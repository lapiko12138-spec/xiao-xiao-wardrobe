import { NextResponse } from "next/server";
import { getRuntimeAppData } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getRuntimeAppData(), {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
