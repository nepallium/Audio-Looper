import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

// icons
import { IoArrowBack } from "react-icons/io5";
import { IoMdMicrophone } from "react-icons/io";
import { GiGuitarBassHead } from "react-icons/gi";
import { CgPiano } from "react-icons/cg";
import { PiGuitar } from "react-icons/pi";
import { IoMusicalNotes } from "react-icons/io5";
import { LiaDrumSolid } from "react-icons/lia";
import { useAudioEngine } from "./contexts/AudioEngineContext.jsx";

const STEM_ICONS = {
  vocals: <IoMdMicrophone className="text-sky-400" size={16} />,
  bass: <GiGuitarBassHead className="text-green-400" size={16} />,
  drums: <LiaDrumSolid className="text-red-400" size={16} />,
  piano: <CgPiano className="text-purple-400" size={16} />,
  guitar: <PiGuitar className="text-orange-400" size={16} />,
  other: <IoMusicalNotes className="text-neutral-400" size={16} />,
};

const STEM_NAMES = ["vocals", "bass", "drums", "piano", "guitar", "other"];

export default function Mixer({
  status,
  error,
  audioEl,
  stems,
  onTriggerSplit,
  onBack,
}) {
  const engine = useAudioEngine();
  const {
    audioCtxRef,
    gainNodesRef,
    sourceNodesRef,
    originalBuffersRef,
    audioBuffersRef,
  } = engine;

  const [isDecoding, setIsDecoding] = useState(false);
  const [volumes, setVolumes] = useState({
    vocals: 1,
    bass: 1,
    drums: 1,
    piano: 1,
    guitar: 1,
    other: 1,
  });

  const volumesRef = useRef(volumes);
  const lastStemsRef = useRef(null);
  const isMountedRef = useRef(true);
  const decodeRunIdRef = useRef(0);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (status !== "done" || !stems) {
      setIsDecoding(false);
    }
  }, [status, stems]);

  useEffect(() => {
    volumesRef.current = volumes;
  }, [volumes]);

  const stopAllStems = () => {
    Object.keys(sourceNodesRef.current).forEach((name) => {
      try {
        sourceNodesRef.current[name].stop();
        sourceNodesRef.current[name].disconnect();
      } catch (err) {}
    });
    sourceNodesRef.current = {};
  };

  // 2. THE ENGINE LOGIC (Unpacking the files into memory)
  useEffect(() => {
    if (status !== "done" || !stems) return;

    let cancelled = false;
    const runId = (decodeRunIdRef.current += 1);

    async function initializeAudioEngine() {
      setIsDecoding(true);
      try {
        const AudioContextClass =
          window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
          throw new Error("AudioContext is not supported");
        }

        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new AudioContextClass();
        }

        if (lastStemsRef.current !== stems) {
          stopAllStems();
          originalBuffersRef.current = {};
          audioBuffersRef.current = {};
          lastStemsRef.current = stems;
        }

        const hasAllBuffers = STEM_NAMES.every(
          (name) => originalBuffersRef.current[name],
        );
        if (hasAllBuffers) {
          setIsDecoding(false);
          return;
        }

        const ctx = audioCtxRef.current;

        if (ctx.state === "suspended") {
          try {
            await ctx.resume();
          } catch (err) {}
        }

        await Promise.all(
          STEM_NAMES.map(async (name) => {
            if (!stems[name]) return;
            const arrayBuffer = await stems[name].arrayBuffer();
            const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
            originalBuffersRef.current[name] = decodedBuffer;
            audioBuffersRef.current[name] = decodedBuffer;

            if (!gainNodesRef.current[name]) {
              const gainNode = ctx.createGain();
              gainNode.gain.setValueAtTime(
                volumesRef.current[name],
                ctx.currentTime,
              );
              gainNode.connect(ctx.destination);
              gainNodesRef.current[name] = gainNode;
            } else {
              gainNodesRef.current[name].gain.setValueAtTime(
                volumesRef.current[name],
                ctx.currentTime,
              );
            }
          }),
        );
      } catch (err) {
        console.error("Critical error building audio engine:", err);
      } finally {
        if (!cancelled && isMountedRef.current && runId === decodeRunIdRef.current) {
          setIsDecoding(false);
        }
      }
    }

    initializeAudioEngine();

    return () => {
      cancelled = true;
    };
  }, [status, stems, audioCtxRef, gainNodesRef, originalBuffersRef, audioBuffersRef]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
      originalBuffersRef.current = {};
      audioBuffersRef.current = {};
      gainNodesRef.current = {};
      sourceNodesRef.current = {};
    };
  }, [
    audioCtxRef,
    originalBuffersRef,
    audioBuffersRef,
    gainNodesRef,
    sourceNodesRef,
  ]);

  // 3. WIRING THE SLIDERS TO THE ENGINE
  const handleVolumeChange = (name, val) => {
    const volumeValue = parseFloat(val);
    setVolumes((prev) => ({ ...prev, [name]: volumeValue }));

    if (gainNodesRef.current[name] && audioCtxRef.current) {
      gainNodesRef.current[name].gain.linearRampToValueAtTime(
        volumeValue,
        audioCtxRef.current.currentTime + 0.02,
      );
    }
  };

  // 4. THE AUDIO HIJACK ENGINE (Syncing Stems to Wavesurfer)
  useEffect(() => {
    // Only run if the audio element exists, stems are done, and decoding is finished
    if (!audioEl || status !== "done" || isDecoding) return;

    // Helper to instantly kill all 6 tracks
    const stopStems = () => stopAllStems();

    // Helper to start all 6 tracks at an exact timestamp
    const playStems = async (startTime) => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      // WAIT for the context to be running before scheduling sources
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      stopStems(); // clear old nodes after context is confirmed running

      Object.keys(audioBuffersRef.current).forEach((name) => {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffersRef.current[name];
        source.playbackRate.setValueAtTime(1, ctx.currentTime);
        source.connect(gainNodesRef.current[name]);
        source.start(0, startTime);
        sourceNodesRef.current[name] = source;
      });
    };

    // Listeners that react to Wavesurfer's background actions
    const handlePlay = () => {
      playStems(audioEl.currentTime);
    };
    const handlePause = () => stopStems();
    const handleSeeking = () => stopStems(); // Stop audio while user is dragging the timeline
    const handleSeeked = () => {
      if (!audioEl.paused) playStems(audioEl.currentTime); // Resume if they were playing
    };

    // Attach the listeners
    audioEl.addEventListener("play", handlePlay);
    audioEl.addEventListener("pause", handlePause);
    audioEl.addEventListener("seeking", handleSeeking);
    audioEl.addEventListener("seeked", handleSeeked);

    // MUTE THE MASTER TRACK (The hijack!)
    audioEl.muted = true;

    // If the song is already playing when the stems finish decoding, start them instantly!
    if (!audioEl.paused) {
      playStems(audioEl.currentTime);
    }

    // Cleanup when component unmounts
    return () => {
      audioEl.removeEventListener("play", handlePlay);
      audioEl.removeEventListener("pause", handlePause);
      audioEl.removeEventListener("seeking", handleSeeking);
      audioEl.removeEventListener("seeked", handleSeeked);
      audioEl.muted = false; // Give audio back to the master track
      stopStems();
    };
  }, [audioEl, status, isDecoding]);

  return (
    <div className="w-full h-full p-4 flex flex-col">
      {/* HEADER: Back Button */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-md text-neutral-300 transition-colors"
        >
          <IoArrowBack size={18} />
        </button>
        <h3 className="text-lg font-bold text-white">Audio Mixer</h3>
      </div>

      {/* STATE: IDLE */}
      {status === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-neutral-400 mb-4 text-sm max-w-sm">
            Isolate instruments using the BS-Roformer neural network. This
            process takes a few minutes.
          </p>
          <button
            onClick={onTriggerSplit}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-md text-sm"
          >
            Generate AI Stems
          </button>
        </div>
      )}

      {/* STATE: WORKING */}
      {(status === "downloading" ||
        status === "processing" ||
        status === "hydrating") && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3" />
          <p className="text-white font-medium text-sm mb-1">
            {status === "downloading" && "Acquiring source..."}
            {status === "processing" && "AI isolating layers..."}
            {status === "hydrating" && "Caching tracks..."}
          </p>
          <p className="text-neutral-500 text-xs">
            You can go back to the waveform while this runs.
          </p>
        </div>
      )}

      {/* STATE: FAILED */}
      {status === "failed" && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-rose-400 font-medium text-sm mb-1">
            Extraction Aborted
          </p>
          <p className="text-neutral-400 text-xs mb-4 max-w-sm">
            {error || "An unknown error occurred during generation."}
          </p>
          <button
            onClick={onTriggerSplit}
            className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs py-2 px-4 rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* STATE: DONE (The 3x2 Grid) */}
      {status === "done" && (
        <div className="flex-1 flex flex-col justify-center relative">
          {isDecoding ? (
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-neutral-400">
                Booting audio engine...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-8">
              {STEM_NAMES.map((name) => (
                <div
                  key={name}
                  className="flex flex-col bg-neutral-950 p-3 rounded-lg border border-neutral-800/50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      {STEM_ICONS[name] || <IoMusicalNotes size={16} />}
                      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                        {name}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleVolumeChange(name, volumes[name] > 0 ? 0 : 1)
                      }
                      className={clsx(
                        "text-[10px] font-bold px-2 py-0.5 rounded transition-colors",
                        volumes[name] === 0
                          ? "bg-rose-500/20 text-rose-400"
                          : "bg-neutral-800 hover:bg-neutral-700 text-neutral-400",
                      )}
                    >
                      {volumes[name] === 0 ? "MUTED" : "MUTE"}
                    </button>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volumes[name]}
                    onChange={(e) => handleVolumeChange(name, e.target.value)}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
