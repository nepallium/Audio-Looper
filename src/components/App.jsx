import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import EditAudioPage from "./edit-audio/EditAudioPage";

export default function App() {
  const audioRef = useRef(null);
  const location = useLocation();
  // const { videoId, blobUrl } = location.state;
  const url = "../../dev-tmp/audios/test_audio4.opus";
  // const url = "../../dev-tmp/audios/test_audio2.mp3";
  // const url = "https://www.youtube.com/watch?v=7GRG7HNDct8"
  // const url = "http://localhost:8000/api/audios/7GRG7HNDct8";

  return (
    <div className="page-layout h-screen text-base-light">
      <audio
        ref={audioRef}
        // src={blobUrl}
        src={url}
        preload="metadata"
      ></audio>
      <EditAudioPage audioRef={audioRef} />
    </div>
  );
}
