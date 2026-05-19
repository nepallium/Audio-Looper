import express from "express";
import * as ytController from "../controllers/ytController.js";
import * as stemsController from "../controllers/stemsController.js";

const router = express.Router();

router.get("/ytAudio/:videoId", ytController.getYtAudio);

router.get("/stems/:videoId", stemsController.processAudioStemSplit);

import { jobStore } from "../controllers/stemsController.js";

router.get("/stems/status/:videoId", (req, res) => {
  const job = jobStore.get(req.params.videoId);
  if (!job) return res.status(404).json({ status: "not_found" });
  res.json(job);
});

export default router;
