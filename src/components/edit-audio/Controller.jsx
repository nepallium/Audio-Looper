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
        try {
          ({ id: videoId, video } = await loadTmpAudioFromDB());
        } catch (e) {
          setIsNoAudio(true);
          return;
        }
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
      <main className="flex flex-col items-center justify-center page-layout h-screen text-base-light gap-12">
        <h1 className="font-semibold text-xl">
          Audio waveform will appear here
        </h1>
        <div className="flex flex-col gap-4 items-center">
          <button
            className="underline text-primary-100 cursor-pointer"
            onClick={() => navigate("/")}
          >
            Load a saved audio
          </button>
          <span>or</span>
          <button
            className="underline text-primary-100 cursor-pointer"
            onClick={() => navigate("/yt-search")}
          >
            Search with YouTube
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="page-layout h-screen text-base-light">
      <audio ref={audioRef} preload="metadata"></audio>
      {audioEl && <EditAudioPage />}
    </div>
  );
}
