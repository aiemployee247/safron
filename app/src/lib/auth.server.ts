// Server-only auth utilities: password hashing (PBKDF2 via Web Crypto),
// opaque session tokens stored hashed in D1, httpOnly cookie plumbing.
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";

import { bindings } from "./bindings.server";

const SESSION_COOKIE = "ag_session";
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 100_000;

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function pbkdf2(password: string, saltHex: string): Promise<string> {
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return toHex(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await pbkdf2(password, salt);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4) return false;
  const [, , salt, expected] = parts;
  const actual = await pbkdf2(password, salt);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

async function sha256Hex(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(value)));
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  plan: string;
};

async function newSessionToken(userId: string): Promise<string> {
  const { DB } = bindings();
  if (!DB) throw new Error("database unavailable");
  const token = crypto.randomUUID() + toHex(crypto.getRandomValues(new Uint8Array(16)));
  const tokenHash = await sha256Hex(token);
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await DB.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?1, ?2, ?3)",
  )
    .bind(tokenHash, userId, expires.toISOString())
    .run();
  return token;
}

// For raw server-route handlers (no setCookie helper context guarantees):
// returns a Set-Cookie header value for a fresh session.
export async function createSessionSetCookie(userId: string): Promise<string> {
  const token = await newSessionToken(userId);
  return `${SESSION_COOKIE}=${token}; Max-Age=${SESSION_DAYS * 86_400}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

export async function createSession(userId: string): Promise<void> {
  const token = await newSessionToken(userId);
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
}

async function userForToken(token: string): Promise<SessionUser | null> {
  const { DB } = bindings();
  if (!DB) return null;
  const tokenHash = await sha256Hex(token);
  const row = await DB.prepare(
    `SELECT u.id, u.email, u.name, u.plan FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ?1 AND s.expires_at > datetime('now')`,
  )
    .bind(tokenHash)
    .first<SessionUser>();
  return row ?? null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;
  return userForToken(token);
}

// For raw server-route handlers where the cookie helpers may not apply:
// resolves the session directly from the incoming Request.
export async function getSessionUserFromRequest(
  request: Request,
): Promise<SessionUser | null> {
  const raw = request.headers.get("Cookie") ?? "";
  let token: string | null = null;
  for (const part of raw.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) token = rest.join("=");
  }
  if (!token) return null;
  return userForToken(token);
}

export async function destroySession(): Promise<void> {
  const { DB } = bindings();
  const token = getCookie(SESSION_COOKIE);
  if (DB && token) {
    const tokenHash = await sha256Hex(token);
    await DB.prepare("DELETE FROM sessions WHERE token_hash = ?1").bind(tokenHash).run();
  }
  deleteCookie(SESSION_COOKIE, { path: "/" });
}
