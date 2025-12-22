export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("audioLoops", 1);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("audios")) {
        db.createObjectStore("audios", { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);

    req.onerror = (event) => {
      console.log("An error occured with IndexedDB: ", event);
      reject();
    };
  });
}

export async function saveTmpAudioToDB(video, blob) {
  const db = await openDB();
  const tx = db.transaction("audios", "readwrite");
  tx.objectStore("audios").put({
    isTmp: true,
    id: video.id.videoId,
    name: video.snippet.title,
    video: video,
    blobObj: blob,
    regions: [],
  });
  await tx.done;
  return true;
}

export async function loadAudioFromDB(key) {
  const db = await openDB();
  const tx = db.transaction("audios", "readonly");
  const result = await new Promise((resolve) => {
    const req = tx.objectStore("audios").get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });

  return result;
}

export async function isAudioIdExists(key) {
  const db = await openDB();
  const tx = db.transaction("audios", "readonly");
  const result = await new Promise((resolve) => {
    const req = tx.objectStore("audios").count(key);
    req.onsuccess = (e) => {
      const count = e.target.result;
      resolve(count > 0);
    };
    req.onerror = () => resolve(null);
  });

  return result;
}

export async function saveLoops(key, region) {
  let isSaveSuccess = true;
  const db = await openDB();
  const tx = db.transaction("audios", "readwrite");
  const store = tx.objectStore("audios");

  const existing = await new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  // console.log(existing);
  if (existing && existing.isTmp) {
    existing.isTmp = false;
  }
  if (region) {
    const isRegionUnique = !existing.regions.some((r) => r.id === region.id);
    if (isRegionUnique) {
      existing.regions.push(region);
    } else {
      isSaveSuccess = false;
    }
  }
  await store.put(existing);
  await tx.done;
  return isSaveSuccess;
}

export async function getAudios() {
  const db = await openDB();
  const tx = db.transaction("audios", "readonly");
  const store = tx.objectStore("audios");
  const result = await new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = (event) => {
      // The result of getAll() is the array of all objects in the store
      const allElements = event.target.result;
      // console.log(allElements);
      resolve(allElements);
    };

    request.onerror = (event) => reject(event.target.error);
  });

  // console.log(result);
  return result;
}

export async function getLoopRegions(key) {
  const db = await openDB();
  const tx = db.transaction("audios", "readonly");
  const store = tx.objectStore("audios");
  const result = await new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = (e) => resolve(request.result);
    request.onerror = (e) => reject(request.error);
  });
  tx.done;
  // console.log(result);
  return result.regions ? result.regions : [];
}

export function getStorageUsage() {
  // Check storage quota and usage
  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then((estimate) => {
      const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
      const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(2);
      const percentUsed = ((estimate.usage / estimate.quota) * 100).toFixed(2);

      console.log(`Used: ${usedMB} MB`);
      console.log(`Quota: ${quotaMB} MB`);
      console.log(`Percent used: ${percentUsed}%`);
    });
  }
}

export async function getAudiosByName(searchTerm) {
  const db = await openDB();
  const tx = db.transaction("audios", "readonly");
  const store = tx.objectStore("audios");

  const allAudios = await new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (!searchTerm || searchTerm.trim() === "") {
    return allAudios.filter((audio) => !audio.isTmp); // Return all if no search term
  }

  const lowerSearch = searchTerm.toLowerCase().trim();
  return allAudios.filter(
    (audio) => audio.name.toLowerCase().includes(lowerSearch) && !audio.isTmp
  );
}

export async function deleteAudio(key) {
  const db = await openDB();
  const tx = db.transaction("audios", "readwrite");
  const store = tx.objectStore("audios");

  const result = await new Promise((resolve) => {
    const req = store.delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => resolve(false);
  });

  return result;
}

export async function clearAudios() {
  const db = await openDB();
  const tx = db.transaction("audios", "readwrite");
  const store = tx.objectStore("audios");
  const result = await new Promise((resolve) => {
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = () => resolve(false);
  });

  return result;
}
