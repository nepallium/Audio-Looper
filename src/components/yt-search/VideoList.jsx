import VideoItem from "./VideoItem";

const VideoList = ({ videos, onVideoSelect }) => {
  console.log(videos);
  if (videos.length === 0) {
    return <div className="h-screen">We didn't find anything...</div>;
  }

  const renderedList = videos.map((video) => {
    return (
      <VideoItem
        key={video.id.videoId}
        onVideoSelect={onVideoSelect}
        video={video}
      />
    );
  });

  return <div className="flex flex-col gap-6">{renderedList}</div>;
};

export default VideoList;
