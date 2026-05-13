import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Security alerting — every notable admin event flows through here.
 *
 * - Always writes a SecurityLog row (audit trail; queryable from admin UI later)
 * - If RESEND_API_KEY is set, attempts to send an email to admin@bannerblaze.com
 *   via Resend (lazy dynamic import — `resend` is not a hard dep)
 * - Otherwise falls back to a formatted console.warn so signal isn't lost
 *
 * Failures in either side channel are swallowed — alerts must never break
 * the request they're observing.
 */

export type SecurityEvent =
  | "ADMIN_SIGNUP_ATTEMPT"
  | "ADMIN_CODE_FAILED"
  | "ADMIN_ACCESS_GRANTED"
  | "ADMIN_RATE_LIMITED";

export type SecurityAlertPayload = {
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

const ALERT_RECIPIENT = "admin@bannerblaze.com";

const EVENT_LABEL: Record<SecurityEvent, string> = {
  ADMIN_SIGNUP_ATTEMPT: "Intento de creación de admin",
  ADMIN_CODE_FAILED: "Código de acceso admin fallido",
  ADMIN_ACCESS_GRANTED: "Admin creado con éxito",
  ADMIN_RATE_LIMITED: "Bloqueo por rate-limit",
};

/** Persists a SecurityLog row. Swallows DB errors to keep the caller alive. */
async function persistLog(
  event: SecurityEvent,
  success: boolean,
  payload: SecurityAlertPayload,
): Promise<void> {
  try {
    await db.securityLog.create({
      data: {
        event,
        email: payload.email?.toLowerCase() ?? null,
        ip: payload.ip ?? null,
        userAgent: payload.userAgent ?? null,
        success,
        metadata: (payload.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    console.error("[security-alerts] failed to persist SecurityLog:", err);
  }
}

/** Tries Resend if configured; returns true if an email was attempted (even on failure). */
async function tryResend(event: SecurityEvent, payload: SecurityAlertPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    // Dynamic import with webpackIgnore so Turbopack/webpack does NOT attempt
    // to resolve `resend` at build time — it's an optional runtime dependency.
    // The `@ts-expect-error` covers the missing TypeScript declarations.
    // The `.catch(() => null)` handles the case where it isn't installed.
    type ResendCtor = new (key: string) => { emails: { send: (input: unknown) => Promise<unknown> } };
    // @ts-expect-error — `resend` is optional at install time
    const mod: { Resend: ResendCtor } | null = await import(/* webpackIgnore: true */ "resend").catch(() => null);
    if (!mod) {
      console.warn("[security-alerts] RESEND_API_KEY set but `resend` package is not installed");
      return false;
    }
    const resend = new mod.Resend(apiKey);
    const subject = `[BannerBlaze · Security] ${EVENT_LABEL[event]}`;
    const lines = [
      `Evento: ${event}`,
      `Email: ${payload.email ?? "—"}`,
      `IP: ${payload.ip ?? "—"}`,
      `User-Agent: ${payload.userAgent ?? "—"}`,
      `Metadata: ${JSON.stringify(payload.metadata ?? {}, null, 2)}`,
      `Hora: ${new Date().toISOString()}`,
    ];
    await resend.emails.send({
      from: "BannerBlaze Security <security@bannerblaze.com>",
      to: ALERT_RECIPIENT,
      subject,
      text: lines.join("\n"),
    });
    return true;
  } catch (err) {
    console.error("[security-alerts] Resend send failed:", err);
    return false;
  }
}

/** Formatted console fallback — visible in dev logs, captured in prod log streams. */
function logToConsole(event: SecurityEvent, success: boolean, payload: SecurityAlertPayload): void {
  const banner = "─".repeat(60);
  const status = success ? "GRANTED" : "ATTEMPT";
   
  console.warn(
    `\n${banner}\n  🛡️  BANNERBLAZE SECURITY · ${EVENT_LABEL[event]} [${status}]\n${banner}\n` +
      `  email      : ${payload.email ?? "—"}\n` +
      `  ip         : ${payload.ip ?? "—"}\n` +
      `  user-agent : ${payload.userAgent ?? "—"}\n` +
      `  metadata   : ${JSON.stringify(payload.metadata ?? {})}\n` +
      `  timestamp  : ${new Date().toISOString()}\n` +
      `${banner}\n`,
  );
}

/**
 * Records and notifies a security event.
 * Always writes to SecurityLog; emails when Resend is configured.
 */
export async function sendAdminAlert(
  event: SecurityEvent,
  payload: SecurityAlertPayload = {},
  success: boolean = false,
): Promise<void> {
  await persistLog(event, success, payload);
  const emailed = await tryResend(event, payload);
  if (!emailed) logToConsole(event, success, payload);
}
