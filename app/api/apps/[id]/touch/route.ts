import { NextResponse } from "next/server";
import { touchAppLastAccessed } from "@/lib/apps/access";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await touchAppLastAccessed(id);
  return NextResponse.json({ ok: true });
}
