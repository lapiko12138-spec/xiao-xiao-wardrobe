import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const uploadDir = path.join(process.cwd(), "public", "uploads");

function extensionFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少上传文件" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "只支持图片上传" }, { status: 400 });
  }

  await fs.mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extensionFromType(file.type)}`;
  const filepath = path.join(uploadDir, filename);

  await fs.writeFile(filepath, buffer);

  return NextResponse.json({
    url: `/uploads/${filename}`,
    name: file.name,
    size: file.size
  });
}
