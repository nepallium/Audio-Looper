import { createContext, useContext, useRef } from "react";

const AudioEngineContext = createContext(null);

export function AudioEngineProvider({ children }) {
  const audioCtxRef = useRef(null);
  const gainNodesRef = useRef({});
  const sourceNodesRef = useRef({});
  const originalBuffersRef = useRef({}); // 0-semitone pristine source
  const audioBuffersRef = useRef({}); // Currently active buffers (shifted or raw)

  // Stable engine interface containing all mutable hardware pointers
  const engine = useRef({
    audioCtxRef,
    gainNodesRef,
    sourceNodesRef,
    originalBuffersRef,
    audioBuffersRef,
  });

  return (
    <AudioEngineContext.Provider value={engine.current}>
      {children}
    </AudioEngineContext.Provider>
  );
}

export function useAudioEngine() {
  return useContext(AudioEngineContext);
}
