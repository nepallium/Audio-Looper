import { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EditAudioPage from "./EditAudioPage";
import { loadAudioFromDB, loadTmpAudioFromDB } from "../../api/indexedDB";
import { useWaveContext, useWaveDispatch, WaveProvider } from "./WaveContext";

export default function Controller() {
  return (
    <WaveProvider>
      <ControllerInner />
    </WaveProvider>
  );
}

function ControllerInner() {
  const [audioEl, setAudioEl] = useState(null);
  const [isNoAudio, setIsNoAudio] = useState(false);

  const audioRef = useRef(null);
  const dispatch = useWaveDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function init() {
      let videoId = "",
        video;

      if (location.state) {
        ({ videoId, video } = location.state);
      } else {
        ({ id: videoId, video } = await loadTmpAudioFromDB());
      }

      const { blobObj } = await loadAudioFromDB(videoId);
      if (!blobObj) {
        setIsNoAudio(true);
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

      dispatch({ type: "set_video", video });
    }

    init();
  }, [location, dispatch]);

  useEffect(() => {
    dispatch({ type: "set_audioRef", audioRef });
  }, [dispatch]);

  if (isNoAudio) {
    return (
      <div
        className="flex flex-col items-center justify-center
      page-layout h-screen text-base-light gap-12"
      >
        <p className="font-semibold text-xl">Audio waveform will appear here</p>
        <div className="flex flex-col gap-4 items-center">
          <p className="underline" onClick={() => navigate("/")}>
            Load a saved audio
          </p>
          <span> or</span>
          <p className="underline" onClick={() => navigate("/yt-search")}>
            Search with YouTube
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-layout h-screen text-base-light">
      <audio ref={audioRef} preload="metadata"></audio>
      {audioEl && <EditAudioPage />}
    </div>
  );
}
