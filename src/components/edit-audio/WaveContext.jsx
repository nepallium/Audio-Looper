import { createContext, useContext, useReducer } from "react";

const WaveContext = createContext(null);

const WaveDispatchContext = createContext(null);

export function WaveProvider({ children }) {
  const [waveContext, dispatch] = useReducer(waveReducer);

  return (
    <WaveContext value={waveContext}>
      <WaveDispatchContext value={dispatch}>{children}</WaveDispatchContext>
    </WaveContext>
  );
}

export function useWaveContext() {
  return useContext(WaveContext);
}

export function useWaveDispatch() {
  return useContext(WaveDispatchContext);
}

function waveReducer(wave, action) {
  switch (action.type) {
    case "set_audioEl": {
      return {
        ...wave,
        audioEl: action.audioEl,
      };
    }
  }
}
