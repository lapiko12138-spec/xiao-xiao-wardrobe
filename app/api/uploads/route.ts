import { NextResponse } from "next/server";
import { saveUploadedFile } from "@/lib/storage";

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

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extensionFromType(file.type)}`;
  const url = await saveUploadedFile(filename, buffer, file.type);

  return NextResponse.json({
    url,
    name: file.name,
    size: file.size
  });
}
