import { createHash } from "node:crypto";

export const loginThrottlePolicy = {
  blockMinutes: 15,
  maxAttempts: 5,
  windowMinutes: 15,
} as const;

export function buildLoginThrottleKey(email: string, clientAddress: string, salt: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedAddress = clientAddress.trim().toLowerCase() || "unknown";
  return createHash("sha256")
    .update(`${salt}:${normalizedEmail}:${normalizedAddress}`)
    .digest("hex");
}

export function isLoginThrottleActive(
  blockedUntil: Date | string | null | undefined,
  now = new Date(),
) {
  if (!blockedUntil) return false;
  const blocked = blockedUntil instanceof Date ? blockedUntil : new Date(blockedUntil);
  return !Number.isNaN(blocked.getTime()) && blocked.getTime() > now.getTime();
}
