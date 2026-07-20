// Server-only email notifications via Resend (dependency-free, REST over fetch).
// All sends are best-effort: a failure here must never break a form submission.
import { bindings } from "./bindings.server";

const DEFAULT_NOTIFY = "info@qepilot.com";

export function emailConfigured(): boolean {
  const env = bindings();
  return Boolean(env.RESEND_API_KEY && env.RESEND_FROM);
}

// Notify the site owner about a new submission. Never throws.
export async function notifyOwner(subject: string, text: string): Promise<void> {
  const env = bindings();
  if (!env.RESEND_API_KEY || !env.RESEND_FROM) return;
  const to = env.NOTIFY_EMAIL || DEFAULT_NOTIFY;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.RESEND_FROM, to: [to], subject, text }),
    });
  } catch {
    // swallow — the submission already succeeded
  }
}

// Optionally add a newsletter subscriber to a Resend audience (a mailing list).
// No-op unless RESEND_AUDIENCE_ID is configured. Never throws.
export async function addToAudience(email: string): Promise<void> {
  const env = bindings();
  if (!env.RESEND_API_KEY || !env.RESEND_AUDIENCE_ID) return;
  try {
    await fetch(`https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    });
  } catch {
    // swallow
  }
}
