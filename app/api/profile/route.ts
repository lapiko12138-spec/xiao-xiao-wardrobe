import { NextResponse } from "next/server";
import { updateProfile } from "@/lib/store";

export async function PUT(request: Request) {
  const body = await request.json().catch(() => ({}));
  const profile = await updateProfile({
    name: typeof body.name === "string" ? body.name : undefined,
    avatarTone: typeof body.avatarTone === "string" ? body.avatarTone : undefined,
    avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl : undefined,
    bodyImageUrl: typeof body.bodyImageUrl === "string" ? body.bodyImageUrl : undefined,
    subtitle: typeof body.subtitle === "string" ? body.subtitle : undefined
  });

  return NextResponse.json(profile);
}
