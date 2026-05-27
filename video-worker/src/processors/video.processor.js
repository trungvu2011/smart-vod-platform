const fs = require("fs");
const path = require("path");
const minioClient = require("../config/minio");
const aiService = require("../services/ai.service");

const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const ffprobeInstaller = require("@ffprobe-installer/ffprobe");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const getThumbnailTimestamp = (duration) => {
  if (!duration || duration <= 0) return 1;
  return Math.min(Math.max(Math.floor(duration * 0.1), 1), 10);
};

const getVideoMetadata = async (inputFilePath) =>
  new Promise((resolve) => {
    ffmpeg.ffprobe(inputFilePath, (err, metadata) => {
      if (err || !metadata) {
        resolve(null);
        return;
      }
      resolve(metadata);
    });
  });

const generateThumbnail = async ({
  inputFilePath,
  tempDir,
  videoId,
  bucketName,
  duration,
}) => {
  const thumbnailPath = path.join(tempDir, "thumbnail.jpg");
  const timestamp = getThumbnailTimestamp(duration);

  await new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .seekInput(timestamp)
      .frames(1)
      .videoFilters("scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720")
      .outputOptions(["-q:v 3"])
      .output(thumbnailPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });

  const minioObjectName = `thumbnails/${videoId}.jpg`;
  await minioClient.fPutObject(bucketName, minioObjectName, thumbnailPath, {
    "Content-Type": "image/jpeg",
  });

  return `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${minioObjectName}`;
};

const buildHlsOutputOptions = ({ hasAudio, segmentPattern }) => {
  const options = [
    "-preset fast",

    "-map 0:v",
    "-s:v:0 1280x720",
    "-r:v:0 30",
    "-c:v:0 libx264",
    "-b:v:0 2500k",
    "-g:v:0 300",
    "-keyint_min:v:0 300",
    "-sc_threshold:v:0 0",

    "-map 0:v",
    "-s:v:1 640x360",
    "-r:v:1 30",
    "-c:v:1 libx264",
    "-b:v:1 800k",
    "-g:v:1 300",
    "-keyint_min:v:1 300",
    "-sc_threshold:v:1 0",

    "-map 0:v",
    "-s:v:2 426x240",
    "-r:v:2 15",
    "-c:v:2 libx264",
    "-b:v:2 100k",
    "-maxrate:v:2 120k",
    "-bufsize:v:2 240k",
    "-g:v:2 150",
    "-keyint_min:v:2 150",
    "-sc_threshold:v:2 0",
  ];

  if (hasAudio) {
    options.push(
      "-map 0:a",
      "-c:a:0 aac",
      "-b:a:0 128k",
      "-async 1",

      "-map 0:a",
      "-c:a:1 aac",
      "-b:a:1 96k",
      "-async 1",

      "-map 0:a",
      "-c:a:2 aac",
      "-b:a:2 32k",
      "-async 1",
    );
  }

  options.push(
    "-f hls",
    "-hls_time 10",
    "-hls_playlist_type vod",
    "-hls_flags independent_segments",
    "-master_pl_name master.m3u8",
    "-hls_segment_filename",
    segmentPattern,
    "-var_stream_map",
    hasAudio ? "v:0,a:0 v:1,a:1 v:2,a:2" : "v:0 v:1 v:2",
  );

  return options;
};

const buildMasterPlaylist = (hasAudio) => {
  const audioCodec = hasAudio ? ",mp4a.40.2" : "";

  return `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=148000,RESOLUTION=426x240,CODECS="avc1.4d400c${audioCodec}"
stream_2.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,CODECS="avc1.4d401e${audioCodec}"
stream_1.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1.4d401f${audioCodec}"
stream_0.m3u8`;
};

const cleanChildPlaylist = (filePath) => {
  const content = fs.readFileSync(filePath, "utf-8");
  const cleanedLines = content.split(/\r?\n/).map((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      return trimmed.split("/").pop().split("\\").pop();
    }
    return trimmed;
  });
  fs.writeFileSync(filePath, cleanedLines.join("\n"));
};

const processVideo = async (job) => {
  const { videoId, originalFilename, isMeetingRecording, shouldGenerateThumbnail } =
    job.data;
  const bucketName = process.env.MINIO_BUCKET_NAME;

  console.log(`\n[WORKER] Bat dau xu ly video ID: ${videoId}`);

  const tempDir = path.join(__dirname, "../../../temp", videoId);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const objectName = String(originalFilename || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
  if (!objectName || objectName.split("/").includes("..")) {
    throw new Error(`Invalid MinIO object name: ${originalFilename}`);
  }

  const inputFilePath = path.join(tempDir, ...objectName.split("/"));

  try {
    console.log("[WORKER] [1/4] Dang tai file goc tu MinIO ve worker...");
    await job.updateProgress(2);
    fs.mkdirSync(path.dirname(inputFilePath), { recursive: true });
    await minioClient.fGetObject(bucketName, objectName, inputFilePath);
    await job.updateProgress(5);

    const metadata = await getVideoMetadata(inputFilePath);
    const videoDuration = Math.round(metadata?.format?.duration || 0);
    const hasAudioStream = Boolean(
      metadata?.streams?.some((stream) => stream.codec_type === "audio"),
    );

    console.log(`[WORKER] Do dai video: ${videoDuration} giay`);
    console.log(`[WORKER] Audio stream: ${hasAudioStream ? "yes" : "no"}`);

    let thumbnailUrl = null;
    if (shouldGenerateThumbnail) {
      try {
        console.log("[WORKER] Dang tao thumbnail tu video...");
        thumbnailUrl = await generateThumbnail({
          inputFilePath,
          tempDir,
          videoId,
          bucketName,
          duration: videoDuration,
        });
        console.log(`[WORKER] Da tao thumbnail: ${thumbnailUrl}`);
      } catch (thumbnailError) {
        console.warn("[WORKER] Khong the tao thumbnail tu dong:", thumbnailError.message);
      }
    }

    console.log(
      `[WORKER] [2/4] Dang bam ABR (720p, 360p, 240p) - ${hasAudioStream ? "audio" : "video-only"} mode...`,
    );

    await new Promise((resolve, reject) => {
      const segmentPattern = path
        .join(tempDir, "stream_%v_%03d.ts")
        .replace(/\\/g, "/");
      const playlistPattern = path
        .join(tempDir, "stream_%v.m3u8")
        .replace(/\\/g, "/");
      const outputOptions = buildHlsOutputOptions({
        hasAudio: hasAudioStream,
        segmentPattern,
      });

      ffmpeg(inputFilePath)
        .outputOptions(outputOptions)
        .output(playlistPattern)
        .on("start", (commandLine) => {
          console.log("[WORKER] FFmpeg command:\n", commandLine);
        })
        .on("progress", (progress) => {
          if (progress.percent) {
            const overallPercent = 5 + Math.floor((progress.percent / 100) * 55);
            job.updateProgress(Math.min(overallPercent, 60));
          }
        })
        .on("end", resolve)
        .on("error", (err, stdout, stderr) => {
          const masterPlaylistPath = path.join(tempDir, "master.m3u8");

          if (fs.existsSync(masterPlaylistPath)) {
            console.log(
              "[WORKER] FFmpeg exited with an error after writing HLS files; continuing.",
            );
            resolve();
            return;
          }

          console.error("[WORKER] FFmpeg stderr:", stderr);
          reject(err);
        })
        .run();
    });

    console.log(
      "[WORKER] [3/4] Dang don dep HLS, tao master playlist va day len MinIO...",
    );

    const masterPlaylistPath = path.join(tempDir, "master.m3u8");
    fs.writeFileSync(masterPlaylistPath, buildMasterPlaylist(hasAudioStream));

    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      const filePath = path.join(tempDir, file);

      if (file.endsWith(".m3u8") && file !== "master.m3u8") {
        cleanChildPlaylist(filePath);
      }

      if (file.endsWith(".m3u8") || file.endsWith(".ts")) {
        const minioObjectName = `hls/${videoId}/${file}`;
        const contentType = file.endsWith(".m3u8")
          ? "application/x-mpegURL"
          : "video/MP2T";

        await minioClient.fPutObject(bucketName, minioObjectName, filePath, {
          "Content-Type": contentType,
        });
      }
    }

    let aiResult = null;
    if (!isMeetingRecording && hasAudioStream) {
      console.log("[WORKER] [4/4] Dang chay AI pipeline (Whisper + Summary)...");
      aiResult = await aiService.runLocalWhisper(
        inputFilePath,
        tempDir,
        minioClient,
        job,
      );
    } else if (!hasAudioStream) {
      console.log("[WORKER] [4/4] Bo qua AI pipeline vi video khong co audio.");
      await job.updateProgress(95);
    } else {
      console.log("[WORKER] [4/4] Bo qua AI pipeline (Meeting Recording).");
      await job.updateProgress(95);
    }

    await job.updateProgress(98);
    fs.rmSync(tempDir, { recursive: true, force: true });
    await job.updateProgress(100);
    console.log(`[WORKER] Hoan tat xu ly video ID: ${videoId}\n`);

    return {
      hlsUrl: `${process.env.MINIO_PUBLIC_URL}/${bucketName}/hls/${videoId}/master.m3u8`,
      duration: videoDuration,
      ...(thumbnailUrl && { thumbnailUrl }),
      ...(aiResult && {
        transcriptUrl: aiResult.transcript_url,
        aiSummary: aiResult.ai_summary,
      }),
    };
  } catch (error) {
    console.error(`[ERROR] Loi xu ly video ${videoId}:`, error);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    throw error;
  }
};

module.exports = processVideo;
