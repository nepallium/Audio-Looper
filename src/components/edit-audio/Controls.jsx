import { useEffect, useRef, useState } from "react";

export default function Controls({ audioRef }) {
  const audioCtxRef = useRef(null);
  const soundtouchRef = useRef(null);

  const tempoRef = useRef(null);
  const keyRef = useRef(null);
  const resetRef = useRef(null);

  const [tempoValue, setTempoValue] = useState(1);
  const [keyValue, setKeyValue] = useState(0);

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
    audioRef.current.preservesPitch = true;
    audioRef.current.playbackRate = +value;
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
      new URL(`../../api/SoundTouchWorklet.js`, import.meta.url)
    );
    soundtouchRef.current = new AudioWorkletNode(
      audioCtx,
      "soundtouch-processor"
    );

    const soundtouch = soundtouchRef.current;

    soundtouch.connect(audioCtx.destination);
    // create node from audio element:
    const audioNode = audioCtx.createMediaElementSource(audioRef.current);
    audioNode.connect(soundtouch);
    setupFieldListeners();
  };

  return (
    <form>
      <label>
        Tempo
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
      </label>
      <label>
        Key
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
      </label>
      <button ref={resetRef} id="reset" type="reset">
        Reset
      </button>
    </form>
  );
}
