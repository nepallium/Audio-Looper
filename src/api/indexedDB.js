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

export async function saveTmpAudioToDB(key, blob) {
  const db = await openDB();
  const tx = db.transaction("audios", "readwrite");
  tx.objectStore("audios").put({ id: key, blobObj: blob });
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

export async function saveLoops(key, audioName, video, regions) {
  const db = await openDB();
  const tx = db.transaction("audios", "readwrite");
  const store = tx.objectStore("audios");

  const existing = await new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  // console.log(existing);
  const updated = {
    ...existing,
    name: audioName,
    video: video,
    regions: regions,
  };
  // console.log(updated);
  await store.put(updated);
  await tx.done;
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
    return allAudios; // Return all if no search term
  }

  const lowerSearch = searchTerm.toLowerCase().trim();
  return allAudios.filter((audio) =>
    audio.name.toLowerCase().includes(lowerSearch)
  );
}
