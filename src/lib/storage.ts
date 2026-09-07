import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { put, del } from "@vercel/blob";

const UPLOAD_DIR = path.join(process.cwd(), process.env.UPLOAD_DIR ?? "uploads");

// On Vercel (and anywhere BLOB_READ_WRITE_TOKEN is set), documents are stored
// in Vercel Blob — serverless functions have no persistent/shared local disk.
// Locally (docker-compose dev), they fall back to the filesystem.
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

/**
 * Object storage for company documents.
 *
 * `fileUrl` on CompanyDocument stores either:
 * - a full https:// URL (Vercel Blob) — fetch it directly, or
 * - a local storage key ("companyId/uuid.ext") — resolve via
 *   /api/documents/file/[...path], which reads it off local disk.
 */
export const storage = {
  async put(companyId: string, originalName: string, buffer: Buffer) {
    const ext = path.extname(originalName);
    const key = `${randomUUID()}${ext}`;

    if (useBlob) {
      const blob = await put(`${companyId}/${key}`, buffer, {
        access: "public",
        addRandomSuffix: true,
      });
      return { key: blob.url, url: blob.url };
    }

    const dir = path.join(UPLOAD_DIR, companyId);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, key), buffer);
    const storageKey = `${companyId}/${key}`;
    return { key: storageKey, url: `/api/documents/file/${storageKey}` };
  },

  async remove(storageKeyOrUrl: string) {
    if (storageKeyOrUrl.startsWith("http")) {
      await del(storageKeyOrUrl).catch(() => {});
      return;
    }
    const filePath = path.join(UPLOAD_DIR, storageKeyOrUrl);
    await unlink(filePath).catch(() => {});
  },

  resolvePath(storageKey: string) {
    const base = path.resolve(UPLOAD_DIR);
    const resolved = path.resolve(base, storageKey);
    if (resolved !== base && !resolved.startsWith(base + path.sep)) {
      throw new Error("Invalid storage key");
    }
    return resolved;
  },
};
