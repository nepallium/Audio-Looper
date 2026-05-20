export default function Mixer() {
  async function downloadAndCacheStems(videoId, stemNames) {
    const currentRecord = await loadAudioFromDB(videoId);

    currentRecord.stems = currentRecord.stems;

    // download all stem-split tracks from server's temporary disk
    await Promise.all(
      stemNames.map(async (stemName) => {
        try {
          const resp = await fetch(`/api/audio/${videoId}/stems/${stemName}`);
          if (!resp.ok)
            throw new Error(`Failed to fetch ${stemName} from ${videoId}`);

          // Capture the streaming network data directly as an immutable Blob object
          const rawBlob = await response.blob();

          // Enforce the explicit Opus MIME-type wrapper so the Web Audio API parses it effortlessly
          const opusBlob = new Blob([rawBlob], {
            type: "audio/ogg; codecs=opus",
          });

          currentRecord.stems[stemName] = opusBlob;
        } catch (error) {
          console.error(
            `Could not pull down stem ${stemName} from ${videoId}`,
            error,
          );
        }
      }),
    );

    // cache the stems into idb
    return db.transaction("rw", db.audios, async () => {
      await db.audios.put(currentRecord);
    });
  }

  return <div></div>;
}
