import { expect, test } from "@playwright/test";

// Regression coverage for the Saffron Court ordering + booking demo.
// Written after a live bug was found by hand (order confirmation was
// unreachable because clearing the cart on success also hid the
// confirmation block) — see content/qa/saffron-court-test-plan.md for the
// full manual run. These four cases are the ones worth re-checking on every
// deploy; capacity-conflict and unknown-item-id are server-only edge cases
// covered by not needing a browser, tracked as a follow-up.

test.describe("Saffron Court demo", () => {
  test("adding two dishes shows the correct subtotal", async ({ page }) => {
    await page.goto("/demo/saffron-court");
    await page.getByRole("button", { name: "Add" }).first().click();
    await page.getByText("Mutton Biryani").locator("..").getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Subtotal")).toBeVisible();
    await expect(page.getByText("$32.98")).toBeVisible();
  });

  test("placing a pickup order shows a confirmation with an order id", async ({ page }) => {
    await page.goto("/demo/saffron-court");
    await page.getByRole("button", { name: "Add" }).first().click();
    await page.getByLabel("Name").fill("Playwright Test");
    await page.getByLabel("Phone").fill("555-0100");
    await page.getByRole("button", { name: /Place order/ }).click();
    await expect(page.getByText(/Order ORD-/)).toBeVisible();
    // Regression guard for the bug found in manual testing: the confirmation
    // must still be visible even though the cart is now empty.
    await expect(page.getByText("Nothing in the cart yet")).not.toBeVisible();
  });

  test("booking a table in a valid slot is confirmed", async ({ page }) => {
    await page.goto("/demo/saffron-court");
    await page.getByLabel("Name").nth(1).fill("Playwright Booking");
    await page.getByLabel("Phone").nth(1).fill("555-0111");
    await page.locator('input[type="date"]').fill("2026-08-01");
    await page.locator('input[type="time"]').fill("19:00");
    await page.getByRole("button", { name: "Request table" }).click();
    await expect(page.getByText(/Table request BK-/)).toBeVisible();
  });

  test("booking outside opening hours is rejected", async ({ page }) => {
    await page.goto("/demo/saffron-court");
    await page.getByLabel("Name").nth(1).fill("Off Hours");
    await page.getByLabel("Phone").nth(1).fill("555-0112");
    await page.locator('input[type="date"]').fill("2026-08-01");
    await page.locator('input[type="time"]').fill("03:00");
    await page.getByRole("button", { name: "Request table" }).click();
    await expect(page.getByText(/We're open 11:30–15:00 and 18:00–22:30/)).toBeVisible();
  });
});
