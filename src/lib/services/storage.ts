import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface StorageProvider {
  put(file: File, folder: string): Promise<string>;
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

class LocalDiskStorage implements StorageProvider {
  async put(file: File, folder: string) {
    if (!ALLOWED.has(file.type)) throw new Error("Only JPG, PNG, WebP, AVIF or GIF images are allowed.");
    if (file.size > MAX_UPLOAD_BYTES) throw new Error("Images must be 5 MB or smaller.");
    const ext = file.type.split("/")[1]!.replace("jpeg", "jpg");
    const safeFolder = folder.replace(/[^a-z0-9-]/gi, "");
    const dir = path.join(process.cwd(), "public", "uploads", safeFolder);
    await mkdir(dir, { recursive: true });
    const name = `${crypto.randomUUID()}.${ext}`;
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    return `/uploads/${safeFolder}/${name}`;
  }
}

export const storage: StorageProvider = new LocalDiskStorage();
