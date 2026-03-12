import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // Default: today only
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const from = fromParam ? new Date(fromParam) : todayStart;
    const to = toParam ? new Date(new Date(toParam).setHours(23, 59, 59, 999)) : todayEnd;

    // Fetch all confirmed registrations in the date range
    const registrations = await prisma.registration.findMany({
      where: {
        paymentStatus: 'confirmed',
        updatedAt: {
          gte: from,
          lte: to,
        },
      },
      include: {
        participants: {
          include: {
            category: true,
          },
        },
      },
    });

    // Group by date -> category -> count
    const dailyMap: Record<string, Record<string, number>> = {};

    registrations.forEach((reg) => {
      const dateKey = new Date(reg.updatedAt).toISOString().slice(0, 10); // YYYY-MM-DD
      if (!dailyMap[dateKey]) dailyMap[dateKey] = {};

      reg.participants.forEach((p: any) => {
        const catName = p.category?.name || 'Unknown';
        dailyMap[dateKey][catName] = (dailyMap[dateKey][catName] || 0) + 1;
      });
    });

    // Build sorted array
    const days = Object.keys(dailyMap)
      .sort((a, b) => b.localeCompare(a)) // newest first
      .map((date) => ({
        date,
        categories: dailyMap[date],
        total: Object.values(dailyMap[date]).reduce((s, c) => s + c, 0),
      }));

    // Today's summary (always included even if 0)
    const todayKey = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const todaySummary = dailyMap[todayKey] || {};

    return NextResponse.json({
      days,
      todaySummary,
      todayKey,
      from: from.toISOString(),
      to: to.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}