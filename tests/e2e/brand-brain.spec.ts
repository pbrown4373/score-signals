import { expect, test } from "@playwright/test";

test("a new user completes and reviews a full Brand Brain", async ({
  page,
}) => {
  const suffix = crypto.randomUUID();
  const email = `milestone-two-${suffix}@example.test`;
  const brand = `Northstar ${suffix.slice(0, 6)}`;
  const product = `Starter Kit ${suffix.slice(0, 6)}`;

  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Brand Brain Tester");
  await page
    .getByLabel("Workspace name")
    .fill(`Brand Lab ${suffix.slice(0, 8)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("MilestoneTwo123");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.getByRole("link", { name: "Set up Brand Brain" }).click();
  await expect(
    page.getByRole("heading", { name: "Build your Brand Brain." }),
  ).toBeVisible();

  await page.getByLabel("Brand name").fill(brand);
  await page.getByLabel("Website (optional)").fill("https://northstar.example");
  await page.getByLabel("Category").fill("Home goods");
  await page
    .getByLabel("Brand description")
    .fill("Practical products for calmer and more organized homes.");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Product name (optional)").fill(product);
  await page.getByLabel("Price description").fill("$49 starter bundle");
  await page
    .getByLabel("Product description")
    .fill("A practical organizing kit.");
  await page
    .getByLabel("Offer details")
    .fill("Save 10% on the starter bundle.");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Persona name (optional)").fill("Busy organizer");
  await page.getByLabel("Awareness stage").fill("Problem aware");
  await page
    .getByLabel("Persona description")
    .fill("A time-conscious customer who wants a calmer home.");
  await page.getByLabel("Pains").fill("Clutter\nToo much setup");
  await page.getByLabel("Desires").fill("Calm spaces\nSimple routines");
  await page.getByLabel("Objections").fill("Will it fit my home?");
  await page.getByRole("button", { name: "Continue" }).click();

  await page
    .getByLabel("Brand voice (optional)")
    .fill("Warm, practical, and clear.");
  await page
    .getByLabel("Proof label (optional)")
    .fill("Material specification");
  await page.getByLabel("Source note").fill("Product documentation");
  await page
    .getByLabel("Proof detail")
    .fill("Every component has a documented material specification.");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Restriction type").selectOption("PROHIBITED_CLAIM");
  await page
    .getByLabel("Restriction (optional)")
    .fill("Never promise guaranteed organization results.");
  await page.getByLabel("Internal notes").fill("Compliance guardrail");
  await page.getByRole("button", { name: "Complete Brand Brain" }).click();

  await expect(page).toHaveURL(/\/app\/brand-brain\/[0-9a-f-]+\?onboarded=1$/);
  await expect(
    page.getByText("Brand Brain setup is complete.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: brand })).toBeVisible();
  await expect(page.getByText(product, { exact: true })).toBeVisible();
  await expect(page.getByText("Busy organizer", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Material specification", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Prohibited Claim", { exact: true }),
  ).toBeVisible();

  const productsSection = page
    .getByRole("heading", { name: "Products" })
    .locator("..");
  const addProduct = productsSection.locator("details").filter({
    has: page.getByText("Add another", { exact: true }),
  });
  await addProduct.getByText("Add another", { exact: true }).click();
  await addProduct.getByLabel("Product name").fill("Travel Kit");
  await addProduct.getByRole("button", { name: "Add product" }).click();
  await expect(
    productsSection.getByText("Travel Kit", { exact: true }),
  ).toBeVisible();

  const productCard = productsSection
    .locator("details")
    .filter({ hasText: product });
  await productCard.getByText(product, { exact: true }).click();
  await productCard.getByLabel("Product name").fill(`${product} Updated`);
  await productCard.getByRole("button", { name: "Update product" }).click();
  await expect(
    page.getByText("Product updated.", { exact: true }),
  ).toBeVisible();

  const proofSection = page
    .getByRole("heading", { name: "Proof points" })
    .locator("..");
  await proofSection
    .getByText("Material specification", { exact: true })
    .click();
  await proofSection
    .getByRole("button", { name: "Delete Material specification" })
    .click();
  await expect(
    proofSection.getByText("No proof points yet.", { exact: false }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Command Center" }).click();
  await expect(
    page.getByRole("heading", { name: "Your Brand Brain is ready." }),
  ).toBeVisible();
});

test("onboarding reports required Brand Brain validation", async ({ page }) => {
  const suffix = crypto.randomUUID();
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Validation Tester");
  await page
    .getByLabel("Workspace name")
    .fill(`Validation ${suffix.slice(0, 8)}`);
  await page.getByLabel("Email").fill(`validation-${suffix}@example.test`);
  await page.getByLabel("Password").fill("MilestoneTwo123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByRole("link", { name: "Set up Brand Brain" }).click();

  await page.getByRole("button", { name: "Step 5 Restrictions" }).click();
  await page.getByRole("button", { name: "Complete Brand Brain" }).click();
  await expect(
    page.getByText("Check the highlighted fields.", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Step 1 Brand" }).click();
  await expect(
    page.getByText("Brand name must contain at least 2 characters."),
  ).toBeVisible();
  await expect(
    page.getByText("Category must contain at least 2 characters."),
  ).toBeVisible();
});
