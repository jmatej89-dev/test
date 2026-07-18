import "server-only";
import bcrypt from "bcryptjs";
import { randomBytes, randomInt } from "crypto";

const BCRYPT_COST = 12;

// Excludes visually ambiguous characters (0/O, 1/I/l) since box credentials
// are read off a printed card by a customer.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export async function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifySecret(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

function randomCode(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
  }
  return out;
}

/** Public login identifier for a box, e.g. DET-7F3K-QX2M. Not secret. */
export function generateBoxCode(): string {
  return `DET-${randomCode(4)}-${randomCode(4)}`;
}

/** One-time password printed on the box's card. Secret, high entropy. */
export function generateBoxPassword(): string {
  return `${randomCode(5)}-${randomCode(5)}-${randomCode(5)}`;
}

export function generateAdminTempPassword(): string {
  return randomBytes(12).toString("base64url");
}

/**
 * Precomputed at module load so a login lookup for a non-existent
 * code/email still pays the same bcrypt cost as a real one — otherwise
 * response timing would leak which identifiers exist.
 */
export const DUMMY_HASH = bcrypt.hashSync(
  "dummy-password-for-constant-time-lookup",
  BCRYPT_COST,
);
