import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const [jerseys, jerseyUsage] = await Promise.all([
      prisma.jerseyOption.findMany({
        orderBy: [
          { id: "asc" },
        ],
      }),
      prisma.participant.groupBy({
        by: ["jerseyId"],
        where: {
          jerseyId: { not: null },
          registration: {
            paymentStatus: {
              in: ["pending", "confirmed"],
            },
          },
        },
        _count: {
          jerseyId: true,
        },
      }),
    ]);

    const usageMap = new Map<number, number>();
    for (const row of jerseyUsage) {
      if (row.jerseyId) {
        usageMap.set(row.jerseyId, row._count.jerseyId);
      }
    }

    const jerseysWithQuota = jerseys.map((jersey) => {
      const orderedCount = usageMap.get(jersey.id) || 0;
      const remaining = typeof jersey.quantity === "number"
        ? Math.max(0, jersey.quantity - orderedCount)
        : null;
      const isSoldOut = typeof remaining === "number" ? remaining <= 0 : false;

      return {
        ...jersey,
        orderedCount,
        remaining,
        isSoldOut,
      };
    });

    return NextResponse.json(jerseysWithQuota, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[jerseys] GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch jersey options" },
      { status: 500 }
    );
  }
}