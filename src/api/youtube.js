import axios from "axios";

export default axios.create({
  baseURL: "https://www.googleapis.com/youtube/v3",
  params: {
    part: "snippet",
    type: "video",
    maxResults: 3,
    key: import.meta.env.VITE_YOUTUBE_DATA_KEY,
  },
});
