export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("audioLoops", 1);

    req.onupgradeneeded = () => {
      const db = req.result;
      let store;
      if (!db.objectStoreNames.contains("audios")) {
        store = db.createObjectStore("audios", { keyPath: "id" });
      } else {
        store = req.transaction.objectStore("audios");
      }

      // Create index on isTmp if it doesn't exist (only for new upgrades)
      if (!store.indexNames.contains("isTmp")) {
        store.createIndex("by_isTmp", "isTmp", { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);

    req.onerror = (event) => {
      console.log("An error occured with IndexedDB: ", event);
      reject(req.error);
    };
  });
}

export async function replaceTmpAudio(video, blob) {
  const db = await openDB();
  const tx = db.transaction("audios", "readwrite");
  const store = tx.objectStore("audios");

  const index = store.index("by_isTmp");

  // Delete all tmp audios
  await new Promise((resolve, reject) => {
    const request = index.openCursor(IDBKeyRange.only(1));

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete(); // Delete this tmp entry
        cursor.continue(); // Check if there are more (though there should only be one)
      } else {
        resolve();
      }
    };

    request.onerror = () => reject(request.error);
  });

  // Add the new tmp audio
  await new Promise((resolve, reject) => {
    const putRequest = store.put({
      id: video.id.videoId,
      isTmp: 1,
      name: video.snippet.title,
      video: video,
      blobObj: blob,
      regions: [],
    });

    putRequest.onsuccess = () => resolve();
    putRequest.onerror = () => reject(putRequest.error);
  });

  return true;
}

export async function loadTmpAudioFromDB() {
  const db = await openDB();
  const tx = db.transaction("audios", "readonly");
  const store = tx.objectStore("audios");

  const index = store.index("by_isTmp");

  const result = await new Promise((resolve, reject) => {
    const request = index.openCursor(IDBKeyRange.only(1));

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete(); // Delete this tmp entry
        cursor.continue(); // Check if there are more (though there should only be one)
      } else {
        resolve();
      }
    };

    request.onerror = () => reject(request.error);
  });

  return result;
}

export async function loadAudioFromDB(key) {
  const db = await openDB();
  const tx = db.transaction("audios", "readonly");
  const result = await new Promise((resolve, reject) => {
    const req = tx.objectStore("audios").get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });

  return result;
}

export async function isAudioIdExists(key) {
  const db = await openDB();
  const tx = db.transaction("audios", "readonly");
  const result = await new Promise((resolve, reject) => {
    const req = tx.objectStore("audios").count(key);
    req.onsuccess = (e) => {
      const count = e.target.result;
      resolve(count > 0);
    };
    req.onerror = () => reject(req.error);
  });

  return result;
}

export async function saveLoops(key, region) {
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
    existing.isTmp = 0;
  }
  if (region) {
    const isRegionUnique = !existing.regions.some((r) => r.id === region.id);
    if (!isRegionUnique) {
      return false; // region already exists
    }
    existing.regions.push(region);
  }

  // store loop or new audio in database
  await new Promise((resolve, reject) => {
    const request = store.put(existing);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  return true;
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

  await new Promise((resolve, reject) => {
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  return result;
}

export async function clearAudios() {
  const db = await openDB();
  const tx = db.transaction("audios", "readwrite");
  const store = tx.objectStore("audios");
  await new Promise((resolve, reject) => {
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  return true;
}
