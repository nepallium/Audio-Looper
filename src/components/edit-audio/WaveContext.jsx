import { createContext, useContext, useReducer } from "react";

const WaveContext = createContext(null);

const WaveDispatchContext = createContext(null);

export function WaveProvider({ children }) {
  const [waveContext, dispatch] = useReducer(waveReducer, {});

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
    case "set_video": {
      return {
        ...wave,
        video: action.video,
      };
    }

    case "set_audioRef": {
      return {
        ...wave,
        audioRef: action.audioRef,
      };
    }

    case "set_displayRegionFct": {
      return {
        ...wave,
        displayRegion: action.displayRegion,
      };
    }

    case "set_deleteOneRegionFct": {
      return {
        ...wave,
        deleteOneRegion: action.deleteOneRegion,
      };
    }

    default: {
      throw Error("unknown action in WaveContext: " + action.type);
    }
  }
}
