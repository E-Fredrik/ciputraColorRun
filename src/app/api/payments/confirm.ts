import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, unauthorizedResponse } from '../middleware/auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // Authenticate admin (keeps your existing dev bypass logic)
  const auth = await authenticateAdmin(request);
  if (!auth.authenticated) {
    const host = request.headers.get('host') || '';
    const devBypassHeader = request.headers.get('x-dev-bypass');
    const isDevHost = (process.env.NODE_ENV === 'development') || host.includes('localhost');
    const allowBypass = isDevHost || devBypassHeader === '1';
    if (!allowBypass) return unauthorizedResponse(auth.error);
    console.warn('payments/confirm: admin auth failed — using development bypass (do not use in production).');
  }

  try {
    const body = await request.json().catch(() => ({}));
    const registrationId = Number(body?.registrationId || body?.id);
    if (!registrationId) {
      return NextResponse.json({ error: 'Missing registrationId' }, { status: 400 });
    }

    // Update registration payment status to confirmed
    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: { paymentStatus: 'confirmed' },
      include: { user: true },
    });

    // Attempt to send QR/email but do NOT fail the whole request if it errors.
    // Fire-and-forget with logging so the LO sees successful confirm immediately.
    (async () => {
      try {
        const sendQrResponse = await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/payments/sendQr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registrationId, email: registration.user.email }),
        });
        if (!sendQrResponse.ok) {
          const text = await sendQrResponse.text().catch(() => '');
          console.warn('payments/confirm: sendQr failed', sendQrResponse.status, text);
        }
      } catch (err) {
        console.error('payments/confirm: sendQr error', err);
      }
    })();

    return NextResponse.json({ success: true, registration });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
