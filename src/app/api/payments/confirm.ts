import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, unauthorizedResponse } from '../middleware/auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // Authenticate admin
  const auth = await authenticateAdmin(request);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error);
  }

  try {
    const { registrationId } = await request.json();
    if (!registrationId) {
      return NextResponse.json({ error: 'Missing registrationId' }, { status: 400 });
    }

    // Update registration payment status to confirmed
    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: { paymentStatus: 'confirmed' },
      include: {
        user: true,
      },
    });

    // Trigger QR code generation and sending
    const sendQrResponse = await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/payments/sendQr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        registrationId, 
        email: registration.user.email 
      }),
    });

    if (!sendQrResponse.ok) {
      throw new Error('Failed to send QR code');
    }

    return NextResponse.json({ success: true, registration });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
