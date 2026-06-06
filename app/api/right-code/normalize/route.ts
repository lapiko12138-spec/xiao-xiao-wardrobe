import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const uploadDir = path.join(process.cwd(), "public", "uploads");
const defaultBaseUrl = "https://www.right.codes/draw";

function contentTypeFromPath(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

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

async function imageAsDataUrl(imageUrl: string) {
  const filePath = publicImagePath(imageUrl);

  if (filePath) {
    const buffer = await fs.readFile(filePath);
    const contentType = contentTypeFromPath(filePath);
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  }

  const response = await fetch(imageUrl);
  const contentType = response.headers.get("content-type") || "image/png";
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

async function saveGeneratedImage(firstImage: any) {
  const base64 = firstImage?.b64_json || firstImage?.image_base64 || firstImage?.imageBase64;

  if (base64) {
    await fs.mkdir(uploadDir, { recursive: true });
    const cleanBase64 = String(base64).replace(/^data:image\/\w+;base64,/, "");
    const filename = `right-code-normalized-${Date.now()}.png`;
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, Buffer.from(cleanBase64, "base64"));
    return `/uploads/${filename}`;
  }

  if (firstImage?.url) {
    const response = await fetch(firstImage.url);
    const contentType = response.headers.get("content-type") || "image/png";
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.mkdir(uploadDir, { recursive: true });
    const filename = `right-code-normalized-${Date.now()}.${extensionFromContentType(contentType)}`;
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, buffer);
    return `/uploads/${filename}`;
  }

  return null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const apiKey = process.env.RIGHT_CODE_API_KEY;
  const baseUrl = (process.env.RIGHT_CODE_BASE_URL || defaultBaseUrl).replace(/\/$/, "");
  const imageModel = process.env.RIGHT_CODE_IMAGE_MODEL || "gpt-image-2";
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : "";
  const kind = body.kind === "avatar" ? "avatar" : "clothing";

  if (!apiKey) {
    return NextResponse.json({ error: "未配置 RIGHT_CODE_API_KEY" }, { status: 501 });
  }

  if (!imageUrl) {
    return NextResponse.json({ error: "缺少图片地址" }, { status: 400 });
  }

  const dataUrl = await imageAsDataUrl(imageUrl);
  const imagePrompt =
    kind === "avatar"
      ? "参考输入的用户全身照，生成小小衣橱统一风格的2D人物形象。要求保留人物主要发型、身形比例、姿态和整体气质；柔和干净的2D插画风格，完整全身，正面自然站姿，浅色干净背景，无文字，无水印，适合虚拟试衣。"
      : "参考输入的服饰图片，生成小小衣橱统一风格的单件服饰素材。要求尽量保留原服饰颜色、版型、材质和关键细节；柔和干净的2D插画风格，单品居中，无模特，无文字，无水印，白色或透明背景，适合后续抠图贴到人物身上。";
  const imageResponse = await fetch(`${baseUrl}/v1/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: imageModel,
      prompt: imagePrompt,
      image: [dataUrl],
      n: 1,
      size: "1024x1024",
      response_format: "url"
    })
  });
  const imageResult = await imageResponse.json().catch(() => ({}));

  if (!imageResponse.ok) {
    return NextResponse.json({ error: "Right Code 风格图片生成失败", result: imageResult }, { status: 502 });
  }

  const outputImageUrl = await saveGeneratedImage(imageResult?.data?.[0]);

  if (!outputImageUrl) {
    return NextResponse.json({ error: "未获取到生成图片", result: imageResult }, { status: 502 });
  }

  return NextResponse.json({
    imageUrl: outputImageUrl,
    kind
  });
}
