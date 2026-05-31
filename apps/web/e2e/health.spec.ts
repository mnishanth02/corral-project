import { expect, test } from "@playwright/test";

test("renders mocked health status card", async ({ page }) => {
  await page.route("**/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "ok",
        db: true,
        redis: true,
        uptime: 125,
        version: "e2e",
        timestamp: "2026-01-01T00:00:00.000Z",
      }),
    });
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: /system status/i })).toBeVisible();
  await expect(page.getByText("API: OK")).toBeVisible();
  await expect(page.getByText("DB: OK")).toBeVisible();
  await expect(page.getByText("Redis: OK")).toBeVisible();
});
