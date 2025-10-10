import { useEffect, useRef, useState } from "react";
import Controls from "./edit-audio/Controls";
import YtSearchPage from "./yt-search/YtSearchPage";
import EditAudioPage from "./edit-audio/EditAudioPage";

export default function App() {
  const audioRef = useRef(null);

  const url = "../../dev-tmp/audios/test_audio2.mp3";
  // const url = "https://www.youtube.com/watch?v=7GRG7HNDct8"
  // const url = "http://localhost:8000/api/audios/7GRG7HNDct8";

  return (
    <div className="page-layout h-screen text-base-light">
      <audio ref={audioRef} src={url} preload="metadata"></audio>

      <EditAudioPage audioRef={audioRef} />
      <Controls audioRef={audioRef} />

      {/* <YtSearchPage /> */}
    </div>
  );
}
