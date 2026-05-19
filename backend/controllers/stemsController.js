import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import Queue from "better-queue";
import Docker from "dockerode";

const docker = new Docker();
export const jobStore = new Map(); // jobId -> { status: "processing"|"done"|"failed" }

const TMP_STORAGE_PATH = "backend/tmpStorage/";

export async function processAudioStemSplit(req, res) {
  const { videoId } = req.params;
  if (!videoId) {
    return res.status(400).send("Missing videoId parameter");
  }

  const audioStoreDir = path.join(TMP_STORAGE_PATH, "audios");
  const inputFilePath = path.join(audioStoreDir, `${videoId}.opus`);
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  // where the audio's stems will live (backend/tmpStorage/stems/:videoId/ [6 stems] )
  const stemsOutputDir = path.join(TMP_STORAGE_PATH, "stems", videoId);

  try {
    // Ensure working filesystem directories exist
    fs.mkdirSync(audioStoreDir, { recursive: true });
    fs.mkdirSync(stemsOutputDir, { recursive: true });

    console.log(`Stem split: Starting yt-dlp re-download for: ${videoId}`);

    const downloadProcess = spawn("yt-dlp", ["-x", "-o", inputFilePath, url]);
    downloadProcess.stderr.on("data", (d) =>
      console.error("[yt-dlp]", d.toString()),
    );

    jobStore.set(videoId, { status: "queued" });
    res.json({ jobId: videoId, status: "queued" });

    downloadProcess.on("close", (code) => {
      if (code !== 0) {
        jobStore.set(videoId, { status: "failed" });
        setTimeout(() => jobStore.delete(videoId), 3 * 60 * 1000);
        return;
      }
      console.log(
        `[Enqueue] Moving task into hardware throttling queue: ${videoId}`,
      );
      jobStore.set(videoId, { status: "queued" });
      separationQueue
        .push({ videoId, inputFilePath, stemsOutputDir })
        .on("finish", () => {
          console.log(`[Success] AI Stem generation complete for: ${videoId}`);
          jobStore.set(videoId, { status: "done" });
          setTimeout(() => jobStore.delete(videoId), 3 * 60 * 1000);
        })
        .on("failed", (err) => {
          console.error(
            `[Pipeline Failure] Processing aborted for ${videoId}:`,
            err.message,
          );
          jobStore.set(videoId, { status: "failed", error: err.message });
          setTimeout(() => jobStore.delete(videoId), 3 * 60 * 1000);
        });
    });
  } catch (err) {
    console.error("Critical server fault:", err);
    if (!res.headersSent) {
      res.status(500).send("Internal server processing execution error.");
    }
  }
}

// safety blanket for RTX 4000 8gb VRAM
// max out 2 songs processed at a time
const separationQueue = new Queue(
  async (task, cb) => {
    const { videoId, stemsOutputDir, inputFilePath } = task;

    try {
      const absoluteOutputDir = path.resolve(stemsOutputDir);
      const absoluteInputFile = path.resolve(inputFilePath);
      const absoluteModelsDir = path.resolve(
        path.join("backend/config/bs_roformer/models"),
      );

      // Execute via Docker SDK using the official beveradb image
      await docker.run(
        "beveradb/audio-separator:gpu",
        [
          "/inputAudio",
          "--model_filename",
          "BS-Roformer-SW.ckpt",
          "--model_file_dir",
          "/models",
          "--output_dir",
          "/stemsOutputForAudio",
          "--output_format",
          "OPUS",
          "--chunk_duration",
          "600", // 10-minute internal chunking bounds VRAM to hopefully < 4GB per song
        ],
        process.stdout, // Pipe container logs to server stdout for status visibility
        {
          HostConfig: {
            Binds: [
              `${absoluteOutputDir}:/stemsOutputForAudio`,
              `${absoluteInputFile}:/inputAudio`,
              `${absoluteModelsDir}:/models`,
            ],
            DeviceRequests: [
              {
                Driver: "nvidia",
                Count: -1, // Mount all available system GPUs
                Capabilities: [["gpu"]],
              },
            ],
          },
        },
      );

      cb(null, { success: true });
    } catch (err) {
      console.error(
        `[Queue Error] AI extraction failed for videoId ${videoId}:`,
        err.message,
      );
      cb(err);
    } finally {
      // Structural cleanup of the temporary raw source file
      if (fs.existsSync(inputFilePath)) {
        fs.unlinkSync(inputFilePath);
      }
    }
  },
  {
    concurrent: 2, // 2 concurrent tasks * ~2.5GB VRAM = safely locked under 6GB VRAM max limit
    maxRetries: 0,
  },
);
