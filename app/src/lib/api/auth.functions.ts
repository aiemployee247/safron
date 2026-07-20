import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { bindings } from "../bindings.server";
import {
  createSession,
  destroySession,
  getSessionUser,
  hashPassword,
  verifyPassword,
} from "../auth.server";

const emailSchema = z.string().trim().toLowerCase().email().max(200);

export const signUp = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().trim().min(1).max(100),
      email: emailSchema,
      password: z.string().min(8).max(200),
    }),
  )
  .handler(async ({ data }) => {
    const { DB } = bindings();
    if (!DB) return { ok: false as const, error: "Accounts are unavailable right now." };
    const existing = await DB.prepare("SELECT id FROM users WHERE email = ?1")
      .bind(data.email)
      .first();
    if (existing) {
      return { ok: false as const, error: "An account with this email already exists." };
    }
    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(data.password);
    await DB.prepare(
      "INSERT INTO users (id, email, name, password_hash, plan) VALUES (?1, ?2, ?3, ?4, 'free')",
    )
      .bind(id, data.email, data.name, passwordHash)
      .run();
    await createSession(id);
    return { ok: true as const };
  });

export const signIn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: emailSchema, password: z.string().min(1).max(200) }))
  .handler(async ({ data }) => {
    const { DB } = bindings();
    if (!DB) return { ok: false as const, error: "Sign in is unavailable right now." };
    const user = await DB.prepare(
      "SELECT id, password_hash FROM users WHERE email = ?1",
    )
      .bind(data.email)
      .first<{ id: string; password_hash: string }>();
    if (!user || !(await verifyPassword(data.password, user.password_hash))) {
      return { ok: false as const, error: "Wrong email or password." };
    }
    await createSession(user.id);
    return { ok: true as const };
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  await destroySession();
  return { ok: true as const };
});

export const currentUser = createServerFn({ method: "GET" }).handler(async () => {
  return await getSessionUser();
});

export const unlockAllAccess = createServerFn({ method: "POST" }).handler(async () => {
  const user = await getSessionUser();
  const { DB } = bindings();
  if (!user || !DB) return { ok: false as const, error: "Sign in first." };
  await DB.prepare("UPDATE users SET plan = 'all-access' WHERE id = ?1").bind(user.id).run();
  return { ok: true as const };
});
