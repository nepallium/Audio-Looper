import React, { useRef, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";

const Waveform = ({ audioUrl, audioRef }) => {
  const wavesurferRef = useRef(null);
  const wavesurfer = useRef(null);

  useEffect(() => {
    if (wavesurferRef.current && audioUrl && audioRef) {
      wavesurfer.current = WaveSurfer.create({
        container: wavesurferRef.current,
        backend: "MediaElement",
        media: audioRef.current,
        responsive: true,
        normalize: true,
        waveColor: "#ddd",
        progressColor: "#2196f3",
        height: 100,
        dragToSeek: true,
        width: "35vw",
        hideScrollbar: true,
        barGap: 1,
        barHeight: 20,
        barRadius: 20,
        barWidth: 5,
      });
      wavesurfer.current.setVolume(0.5);
      // wavesurfer.current.load(audioUrl);
    }

    wavesurfer.current.on("click", () => {
      wavesurfer.current.playPause();
    });

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, [audioUrl]);

  return <div ref={wavesurferRef} className="waveform" />;
};

export default Waveform;
