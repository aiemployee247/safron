import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { bindings } from "../bindings.server";
import { MENU_BY_ID, TOTAL_SEATING_CAPACITY, isBookableTime } from "../restaurant-menu";

function orderId() {
  return "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}
function bookingId() {
  return "BK-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const placeRestaurantOrder = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().trim().min(1).max(100),
      phone: z.string().trim().min(5).max(30),
      fulfillment: z.enum(["delivery", "pickup"]),
      address: z.string().trim().max(300).default(""),
      items: z.array(z.object({ id: z.string(), qty: z.number().int().min(1).max(20) })).min(1).max(30),
    }),
  )
  .handler(async ({ data }) => {
    if (data.fulfillment === "delivery" && data.address.length < 5) {
      return { ok: false as const, error: "Delivery orders need a real address." };
    }
    // Recompute every line server-side — never trust a client-submitted price.
    let subtotalCents = 0;
    const priced: { id: string; name: string; qty: number; priceCents: number }[] = [];
    for (const line of data.items) {
      const item = MENU_BY_ID[line.id];
      if (!item) return { ok: false as const, error: `Unknown menu item: ${line.id}` };
      subtotalCents += item.priceCents * line.qty;
      priced.push({ id: item.id, name: item.name, qty: line.qty, priceCents: item.priceCents });
    }

    const { DB } = bindings();
    const id = orderId();
    if (DB) {
      await DB.prepare(
        "INSERT INTO restaurant_orders (id, customer_name, phone, fulfillment, address, items_json, subtotal_cents) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
      )
        .bind(id, data.name, data.phone, data.fulfillment, data.address, JSON.stringify(priced), subtotalCents)
        .run();
    }

    const etaMinutes = data.fulfillment === "delivery" ? 45 : 20;
    return { ok: true as const, orderId: id, subtotalCents, etaMinutes };
  });

export const requestTableBooking = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().trim().min(1).max(100),
      phone: z.string().trim().min(5).max(30),
      partySize: z.number().int().min(1).max(20),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      time: z.string().regex(/^\d{2}:\d{2}$/),
      notes: z.string().trim().max(500).default(""),
    }),
  )
  .handler(async ({ data }) => {
    if (!isBookableTime(data.time)) {
      return { ok: false as const, error: "We're open 11:30–15:00 and 18:00–22:30. Pick a time in one of those windows." };
    }
    const { DB } = bindings();
    if (DB) {
      const existing = await DB.prepare(
        "SELECT COALESCE(SUM(party_size), 0) AS seated FROM restaurant_bookings WHERE booking_date = ?1 AND booking_time = ?2",
      )
        .bind(data.date, data.time)
        .first<{ seated: number }>();
      const seated = existing?.seated ?? 0;
      if (seated + data.partySize > TOTAL_SEATING_CAPACITY) {
        return {
          ok: false as const,
          error: `That slot is fully booked (${seated}/${TOTAL_SEATING_CAPACITY} seats taken). Try a different time.`,
        };
      }
    }

    const id = bookingId();
    if (DB) {
      await DB.prepare(
        "INSERT INTO restaurant_bookings (id, customer_name, phone, party_size, booking_date, booking_time, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
      )
        .bind(id, data.name, data.phone, data.partySize, data.date, data.time, data.notes)
        .run();
    }

    return { ok: true as const, bookingId: id };
  });
