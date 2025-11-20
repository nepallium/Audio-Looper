import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import EditAudioPage from "./edit-audio/EditAudioPage";
import { loadTmpAudioFromDB } from "../api/indexedDB";

export default function App() {
  const audioRef = useRef(null);
  const [audioEl, setAudioEl] = useState(null);
  const location = useLocation();
  const { videoId, video } = location.state;
  // const url = "../../dev-tmp/audios/test_audio4.opus";
  // const url = "../../dev-tmp/audios/test_audio2.mp3";
  // const url = "https://www.youtube.com/watch?v=7GRG7HNDct8"
  // const url = "http://localhost:8000/api/audios/7GRG7HNDct8";

  useEffect(() => {
    async function generateBlobUrl() {
      let { blobObj } = await loadTmpAudioFromDB(videoId);
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

      setAudioEl(audioRef.current);
    }

    generateBlobUrl();
  }, []);

  return (
    <div id="edit-audio-page" className="page-layout h-screen text-base-light">
      <audio
        ref={audioRef}
        // src={blobUrl}
        // src={url}
        preload="metadata"
      ></audio>
      {audioEl && (
        <EditAudioPage audioEl={audioEl} audioRef={audioRef} video={video} />
      )}
    </div>
  );
}
