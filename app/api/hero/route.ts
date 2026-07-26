import { NextResponse } from "next/server";
import { getPublicHeroSlides } from "@/lib/hero/service";

export const revalidate = 60;

export async function GET() {
  try {
    const slides = await getPublicHeroSlides();
    return NextResponse.json({ slides });
  } catch {
    return NextResponse.json({ slides: [] });
  }
}
