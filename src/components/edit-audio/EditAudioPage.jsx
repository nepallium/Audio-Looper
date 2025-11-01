import { useState, useEffect, useRef, useMemo } from "react";
import WavesurferPlayer from "@wavesurfer/react";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import { FaPlayCircle, FaPauseCircle } from "react-icons/fa";
import clsx from "clsx";
import Controls from "./Controls.jsx";
import getCssVar from "../../utils/getCssVar.js";
import { SyncLoader } from "react-spinners";
import WaveSurfer from "wavesurfer.js";

export default function EditAudioPage({ audioRef }) {
  const [wavesurfer, setWavesurfer] = useState(null);
  const [currTime, setCurrTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEl, setAudioEl] = useState(null);
  const [loopMode, setLoopMode] = useState(false);
  const [isWaveReady, setIsWaveReady] = useState(false);
  const [minPxPerSec, setMinPxPerSec] = useState(100);
  const touchRegion = useRef({ start: null, end: null, tempRegion: null });
  const timeSliderRef = useRef(null);
  const timelineRef = useRef(null);
  const wsContainerRef = useRef(null);
  const activeRegion = useRef(null);
  const loopModeRef = useRef(loopMode);
  const onReadyCalledRef = useRef(false);

  useEffect(() => {
    if (audioRef?.current) setAudioEl(audioRef.current);
  }, [audioRef]);

  const timeline = useMemo(
    () =>
      TimelinePlugin.create({
        height: 24,
        container: timeSliderRef,
        timeInterval: 0.2,
        primaryLabelInterval: 1,
        style: {
          fontSize: "20px",
          color: getCssVar("--main-color"),
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
      if (
        activeRegion.current === region &&
        wavesurfer.isPlaying() &&
        loopModeRef.current
      ) {
        wavesurfer.setTime(region.start);
      }
    };

    regions.on("region-created", createdHandler);
    regions.on("region-in", regionInHandler);
    regions.on("region-out", regionOutHandler);

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

    const slider = timeSliderRef.current;
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

      let newEnd = r.end ?? wavesurfer.getDuration();
      if (curr >= newEnd) newEnd = wavesurfer.getDuration();

      r.setOptions({
        start: curr,
        end: newEnd,
        color: "rgba(255, 0, 0, 0.1)",
      });

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

      wavesurfer.setTime(curr);
    }

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

    const region = regions.regions.at(-1);
    if (region) {
      region.setOptions({
        color: newMode ? "rgba(255, 0, 0, 0.1)" : "rgba(255, 0, 0, 0)",
        borderColor: "rgba(255, 0, 0, 0.5)",
        showBorders: true,
      });
    }
  }

  const handleReady = (ws) => {
    if (onReadyCalledRef.current) {
      console.log("onReady called again, ignoring");
      return;
    }

    onReadyCalledRef.current = true;
    console.log("onReady called for first time");

    // Set wavesurfer first
    setWavesurfer(ws);

    // Use a small timeout to ensure the waveform is actually rendered
    const checkReady = () => {
      const wrapper = ws.getWrapper();
      if (wrapper && wrapper.querySelector("canvas")) {
        console.log("waveform canvas found, setting ready");
        setIsWaveReady(true);
      } else {
        console.log("canvas not found, waiting...");
        setTimeout(checkReady, 50);
      }
    };

    // Start checking after a brief delay
    setTimeout(checkReady, 100);
  };

  return (
    <div className="flex flex-col gap-3 h-full w-full">
      {!isWaveReady && (
        <div className="h-full flex flex-col justify-center items-center gap-4">
          <p className="font-semibold text-[1.3rem] text-center">
            Loading waveform
          </p>
          <SyncLoader color={getCssVar("--text-color")} margin={5} size={15} />
        </div>
      )}

      {audioEl && (
        <div
          id="waveform"
          ref={wsContainerRef}
          className={clsx(
            "touch-none select-none overflow-hidden",
            !isWaveReady && "opacity-0 pointer-events-none absolute"
          )}
        >
          <WavesurferPlayer
            height={300}
            waveColor={getCssVar("--sub-alt-color")}
            backend="MediaElement"
            media={audioEl}
            responsive={true}
            normalize={true}
            progressColor={getCssVar("--text-color")}
            minPxPerSec={minPxPerSec}
            onReady={handleReady}
            onClick={handleWsClick}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            plugins={wsPlugins}
          />
        </div>
      )}

      {isWaveReady && (
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

          <div className="flex flex-row justify-around">
            <button
              onClick={handleLoopModeChange}
              className={clsx(
                "px-6 py-2 rounded-md font-semibold",
                loopMode
                  ? "bg-primary-100 text-base-dark"
                  : "bg-surface-200 text-base-light"
              )}
            >{`Loop`}</button>
            <button onClick={markStart}>Start</button>
            <button onClick={markEnd}>End</button>
          </div>

          <div className="flex justify-center">
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
          <Controls audioRef={audioRef} />
        </>
      )}
    </div>
  );
}
