import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), process.env.UPLOAD_DIR ?? "uploads");

/**
 * Local-filesystem-backed object storage for company documents.
 *
 * Swapping to S3-compatible storage later means implementing the same
 * `put`/`remove`/`urlFor` shape against an S3 client — callers (the
 * documents API route) don't need to change.
 */
export const storage = {
  async put(companyId: string, originalName: string, buffer: Buffer) {
    const dir = path.join(UPLOAD_DIR, companyId);
    await mkdir(dir, { recursive: true });
    const ext = path.extname(originalName);
    const key = `${randomUUID()}${ext}`;
    await writeFile(path.join(dir, key), buffer);
    const storageKey = `${companyId}/${key}`;
    return { key: storageKey, url: `/api/documents/file/${storageKey}` };
  },

  async remove(storageKey: string) {
    const filePath = path.join(UPLOAD_DIR, storageKey);
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
