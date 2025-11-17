import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { qrCodeData, claimedBy, packsClaimedCount } = await request.json();
    
    if (!qrCodeData || !claimedBy || !packsClaimedCount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find QR code
    const qrCode = await prisma.qrCode.findUnique({
      where: { qrCodeData },
      include: {
        registration: {
          include: {
            participants: {
              where: {
                categoryId: { equals: undefined }, // Will be set dynamically
              },
            },
          },
        },
      },
    });

    if (!qrCode) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
    }

    // Check if scans remaining
    if (qrCode.scansRemaining < packsClaimedCount) {
      return NextResponse.json({ 
        error: `Not enough scans remaining. Only ${qrCode.scansRemaining} scan(s) left.` 
      }, { status: 400 });
    }

    // Get participants for this category that haven't claimed yet
    const unclaimedParticipants = await prisma.participant.findMany({
      where: {
        registrationId: qrCode.registrationId,
        categoryId: qrCode.categoryId,
        packClaimed: false,
      },
      take: packsClaimedCount,
    });

    if (unclaimedParticipants.length < packsClaimedCount) {
      return NextResponse.json({ 
        error: `Not enough unclaimed packs. Only ${unclaimedParticipants.length} pack(s) available.` 
      }, { status: 400 });
    }

    // Create race pack claim
    const claim = await prisma.racePackClaim.create({
      data: {
        qrCodeId: qrCode.id,
        claimedBy,
        packsClaimedCount,
        claimDetails: {
          create: unclaimedParticipants.map(participant => ({
            participantId: participant.id,
          })),
        },
      },
    });

    // Update participants as claimed
    await prisma.participant.updateMany({
      where: {
        id: { in: unclaimedParticipants.map(p => p.id) },
      },
      data: {
        packClaimed: true,
      },
    });

    // Decrement scans remaining
    await prisma.qrCode.update({
      where: { id: qrCode.id },
      data: {
        scansRemaining: qrCode.scansRemaining - packsClaimedCount,
      },
    });

    return NextResponse.json({ 
      success: true, 
      claim,
      scansRemaining: qrCode.scansRemaining - packsClaimedCount,
    });
  } catch (error) {
    console.error('Error claiming race pack:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
