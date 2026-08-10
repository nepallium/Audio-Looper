import Dexie from "dexie";
import decodeHtmlEntities from "@shared/utils/decodeHtmlEntities.js";

// Database definition

export const db = new Dexie("audioLoops");

db.version(1).stores({
  // Only indexed fields go here; all other fields are stored automatically.
  audios: "id, isTmp, name",
});

// Helpers

/**
 * Builds a clean audio record ready for storage.
 * @param {object} video  - YouTube video object.
 * @param {Blob}   blob   - Audio blob.
 * @param {number} isTmp  - 1 = temporary, 0 = saved.
 */
function buildAudioRecord(video, blob, isTmp = 1) {
  return {
    id: video.id.videoId,
    isTmp,
    name: decodeHtmlEntities(video.snippet.title),
    video,
    blobObj: blob,
    regions: [],
  };
}

// Audio CRUD

/**
 * Replaces the current temporary audio with a new one.
 * Any existing record flagged as temporary is deleted first.
 */
export async function replaceTmpAudio(video, blob) {
  await db.audios.where("isTmp").equals(1).delete();
  await db.audios.put(buildAudioRecord(video, blob, 1));
  return true;
}

/**
 * Loads the current temporary audio, or null if none exists.
 */
export async function loadTmpAudioFromDB() {
  const record = (await db.audios.where("isTmp").equals(1).first()) ?? null;
  return record;
}

/**
 * Loads a saved audio by its ID, or null if not found.
 * @param {string} key - Audio ID.
 */
export async function loadAudioFromDB(key) {
  const record = (await db.audios.get(key)) ?? null;
  return record;
}

/**
 * Returns true if an audio with the given ID exists in the database.
 * @param {string} key - Audio ID.
 */
export async function isAudioIdExists(key) {
  const count = await db.audios.where("id").equals(key).count();
  return count > 0;
}

/**
 * Returns all non-temporary audios, optionally filtered by name.
 * @param {string} [searchTerm] - Case-insensitive substring to match against name.
 */
export async function getAudiosByName(searchTerm) {
  const term = searchTerm?.trim().toLowerCase() ?? "";

  const audios = term
    ? await db.audios
        .filter(
          (audio) => !audio.isTmp && audio.name.toLowerCase().includes(term),
        )
        .toArray()
    : await db.audios.where("isTmp").equals(0).toArray();

  return audios;
}

/**
 * Returns all audio records (including temporary ones).
 */
export async function getAudios() {
  return db.audios.toArray();
}

/**
 * Permanently deletes an audio record by ID.
 * @param {string} key - Audio ID.
 */
export async function deleteAudio(key) {
  await db.audios.delete(key);
  return true;
}

/**
 * Deletes every audio record in the database.
 */
export async function clearAudios() {
  await db.audios.clear();
  return true;
}

// Loop / region management

/**
 * Promotes a temporary audio to saved, optionally appending a new region.
 * Returns false if the region already exists; true otherwise.
 *
 * @param {string}  key    - Audio ID.
 * @param {object}  [region] - Region to append (optional).
 */
export async function saveLoops(key, region) {
  return db.transaction("rw", db.audios, async () => {
    const audio = await db.audios.get(key);
    if (!audio)
      throw new Error(`[DB] Cannot save loops — audio "${key}" not found.`);

    if (audio.isTmp) audio.isTmp = 0;

    if (region) {
      const isDuplicate = audio.regions.some((r) => r.id === region.id);
      if (isDuplicate) {
        return false;
      }
      audio.regions.push(region);
    }

    await db.audios.put(audio);
    return true;
  });
}

/**
 * Removes a single region from an audio record.
 * Returns the updated record, or null if the audio was not found.
 *
 * @param {string} key    - Audio ID.
 * @param {object} region - Region to remove (matched by region.id).
 */
export async function deleteOneLoop(key, region) {
  return db.transaction("rw", db.audios, async () => {
    const audio = await db.audios.get(key);
    if (!audio) {
      return null;
    }

    audio.regions = audio.regions.filter((r) => r.id !== region.id);
    await db.audios.put(audio);
    return audio;
  });
}

/**
 * Returns all regions for a given audio ID.
 * @param {string} key - Audio ID.
 */
export async function getLoopRegions(key) {
  const audio = await db.audios.get(key);
  return audio?.regions ?? [];
}

// Diagnostics

/**
 * Logs current IndexedDB storage usage to the console.
 */
export async function getStorageUsage() {
  if (!navigator.storage?.estimate) {
    console.warn(
      "[DB] Storage estimation API is not available in this browser.",
    );
    return;
  }

  const { usage, quota } = await navigator.storage.estimate();
  const usedMB = (usage / 1024 / 1024).toFixed(2);
  const quotaMB = (quota / 1024 / 1024).toFixed(2);
  const percentUsed = ((usage / quota) * 100).toFixed(2);

  console.info(
    `[DB] Storage — used: ${usedMB} MB / ${quotaMB} MB (${percentUsed}%)`,
  );
}
