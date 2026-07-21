import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { bindings } from "../bindings.server";
import { addToAudience, notifyOwner } from "../email.server";

const emailSchema = z.string().trim().toLowerCase().email().max(200);

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().trim().min(1).max(100),
      email: emailSchema,
      message: z.string().trim().min(1).max(5000),
    }),
  )
  .handler(async ({ data }) => {
    const { DB } = bindings();
    if (!DB) return { ok: false as const, error: "The contact form is unavailable right now." };
    await DB.prepare(
      "INSERT INTO contact_messages (name, email, message) VALUES (?1, ?2, ?3)",
    )
      .bind(data.name, data.email, data.message)
      .run();
    await notifyOwner(
      `New contact message from ${data.name}`,
      `From: ${data.name} <${data.email}>\n\n${data.message}`,
    );
    return { ok: true as const };
  });

export const requestBooking = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().trim().min(1).max(100),
      email: emailSchema,
      service: z.enum(["diagnostic-call", "build-sprint", "ongoing-support"]),
      notes: z.string().trim().max(5000).default(""),
    }),
  )
  .handler(async ({ data }) => {
    const { DB } = bindings();
    if (!DB) return { ok: false as const, error: "Booking is unavailable right now." };
    await DB.prepare(
      "INSERT INTO booking_requests (name, email, service, notes) VALUES (?1, ?2, ?3, ?4)",
    )
      .bind(data.name, data.email, data.service, data.notes)
      .run();
    await notifyOwner(
      `New session booking: ${data.service}`,
      `${data.name} <${data.email}> requested "${data.service}".\n\nNotes:\n${data.notes || "(none)"}`,
    );
    return { ok: true as const };
  });

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: emailSchema }))
  .handler(async ({ data }) => {
    const { DB } = bindings();
    if (!DB) return { ok: false as const, error: "Subscriptions are unavailable right now." };
    await DB.prepare(
      "INSERT INTO newsletter_subscribers (email) VALUES (?1) ON CONFLICT(email) DO NOTHING",
    )
      .bind(data.email)
      .run();
    await addToAudience(data.email);
    await notifyOwner("New newsletter subscriber", `${data.email} subscribed to Shop Notes.`);
    return { ok: true as const };
  });
