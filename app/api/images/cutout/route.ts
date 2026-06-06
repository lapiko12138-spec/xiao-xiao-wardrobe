import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { saveUploadedFile } from "@/lib/storage";

function publicImagePath(imageUrl: string) {
  if (!imageUrl.startsWith("/uploads/")) {
    return null;
  }

  return path.join(process.cwd(), "public", imageUrl);
}

function extensionFromContentType(contentType: string) {
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return "png";
}

function pickImageUrl(result: unknown): string | undefined {
  const data = result as Record<string, any>;
  return (
    data?.imageUrl ||
    data?.image_url ||
    data?.url ||
    data?.data?.imageUrl ||
    data?.data?.image_url ||
    data?.data?.url ||
    data?.result?.imageUrl ||
    data?.result?.image_url ||
    data?.result?.url ||
    data?.Result?.ImageUrl ||
    data?.Result?.ImageURL ||
    data?.Result?.Url
  );
}

function pickImageBase64(result: unknown): string | undefined {
  const data = result as Record<string, any>;
  return (
    data?.imageBase64 ||
    data?.image_base64 ||
    data?.data?.imageBase64 ||
    data?.data?.image_base64 ||
    data?.result?.imageBase64 ||
    data?.result?.image_base64 ||
    data?.Result?.ImageBase64
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : "";

  if (!imageUrl) {
    return NextResponse.json({ error: "缺少图片地址" }, { status: 400 });
  }

  const apiUrl = process.env.DOUBAO_CUTOUT_API_URL || process.env.VOLCENGINE_CUTOUT_API_URL;
  const apiKey = process.env.DOUBAO_CUTOUT_API_KEY || process.env.VOLCENGINE_CUTOUT_API_KEY;

  if (!apiUrl || !apiKey) {
    return NextResponse.json({
      imageUrl,
      processed: false,
      message: "未配置豆包/火山抠图 API，已使用原图。"
    });
  }

  const filePath = publicImagePath(imageUrl);
  const fileBuffer = filePath ? await fs.readFile(filePath).catch(() => null) : null;
  const imageBase64 = fileBuffer ? fileBuffer.toString("base64") : undefined;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      imageUrl,
      image_url: imageUrl,
      imageBase64,
      image_base64: imageBase64,
      mode: "foreground_cutout",
      output_format: "png"
    })
  });

  if (!response.ok) {
    return NextResponse.json({ imageUrl, processed: false, error: "抠图服务调用失败" }, { status: 502 });
  }

  const result = await response.json();
  const outputBase64 = pickImageBase64(result);
  const outputUrl = pickImageUrl(result);

  if (outputBase64) {
    const cleanBase64 = outputBase64.replace(/^data:image\/\w+;base64,/, "");
    const contentType = outputBase64.match(/^data:(image\/[^;]+);base64,/)?.[1] || "image/png";
    const filename = `cutout-${Date.now()}.${extensionFromContentType(contentType)}`;
    const savedImageUrl = await saveUploadedFile(filename, Buffer.from(cleanBase64, "base64"), contentType);

    return NextResponse.json({
      imageUrl: savedImageUrl,
      processed: true
    });
  }

  return NextResponse.json({
    imageUrl: outputUrl || imageUrl,
    processed: Boolean(outputUrl),
    raw: outputUrl ? undefined : result
  });
}
