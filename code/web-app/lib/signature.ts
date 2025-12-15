import crypto from "crypto";

export type VerifyResult = { ok: true } | { ok: false; reason: string };

export function verifySignature(payload: { badgeId: string | number; readerId: string; timestamp: string; signature?: string }, opts?: { secret?: string; ttlMs?: number }): VerifyResult {
  const { badgeId, readerId, timestamp, signature } = payload;
  const SECRET_KEY = opts?.secret ?? process.env.SECRET_KEY;
  const SIGN_TTL_MS = opts?.ttlMs ?? (process.env.SIGNATURE_TTL_MS ? parseInt(process.env.SIGNATURE_TTL_MS, 10) : 30_000);

  if (!SECRET_KEY) return { ok: false, reason: "NO_SECRET" };

  const ts = Date.parse(timestamp);
  if (Number.isNaN(ts)) return { ok: false, reason: "INVALID_TIMESTAMP" };
  if (Math.abs(Date.now() - ts) > SIGN_TTL_MS) return { ok: false, reason: "TIMESTAMP_OUT_OF_RANGE" };

  if (!signature || typeof signature !== "string") return { ok: false, reason: "MISSING_SIGNATURE" };

  const raw = `${badgeId}:${readerId}:${timestamp}`;
  const expectedHex = crypto.createHmac("sha256", SECRET_KEY).update(raw).digest("hex");

  let provided: Buffer;
  try {
    provided = Buffer.from(signature, "hex");
  } catch (e) {
    return { ok: false, reason: "INVALID_SIGNATURE_FORMAT" };
  }

  const expected = Buffer.from(expectedHex, "hex");
  if (provided.length !== expected.length) return { ok: false, reason: "INVALID_SIGNATURE" };
  if (!crypto.timingSafeEqual(provided, expected)) return { ok: false, reason: "INVALID_SIGNATURE" };

  return { ok: true };
}
