import { useContext, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import EditAudioPage from "./EditAudioPage";
import { loadAudioFromDB } from "../../api/indexedDB";
import { useWaveContext, useWaveDispatch, WaveProvider } from "./WaveContext";

export default function Controller() {
  return (
    <WaveProvider>
      <ControllerInner />
    </WaveProvider>
  );
}

function ControllerInner() {
  const audioRef = useRef(null);

  const location = useLocation();
  const { videoId, video, regions = null } = location.state;

  const dispatch = useWaveDispatch();
  const waveContext = useWaveContext();

  useEffect(() => {
    async function generateBlobUrl() {
      let { blobObj } = await loadAudioFromDB(videoId);
      if (!blobObj) {
        // route to main page or show no audio loaded page
      }

      const blobUrl = URL.createObjectURL(blobObj);
      audioRef.current.src = blobUrl;

      await new Promise((resolve) => {
        const handler = () => {
          audioRef.current.removeEventListener("loadedmetadata", handler);
          resolve();
        };
        audioRef.current.addEventListener("loadedmetadata", handler);
        audioRef.current.load();
      });

      dispatch({ type: "set_audioEl", audioEl: audioRef.current });
    }

    generateBlobUrl();
    dispatch({ type: "set_video", video: video });
    dispatch({ type: "set_existingRegions", regions: regions });
  }, []);

  return (
    <div id="edit-audio-page" className="page-layout h-screen text-base-light">
      <audio
        ref={audioRef}
        // src={blobUrl}
        // src={url}
        preload="metadata"
      ></audio>
      {waveContext.audioEl && <EditAudioPage />}
    </div>
  );
}
