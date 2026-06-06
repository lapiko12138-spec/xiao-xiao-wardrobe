import { NextResponse } from "next/server";
import { updateCommunityPost } from "@/lib/store";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const post = await updateCommunityPost(params.id, {
    likeDelta: typeof body.likeDelta === "number" ? body.likeDelta : undefined,
    commentDelta: typeof body.commentDelta === "number" ? body.commentDelta : undefined,
    title: typeof body.title === "string" ? body.title : undefined,
    desc: typeof body.desc === "string" ? body.desc : undefined
  });

  if (!post) {
    return NextResponse.json({ error: "未找到帖子" }, { status: 404 });
  }

  return NextResponse.json(post);
}
