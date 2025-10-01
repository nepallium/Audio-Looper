import React, { useState, useEffect, useRef } from "react";
// import "../../../style/app.scss";
import SearchBar from "./SearchBar";
import VideoList from "./VideoList";
import VideoDetail from "./VideoDetail";
import useVideos from "../../hooks/useVideos";
import { preloadedVids } from "../../../dev-tmp/yt-data";

const YtSearchPage = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  // const [videos, search] = useVideos("");
  const videos = useRef(preloadedVids);

  useEffect(() => {
    setSelectedVideo(videos[0]);
  }, [videos]);

  return (
    <div className="page-layout !pb-5 text-base-light">
      <SearchBar
      // onFormSubmit={search}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3">
        <VideoDetail video={selectedVideo} />
        <div className="lg:col-span-1">
          <VideoList onVideoSelect={setSelectedVideo} videos={videos.current} />
        </div>
      </div>
    </div>
  );
};

export default YtSearchPage;
