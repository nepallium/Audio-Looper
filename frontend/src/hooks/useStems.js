import { useState, useEffect, useCallback } from "react";
import { cacheAudioStems, loadAudioFromDB } from "@src/db/indexedDB";

export function useStems(videoId) {
  const [status, setStatus] = useState("idle"); // idle, downloading, processing, hydrating, done, failed
  const [error, setError] = useState(null);
  const [stems, setStems] = useState(null);

  const triggerStemSplit = async () => {
    if (!videoId) return;

    setStatus("downloading");
    setError(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/audio/${videoId}/stems/split`,
        {
          method: "POST",
        },
      );

      if (!res.ok)
        throw new Error("Server rejected job initialization for stem split");

      const job = await res.json();
      setStatus(job.status);
    } catch (error) {
      setStatus("failed");
      setError(error.message);
    }
  };

  const downloadStems = useCallback(
    async (stemNames) => {
      setStatus("hydrating");

      const stemsMap = {};

      // download all files concurrently from backend streams
      await Promise.all(
        stemNames.map(async (name) => {
          const res = await fetch(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/audio/${videoId}/stems/${name}`,
          );
          if (!res.ok)
            throw new Error(
              `Failed to download the ${name} stem track from ${videoId}`,
            );

          const rawBlob = await res.blob();
          stemsMap[name] = new Blob([rawBlob], {
            type: "audio/ogg; codecs=opus",
          });
        }),
      );

      return stemsMap;
    },
    [videoId],
  );

  // check if stems already live in idb, else download and cache into idb from backend
  const updateStatus = useCallback(async () => {
    if (!videoId) return;

    try {
      // check idb cache first
      const record = await loadAudioFromDB(videoId);
      if (record && record.stems && Object.keys(record.stems).length > 0) {
        setStems(record.stems);
        setStatus("done");
        return;
      }

      // else, check jobStore status from backend
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/audio/${videoId}/stems/status`,
      );

      if (res.status === 404) {
        setStatus("idle");
        return;
      }

      const job = await res.json();
      if (job.status === "done") {
        // The server finished! Transition to downloading the files locally
        // move to status "hydrating"
        try {
          const stemsMap = await downloadStems(job.stemNames);
          const updatedAudioRecord = await cacheAudioStems(videoId, stemsMap);

          // now we're actually done
          setStatus("done");
          setStems(updatedAudioRecord.stems);
        } catch (error) {
          console.error("Failed to download stems to frontend", error);
          setStatus("failed");
          setError(
            "Stems were generated, but we couldn't download them to your device storage",
          );
        }
      } else if (job.status === "failed") {
        setStatus("failed");
        setError(job.error || "The system failed to split this audio track.");
      } else {
        // Keeps status sync locked to "downloading" or "processing"
        setStatus(job.status);
      }
    } catch (error) {
      console.error("Error fetching status context:", error);
    }
  }, [videoId, downloadStems]);

  // polling every 5s
  useEffect(() => {
    updateStatus();

    if (status === "downloading" || status === "processing") {
      const interval = setInterval(updateStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [status, updateStatus]);

  return { status, error, triggerStemSplit, updateStatus, stems };
}
