import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Get status filter from query params
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const registrations = await prisma.registration.findMany({
      where: status ? {
        payment: {
          status: status
        }
      } : undefined,
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

    console.log('[admin/payments/all] Sample payment object:', JSON.stringify(registrations[0]?.payment, null, 2));

    // Group registrations by transactionId (or payment.id if no transactionId)
    const txMap = new Map<string, {
      transactionId: string;
      paymentId: number;
      totalAmount: number;
      paymentStatus: string;
      createdAt: Date;
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
      if (!p) return; // Skip registrations without payment

      const txId = p.transactionId || `payment-${p.id}`;
      
      if (!txMap.has(txId)) {
        txMap.set(txId, {
          transactionId: txId,
          paymentId: p.id,
          totalAmount: Number(p.amount || 0),
          paymentStatus: p.status || 'pending',
          createdAt: p.createdAt || reg.createdAt,
          proofOfPayment: p.proofOfPayment,
          proofSenderName: p.proofSenderName,
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
        createdAt: reg.createdAt.toISOString(),
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

      return {
        // Use first registration ID as the primary identifier
        registrationId: Array.from(entry.registrationIds)[0],
        registrationIds: Array.from(entry.registrationIds),
        transactionId: entry.transactionId,
        userName: entry.userName,
        email: entry.email,
        phone: entry.phone,
        registrationType: primaryType,
        groupName,
        totalAmount: entry.totalAmount,
        createdAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : entry.createdAt,
        paymentStatus: entry.paymentStatus,
        participantCount: totalParticipants,
        categoryCounts: Object.keys(entry.categoryCounts).length > 0 ? entry.categoryCounts : undefined,
        jerseySizes: Object.keys(entry.jerseySizes).length > 0 ? entry.jerseySizes : undefined,
        payments: [{
          id: entry.paymentId,
          amount: entry.totalAmount,
          proofOfPayment: entry.proofOfPayment,
          proofSenderName: entry.proofSenderName,
          status: entry.paymentStatus,
          transactionId: entry.transactionId,
          registrationId: Array.from(entry.registrationIds)[0],
        }],
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