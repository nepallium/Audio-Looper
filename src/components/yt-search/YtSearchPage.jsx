import React, { useState, useEffect } from "react";
// import "../../../style/app.scss";
import SearchBar from "./SearchBar";
import VideoList from "./VideoList";
import VideoDetail from "./VideoDetail";
import useVideos from "../../hooks/useVideos";

const YtSearchPage = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, search] = useVideos("");

  useEffect(() => {
    setSelectedVideo(videos[0]);
  }, [videos]);

  return (
    <div className="container mx-auto p-4">
      <SearchBar onFormSubmit={search} />
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VideoDetail video={selectedVideo} />
        </div>
        <div className="lg:col-span-1">
          <VideoList onVideoSelect={setSelectedVideo} videos={videos} />
        </div>
      </div>
    </div>
  );
};

export default YtSearchPage;
