import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('[API] Fetching race categories...');
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
        earlyBirdCapacity: true,
      },
    });

    console.log('[API] Found categories:', categories.length);

    // compute remaining early-bird per category using EarlyBirdClaim count
    const categoriesWithRemaining = await Promise.all(
      categories.map(async (c) => {
        const claims = await prisma.earlyBirdClaim.count({ where: { categoryId: c.id } });
        const remaining =
          typeof c.earlyBirdCapacity === "number" ? Math.max(0, c.earlyBirdCapacity - claims) : null;
        console.log(`[API] Category ${c.name}: capacity=${c.earlyBirdCapacity}, claims=${claims}, remaining=${remaining}`);
        return { ...c, earlyBirdRemaining: remaining };
      })
    );

    console.log('[API] Returning categories with remaining:', categoriesWithRemaining);
    return NextResponse.json(categoriesWithRemaining);
  } catch (err: any) {
    console.error("GET /api/categories error:", err);
    return NextResponse.json(
      { error: "failed to load categories", details: err?.message },
      { status: 500 }
    );
  }
}
