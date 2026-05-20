import { IoClose } from "react-icons/io5";

export default function Mixer({ status, error, onTriggerSplit, onClose }) {
  // Hardcoded for UI mapping right now
  const stemNames = ["vocals", "bass", "drums", "piano", "guitar", "other"];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-xl rounded-xl p-6 relative flex flex-col shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <IoClose size={24} />
        </button>

        <h3 className="text-xl font-bold text-white mb-4">Audio Mixer</h3>

        {/* STATE: IDLE */}
        {status === "idle" && (
          <div className="text-center py-8">
            <p className="text-neutral-400 mb-6 text-sm">
              Isolate instruments using the BS-Roformer neural network. This
              process takes a few minutes.
            </p>
            <button
              onClick={onTriggerSplit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-md"
            >
              Generate AI Stems
            </button>
          </div>
        )}

        {/* STATE: WORKING (Downloading, Processing, Hydrating) */}
        {(status === "downloading" ||
          status === "processing" ||
          status === "hydrating") && (
          <div className="text-center py-10 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-white font-medium text-sm mb-2">
              {status === "downloading" &&
                "Acquiring high-fidelity source audio..."}
              {status === "processing" && "AI isolating instrument layers..."}
              {status === "hydrating" && "Caching tracks to local storage..."}
            </p>
            <p className="text-neutral-500 text-xs max-w-xs">
              You can close this overlay and keep practicing. We'll finish
              setting up the mixer in the background.
            </p>
          </div>
        )}

        {/* STATE: FAILED */}
        {status === "failed" && (
          <div className="text-center py-8">
            <p className="text-rose-400 font-medium text-sm mb-2">
              Extraction Aborted
            </p>
            <p className="text-neutral-400 text-xs mb-6 max-w-sm mx-auto">
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

        {/* STATE: DONE (The Sliders) */}
        {status === "done" && (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-xs text-emerald-500 mb-2 font-medium">
              Stems successfully loaded to local cache.
            </p>

            {stemNames.map((name) => (
              <div
                key={name}
                className="flex items-center justify-between bg-neutral-950 p-3 rounded-lg border border-neutral-800/50"
              >
                <span className="text-sm font-medium capitalize text-neutral-300 w-20">
                  {name}
                </span>
                <div className="flex items-center gap-4 flex-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    defaultValue="1"
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <button className="text-xs font-semibold px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors">
                    Mute
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
