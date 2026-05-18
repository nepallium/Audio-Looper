import express from "express";
import * as controller from "../controllers/ytController.js";

const router = express.Router();

router.get("/ytAudio/:videoId", controller.getYtAudio);

export default router;
