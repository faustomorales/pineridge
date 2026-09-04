import { expect, test } from "@playwright/test";

test("tutor completes an early-stopped Assessment Run without student feedback", async ({
  page,
}) => {
  await page.goto("/assessment/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Reading Assessment" })).toBeVisible();

  await page.getByRole("button", { name: /begin/i }).click();
  await expect(page.getByText("map", { exact: true })).toBeVisible();
  await expect(page.getByText(/correct|incorrect/i)).toHaveCount(0);

  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByText("am", { exact: true })).toBeVisible();

  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("heading", { name: /finished/i })).toBeVisible();
  await expect(page.getByText(/Correct|Incorrect/)).toHaveCount(0);

  await page.getByRole("button", { name: /reveal results/i }).click();
  await expect(page.getByText(/Starting Point.*Lesson 1/)).toBeVisible();
  await expect(page.getByText("Home Practice:")).toBeVisible();
  await expect(page.getByText("Unavailable").first()).toBeVisible();
  await expect(page.getByText("Incorrect").first()).toBeVisible();
  await expect(page.locator(".response-group li")).toHaveCount(6);

  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("button", { name: /Print/ })).toBeHidden();
  await expect(page.getByText("Student", { exact: true })).toBeVisible();
  await expect(page.getByText("Date", { exact: true })).toBeVisible();
  await expect(page.locator(".destination").first()).toBeVisible();

  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: /new run/i }).click();
  await expect(page.getByRole("button", { name: /begin/i })).toBeVisible();
});

test("phone swipe advances while the word screen remains neutral", async ({ page }) => {
  await page.goto("/assessment/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /begin/i }).click();
  const stage = page.getByLabel("Assessment word");
  await stage.dispatchEvent("pointerdown", { clientX: 40, clientY: 120 });
  await stage.dispatchEvent("pointerup", { clientX: 140, clientY: 120 });

  await expect(page.getByText("fin", { exact: true })).toBeVisible();
  await expect(page.getByText(/correct|incorrect/i)).toHaveCount(0);
});

test("keyboard undo, ignored input, and reload do not retain a run", async ({ page }) => {
  await page.goto("/assessment/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /begin/i }).click();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("fin", { exact: true })).toBeVisible();
  await page.keyboard.press("Backspace");
  await expect(page.getByText("map", { exact: true })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByText("map", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: /begin/i })).toBeVisible();
});

test("passing every Checkpoint leads to fluency guidance", async ({ page }) => {
  await page.goto("/assessment/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /begin/i }).click();
  for (let index = 0; index < 220; index += 1) {
    await page.keyboard.press("ArrowRight");
  }
  await page.getByRole("button", { name: /reveal results/i }).click();
  await expect(page.getByText(/No UFLI Foundations Starting Point/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Reading Fluency guide/i })).toBeVisible();
});

test("all clean routes load", async ({ page }) => {
  for (const route of ["/", "/handout/", "/van-magnet/", "/student-expectations/"]) {
    const response = await page.goto(route);
    expect(response?.ok()).toBe(true);
    await expect(page.locator("body")).not.toBeEmpty();
  }
});
