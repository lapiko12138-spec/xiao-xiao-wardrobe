import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const uploadDir = path.join(process.cwd(), "public", "uploads");
const defaultBaseUrl = "https://www.right.codes/draw";

function extensionFromContentType(contentType: string) {
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return "png";
}

async function saveImageBuffer(buffer: Buffer, contentType = "image/png") {
  await fs.mkdir(uploadDir, { recursive: true });
  const filename = `right-code-${Date.now()}.${extensionFromContentType(contentType)}`;
  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, buffer);
  return `/uploads/${filename}`;
}

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.RIGHT_CODE_API_KEY),
    baseUrl: process.env.RIGHT_CODE_BASE_URL || defaultBaseUrl,
    model: process.env.RIGHT_CODE_IMAGE_MODEL || "gpt-image-2"
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const apiKey = process.env.RIGHT_CODE_API_KEY;
  const baseUrl = (process.env.RIGHT_CODE_BASE_URL || defaultBaseUrl).replace(/\/$/, "");
  const model = String(body.model || process.env.RIGHT_CODE_IMAGE_MODEL || "gpt-image-2");
  const prompt = String(body.prompt || "");

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "未配置 RIGHT_CODE_API_KEY",
        message: "请在 .env.local 中配置 RIGHT_CODE_API_KEY 后重启服务。"
      },
      { status: 501 }
    );
  }

  const response = await fetch(`${baseUrl}/v1/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt,
      image: Array.isArray(body.image) ? body.image : body.image ? [body.image] : [],
      n: Number(body.n || 1),
      size: body.size || "1024x1024",
      response_format: body.response_format || "url"
    })
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    return NextResponse.json(
      {
        error: "Right Code 图片生成失败",
        status: response.status,
        result
      },
      { status: 502 }
    );
  }

  const firstImage = result?.data?.[0];
  const base64 = firstImage?.b64_json || firstImage?.image_base64 || firstImage?.imageBase64;

  if (base64) {
    const cleanBase64 = String(base64).replace(/^data:image\/\w+;base64,/, "");
    const imageUrl = await saveImageBuffer(Buffer.from(cleanBase64, "base64"));
    return NextResponse.json({ imageUrl, raw: result });
  }

  if (firstImage?.url) {
    const imageResponse = await fetch(firstImage.url);
    if (imageResponse.ok) {
      const contentType = imageResponse.headers.get("content-type") || "image/png";
      const buffer = Buffer.from(await imageResponse.arrayBuffer());
      const imageUrl = await saveImageBuffer(buffer, contentType);
      return NextResponse.json({ imageUrl, remoteUrl: firstImage.url, raw: result });
    }
  }

  return NextResponse.json({ raw: result });
}
