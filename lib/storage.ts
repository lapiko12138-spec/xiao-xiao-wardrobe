import { promises as fs } from "fs";
import path from "path";
import { list, put } from "@vercel/blob";

const uploadDir = path.join(process.cwd(), "public", "uploads");
const storePath = path.join(process.cwd(), "data", "app-store.json");
const blobStorePath = "data/app-store.json";

export function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function saveUploadedFile(filename: string, data: Buffer | string, contentType: string) {
  if (hasBlobStorage()) {
    const blob = await put(`uploads/${filename}`, data, {
      access: "public",
      contentType
    });

    return blob.url;
  }

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), data);
  return `/uploads/${filename}`;
}

export async function readStoreFile() {
  if (hasBlobStorage()) {
    const result = await list({ prefix: blobStorePath, limit: 1 });
    const blob = result.blobs.find((item) => item.pathname === blobStorePath) || result.blobs[0];

    if (!blob) {
      return null;
    }

    const response = await fetch(blob.url, { cache: "no-store" });

    if (!response.ok) {
      return null;
    }

    return response.text();
  }

  try {
    return await fs.readFile(storePath, "utf8");
  } catch {
    return null;
  }
}

export async function writeStoreFile(data: string) {
  if (hasBlobStorage()) {
    await put(blobStorePath, data, {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true
    });
    return;
  }

  await fs.mkdir(path.dirname(storePath), { recursive: true });
  const tempPath = `${storePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, data, "utf8");
  await fs.rename(tempPath, storePath);
}
