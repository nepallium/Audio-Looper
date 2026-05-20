import express from "express";
import * as ytController from "../controllers/ytController.js";
import * as stemsController from "../controllers/stemsController.js";

const router = express.Router();

router.get("/audio/:videoId/yt", ytController.getYtAudio);

// Generate the stems, stores on server disk temporarily
router.post("/audio/:videoId/stems/split", stemsController.stemSplitAudio);

router.get("/audio/:videoId/stems/:stemName", stemsController.getStemFile);

router.get("/audio/:videoId/stems/status", stemsController.getJobStatus);

export default router;
