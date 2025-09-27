import { useEffect, useRef, useState } from "react";
import Waveform from "./Waveform";
import Controls from "./Controls";
import YtSearchPage from "./yt-search/YtSearchPage";

export default function App() {
  const audioRef = useRef(null);

  const url = "/test_audio.mp3";
  // const url = "https://www.youtube.com/watch?v=7GRG7HNDct8"
  // const url = "http://localhost:8000/api/audios/7GRG7HNDct8";

  return (
    <>
      {/* <audio ref={audioRef} src={url} preload="none" controls></audio> */}

      {/* <Controls audioRef={audioRef} />

      <Waveform audioUrl={url} audioRef={audioRef} className="w-4 h-10" /> */}

      <YtSearchPage />
    </>
  );
}
