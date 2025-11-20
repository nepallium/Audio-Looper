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

export async function loadTmpAudioFromDB(key) {
  const db = await openDB();
  const tx = db.transaction("audios", "readonly");
  const result = await new Promise((resolve) => {
    const req = tx.objectStore("audios").get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });

  return result;
}

export async function saveLoops(key, audioName, video, regions) {
  const db = await openDB();
  const tx = db.transaction("audios", "readwrite");
  const store = tx.objectStore("audios");

  const existing = await store.get(key);
  const updated = {
    ...existing,
    id: key,
    name: audioName,
    video: video,
    regions: regions,
  };
  await store.put(updated);
  await tx.done;
  return true;
}
