import { NextResponse } from "next/server";
import { addPost, getRuntimeAppData } from "@/lib/store";
import type { PlaceholderTone } from "@/lib/app-data";

export async function GET() {
  const data = await getRuntimeAppData();
  return NextResponse.json(data.community.posts);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const post = await addPost({
    author: String(body.author || ""),
    title: String(body.title || ""),
    desc: String(body.desc || ""),
    tone: (body.tone || "green") as PlaceholderTone,
    imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : undefined,
    source: body.source === "ai" ? "ai" : "camera"
  });

  return NextResponse.json(post, { status: 201 });
}
