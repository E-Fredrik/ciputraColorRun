import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type PaymentStatus = 'pending' | 'confirmed' | 'declined';

const ALLOWED_STATUSES = new Set<PaymentStatus>(['pending', 'confirmed', 'declined']);

function normalizeStatus(raw: string | null): PaymentStatus | null {
  if (!raw) return null;
  const value = raw.toLowerCase() as PaymentStatus;
  return ALLOWED_STATUSES.has(value) ? value : null;
}

function toIsoStringSafe(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date(0).toISOString();
}

export async function GET(request: Request) {
  try {
    // Get status filter from query params
    const url = new URL(request.url);
    const rawStatus = url.searchParams.get('status');
    const status = normalizeStatus(rawStatus);

    if (rawStatus && !status) {
      return NextResponse.json(
        { error: 'Invalid status filter' },
        { status: 400 }
      );
    }

    const registrations = await prisma.registration.findMany({
      where: status
        ? {
            paymentStatus: status,
          }
        : undefined,
      include: {
        user: true,
        payment: {
          select: { 
            id: true,
            amount: true,
            proofOfPayment: true,
            status: true,
            transactionId: true,
            proofSenderName: true,
            createdAt: true,
          }
        },
        participants: {
          include: {
            category: true,
            jersey: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group registrations by transactionId (or payment.id if no transactionId)
    const txMap = new Map<string, {
      transactionId: string;
      paymentId: number | null;
      hasPayment: boolean;
      totalAmount: number;
      paymentStatus: string;
      createdAt: unknown;
      proofOfPayment?: string;
      proofSenderName?: string;
      registrationIds: Set<number>;
      registrations: Array<{
        registrationId: number;
        registrationType: string;
        totalAmount: number;
        groupName?: string;
        participantCount: number;
        createdAt: string;
        user?: any;
      }>;
      userName: string;
      email: string;
      phone: string;
      categoryCounts: Record<string, number>;
      jerseySizes: Record<string, number>;
      user?: any;
    }>();

    registrations.forEach((reg: any) => {
      const p = reg.payment;
      const txId = p?.transactionId || (p ? `payment-${p.id}` : `reg-${reg.id}`);
      
      if (!txMap.has(txId)) {
        txMap.set(txId, {
          transactionId: txId,
          paymentId: p?.id ?? null,
          hasPayment: Boolean(p),
          totalAmount: Number(p?.amount ?? reg.totalAmount ?? 0),
          paymentStatus: p?.status || reg.paymentStatus || 'pending',
          createdAt: p?.createdAt || reg.createdAt,
          proofOfPayment: p?.proofOfPayment,
          proofSenderName: p?.proofSenderName,
          registrationIds: new Set(),
          registrations: [],
          userName: reg.user?.name || '',
          email: reg.user?.email || '',
          phone: reg.user?.phone || '',
          categoryCounts: {},
          jerseySizes: {},
          user: {
            birthDate: reg.user?.birthDate,
            gender: reg.user?.gender,
            currentAddress: reg.user?.currentAddress,
            nationality: reg.user?.nationality,
            emergencyPhone: reg.user?.emergencyPhone,
            medicalHistory: reg.user?.medicalHistory,
            idCardPhoto: reg.user?.idCardPhoto,
          },
        });
      }

      const entry = txMap.get(txId)!;
      entry.registrationIds.add(reg.id);

      // Add this registration to the registrations array
      entry.registrations.push({
        registrationId: reg.id,
        registrationType: reg.registrationType,
        totalAmount: Number(reg.totalAmount || 0),
        groupName: reg.groupName || undefined,
        participantCount: reg.participants?.length || 0,
        createdAt: toIsoStringSafe(reg.createdAt),
        user: {
          idCardPhoto: reg.user?.idCardPhoto,
        },
      });

      // Aggregate category counts and jersey sizes
      reg.participants?.forEach((participant: any) => {
        const catName = participant.category?.name || 'Unknown';
        entry.categoryCounts[catName] = (entry.categoryCounts[catName] || 0) + 1;

        const size = participant.jersey?.size;
        if (size) {
          entry.jerseySizes[size] = (entry.jerseySizes[size] || 0) + 1;
        }
      });
    });

    // Convert map to array with proper structure for frontend
    const payments = Array.from(txMap.values()).map((entry) => {
      const totalParticipants = entry.registrations.reduce((sum, r) => sum + r.participantCount, 0);
      
      // Determine the primary registration type (most common or first)
      const typeCounts: Record<string, number> = {};
      entry.registrations.forEach(r => {
        typeCounts[r.registrationType] = (typeCounts[r.registrationType] || 0) + 1;
      });
      const primaryType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'individual';

      // Get group name from first registration that has one
      const groupName = entry.registrations.find(r => r.groupName)?.groupName;
      const firstRegistrationId = Array.from(entry.registrationIds)[0];

      return {
        // Use first registration ID as the primary identifier
        registrationId: firstRegistrationId,
        registrationIds: Array.from(entry.registrationIds),
        transactionId: entry.transactionId,
        userName: entry.userName,
        email: entry.email,
        phone: entry.phone,
        registrationType: primaryType,
        groupName,
        totalAmount: entry.totalAmount,
        createdAt: toIsoStringSafe(entry.createdAt),
        paymentStatus: entry.paymentStatus,
        participantCount: totalParticipants,
        categoryCounts: Object.keys(entry.categoryCounts).length > 0 ? entry.categoryCounts : undefined,
        jerseySizes: Object.keys(entry.jerseySizes).length > 0 ? entry.jerseySizes : undefined,
        payments: entry.hasPayment && entry.paymentId !== null
          ? [{
              id: entry.paymentId,
              amount: entry.totalAmount,
              proofOfPayment: entry.proofOfPayment,
              proofSenderName: entry.proofSenderName,
              status: entry.paymentStatus,
              transactionId: entry.transactionId,
              registrationId: firstRegistrationId,
            }]
          : [],
        user: entry.user,
        // Include all registrations in this transaction for detail view
        registrations: entry.registrations,
      };
    });

    // Sort by creation date descending
    payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(payments);
  } catch (err: any) {
    console.error('[admin/payments/all] Error:', err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}