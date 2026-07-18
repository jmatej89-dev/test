import "server-only";
import { cookies } from "next/headers";
import { EncryptJWT, jwtDecrypt } from "jose";

const SESSION_COOKIE = "detektivky_session";
const BOX_SESSION_MAX_AGE = 60 * 60 * 12; // 12h — a case-solving session
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8; // 8h

const secret = process.env.SESSION_SECRET;
if (!secret || secret.length < 32) {
  throw new Error(
    "SESSION_SECRET is missing or too short (need >= 32 chars). Set it in your environment.",
  );
}
// A256GCM needs a 32-byte key; derive it deterministically from the secret.
const encodedKey = new TextEncoder().encode(secret).slice(0, 32);

export type SessionPayload =
  | {
      type: "box";
      boxId: string;
      caseId: string;
      boxCode: string;
    }
  | {
      type: "admin";
      adminId: string;
      email: string;
      role: "ADMIN" | "EDITOR";
    };

async function encryptSession(
  payload: SessionPayload,
  maxAgeSeconds: number,
): Promise<string> {
  return new EncryptJWT({ ...payload })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSeconds)
    .encrypt(encodedKey);
}

async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtDecrypt(token, encodedKey);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const maxAge =
    payload.type === "admin" ? ADMIN_SESSION_MAX_AGE : BOX_SESSION_MAX_AGE;
  const token = await encryptSession(payload, maxAge);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decryptSession(token);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
