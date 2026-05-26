import { useEffect, useRef, useState } from "react";
import { IoMdAddCircle, IoMdRemoveCircle } from "react-icons/io";
import CustomModal from "../CustomModal";
import LoopsList from "./saved-loops/LoopsList";
import { useWaveContext } from "./contexts/WaveContext";
import { useAudioEngine } from "./contexts/AudioEngineContext.jsx";

const STEM_NAMES = ["vocals", "bass", "drums", "piano", "guitar", "other"];
const PITCH_RANGE = { min: -12, max: 12 };
const TEMPO_RANGE = { min: 0.25, max: 1.5, step: 0.01 };
const PITCH_WINDOW = {
  size: 2048,
  hop: 512,
};

const clampValue = (value, min, max) => Math.min(max, Math.max(min, value));

const formatSignedValue = (value) => (value > 0 ? `+${value}` : `${value}`);

const yieldToMain = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

function createHannWindow(length) {
  const window = new Float32Array(length);
  const denom = Math.max(1, length - 1);

  for (let i = 0; i < length; i += 1) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / denom));
  }

  return window;
}

function resampleLinear(input, ratio) {
  const outputLength = Math.max(1, Math.floor(input.length / ratio));
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i += 1) {
    const pos = i * ratio;
    const index = Math.floor(pos);
    const frac = pos - index;
    const nextIndex = Math.min(index + 1, input.length - 1);
    const sample = input[index] * (1 - frac) + input[nextIndex] * frac;
    output[i] = sample;
  }

  return output;
}

async function timeStretchOLA(
  input,
  stretch,
  window,
  hopIn,
  shouldAbort,
) {
  if (stretch === 1) {
    return input.slice();
  }

  const windowSize = window.length;
  const hopOut = Math.max(1, Math.round(hopIn * stretch));
  const frameCount = Math.max(
    1,
    Math.floor((input.length - windowSize) / hopIn) + 1,
  );
  const outputLength = (frameCount - 1) * hopOut + windowSize;
  const output = new Float32Array(outputLength);
  const windowSum = new Float32Array(outputLength);

  for (let frame = 0; frame < frameCount; frame += 1) {
    if (frame % 32 === 0) {
      if (shouldAbort?.()) {
        throw new Error("Pitch shift cancelled");
      }
      await yieldToMain();
    }
    const inPos = frame * hopIn;
    const outPos = frame * hopOut;

    for (let i = 0; i < windowSize; i += 1) {
      const inputIndex = inPos + i;
      if (inputIndex >= input.length) break;
      const value = input[inputIndex] * window[i];
      const outIndex = outPos + i;
      if (outIndex >= outputLength) break;
      output[outIndex] += value;
      windowSum[outIndex] += window[i];
    }
  }

  for (let i = 0; i < outputLength; i += 1) {
    if (i % 65536 === 0) {
      if (shouldAbort?.()) {
        throw new Error("Pitch shift cancelled");
      }
      await yieldToMain();
    }
    if (windowSum[i] > 1e-6) {
      output[i] /= windowSum[i];
    }
  }

  return output;
}

function fitToLength(input, targetLength) {
  if (input.length === targetLength) {
    return input;
  }

  const output = new Float32Array(targetLength);
  const length = Math.min(targetLength, input.length);
  output.set(input.subarray(0, length));
  return output;
}

async function renderPitchShiftedBuffer(
  originalBuffer,
  semitones,
  audioCtxRef,
  shouldAbort,
) {
  if (semitones === 0) {
    return originalBuffer;
  }

  const ratio = Math.pow(2, semitones / 12);
  const windowSize = PITCH_WINDOW.size;
  const hopIn = PITCH_WINDOW.hop;
  const window = createHannWindow(windowSize);
  const targetLength = originalBuffer.length;

  const processedChannels = Array.from(
    { length: originalBuffer.numberOfChannels },
    () => new Float32Array(targetLength),
  );

  for (
    let channel = 0;
    channel < originalBuffer.numberOfChannels;
    channel += 1
  ) {
    const input = originalBuffer.getChannelData(channel);
    if (shouldAbort?.()) {
      throw new Error("Pitch shift cancelled");
    }
    const resampled = resampleLinear(input, ratio);
    const stretched = await timeStretchOLA(
      resampled,
      ratio,
      window,
      hopIn,
      shouldAbort,
    );
    processedChannels[channel] = fitToLength(stretched, targetLength);
  }

  let offlineCtx = null;
  let outputBuffer = null;

  try {
    if (audioCtxRef?.current && audioCtxRef.current.state !== "closed") {
      outputBuffer = audioCtxRef.current.createBuffer(
        originalBuffer.numberOfChannels,
        targetLength,
        originalBuffer.sampleRate,
      );
    } else {
      const OfflineAudioContextClass =
        window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!OfflineAudioContextClass) {
        throw new Error("OfflineAudioContext is not supported");
      }
      offlineCtx = new OfflineAudioContextClass(
        originalBuffer.numberOfChannels,
        targetLength,
        originalBuffer.sampleRate,
      );
      outputBuffer = offlineCtx.createBuffer(
        originalBuffer.numberOfChannels,
        targetLength,
        originalBuffer.sampleRate,
      );
    }

    for (let channel = 0; channel < processedChannels.length; channel += 1) {
      outputBuffer.copyToChannel(processedChannels[channel], channel);
    }
  } finally {
    if (offlineCtx?.close) {
      try {
        await offlineCtx.close();
      } catch (err) {}
    }
  }

  return outputBuffer;
}

export default function Controls({ wavesurfer }) {
  const waveContext = useWaveContext();
  const audioRef = waveContext.audioRef;
  const engine = useAudioEngine();
  const { audioCtxRef, sourceNodesRef, originalBuffersRef, audioBuffersRef } =
    engine;

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

  const isEngineReady = STEM_NAMES.every(
    (name) => originalBuffersRef.current[name],
  );

  const stopAllStems = () => {
    Object.keys(sourceNodesRef.current).forEach((name) => {
      try {
        sourceNodesRef.current[name].stop();
        sourceNodesRef.current[name].disconnect();
      } catch (err) {}
    });
    sourceNodesRef.current = {};
  };

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

    // Stems always play at native rate to avoid pitch shifting.
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

    if (isPitchShifting || !isEngineReady || nextKey === activeKey) {
      setPendingKey(nextKey);
      return;
    }

    const jobId = (pitchJobIdRef.current += 1);
    setPendingKey(nextKey);
    setIsPitchShifting(true);
    await yieldToMain();

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

    stopAllStems();

    const shouldAbort = () =>
      !isMountedRef.current || pitchJobIdRef.current !== jobId;

    try {
      if (shouldAbort()) {
        throw new Error("Pitch shift cancelled");
      }
      if (nextKey === 0) {
        audioBuffersRef.current = { ...originalBuffersRef.current };
      } else {
        const shiftedBuffers = {};
        for (const name of STEM_NAMES) {
          shiftedBuffers[name] = await renderPitchShiftedBuffer(
            originalBuffersRef.current[name],
            nextKey,
            audioCtxRef,
            shouldAbort,
          );
        }
        audioBuffersRef.current = shiftedBuffers;
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
              isPitchShifting || !isEngineReady || pendingKey === activeKey
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
