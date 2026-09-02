import { expect, test } from "@playwright/test";

test("public foundation and health endpoint are available", async ({
  page,
  request,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Turn creative structures into original ideas for your brand.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Analyze a Creative" }),
  ).toBeVisible();

  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);
  await expect(response.json()).resolves.toMatchObject({
    status: "ok",
    service: "score-signals",
  });
});
