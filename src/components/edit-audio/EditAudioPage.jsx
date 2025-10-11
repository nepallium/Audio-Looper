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
  const [minPxPerSec, setMinPxPerSec] = useState(100);
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

  useEffect(() => {
    regions.enableDragSelection({
      color: "rgba(255, 0, 0, 0.1)",
    });
  }, []);

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

  const handleSlideDrag = (e) => {
    const time = parseFloat(e.target.value);
    wavesurfer.setTime(time);
    setCurrTime(time);
    e.target.style.setProperty(
      "--value",
      ((time / wavesurfer.getDuration()) * 100).toFixed(4) + "%"
    );
  };

  function getCurrScrollSec() {
    return +wavesurfer.getScroll() / minPxPerSec;
  }

  function handleTouchStart(e) {
    if (!loopMode) return;

    const rect = wsContainerRef.current.getBoundingClientRect();
    const touchX = e.targetTouches[0].clientX - rect.left;

    // convert X position to audio time
    touchRegion.current.start = +touchX / minPxPerSec + getCurrScrollSec();
    console.log(touchRegion.current.start);
  }

  const handleTouchMove = (e) => {
    if (!loopMode || !wavesurfer) return;

    const rect = wsContainerRef.current.getBoundingClientRect();
    const touchX = e.targetTouches[0].clientX - rect.left;

    touchRegion.current.end = +touchX / minPxPerSec + getCurrScrollSec();

    if (!touchRegion.current.tempRegion) {
      // Create initial region
      touchRegion.current.tempRegion = regions.addRegion({
        start: Math.min(touchRegion.current.start, touchRegion.current.end),
        end: Math.max(touchRegion.current.start, touchRegion.current.end),
        color: "rgba(255, 0, 0, 0.2)",
        drag: false,
        resize: true,
      });
    } else {
      // Update existing region using setOptions
      touchRegion.current.tempRegion.setOptions({
        start: Math.min(touchRegion.current.start, touchRegion.current.end),
        end: Math.max(touchRegion.current.start, touchRegion.current.end),
      });
    }
  };

  function handleTouchEnd(e) {
    if (!loopMode || !touchRegion.current.start) return;

    const region = touchRegion.current;

    // Remove the temp region
    if (region.tempRegion) {
      region.tempRegion.remove();
    }

    // Add final region
    if (region.end && region.start !== region.end) {
      regions.addRegion({
        start: Math.min(region.start, region.end),
        end: Math.max(region.start, region.end),
        color: "rgba(255, 0, 0, 0.1)",
      });
    }

    // Reset
    region.tempRegion = null;
    region.start = null;
    region.end = null;
  }

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
        className="touch-none select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <WavesurferPlayer
          height={100}
          waveColor={getCssVar("--clr-surface-tonal-a50")}
          backend="MediaElement"
          media={audioEl}
          responsive={true}
          normalize={true}
          progressColor={getCssVar("--clr-primary-a20")}
          minPxPerSec={minPxPerSec}
          onReady={(ws) => {
            setWavesurfer(ws);

            const wrapper = ws.getWrapper();
            const container = wrapper?.querySelector("div");
            const touchValue = loopMode ? "none" : "auto";

            if (wrapper) wrapper.style.touchAction = touchValue;
            if (container) container.style.touchAction = touchValue;
          }}
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
            onChange={handleSlideDrag}
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
            className="cursor-pointer"
          />
        ) : (
          <FaPlayCircle
            size={50}
            color={getCssVar("--clr-primary-a30")}
            onClick={handlePlayPause}
            className="cursor-pointer"
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
