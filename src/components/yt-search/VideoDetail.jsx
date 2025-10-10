const baseStyles =
  "rounded-lg bg-tonal-200 shadow flex flex-col items-center w-full";

const VideoDetail = ({ video }) => {
  async function fetchData() {
    if (video != null) {
      const videoId = video.id.videoId;
      try {
        const res = await fetch(`http://localhost:8000/api/audios/${videoId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch video with id: " + videoId);
        }
      } catch (error) {
        console.log("Failed to fetch video");
      }
    }
  }

  if (!video) {
    return (
      <div
        className={`${baseStyles} mt-5 mb-7 py-4 text-surface-600 text-lg font-semibold justify-center`}
      >
        Click a video to preview it
      </div>
    );
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
      <button
        onClick={fetchData}
        className="mb-2 px-4 py-2 rounded-lg bg-primary-100 text-white font-semibold shadow hover:bg-primary-500 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-300"
      >
        Analyze this video
      </button>
    </div>
  );
};

export default VideoDetail;
