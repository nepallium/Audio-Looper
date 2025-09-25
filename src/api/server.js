import express from "express";
import cors from 'cors'
import { getYtAudio } from "./getYtAudio.js";

const PORT = 8000;

const app = express();

app.use(cors());
app.get("/api/audios/:videoId", getYtAudio);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
