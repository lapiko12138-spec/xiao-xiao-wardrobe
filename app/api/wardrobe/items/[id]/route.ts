import { NextResponse } from "next/server";
import { deleteWardrobeItem, getWardrobeItem, updateWardrobeItem } from "@/lib/store";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const item = await getWardrobeItem(params.id);

  if (!item) {
    return NextResponse.json({ error: "未找到衣物" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const item = await updateWardrobeItem(params.id, {
    cutoutImageUrl: typeof body.cutoutImageUrl === "string" ? body.cutoutImageUrl : undefined
  });

  if (!item) {
    return NextResponse.json({ error: "未找到衣物" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const item = await deleteWardrobeItem(params.id);

  if (!item) {
    return NextResponse.json({ error: "未找到衣物" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item });
}
