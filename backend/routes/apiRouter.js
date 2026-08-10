import express from "express";
import * as ytController from "../controllers/ytController.js";

const router = express.Router();

router.get("/audio/:videoId/yt", ytController.getYtAudio);

export default router;
