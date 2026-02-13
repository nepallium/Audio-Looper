import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import WavesurferPlayer from "@wavesurfer/react";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import { FaPlayCircle, FaPauseCircle } from "react-icons/fa";
import clsx from "clsx";
import Controls from "./Controls.jsx";
import getCssVar from "../../utils/getCssVar.js";
import { SyncLoader } from "react-spinners";
import isMobileDevice from "../../utils/isMobileDevice.js";
import decodeHtmlEntities from "../../utils/decodeHtmlEntities.js";
import { saveLoops } from "../../api/indexedDB.js";
import { useWaveContext, useWaveDispatch } from "./WaveContext.jsx";
import InfoBanner from "../InfoBanner.jsx";
import { getLoopRegions } from "../../api/indexedDB.js";
import Header from "../Header.jsx";
import useScreenHeight from "../../hooks/useScreenHeight.js";
import { KeepAwake } from "@capacitor-community/keep-awake";
import { IoIosFastforward } from "react-icons/io";

export default function EditAudioPage() {
  const dispatch = useWaveDispatch();
  const waveContext = useWaveContext();
  const audioEl = waveContext.audioRef.current;
  const video = waveContext.video;
  const existingRegions = waveContext.existingRegions;
  const screenHeight = useScreenHeight();

  const [wavesurfer, setWavesurfer] = useState(null);
  const [waveHeight, setWaveHeight] = useState(0);
  const [currTime, setCurrTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopMode, setLoopMode] = useState(false);
  const [isWaveReady, setIsWaveReady] = useState(false);
  const [minPxPerSec, setMinPxPerSec] = useState(100);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loopName, setLoopName] = useState("");
  const [infoBanner, setInfoBanner] = useState({
    message: "",
    error: false,
    trigger: 0,
  });

  const touchRegion = useRef({ start: null, end: null, tempRegion: null });
  const timeSliderRef = useRef(null);
  const timelineRef = useRef(null);
  const wsContainerRef = useRef(null);
  const activeRegion = useRef(null);
  const loopModeRef = useRef(loopMode);
  const onReadyCalledRef = useRef(false);
  const waveContainerRef = useRef(null);

  useEffect(() => {
    const keepScreenAwake = async () => {
      try {
        await KeepAwake.keepAwake();
        console.log("Screen wake lock active");
      } catch (err) {
        console.log("KeepAwake not supported on this platform", err);
      }
    };

    const allowScreenSleep = async () => {
      try {
        await KeepAwake.allowSleep();
        console.log("Screen wake lock released");
      } catch (err) {
        // ignore errors on cleanup
      }
    };

    keepScreenAwake();

    // Cleanup function: runs when component unmounts or user navigates away
    return () => {
      allowScreenSleep();
    };
  }, []);

  useEffect(() => {
    setWaveHeight(screenHeight * 0.3);
  }, [screenHeight]);

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
    [],
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
      ((currentTime / duration) * 100).toFixed(4) + "%",
    );
  };

  const handlePlayPause = () => {
    if (!wavesurfer) return;

    setIsPlaying((prev) => !prev);

    wavesurfer.playPause();

    updateProgress();
  };

  const handleRewind = (e) => {
    const currRegion = regions.regions.at(-1);
    let time;
    if (!currRegion) {
      time = 0;
    } else {
      time = currRegion.start;
    }
    wavesurfer.setTime(time);
    setCurrTime(time);
  };

  const handleFastForward = (e) => {
    const currRegion = regions.regions.at(-1);

    let time;
    if (!currRegion) {
      time = wavesurfer.getDuration();
    } else {
      time = currRegion.end;
    }
    wavesurfer.setTime(time);
    setCurrTime(time);
  };

  const handleWsClick = (e) => {
    const time = wavesurfer.getCurrentTime();
    setCurrTime(time);
    timeSliderRef.current.style.setProperty(
      "--value",
      ((time / wavesurfer.getDuration()) * 100).toFixed(4) + "%",
    );
  };

  const handleSlideDrag = (e) => {
    const time = parseFloat(e.target.value);
    wavesurfer.setTime(time);
    setCurrTime(time);
    e.target.style.setProperty(
      "--value",
      ((time / wavesurfer.getDuration()) * 100).toFixed(4) + "%",
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
        id: `region_${Date.now()}`,
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
        id: `region_${Date.now()}`,
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
      id: `region_${Date.now()}`,
      start: start,
      end: end,
      color: "rgba(255, 0, 0, 0.1)",
    });
  }

  const displayRegion = useCallback(
    (region) => {
      regions.clearRegions();
      regions.addRegion({
        ...region,
      });
      wavesurfer.setTime(region.start);
    },
    [wavesurfer],
  );

  useEffect(() => {
    dispatch({ type: "set_displayRegionFct", displayRegion: displayRegion });
  }, [displayRegion]);

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

  async function onSave() {
    let serializedRegion = null;
    if (regions.getRegions().length > 0) {
      const r = regions.getRegions().at(0);
      serializedRegion = {
        id: r.id,
        name: loopName,
        start: r.start,
        end: r.end,
        color: r.color,
        drag: r.drag,
        resize: r.resize,
        resizeStart: r.resizeStart,
        resizeEnd: r.resizeEnd,
      };
    }

    const ok = await saveLoops(video.id.videoId, serializedRegion);
    if (ok) {
      setInfoBanner((b) => ({
        message: "Saved successfully",
        error: false,
        trigger: b.trigger + 1,
      }));
    } else {
      setInfoBanner((b) => ({
        message: "Already saved",
        error: false,
        trigger: b.trigger + 1,
      }));
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
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
            !isWaveReady && "opacity-0 pointer-events-none absolute",
          )}
        >
          <Header title={decodeHtmlEntities(video.snippet.title)} />
          <div className={`min-h-[${waveHeight}]`}>
            <WavesurferPlayer
              height={waveHeight}
              waveColor={getCssVar("--sub-alt-color")}
              backend="WebAudio"
              media={audioEl}
              responsive={!isMobileDevice()}
              normalize={isMobileDevice()}
              progressColor={getCssVar("--text-color")}
              minPxPerSec={isMobileDevice() ? 50 : minPxPerSec}
              pixelRatio={isMobileDevice() ? 1 : window.devicePixelRatio}
              onReady={handleReady}
              onClick={handleWsClick}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              plugins={wsPlugins}
            />
          </div>
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
            className="timeline-slider"
          />

          <div className="flex flex-row justify-around">
            <button
              onClick={handleLoopModeChange}
              className={clsx(
                "regular-button",
                loopMode && "bg-primary-100 text-base-dark",
              )}
            >{`Loop`}</button>
            <button className="regular-button" onClick={markStart}>
              Start
            </button>
            <button className="regular-button" onClick={markEnd}>
              End
            </button>
            <button className="regular-button" onClick={onSave}>
              Save
            </button>
          </div>

          <div className="flex gap-10 justify-center items-center pt-4">
            <IoIosFastforward
              className="rotate-180"
              size={40}
              onClick={handleRewind}
            />
            {isPlaying ? (
              <FaPauseCircle
                size={55}
                color={getCssVar("--clr-primary-a30")}
                onClick={handlePlayPause}
                className="cursor-pointer"
              />
            ) : (
              <FaPlayCircle
                size={55}
                color={getCssVar("--clr-primary-a30")}
                onClick={handlePlayPause}
                className="cursor-pointer"
              />
            )}
            <IoIosFastforward size={40} onClick={handleFastForward} />
          </div>
          <Controls wavesurfer={wavesurfer} />
        </>
      )}

      <InfoBanner
        message={infoBanner.message}
        error={infoBanner.error}
        trigger={infoBanner.trigger}
      />
    </div>
  );
}
