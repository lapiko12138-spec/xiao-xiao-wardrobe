import { NextResponse } from "next/server";
import { addWardrobeItem, getWardrobeItems } from "@/lib/store";
import type { PlaceholderTone } from "@/lib/app-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;

  return NextResponse.json(await getWardrobeItems(category));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const item = await addWardrobeItem({
    category: String(body.category || "上衣"),
    name: String(body.name || "新衣物"),
    color: String(body.color || "未填写"),
    season: String(body.season || "四季"),
    scene: String(body.scene || "日常"),
    material: String(body.material || "未填写"),
    detail: String(body.detail || "这是一件新加入小小衣橱的单品。"),
    tone: (body.tone || "cream") as PlaceholderTone,
    imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : undefined,
    cutoutImageUrl: typeof body.cutoutImageUrl === "string" ? body.cutoutImageUrl : undefined,
    purchaseUrl: typeof body.purchaseUrl === "string" ? body.purchaseUrl : undefined,
    brand: typeof body.brand === "string" ? body.brand : undefined
  });

  return NextResponse.json(item, { status: 201 });
}
