import { useState, useEffect } from "react";
import youtube from "../api/youtube";

const useVideos = (defaultSearchTerm) => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    search(defaultSearchTerm);
  }, [defaultSearchTerm]);

  const search = async (term) => {
    const response = await youtube.get("/search", {
      params: {
        q: term,
        part: "snippet",
        type: "video",
        maxResults: 10,
        key: import.meta.env.VITE_YOUTUBE_DATA_KEY,
      },
    });

    const videoItems = response.data.items
      .filter((item) => item.id.kind === "youtube#video")
      .slice(0, 5);
    setVideos(videoItems);
  };

  return [videos, search];
};

export default useVideos;
