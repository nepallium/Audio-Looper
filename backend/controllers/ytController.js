import { spawn } from "child_process";

export function getYtAudio(req, res) {
  const videoId = req.params.videoId;
  if (!videoId) {
    return res.status(400).send("Missing videoId");
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  console.log("Streaming:", url);

  try {
    // Spawn yt-dlp to extract audio as MP3 directly to stdout
    const ytProcess = spawn("yt-dlp", [
      "-x",
      "-o",
      "-", // pipe to stdout
      url,
    ]);

    req.on("close", () => {
      ytProcess.kill("SIGTERM");

      setTimeout(() => {
        if (!ytProcess.killed) {
          ytProcess.kill("SIGKILL");
        }
      }, 1000);
    });

    ytProcess.on("error", (err) => {
      console.error("yt-dlp error:", err);
      if (!res.headersSent) {
        res.status(500).send("Internal system error");
      }
    });

    // headers for streaming as blob
    res.setHeader("Content-Type", "audio/ogg");
    res.setHeader("Content-Disposition", `inline; filename="${videoId}.opus"`);

    // pipe output to client
    ytProcess.stdout.pipe(res);
  } catch (err) {
    console.error("Error streaming audio:", err);
    if (!res.headersSent) {
      res.status(500).send("Internal system error");
    }
  }
}
