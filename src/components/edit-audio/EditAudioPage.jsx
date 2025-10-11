import { useState, useEffect, useRef, useMemo } from "react";
import WavesurferPlayer from "@wavesurfer/react";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import { FaPlayCircle, FaPauseCircle } from "react-icons/fa";

export default function EditAudioPage({ audioRef }) {
  const [wavesurfer, setWavesurfer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currTime, setCurrTime] = useState(0);
  const [audioEl, setAudioEl] = useState(null);
  const [loopMode, setLoopMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const touchRegion = useRef({ start: null, end: null, tempRegion: null });
  const timeSliderRef = useRef(null);
  const timelineRef = useRef(null);
  const wsContainerRef = useRef(null);
  const rafId = useRef(null); // store requestAnimationFrame id

  useEffect(() => {
    if (audioRef?.current) setAudioEl(audioRef.current);
  }, [audioRef]);

  // cleanup on unmount
  useEffect(() => () => window.cancelAnimationFrame(rafId.current), []);

  const timeline = useMemo(
    () =>
      TimelinePlugin.create({
        height: 24,
        // insertPosition: "beforebegin",
        container: timeSliderRef,
        timeInterval: 0.2,
        primaryLabelInterval: 1,
        // secondaryLabelInterval: 1,
        style: {
          fontSize: "20px",
          color: "#2D5B88",
        },
      }),
    []
  );

  const regions = useMemo(() => RegionsPlugin.create(), []);

  const wsPlugins = useMemo(() => [timeline, regions], []);

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

  const handleWsClick = (e) => {
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

  const handleTouchStart = (e) => {};

  const handleTouchMove = (e) => {
    // e.preventDefault();
    // wavesurfer.setScroll(scrollPx);
    // Reset
    touchRegion.current.start = null;
    touchRegion.current.end = null;
    touchRegion.current.tempRegion = null;
  };

  function handleLoopModeChange(e) {
    const newMode = !loopMode;
    setLoopMode(newMode);

    const setTouchAction = (el, value) => {
      if (el) el.style.touchAction = value;
    };

    const wrapper = wavesurfer.getWrapper();
    const container = wrapper?.querySelector("div");
    const touchValue = newMode ? "none" : "auto";

    setTouchAction(wrapper, touchValue);
    setTouchAction(container, touchValue);
  }

  if (!audioEl) return <div>Loading audio…</div>;

  return (
    <>
      <div>
        <button onClick={handleLoopModeChange}>
          {`Loop Mode: ${loopMode}`}
        </button>
      </div>
      <div
        ref={wsContainerRef}
        className="overflow-x-hidden select-none"
        style={{ touchAction: "none", overflowX: "hidden" }}
      >
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
          onClick={handleWsClick}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          plugins={wsPlugins}
        />
      </div>
      {wavesurfer ? null : <div>Loading waveform...</div>}

      {wavesurfer && (
        <>
          <div ref={timelineRef} style={{ width: "100%" }} />
          <input
            type="range"
            min="0"
            max={wavesurfer.getDuration()}
            step="0.001"
            value={currTime}
            onChange={handleSlide}
            ref={timeSliderRef}
          />
        </>
      )}

      <div className="p-5 flex justify-center">
        {isPlaying ? (
          <FaPauseCircle
            size={50}
            color={getCssVar("--clr-primary-a30")}
            onClick={handlePlayPause}
          />
        ) : (
          <FaPlayCircle
            size={50}
            color={getCssVar("--clr-primary-a30")}
            onClick={handlePlayPause}
          />
        )}
      </div>
    </>
  );
}

function getCssVar(name) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}
