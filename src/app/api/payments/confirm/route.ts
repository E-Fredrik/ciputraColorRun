import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, unauthorizedResponse } from '../../middleware/auth';

const prisma = new PrismaClient();

async function makeUniqueAccessCode(baseName: string): Promise<string> {
  const base = (baseName || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_$/, '')
    .slice(0, 30) || `u${Date.now().toString(36).slice(-6)}`;

  let code = base;
  let counter = 0;
  while (true) {
    const existing = await prisma.user.findUnique({ where: { accessCode: code } });
    if (!existing) return code;
    counter += 1;
    code = `${base}_${counter}`;
  }
}

export async function POST(request: Request) {
  // Authenticate admin (keeps your dev bypass logic)
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

    // 1) perform DB updates in one transaction (payments + registration + ensure accessCode)
    const registration = await prisma.$transaction(async (tx) => {
      // mark any pending payments for this registration as confirmed
      await tx.payment.updateMany({
        where: { registrationId, status: 'pending' },
        data: { status: 'confirmed' },
      });

      // update registration.paymentStatus
      const reg = await tx.registration.update({
        where: { id: registrationId },
        data: { paymentStatus: 'confirmed' },
        include: { user: true, payments: true },
      });

      // ensure user has accessCode (create if missing)
      if (reg.user && !reg.user.accessCode) {
        const accessCode = await (async () => {
          const base = reg.user.name || reg.user.email || `user${reg.user.id}`;
          return await makeUniqueAccessCode(base);
        })();

        await tx.user.update({
          where: { id: reg.user.id },
          data: { accessCode },
        });

        // reflect in returned object
        reg.user.accessCode = accessCode;
      }

      return reg;
    });

    // 2) Fire-and-forget send QR/email: only attempt if APP_URL/VERCEL_URL set. Errors are logged but won't fail response.
    (async () => {
      try {
        const baseUrl =
          process.env.APP_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

        if (!baseUrl) {
          console.warn('payments/confirm: APP_URL or VERCEL_URL not set — skipping sendQr.');
          return;
        }

        // wrap network call in try/catch — do not throw to caller
        await fetch(`${baseUrl.replace(/\/$/, '')}/api/payments/sendQr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registrationId: registration.id,
            email: registration.user?.email,
            accessCode: registration.user?.accessCode,
          }),
        }).catch((e) => {
          console.warn('payments/confirm: sendQr fetch failed (caught)', e);
        });
      } catch (e) {
        console.warn('payments/confirm: sendQr unexpected error', e);
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