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

    // Optimized early bird count
    const earlyBirdCounts = await prisma.earlyBirdClaim.groupBy({
      by: ['categoryId'],
      _count: {
        categoryId: true,
      },
    });

    // Create a map for quick lookups
    const claimsMap = new Map<number, number>();
    for (const group of earlyBirdCounts) {
      claimsMap.set(group.categoryId, group._count.categoryId);
    }

    const categoriesWithRemaining = categories.map((c: any) => {
      const claims = claimsMap.get(c.id) || 0;
      const remaining = Math.max(0, (c.earlyBirdCapacity ?? 0) - claims);
      console.log(`[API] Category ${c.name}: ${claims} claims, ${remaining} remaining`);
      return { ...c, earlyBirdRemaining: remaining };
    });

    return NextResponse.json(categoriesWithRemaining, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[API] Error fetching categories:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch categories', details: errorMessage }, { status: 500 });
  }
}
