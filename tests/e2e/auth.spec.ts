import { expect, test } from "@playwright/test";

test("a user can sign up, receive a tenant, sign out, and sign in", async ({
  page,
}) => {
  const suffix = crypto.randomUUID();
  const email = `milestone-one-${suffix}@example.test`;
  const password = "MilestoneOne123";
  const workspace = `SCORE Test ${suffix.slice(0, 8)}`;

  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Milestone Tester");
  await page.getByLabel("Workspace name").fill(workspace);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(
    page.getByRole("heading", { name: "Your private workspace is ready." }),
  ).toBeVisible();
  await expect(page.getByText(workspace)).toBeVisible();
  await expect(page.getByText("OWNER", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText(workspace)).toBeVisible();
});
