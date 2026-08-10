import { useEffect, useRef, useState } from "react";
import { IoMdAddCircle, IoMdRemoveCircle } from "react-icons/io";
import CustomModal from "../CustomModal";
import LoopsList from "./saved-loops/LoopsList";
import { useWaveContext } from "./contexts/WaveContext";
const PITCH_RANGE = { min: -12, max: 12 };
const TEMPO_RANGE = { min: 0.25, max: 1.5, step: 0.01 };

const clampValue = (value, min, max) => Math.min(max, Math.max(min, value));

const formatSignedValue = (value) => (value > 0 ? `+${value}` : `${value}`);

export default function Controls({ wavesurfer }) {
  const waveContext = useWaveContext();
  const audioRef = waveContext.audioRef;

  const [tempoValue, setTempoValue] = useState(1);
  const [pendingKey, setPendingKey] = useState(0);
  const [activeKey, setActiveKey] = useState(0);
  const [isPitchShifting, setIsPitchShifting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isMountedRef = useRef(true);
  const pitchJobIdRef = useRef(0);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const applyTempo = (nextValue) => {
    const tempo = clampValue(
      Number(nextValue),
      TEMPO_RANGE.min,
      TEMPO_RANGE.max,
    );

    setTempoValue(tempo);

    if (audioRef?.current) {
      audioRef.current.playbackRate = tempo;
    }

    if (wavesurfer) {
      wavesurfer.setPlaybackRate(tempo, true);
    }
  };

  const onTempoChange = ({ target: { value } }) => {
    applyTempo(value);
  };

  const handleTempoStep = (delta) => {
    applyTempo(tempoValue + delta);
  };

  const onKeyChange = ({ target: { value } }) => {
    const nextValue = clampValue(
      parseInt(value, 10),
      PITCH_RANGE.min,
      PITCH_RANGE.max,
    );
    setPendingKey(nextValue);
  };

  const handleKeyStep = (delta) => {
    setPendingKey((prev) =>
      clampValue(prev + delta, PITCH_RANGE.min, PITCH_RANGE.max),
    );
  };

  const applyKeyChange = async (targetKey = pendingKey) => {
    const nextKey = clampValue(
      Number(targetKey),
      PITCH_RANGE.min,
      PITCH_RANGE.max,
    );

    if (isPitchShifting || nextKey === activeKey) {
      setPendingKey(nextKey);
      return;
    }

    const jobId = (pitchJobIdRef.current += 1);
    setPendingKey(nextKey);
    setIsPitchShifting(true);

    const audioEl = audioRef?.current || null;
    const wasPlaying = wavesurfer
      ? wavesurfer.isPlaying()
      : audioEl
      ? !audioEl.paused
      : false;
    const playhead = wavesurfer
      ? wavesurfer.getCurrentTime()
      : audioEl
      ? audioEl.currentTime
      : 0;

    if (wavesurfer && wasPlaying) {
      wavesurfer.pause();
    } else if (audioEl && wasPlaying) {
      audioEl.pause();
    }

    const shouldAbort = () =>
      !isMountedRef.current || pitchJobIdRef.current !== jobId;

    try {
      if (shouldAbort()) {
        throw new Error("Pitch shift cancelled");
      }

      if (isMountedRef.current && pitchJobIdRef.current === jobId) {
        setActiveKey(nextKey);
      }
    } catch (err) {
      if (!shouldAbort()) {
        console.error("Failed to shift key:", err);
      }
    } finally {
      if (audioEl && pitchJobIdRef.current === jobId) {
        audioEl.currentTime = playhead;
      }
      if (wavesurfer && pitchJobIdRef.current === jobId) {
        wavesurfer.setTime(playhead);
      }

      if (wasPlaying && pitchJobIdRef.current === jobId) {
        try {
          if (wavesurfer) {
            await wavesurfer.play();
          } else if (audioEl) {
            await audioEl.play();
          }
        } catch (err) {}
      }

      if (isMountedRef.current && pitchJobIdRef.current === jobId) {
        setIsPitchShifting(false);
      }
    }
  };

  const onReset = async () => {
    applyTempo(1);
    await applyKeyChange(0);
  };

  return (
    <>
      <form className="flex-1 flex flex-col justify-between px-4 pb-4 relative">
        {isPitchShifting && (
          <div className="absolute inset-0 z-10 bg-neutral-950/70 flex flex-col items-center justify-center gap-2">
            <div className="w-7 h-7 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-xs text-neutral-300">
              Shifting Key... Processing Audio...
            </p>
          </div>
        )}

        <label>
          {`Tempo: ${tempoValue.toFixed(2)}x`}
          <div className="flex items-center gap-2">
            <IoMdRemoveCircle
              size={34}
              onClick={() => handleTempoStep(-TEMPO_RANGE.step)}
              className="cursor-pointer"
            />
            <input
              id="tempo"
              type="range"
              min={TEMPO_RANGE.min}
              max={TEMPO_RANGE.max}
              step={TEMPO_RANGE.step}
              value={tempoValue}
              onChange={onTempoChange}
            />
            <IoMdAddCircle
              size={34}
              onClick={() => handleTempoStep(TEMPO_RANGE.step)}
              className="cursor-pointer"
            />
          </div>
        </label>

        <label>
          {`Key: ${formatSignedValue(pendingKey)} st`}
          <div className="flex items-center gap-2">
            <IoMdRemoveCircle
              size={34}
              onClick={() => handleKeyStep(-1)}
              className="cursor-pointer"
            />
            <div className="w-full">
              <input
                type="range"
                min={PITCH_RANGE.min}
                max={PITCH_RANGE.max}
                id="key"
                step="1"
                value={pendingKey}
                onChange={onKeyChange}
                disabled={isPitchShifting}
              />
              <div className="text-[10px] text-neutral-400 mt-1">
                Applied: {formatSignedValue(activeKey)} st
              </div>
            </div>
            <IoMdAddCircle
              size={34}
              onClick={() => handleKeyStep(1)}
              className="cursor-pointer"
            />
          </div>
          <button
            type="button"
            onClick={() => applyKeyChange(pendingKey)}
            disabled={
              isPitchShifting || pendingKey === activeKey
            }
            className="mt-2 regular-button"
          >
            Apply Key Change
          </button>
        </label>

        <div className="flex gap-4">
          <button
            className="regular-button flex-1 py-3"
            id="reset"
            type="reset"
            onClick={onReset}
          >
            Reset
          </button>
          <button
            className="regular-button flex-1"
            onClick={(e) => {
              setIsModalOpen(true);
              e.preventDefault();
            }}
          >
            Load loop
          </button>
        </div>
      </form>

      <CustomModal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        title="Saved loops"
        className="h-[70%] flex flex-col"
      >
        <LoopsList setIsModalOpen={setIsModalOpen} />
      </CustomModal>
    </>
  );
}
