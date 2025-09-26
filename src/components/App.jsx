import { useEffect, useRef, useState } from "react";
import Waveform from "./Waveform";

export default function App() {
    const audioCtxRef = useRef(null);
    const soundtouchRef = useRef(null);

    const audioRef = useRef(null);
    const pitchRef = useRef(null);
    const tempoRef = useRef(null);
    const keyRef = useRef(null);
    const resetRef = useRef(null);

    const [pitchValue, setPitchValue] = useState(1);
    const [tempoValue, setTempoValue] = useState(1);
    const [keyValue, setKeyValue] = useState(0);

    useEffect(() => {
        audioRef.current.volume = 0.3;
    }, []);

    function beforeunloadFct() {
        audioRef.current.removeEventListener("play", onPlay);
        removeFieldListeners();
        audioCtxRef.current?.close();
        audioCtxRef.current = null;
        soundtouchRef.current = null;
    }
    useEffect(() => {
        window.addEventListener("beforeunload", beforeunloadFct);

        return () => {
            window.removeEventListener("beforeunload", beforeunloadFct);
        };
    }, []);

    const onPitchChange = ({ target: { value } }) => {
        setPitchValue(value);
        soundtouchRef.current.parameters.get("pitch").value = +value;
    };

    const onTempoChange = ({ target: { value } }) => {
        setTempoValue(value);
        audioRef.current.preservesPitch = true;
        audioRef.current.playbackRate = +value;
    };

    const onKeyChange = ({ target: { value } }) => {
        setKeyValue(value);
        soundtouchRef.current.parameters.get("pitchSemitones").value = +value;
    };

    const onReset = () => {
        if (soundtouchRef.current) {
            soundtouchRef.current.parameters.get("pitch").value = 1;
            soundtouchRef.current.parameters.get("pitchSemitones").value = 0;
        }
        audioRef.current.playbackRate = 1;
    };

    function setupFieldListeners() {
        if (!soundtouchRef.current) {
            return;
        }
        soundtouchRef.current.parameters.get("pitch").value =
            pitchRef.current.value;
        audioRef.current.preservesPitch = true;
        audioRef.current.playbackRate = tempoRef.current.value;
        audioRef.current.preservesPitch = false;
        soundtouchRef.current.parameters.get("pitchSemitones").value =
            keyRef.current.value;
        pitchRef.current.addEventListener("input", onPitchChange);
        tempoRef.current.addEventListener("input", onTempoChange);
        keyRef.current.addEventListener("input", onKeyChange);
        resetRef.current.addEventListener("click", onReset);
    }

    function removeFieldListeners() {
        pitchRef.current.removeEventListener("input", onPitchChange);
        tempoRef.current.removeEventListener("input", onTempoChange);
        keyRef.current.removeEventListener("input", onKeyChange);
        resetRef.current.removeEventListener("click", onReset);
    }

    const onPlay = async () => {
        if (audioCtxRef.current) return;
        audioCtxRef.current = new AudioContext();
        const audioCtx = audioCtxRef.current;
        // add worklet asynchronously:
        await audioCtx.audioWorklet.addModule(
            new URL("../api/SoundTouchWorklet.js", import.meta.url)
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

    const url = "/test_audio.mp3";
    // const url = "https://www.youtube.com/watch?v=7GRG7HNDct8"
    // const url = "http://localhost:8000/api/audios/7GRG7HNDct8";

    return (
        <>
            <audio
                ref={audioRef}
                src={url}
                preload="none"
                controls
                onPlay={onPlay}
            ></audio>

            <form>
                <label>
                    Pitch{" "}
                    <input
                        ref={pitchRef}
                        id="pitch"
                        type="range"
                        min="0.25"
                        max="4.0"
                        step="0.01"
                        value={pitchValue}
                        onChange={onPitchChange}
                    />
                </label>
                <label>
                    Tempo{" "}
                    <input
                        ref={tempoRef}
                        id="tempo"
                        type="range"
                        min="0.25"
                        max="4.0"
                        step="0.01"
                        value={tempoValue}
                        onChange={onTempoChange}
                    />
                </label>
                <label>
                    Key{" "}
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
                    <datalist id="keyrange">
                        <option value="-7"> </option>
                        <option value="-6"> </option>
                        <option value="-5"> </option>
                        <option value="-4"> </option>
                        <option value="-3"> </option>
                        <option value="-2"> </option>
                        <option value="-1"> </option>
                        <option value="0"> </option>
                        <option value="1"> </option>
                        <option value="2"> </option>
                        <option value="3"> </option>
                        <option value="4"> </option>
                        <option value="5"> </option>
                        <option value="6"> </option>
                        <option value="7"> </option>
                    </datalist>
                </label>
                <button ref={resetRef} id="reset" type="reset">
                    Reset
                </button>
            </form>

            {/* <Waveform audioUrl={url} className="w-4 h-10" /> */}
        </>
    );
}
