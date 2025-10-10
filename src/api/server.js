import express from "express";
import cors from "cors";
import { getYtAudio } from "./getYtAudio.js";
import fs from "fs";
import youtube from "./youtube.js";

const PORT = 8000;

const app = express();

app.use(cors());
app.get("/api/audios/:videoId", getYtAudio);

// const response = await youtube.get("/search", {
//   params: {
//     q: "emmet cohen",
//     part: "snippet",
//     // maxResults: 3,
//     type: "video",
//     key: import.meta.env.VITE_YOUTUBE_DATA_KEY,
//   },
// });

// fs.writeFile(
//   process.cwd() + "/dev-tmp/yt-data.json",
//   JSON.stringify(response.data.items),
//   "utf-8",
//   () => console.log("succesfully written into json")
// );

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
