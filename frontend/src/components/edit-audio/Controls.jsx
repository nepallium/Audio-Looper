import { useEffect, useRef, useState } from "react";
import { IoMdAddCircle, IoMdRemoveCircle } from "react-icons/io";
import CustomModal from "../CustomModal";
import LoopsList from "./saved-loops/LoopsList";
import { useWaveContext } from "./WaveContext";

export default function Controls({ wavesurfer }) {
  const waveContext = useWaveContext();
  const audioRef = waveContext.audioRef;

  const audioCtxRef = useRef(null);
  const soundtouchRef = useRef(null);

  const tempoRef = useRef(null);
  const keyRef = useRef(null);
  const resetRef = useRef(null);

  const [tempoValue, setTempoValue] = useState(1);
  const [keyValue, setKeyValue] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    audioRef.current.volume = 0.3;
    audioRef.current.addEventListener("play", onPlay);

    setupFieldListeners();

    return () => {
      removeFieldListeners();
      audioCtxRef.current?.close();
    };
  }, []);

  // Handle cleanup for page unload/close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("play", onPlay);
        removeFieldListeners();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // runs for component unmount
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const onTempoChange = ({ target: { value } }) => {
    setTempoValue(value);
    // audioRef.current.preservesPitch = true;
    // audioRef.current.playbackRate = +value;
    wavesurfer.setPlaybackRate(+value, true);
  };

  const onKeyChange = ({ target: { value } }) => {
    setKeyValue(value);
    if (soundtouchRef.current) {
      soundtouchRef.current.parameters.get("pitchSemitones").value = +value;
    }
  };

  const onReset = () => {
    if (soundtouchRef.current) {
      soundtouchRef.current.parameters.get("pitchSemitones").value = 0;
    }
    audioRef.current.playbackRate = 1;

    setTempoValue(1);
    setKeyValue(0);
  };

  function setupFieldListeners() {
    if (!soundtouchRef.current) {
      return;
    }
    audioRef.current.preservesPitch = true;
    audioRef.current.playbackRate = tempoRef.current.value;
    audioRef.current.preservesPitch = false;
    soundtouchRef.current.parameters.get("pitchSemitones").value =
      keyRef.current.value;
    tempoRef.current.addEventListener("input", onTempoChange);
    keyRef.current.addEventListener("input", onKeyChange);
    resetRef.current.addEventListener("click", onReset);
  }

  function removeFieldListeners() {
    if (!tempoRef.current || !keyRef.current || !resetRef.current) return;

    tempoRef.current.removeEventListener("input", onTempoChange);
    keyRef.current.removeEventListener("input", onKeyChange);
    resetRef.current.removeEventListener("click", onReset);
  }

  const onPlay = async () => {
    if (audioCtxRef.current) {
      await audioCtxRef.current.resume();
      return;
    }
    audioCtxRef.current = new AudioContext();
    const audioCtx = audioCtxRef.current;
    // add worklet asynchronously:
    await audioCtx.audioWorklet.addModule(
      new URL(`@/src/config/SoundTouchWorklet.js`, import.meta.url),
    );
    soundtouchRef.current = new AudioWorkletNode(
      audioCtx,
      "soundtouch-processor",
    );

    const soundtouch = soundtouchRef.current;

    soundtouch.connect(audioCtx.destination);
    // create node from audio element:
    const audioNode = audioCtx.createMediaElementSource(audioRef.current);
    audioNode.connect(soundtouch);
    setupFieldListeners();
  };

  function onPlus(onChange, sliderRef) {
    if (!sliderRef.current) return;

    const slider = sliderRef.current;
    const currVal = Number(slider.value);
    if (currVal === Number(slider.max)) return;
    const newVal =
      Math.round((Number(slider.value) + Number(slider.step)) * 100) / 100;
    slider.value = newVal;

    onChange({ target: { value: newVal.toString() } });
  }
  function onMinus(onChange, sliderRef) {
    if (!sliderRef.current) return;

    const slider = sliderRef.current;
    const currVal = Number(slider.value);
    if (currVal === Number(slider.min)) return;
    const newVal =
      Math.round((Number(slider.value) - Number(slider.step)) * 100) / 100;
    slider.value = newVal;

    onChange({ target: { value: newVal.toString() } });
  }

  return (
    <>
      <form className="flex-1 flex flex-col justify-between px-4 pb-4">
        <label>
          {`Tempo: ${tempoValue}`}
          <div className="flex items-center gap-2">
            <IoMdRemoveCircle
              size={34}
              onClick={() => onMinus(onTempoChange, tempoRef)}
              className="cursor-pointer"
            />
            <input
              ref={tempoRef}
              id="tempo"
              type="range"
              min="0.25"
              max="1.5"
              step="0.01"
              value={tempoValue}
              onChange={onTempoChange}
            />
            <IoMdAddCircle
              size={34}
              onClick={() => onPlus(onTempoChange, tempoRef)}
              className="cursor-pointer"
            />
          </div>
        </label>
        <label>
          {`Key: ${keyValue}`}
          <div className="flex items-center gap-2">
            <IoMdRemoveCircle
              size={34}
              onClick={() => onMinus(onKeyChange, keyRef)}
              className="cursor-pointer"
            />
            <div className="w-full">
              <input
                ref={keyRef}
                type="range"
                min="-7.0"
                max="7.0"
                id="key"
                step="1"
                list="keyrange"
                value={keyValue}
                onChange={onKeyChange}
              />
              <datalist className="sliderticks">
                <span>-7</span>
                <span>-6</span>
                <span>-5</span>
                <span>-4</span>
                <span>-3</span>
                <span>-2</span>
                <span>-1</span>
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
                <span>7</span>
              </datalist>
            </div>
            <IoMdAddCircle
              size={34}
              onClick={() => onPlus(onKeyChange, keyRef)}
              className="cursor-pointer"
            />
          </div>
        </label>
        <div className="flex gap-4">
          <button
            className="regular-button flex-1 py-3"
            ref={resetRef}
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
