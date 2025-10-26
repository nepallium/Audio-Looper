import { useState, useEffect, useRef, useMemo } from "react";
import WavesurferPlayer from "@wavesurfer/react";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import { FaPlayCircle, FaPauseCircle } from "react-icons/fa";

export default function EditAudioPage({ audioRef }) {
  const [wavesurfer, setWavesurfer] = useState(null);
  const [currTime, setCurrTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEl, setAudioEl] = useState(null);
  const [loopMode, setLoopMode] = useState(false);
  const [minPxPerSec, setMinPxPerSec] = useState(100);
  const touchRegion = useRef({ start: null, end: null, tempRegion: null });
  const timeSliderRef = useRef(null);
  const timelineRef = useRef(null);
  const wsContainerRef = useRef(null);
  const activeRegion = useRef(null);
  const loopModeRef = useRef(loopMode);

  useEffect(() => {
    if (audioRef?.current) setAudioEl(audioRef.current);
  }, [audioRef]);

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

  // Set up event handlers for regions
  useEffect(() => {
    if (!regions || !wavesurfer) return;

    let activeLoopRAF = null;
    const clearLoopRAF = () => {
      if (activeLoopRAF) {
        cancelAnimationFrame(activeLoopRAF);
        activeLoopRAF = null;
      }
    };

    const handleRegionOut = (region) => {
      if (wavesurfer.isPlaying() && loopModeRef.current) {
        // Only loop if loop mode is on
        clearLoopRAF();
        activeLoopRAF = requestAnimationFrame(() => {
          wavesurfer.setTime(region.start);
          activeLoopRAF = null;
        });
      }
    };

    const createdHandler = (region) => {
      region.on("out", () => handleRegionOut(region));
    };

    const regionInHandler = (region) => {
      activeRegion.current = region;
    };

    const regionOutHandler = (region) => {
      // Only loop back to start if we're playing AND loop mode is on
      if (
        activeRegion.current === region &&
        wavesurfer.isPlaying() &&
        loopModeRef.current
      ) {
        wavesurfer.setTime(region.start);
      }
    };

    // Add event listeners
    regions.on("region-created", createdHandler);
    regions.on("region-in", regionInHandler);
    regions.on("region-out", regionOutHandler);

    // Cleanup function
    return () => {
      clearLoopRAF();
      regions.un("region-created", createdHandler);
      regions.un("region-in", regionInHandler);
      regions.un("region-out", regionOutHandler);
    };
  }, [regions, wavesurfer]);

  const wsPlugins = useMemo(() => [timeline, regions], []);

  useEffect(() => {
    loopModeRef.current = loopMode;
  }, [loopMode]);

  // Keep progress in sync with wavesurfer timeupdate
  useEffect(() => {
    if (!wavesurfer) return;

    wavesurfer.on("timeupdate", updateProgress);
    return () => wavesurfer.un("timeupdate", updateProgress);
  }, [wavesurfer]);

  const updateProgress = () => {
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
  };

  const handlePlayPause = () => {
    if (!wavesurfer) return;

    const currRegion = regions.regions.at(-1);
    setIsPlaying((prev) => !prev);

    // if (currRegion) {
    //   if (
    //     wavesurfer.getCurrentTime() < currRegion.start ||
    //     wavesurfer.getCurrentTime() > currRegion.end
    //   ) {
    //     wavesurfer.setTime(currRegion.start);
    //     wavesurfer.playPause();
    //     return;
    //   }
    // }

    wavesurfer.playPause();

    updateProgress();
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

  function markStart(e) {
    if (!wavesurfer || !regions) return;

    setLoopMode(true);
    const curr = wavesurfer.getCurrentTime();
    touchRegion.current.start = curr;

    if (regions.getRegions().length === 0) {
      touchRegion.current.end = wavesurfer.getDuration();
      createRegion(touchRegion.current.start, touchRegion.current.end);
    } else {
      const r = regions.regions.at(0);
      if (!r) return;

      // ensure end is valid; if start is after end, extend end to duration
      let newEnd = r.end ?? wavesurfer.getDuration();
      if (curr >= newEnd) newEnd = wavesurfer.getDuration();

      r.setOptions({
        start: curr,
        end: newEnd,
        color: "rgba(255, 0, 0, 0.1)",
      });

      // Scroll to the modified region if it's out of view
      wavesurfer.setTime(curr);
    }
  }

  function markEnd(e) {
    if (!wavesurfer || !regions) return;

    setLoopMode(true);
    const curr = wavesurfer.getCurrentTime();
    touchRegion.current.end = curr;

    if (regions.getRegions().length === 0) {
      touchRegion.current.start = 0;
      createRegion(touchRegion.current.start, touchRegion.current.end);
    } else {
      const r = regions.regions.at(0);
      if (!r) return;

      let newStart = r.start ?? 0;
      if (curr <= newStart) newStart = 0;

      r.setOptions({
        start: newStart,
        end: curr,
        color: "rgba(255, 0, 0, 0.1)",
      });

      // Scroll to the modified region if it's out of view
      wavesurfer.setTime(curr);
    }

    // Reset
    touchRegion.current.tempRegion = null;
    touchRegion.current.start = null;
    touchRegion.current.end = null;
  }

  function createRegion(start, end) {
    regions.addRegion({
      start: start,
      end: end,
      color: "rgba(255, 0, 0, 0.1)",
    });
  }

  function handleLoopModeChange(e) {
    const newMode = !loopMode;
    setLoopMode(newMode);

    // Update region appearance based on loop mode
    const region = regions.regions.at(-1);
    if (region) {
      region.setOptions({
        color: newMode ? "rgba(255, 0, 0, 0.1)" : "rgba(255, 0, 0, 0)",
        // Show borders regardless of mode
        borderColor: "rgba(255, 0, 0, 0.5)",
        showBorders: true,
      });
    }
  }

  if (!audioEl) return <div>Loading audio…</div>;

  return (
    <>
      <div className="flex flex-row gap-5">
        <button onClick={handleLoopModeChange}>
          {`Loop Mode: ${loopMode}`}
        </button>
        <button onClick={markStart}>Start</button>
        <button onClick={markEnd}>End</button>
      </div>
      <div
        ref={wsContainerRef}
        id="waveform"
        className="touch-none select-none"
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
