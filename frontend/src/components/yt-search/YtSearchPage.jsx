import React, { useState, useEffect, useRef } from "react";
import SearchBar from "./SearchBar";
import VideoList from "./VideoList";
import VideoDetail from "./VideoDetail";
import useVideos from "../../hooks/useVideos";
import Header from "../Header";
// import { preloadedVids } from "../../../dev-tmp/yt-data";

const YtSearchPage = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, search] = useVideos("ncs");
  // const videos = useRef(preloadedVids);

  useEffect(() => {
    setSelectedVideo(null);
  }, [videos]);

  return (
    <div className="page-layout !pb-5 text-base-light">
      <Header title="Youtube Search" />
      <div className="p-4">
        <SearchBar onFormSubmit={search} />
        <div className="flex flex-col gap-4">
          <VideoDetail video={selectedVideo} />
          <VideoList
            onVideoSelect={setSelectedVideo}
            videos={videos}
            // videos={videos.current}
          />
        </div>
      </div>
    </div>
  );
};

export default YtSearchPage;
