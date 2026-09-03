import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import { join } from "node:path";

import { z } from "zod";

import { MediaError } from "@/modules/media/errors";

const probeSchema = z.object({
  format: z.object({ duration: z.string().optional() }).passthrough(),
  streams: z.array(
    z
      .object({
        codec_type: z.string().optional(),
        duration: z.string().optional(),
        height: z.number().int().positive().optional(),
        width: z.number().int().positive().optional(),
      })
      .passthrough(),
  ),
});

export type MediaMetadata = {
  durationMs: number;
  hasAudio: boolean;
  height: number;
  width: number;
};

export type ProcessedFile = {
  byteSize: number;
  kind: "AUDIO" | "FRAME" | "NORMALIZED_VIDEO" | "THUMBNAIL";
  metadata: Record<string, number | string>;
  mimeType: string;
  path: string;
};

export async function processMediaFile(input: {
  ffmpegPath: string;
  ffprobePath: string;
  inputPath: string;
  maximumDurationSeconds: number;
  outputDirectory: string;
}): Promise<{ artifacts: ProcessedFile[]; metadata: MediaMetadata }> {
  const metadata = await probeMedia(input.ffprobePath, input.inputPath);
  if (metadata.durationMs > input.maximumDurationSeconds * 1000) {
    throw new MediaError(
      "CREATIVE_INVALID_MEDIA",
      `The video exceeds the ${input.maximumDurationSeconds} second duration limit.`,
      422,
    );
  }

  const normalizedPath = join(input.outputDirectory, "normalized.mp4");
  await runCommand(input.ffmpegPath, [
    "-y",
    "-i",
    input.inputPath,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0?",
    "-map_metadata",
    "-1",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    "-threads",
    "1",
    normalizedPath,
  ]);

  const artifacts: ProcessedFile[] = [
    await fileArtifact("NORMALIZED_VIDEO", normalizedPath, "video/mp4", {}),
  ];

  if (metadata.hasAudio) {
    const audioPath = join(input.outputDirectory, "audio.m4a");
    await runCommand(input.ffmpegPath, [
      "-y",
      "-i",
      input.inputPath,
      "-vn",
      "-map_metadata",
      "-1",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      audioPath,
    ]);
    artifacts.push(await fileArtifact("AUDIO", audioPath, "audio/mp4", {}));
  }

  const durationSeconds = metadata.durationMs / 1000;
  const timestamps = [0.1, 0.5, 0.9].map((position) =>
    Math.max(0, Math.min(durationSeconds - 0.01, durationSeconds * position)),
  );
  for (const [index, timestamp] of timestamps.entries()) {
    const framePath = join(
      input.outputDirectory,
      `frame-${String(index + 1).padStart(3, "0")}.jpg`,
    );
    await runCommand(input.ffmpegPath, [
      "-y",
      "-ss",
      timestamp.toFixed(3),
      "-i",
      input.inputPath,
      "-frames:v",
      "1",
      "-q:v",
      "3",
      "-map_metadata",
      "-1",
      framePath,
    ]);
    artifacts.push(
      await fileArtifact("FRAME", framePath, "image/jpeg", {
        index: index + 1,
        timestamp_ms: Math.round(timestamp * 1000),
      }),
    );
    if (index === 0) {
      artifacts.push(
        await fileArtifact("THUMBNAIL", framePath, "image/jpeg", {
          timestamp_ms: Math.round(timestamp * 1000),
        }),
      );
    }
  }

  return { artifacts, metadata };
}

export async function probeMedia(
  ffprobePath: string,
  inputPath: string,
): Promise<MediaMetadata> {
  const { stdout } = await runCommand(ffprobePath, [
    "-v",
    "error",
    "-show_streams",
    "-show_format",
    "-of",
    "json",
    inputPath,
  ]);

  let raw: unknown;
  try {
    raw = JSON.parse(stdout);
  } catch (cause) {
    throw processingError("FFprobe returned malformed metadata.", cause);
  }
  const result = probeSchema.safeParse(raw);
  if (!result.success) {
    throw processingError(
      "FFprobe returned incomplete metadata.",
      result.error,
    );
  }

  const video = result.data.streams.find(
    (stream) => stream.codec_type === "video",
  );
  const duration = Number(
    result.data.format.duration ?? video?.duration ?? Number.NaN,
  );
  if (
    !video?.width ||
    !video.height ||
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    throw new MediaError(
      "CREATIVE_INVALID_MEDIA",
      "The uploaded file does not contain a readable video stream.",
      415,
    );
  }

  return {
    durationMs: Math.round(duration * 1000),
    hasAudio: result.data.streams.some(
      (stream) => stream.codec_type === "audio",
    ),
    height: video.height,
    width: video.width,
  };
}

async function fileArtifact(
  kind: ProcessedFile["kind"],
  path: string,
  mimeType: string,
  metadata: ProcessedFile["metadata"],
): Promise<ProcessedFile> {
  return {
    byteSize: (await stat(path)).size,
    kind,
    metadata,
    mimeType,
    path,
  };
}

async function runCommand(
  executable: string,
  args: string[],
): Promise<{ stderr: string; stdout: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(processingError("Media command timed out."));
    }, 120_000);

    child.stdout.on("data", (chunk: Buffer) => {
      if (stdout.length < 2_000_000) stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < 2_000_000) stderr += chunk.toString("utf8");
    });
    child.on("error", (cause) => {
      clearTimeout(timer);
      reject(processingError("Media command could not start.", cause));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stderr, stdout });
      else reject(processingError(`Media command exited with code ${code}.`));
    });
  });
}

function processingError(message: string, cause?: unknown): MediaError {
  return new MediaError("CREATIVE_PROCESSING_FAILED", message, 500, true, {
    cause,
  });
}
