import { expect, test } from "@playwright/test";

test("unauthenticated user sees VerifyFlow sign-in screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "VerifyFlow" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeVisible();
});

test("local mock user can verify and upgrade", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in as local tester" }).click();
  await expect(page.getByRole("heading", { name: "KYC Flow Dashboard" })).toBeVisible();

  await page.getByRole("link", { name: "Onboarding" }).click();
  await page.getByLabel("Full legal name").fill("Local Verified Tester");
  await page.getByRole("button", { name: "Submit and start" }).click();
  await page.getByRole("button", { name: "Open payload" }).click();
  await page.getByRole("link", { name: "Continue to verification" }).click();
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText("allow -> verified")).toBeVisible();

  await page.getByRole("link", { name: "VerifyFlow" }).click();
  await page.getByRole("link", { name: "Upgrade" }).click();
  await page.getByLabel("Full legal name").fill("Local Enhanced Tester");
  await page.getByRole("button", { name: "Upgrade" }).click();
  await expect(page.getByText("allow -> enhanced")).toBeVisible();
});
