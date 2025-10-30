import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";

export default function App() {
  const audioRef = useRef(null);

  const url = "../../dev-tmp/audios/test_audio2.mp3";
  // const url = "https://www.youtube.com/watch?v=7GRG7HNDct8"
  // const url = "http://localhost:8000/api/audios/7GRG7HNDct8";

  return (
    <div className="page-layout h-screen text-base-light">
      <audio ref={audioRef} src={url} preload="metadata"></audio>
      <Outlet context={{ audioRef }} />
    </div>
  );
}
