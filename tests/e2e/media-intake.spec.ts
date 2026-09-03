import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { expect, test } from "@playwright/test";

const execute = promisify(execFile);
let fixture: Buffer;
let fixtureDirectory: string;

test.beforeAll(async () => {
  fixtureDirectory = await mkdtemp(join(tmpdir(), "score-e2e-media-"));
  const path = join(fixtureDirectory, "synthetic.mp4");
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
    path,
  ]);
  fixture = await readFile(path);
});

test.afterAll(async () => {
  await rm(fixtureDirectory, { recursive: true, force: true });
});

test("valid media processes while invalid and oversized input are rejected", async ({
  page,
}) => {
  const suffix = crypto.randomUUID();
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Media Tester");
  await page
    .getByLabel("Workspace name")
    .fill(`Media Lab ${suffix.slice(0, 8)}`);
  await page.getByLabel("Email").fill(`media-${suffix}@example.test`);
  await page.getByLabel("Password").fill("MilestoneThree123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/app$/);

  const oversized = await page.request.post("/api/creative/upload-init", {
    data: {
      byte_size: 1_048_577,
      filename: "large.mp4",
      idempotency_key: crypto.randomUUID(),
      mime_type: "video/mp4",
    },
  });
  expect(oversized.status()).toBe(413);
  await expect(oversized.json()).resolves.toMatchObject({
    error: { code: "CREATIVE_UPLOAD_TOO_LARGE" },
  });

  await page.goto("/app/analyze");
  await page.getByLabel("Video file").setInputFiles({
    buffer: Buffer.from("not a video"),
    mimeType: "video/mp4",
    name: "invalid.mp4",
  });
  await page.getByRole("button", { name: "Upload and process" }).click();
  await expect(
    page.getByText("not a supported MP4", { exact: false }),
  ).toBeVisible();

  await page.getByLabel("Creative title").fill("Synthetic launch creative");
  await page.getByLabel("Video file").setInputFiles({
    buffer: fixture,
    mimeType: "video/mp4",
    name: "synthetic.mp4",
  });
  await page.getByRole("button", { name: "Upload and process" }).click();

  await expect(page).toHaveURL(/\/app\/library\/[0-9a-f-]+$/);
  await expect(
    page.getByRole("heading", { name: "Synthetic launch creative" }),
  ).toBeVisible();
  await expect(page.getByText("TRANSCRIBING", { exact: true })).toBeVisible();
  await expect(
    page.getByText("NORMALIZED VIDEO", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("AUDIO", { exact: true })).toBeVisible();
  await expect(page.getByText("THUMBNAIL", { exact: true })).toBeVisible();
  await expect(page.getByText("FRAME", { exact: true })).toHaveCount(3);
  await expect(page.getByText("160 × 90", { exact: true })).toBeVisible();

  const statusResponse = await page.request.get(
    page.url().replace("/app/library/", "/api/creative/"),
  );
  expect(statusResponse.ok()).toBe(true);
  const statusBody = await statusResponse.json();
  expect(statusBody).toMatchObject({
    asset: { status: "TRANSCRIBING" },
    job: { attempt: 1, status: "SUCCEEDED" },
  });
  expect(JSON.stringify(statusBody)).not.toContain("storage_key");
});
