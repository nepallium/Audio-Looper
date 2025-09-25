import React, { useRef, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";

const Waveform = ({ audioUrl }) => {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);

  useEffect(() => {
    if (waveformRef.current && audioUrl) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        backend: "MediaElement",
        waveColor: "#ddd",
        progressColor: "#2196f3",
        height: 100,
        dragToSeek: true,
        width: "35vw",
        hideScrollbar: true,
        normalize: true,
        barGap: 1,
        barHeight: 20,
        barRadius: 20,
        barWidth: 5,
      });
      wavesurfer.current.setVolume(0.1);
      wavesurfer.current.load(audioUrl);
    }

    wavesurfer.current.on('click', () => {
      wavesurfer.current.play()
    })

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, [audioUrl]);


  return <div ref={waveformRef} className="waveform" />;
};

export default Waveform;
