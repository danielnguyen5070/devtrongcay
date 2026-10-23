import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Constant-time check of `Authorization: Bearer <secret>`. */
export function isAuthorized(request: Request, secret: string) {
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return received.length === expected.length && timingSafeEqual(received, expected);
}
