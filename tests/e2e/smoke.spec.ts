import { expect, test } from "@playwright/test";

test("unauthenticated user sees VerifyFlow sign-in screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "VerifyFlow" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeVisible();
});

