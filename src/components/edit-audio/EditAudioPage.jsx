import { useState, useEffect, useRef } from "react";
import WavesurferPlayer from "@wavesurfer/react";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";

export default function EditAudioPage({ audioRef }) {
  const [wavesurfer, setWavesurfer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currTime, setCurrTime] = useState(0);
  const [audioEl, setAudioEl] = useState(null);
  const timeSliderRef = useRef(null);
  const rafId = useRef(null); // store requestAnimationFrame id

  useEffect(() => {
    if (audioRef.current) setAudioEl(audioRef.current);
  }, [audioRef.current]);

  // Smooth progress animation using requestAnimationFrame
  const animateProgress = () => {
    if (!wavesurfer) return;

    const slider = document.querySelector("input[type='range']");
    if (!slider) return;

    const currentTime = wavesurfer.getCurrentTime();
    const duration = wavesurfer.getDuration();

    setCurrTime(currentTime);
    slider.value = currentTime;
    slider.style.setProperty(
      "--value",
      ((currentTime / duration) * 100).toFixed(4) + "%"
    );

    // Continue animation while audio is playing
    if (wavesurfer.isPlaying()) {
      rafId.current = window.requestAnimationFrame(animateProgress);
    }
  };

  const handlePlayPause = () => {
    if (!wavesurfer) return;

    wavesurfer.playPause();
    setIsPlaying(wavesurfer.isPlaying());

    if (wavesurfer.isPlaying()) {
      rafId.current = window.requestAnimationFrame(animateProgress);
    } else {
      window.cancelAnimationFrame(rafId.current);
    }
  };

  const handleWavesurferClick = () => {
    const time = wavesurfer.getCurrentTime();
    setCurrTime(time);
    timeSliderRef.current.style.setProperty(
      "--value",
      ((time / wavesurfer.getDuration()) * 100).toFixed(4) + "%"
    );
  };

  const handleSlide = (e) => {
    const time = parseFloat(e.target.value);
    wavesurfer.setTime(time);
    setCurrTime(time);
    e.target.style.setProperty(
      "--value",
      ((time / wavesurfer.getDuration()) * 100).toFixed(4) + "%"
    );
  };

  // cleanup on unmount
  useEffect(() => () => window.cancelAnimationFrame(rafId.current), []);

  if (!audioEl) return <div>Loading audio…</div>;

  return (
    <>
      {wavesurfer && (
        <input
          type="range"
          min="0"
          max={wavesurfer.getDuration()}
          step="0.001"
          value={currTime}
          onChange={handleSlide}
          ref={timeSliderRef}
        />
      )}
      <WavesurferPlayer
        height={100}
        waveColor={getCssVar("--clr-surface-tonal-a50")}
        backend="MediaElement"
        media={audioEl}
        responsive={true}
        normalize={true}
        progressColor={getCssVar("--clr-primary-a20")}
        minPxPerSec={100}
        onReady={(ws) => setWavesurfer(ws)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={handleWavesurferClick}
      />
      {wavesurfer ? <></> : <div>Loading waveform...</div>}

      <div style={{ margin: "1em 0", display: "flex", gap: "1em" }}>
        <button onClick={handlePlayPause} style={{ minWidth: "5em" }}>
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>
    </>
  );
}

function getCssVar(name) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}
