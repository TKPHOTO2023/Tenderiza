import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

/**
 * Mailbox passwords are encrypted at rest with AES-256-GCM. The key comes
 * from MAIL_ENCRYPTION_KEY; without it, connecting a mailbox is refused
 * outright rather than storing a password in the clear.
 */
function key() {
  const secret = process.env.MAIL_ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new Error(
      "MAIL_ENCRYPTION_KEY is not set (or is too short). Set a long random value before connecting a mailbox."
    );
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptSecret(stored: string): string {
  const [iv, tag, payload] = stored.split(".");
  if (!iv || !tag || !payload) throw new Error("Stored mailbox password is malformed.");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(payload, "base64")), decipher.final()]).toString("utf8");
}

export function hasEncryptionKey() {
  const secret = process.env.MAIL_ENCRYPTION_KEY;
  return Boolean(secret && secret.length >= 16);
}
