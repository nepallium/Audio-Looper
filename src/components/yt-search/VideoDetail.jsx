import { useEffect, useState, forwardRef } from "react";
import { BarLoader, SyncLoader } from "react-spinners";
import getCssVar from "../../utils/getCssVar";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { isAudioIdExists, saveTmpAudioToDB } from "../../api/indexedDB";

const baseStyles =
  "rounded-lg bg-surface-200 shadow flex flex-col items-center w-full";

const VideoDetail = ({ video }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const navigate = useNavigate();

  if (!video) {
    return (
      <div
        className={`${baseStyles} mt-5 mb-7 h-16 text-lg font-semibold justify-center`}
      >
        Click a video to preview it
      </div>
    );
  }

  async function handleAnalyze() {
    if (!video) return;
    setIsLoading(true);

    const videoId = video.id.videoId;
    try {
      const isAudioSaved = await isAudioIdExists(videoId);
      if (isAudioSaved) {
        console.log("Loaded existing audio from IndexedDB");
      } else {
        console.log("Starting analyze for video:", video.id.videoId);
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/audios/${videoId}`
          // `http://localhost:8000/api/audios/${videoId}`
        );
        console.log("Fetch response ok?", res.ok);
        if (!res.ok) {
          throw new Error("Failed to fetch video with id: " + videoId);
        }
        const blob = await res.blob();
        // console.log("Blob size:", blob.size);
        // const blobUrl = URL.createObjectURL(blob);

        await saveTmpAudioToDB(video, blob);
        console.log("Saved to IndexedDB");
      }

      // Done loading → navigate
      navigate("/audio-editor", { state: { videoId, video } });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {!isIframeReady && (
        <div className={`${baseStyles} mt-5 mb-7 h-16 justify-center`}>
          <SyncLoader color={getCssVar("--text-color")} size={10} />
        </div>
      )}

      <div
        className={clsx(
          `${baseStyles} mt-5 mb-10 p-2 gap-4`,
          isIframeReady ? "flex" : "hidden"
        )}
      >
        <div className="w-full aspect-video rounded overflow-hidden">
          <iframe
            className="w-full h-full"
            title="video player"
            src={`https://www.youtube.com/embed/${video.id.videoId}`}
            onLoad={() => setIsIframeReady(true)}
            allowFullScreen
          />
        </div>
        <div
          onClick={() => {
            if (!isLoading) handleAnalyze();
          }}
          className="w-[85%] min-h-[65px] flex justify-center items-center mb-2 px-6 py-3 rounded-lg bg-primary-100 text-white font-semibold"
        >
          {!isLoading ? (
            <button>Analyze this video</button>
          ) : (
            <div className="flex flex-col justify-center items-center gap-1">
              <div>Downloading audio</div>
              <BarLoader
                width={200}
                color={getCssVar("--text-color")}
                className="w-[200px]"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VideoDetail;
