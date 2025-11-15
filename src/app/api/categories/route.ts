import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const categories = await prisma.raceCategory.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        basePrice: true,
        earlyBirdPrice: true,
        tier1Price: true,
        tier1Min: true,
        tier1Max: true,
        tier2Price: true,
        tier2Min: true,
        tier2Max: true,
        tier3Price: true,
        tier3Min: true,
        bundlePrice: true,
        bundleSize: true,
      },
    });
    return NextResponse.json(categories);
  } catch (err: any) {
    console.error("GET /api/categories error:", err);
    return NextResponse.json(
      { error: "failed to load categories" },
      { status: 500 }
    );
  }
}
