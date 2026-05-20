import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import Queue from "better-queue";
import Docker from "dockerode";
import { TIMEOUT } from "dns";

const docker = new Docker();
export const jobStore = new Map(); // jobId -> { status: "downloading"|"processing"|"done"|"failed" }

const TMP_STORAGE_PATH = "tmpStorage/";
const TIME_BEFORE_CLEAR = 30 * 1000;

const scheduleCleanup = (videoId, stemsOutputDir) => {
  setTimeout(() => {
    jobStore.delete(videoId);
    fs.rmSync(stemsOutputDir, { recursive: true, force: true });
  }, TIME_BEFORE_CLEAR);
};

export async function stemSplitAudio(req, res) {
  const { videoId } = req.params;
  if (!videoId) {
    return res.status(400).send("Missing videoId parameter");
  }

  const existing = jobStore.get(videoId);
  if (existing) {
    return res.json({ jobId: videoId, status: existing.status });
  }

  const audioStoreDir = path.join(TMP_STORAGE_PATH, "audios");
  const outputTemplate = path.join(audioStoreDir, "%(id)s.%(ext)s");
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  // where the audio's stems will live (backend/tmpStorage/stems/:videoId/ [6 stems] )
  const stemsOutputDir = path.join(TMP_STORAGE_PATH, "stems", videoId);

  try {
    // Ensure working filesystem directories exist
    fs.mkdirSync(audioStoreDir, { recursive: true });
    fs.mkdirSync(stemsOutputDir, { recursive: true });

    console.log(`Stem split: Starting yt-dlp re-download for: ${videoId}`);

    const downloadProcess = spawn("yt-dlp", [
      "-x",
      "--audio-format",
      "opus",
      "--no-playlist",
      "-o",
      outputTemplate,
      "--print",
      "after_move:filepath",
      url,
    ]);
    let downloadStdout = "";
    downloadProcess.stdout.on("data", (d) => {
      downloadStdout += d.toString();
    });
    downloadProcess.stderr.on("data", (d) =>
      console.error("[yt-dlp]", d.toString()),
    );

    jobStore.set(videoId, { status: "downloading" });
    res.json({ jobId: videoId, status: "downloading" });

    downloadProcess.on("close", (code) => {
      // failed download
      if (code !== 0) {
        jobStore.set(videoId, {
          status: "failed",
          error: "Failed while downloading yt audio",
        });
        scheduleCleanup(videoId, stemsOutputDir);
        return;
      }

      const printedPath = downloadStdout
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .at(-1);
      const inputFilePath = printedPath;

      console.log(
        `[Enqueue] Moving task into hardware throttling queue: ${videoId}`,
      );
      jobStore.set(videoId, { status: "processing" });
      separationQueue
        .push({ videoId, inputFilePath, stemsOutputDir })
        .on("finish", () => {
          console.log(`[Success] AI Stem generation complete for: ${videoId}`);
          jobStore.set(videoId, {
            status: "done",
            stemNames: ["vocals", "bass", "drums", "piano", "guitar", "other"],
          });
          scheduleCleanup(videoId, stemsOutputDir);
        })
        .on("failed", (err) => {
          console.error(
            `[Pipeline Failure] Processing aborted for ${videoId}:`,
            err.message,
          );
          jobStore.set(videoId, {
            status: "failed",
            error: "Error while stem splitting: " + err.message,
          });
          scheduleCleanup(videoId, stemsOutputDir);
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
        path.join("config/bs_roformer/models"),
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
          "--custom_output_names",
          JSON.stringify({
            Vocals: "vocals",
            Bass: "bass",
            Drums: "drums",
            Piano: "piano",
            Guitar: "guitar",
            Other: "other",
          }),
          "--chunk_duration",
          "600", // 10-minute internal chunking bounds VRAM to hopefully < 4GB per song
        ],
        process.stdout, // Pipe container logs to server stdout for status visibility
        {
          HostConfig: {
            AutoRemove: true,
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

export function getJobStatus(req, res) {
  const job = jobStore.get(req.params.videoId);
  if (!job) return res.status(404).json({ status: "not_found" });
  res.json(job);
}

export function getStemFile(req, res) {
  const { videoId, stemName } = req.params;

  // prod
  // const stemFilePath = path.join(
  //   TMP_STORAGE_PATH,
  //   "stems",
  //   videoId,
  //   `${stemName}.opus`,
  // );

  // dev
  const stemFilePath = path.join(TMP_STORAGE_PATH, "stems", `${stemName}.opus`);

  res.setHeader("Content-Type", "audio/ogg; codecs=opus");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${stemName}.opus"`,
  );

  const fileStream = fs.createReadStream(stemFilePath);

  fileStream.on("error", (err) => {
    console.error(`[Stream Error] Failure on stem ${stemName}:`, err);
    if (!res.headersSent) res.status(500).send("Error streaming audio file.");
  });

  fileStream.pipe(res);
}
