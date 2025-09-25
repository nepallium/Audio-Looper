import { spawn } from "child_process";

export function getYtAudio(req, res) {
  const videoId = req.params.videoId;
  if (!videoId) {
    res.status(400).send("Missing videoId");
    return;
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  console.log("Streaming:", url);

  try {
    // Spawn yt-dlp to extract audio as MP3 directly to stdout
    const ytProcess = spawn("yt-dlp", [
      "-f", "bestaudio[abr<=128]",
      "-o", "-", // pipe to stdout
      url,
    ]);

    ytProcess.on("error", (err) => {
      console.error("yt-dlp error:", err);
      if (!res.headersSent) {
        res.status(500).send("Internal system error");
      }
    });

    // Pipe the audio output directly to the client
    res.setHeader("Content-Type", "audio/webm");
    res.setHeader("Content-Disposition", `inline; filename="${videoId}.webm"`);
    ytProcess.stdout.pipe(res);

  } catch (err) {
    console.error("Error streaming video:", err);
    if (!res.headersSent) {
      res.status(500).send("Internal system error");
    }
  }
}
