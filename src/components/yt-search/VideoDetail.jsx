import { useState } from "react";
import { BarLoader } from "react-spinners";
import getCssVar from "../../utils/getCssVar";
import { useNavigate } from "react-router-dom";

const baseStyles =
  "rounded-lg bg-surface-200 shadow flex flex-col items-center w-full";

const VideoDetail = ({ video }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const navigate = useNavigate();

  if (!video) {
    return (
      <div
        className={`${baseStyles} mt-5 mb-7 py-4  text-lg font-semibold justify-center`}
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
      const res = await fetch(`http://localhost:8000/api/audios/${videoId}`);
      if (!res.ok) throw new Error("Failed to fetch video with id: " + videoId);

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Done loading → navigate
      navigate("/audio-editor", { state: { videoId, blobUrl } });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const videoSrc = `https://www.youtube.com/embed/${video.id.videoId}`;
  return (
    <div className={`${baseStyles} mt-5 mb-10 p-2 gap-4`}>
      <div className="w-full aspect-video rounded overflow-hidden">
        <iframe
          className="w-full h-full"
          title="video player"
          src={videoSrc}
          allowFullScreen
        />
      </div>
      <div className="w-[85%] min-h-[65px] flex justify-center items-center mb-2 px-6 py-3 rounded-lg bg-primary-100 text-white font-semibold">
        {!isLoading ? (
          <button onClick={handleAnalyze}>Analyze this video</button>
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
  );
};

export default VideoDetail;
