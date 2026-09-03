import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

import { processMediaFile } from "@/modules/media/ffmpeg";

const execute = promisify(execFile);
const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe("FFmpeg media pipeline", () => {
  it("normalizes synthetic video and extracts audio, thumbnail, and frames", async () => {
    const root = await mkdtemp(join(tmpdir(), "score-ffmpeg-test-"));
    directories.push(root);
    const source = join(root, "source.mp4");
    await execute("ffmpeg", [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "testsrc=size=160x90:rate=12:duration=1",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:duration=1",
      "-shortest",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      source,
    ]);
    const result = await processMediaFile({
      ffmpegPath: "ffmpeg",
      ffprobePath: "ffprobe",
      inputPath: source,
      maximumDurationSeconds: 10,
      outputDirectory: root,
    });
    expect(result.metadata).toMatchObject({
      hasAudio: true,
      height: 90,
      width: 160,
    });
    expect(result.artifacts.map((artifact) => artifact.kind)).toEqual([
      "NORMALIZED_VIDEO",
      "AUDIO",
      "FRAME",
      "THUMBNAIL",
      "FRAME",
      "FRAME",
    ]);
    expect(result.artifacts.every((artifact) => artifact.byteSize > 0)).toBe(
      true,
    );
  }, 30_000);
});
