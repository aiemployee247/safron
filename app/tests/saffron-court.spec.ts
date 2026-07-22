import { expect, test } from "@playwright/test";

// Regression coverage for the Saffron Court ordering + booking demo.
// Written after a live bug was found by hand (order confirmation was
// unreachable because clearing the cart on success also hid the
// confirmation block) — see content/qa/saffron-court-test-plan.md for the
// full manual run. These four cases are the ones worth re-checking on every
// deploy; capacity-conflict and unknown-item-id are server-only edge cases
// covered by not needing a browser, tracked as a follow-up.
//
// The booking form is always on the page and the checkout form only
// appears once the cart has items, so once an item is added there are two
// "Name"/"Phone" fields on the page at once. Every locator below is scoped
// to its own form's container (.sc-cart for checkout, #book for booking) —
// never a bare page-wide getByLabel/nth() — so these can't cross-match.

test.describe("Saffron Court demo", () => {
  test("adding two dishes shows the correct subtotal", async ({ page }) => {
    await page.goto("/demo/saffron-court");
    await page.getByRole("button", { name: "Add" }).first().click();
    await page.getByText("Mutton Biryani").locator("..").getByRole("button", { name: "Add" }).click();
    const cart = page.locator(".sc-cart");
    await expect(cart.getByText("Subtotal")).toBeVisible();
    await expect(cart.getByText("$32.98")).toBeVisible();
  });

  test("placing a pickup order shows a confirmation with an order id", async ({ page }) => {
    await page.goto("/demo/saffron-court");
    await page.getByRole("button", { name: "Add" }).first().click();
    const cart = page.locator(".sc-cart");
    await cart.getByLabel("Name").fill("Playwright Test");
    await cart.getByLabel("Phone").fill("555-0100");
    await cart.getByRole("button", { name: /Place order/ }).click();
    await expect(cart.getByText(/Order ORD-/)).toBeVisible();
    // Regression guard for the bug found in manual testing: the confirmation
    // must still be visible even though the cart is now empty.
    await expect(cart.getByText("Nothing in the cart yet")).not.toBeVisible();
  });

  test("a delivery order to an out-of-radius ZIP is rejected as out of range", async ({ page }) => {
    await page.goto("/demo/saffron-court");
    await page.getByRole("button", { name: "Add" }).first().click();
    const cart = page.locator(".sc-cart");
    await cart.getByLabel("Delivery", { exact: true }).check();
    await cart.getByLabel("Name").fill("Far Away");
    await cart.getByLabel("Phone").fill("555-0120");
    // 78748 is a known ZIP but sits past the 6-mile delivery radius.
    await cart.getByLabel("Delivery address").fill("100 Distant Rd, Austin, TX 78748");
    await cart.getByRole("button", { name: /Place order/ }).click();
    await expect(cart.getByText(/outside our 6-mile delivery radius/)).toBeVisible();
  });

  test("a delivery order to an unrecognisable address asks the user to correct it", async ({ page }) => {
    await page.goto("/demo/saffron-court");
    await page.getByRole("button", { name: "Add" }).first().click();
    const cart = page.locator(".sc-cart");
    await cart.getByLabel("Delivery", { exact: true }).check();
    await cart.getByLabel("Name").fill("No Zip");
    await cart.getByLabel("Phone").fill("555-0121");
    // No resolvable ZIP — distinct from the out-of-radius message.
    await cart.getByLabel("Delivery address").fill("somewhere down the street");
    await cart.getByRole("button", { name: /Place order/ }).click();
    await expect(cart.getByText(/include a valid ZIP code/)).toBeVisible();
  });

  test("booking a table in a valid slot is confirmed", async ({ page }) => {
    await page.goto("/demo/saffron-court");
    const booking = page.locator("#book");
    await booking.getByLabel("Name").fill("Playwright Booking");
    await booking.getByLabel("Phone").fill("555-0111");
    await booking.locator('input[type="date"]').fill("2026-08-01");
    await booking.locator('input[type="time"]').fill("19:00");
    await booking.getByRole("button", { name: "Request table" }).click();
    await expect(booking.getByText(/Table request BK-/)).toBeVisible();
  });

  test("booking outside opening hours is rejected", async ({ page }) => {
    await page.goto("/demo/saffron-court");
    const booking = page.locator("#book");
    await booking.getByLabel("Name").fill("Off Hours");
    await booking.getByLabel("Phone").fill("555-0112");
    await booking.locator('input[type="date"]').fill("2026-08-01");
    await booking.locator('input[type="time"]').fill("03:00");
    await booking.getByRole("button", { name: "Request table" }).click();
    await expect(booking.getByText(/We're open 11:30–15:00 and 18:00–22:30/)).toBeVisible();
  });
});
