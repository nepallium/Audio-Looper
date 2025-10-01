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

  useEffect(() => {
    async function fetchData() {
      if (selectedVideo != null) {
        const videoId = selectedVideo.id.videoId;
        try {
          const res = await fetch(
            `http://localhost:8000/api/audios/${videoId}`
          );
          if (!res.ok) {
            throw new Error("Failed to fetch video with id: " + videoId);
          }
        } catch (error) {
          console.log("Failed to fetch video");
        }
      }
    }

    fetchData();
  }, [selectedVideo]);

  return (
    <div className="page-layout !p-0 !pb-5 text-base-light">
      <SearchBar
      // onFormSubmit={search}
      />
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <VideoList onVideoSelect={setSelectedVideo} videos={videos.current} />
        </div>
      </div>
    </div>
  );
};

export default YtSearchPage;
