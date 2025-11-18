import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, unauthorizedResponse } from '../../middleware/auth';
import nodemailer from "nodemailer";

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

    // 0) Load registration + user
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { user: true, payments: true },
    });
    if (!registration) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    // 1) Ensure we have an access code to email (generate but do not persist yet)
    const accessCode = registration.user?.accessCode || await makeUniqueAccessCode(registration.user?.name || registration.user?.email || `user${Date.now()}`);

    // 2) Build email content (same structure as sendQr route)
    const accessHtml = accessCode
      ? `<p><strong>Your access code:</strong> <code style="background:#f3f4f6;padding:4px 8px;border-radius:6px;">${accessCode}</code></p>
         <p>Use this code in the mobile app or profile page to manage your registration.</p>`
      : `<p>Your registration has been confirmed. No access code available.</p>`;

    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = Number(process.env.EMAIL_PORT || 465);
    const secure = (process.env.EMAIL_SECURE || 'true') === 'true';
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      console.error('[confirm] Missing EMAIL_USER or EMAIL_PASS environment variables');
      return NextResponse.json(
        { error: 'SMTP credentials are not configured. Set EMAIL_USER and EMAIL_PASS.' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    // verify and send email before changing DB
    try {
      await transporter.verify();
    } catch (err: any) {
      console.error('[confirm] Email transporter verification failed:', err);
      return NextResponse.json(
        { error: 'Email transporter verification failed. Check EMAIL_USER / EMAIL_PASS and provider settings.' },
        { status: 500 }
      );
    }

    try {
      const mailOptions = {
        from: `"Ciputra Color Run" <${user}>`,
        to: registration.user?.email,
        subject: 'Ciputra Color Run - Registration Confirmed',
        html: `
          <h1>Thank you for registering!</h1>
          <p>Your payment has been confirmed for registration <strong>#${registration.id}</strong>.</p>
          ${accessHtml}
          <p>If you did not expect this email, please contact the event organiser.</p>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('[confirm] sendMail result:', { accepted: info.accepted, rejected: info.rejected });
    } catch (err: any) {
      console.error('[confirm] Error sending confirmation email:', err);
      return NextResponse.json({ error: 'Failed to send confirmation email' }, { status: 500 });
    }

    // 3) Email succeeded -> perform DB updates in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      // mark payments as confirmed
      await tx.payment.updateMany({
        where: { registrationId, status: 'pending' },
        data: { status: 'confirmed' },
      });

      // ensure user accessCode persisted if we generated one
      if (registration.user && !registration.user.accessCode) {
        await tx.user.update({
          where: { id: registration.user.id },
          data: { accessCode },
        });
      }

      // update registration paymentStatus
      const reg = await tx.registration.update({
        where: { id: registrationId },
        data: { paymentStatus: 'confirmed' },
        include: { user: true, payments: true },
      });

      return reg;
    });

    return NextResponse.json({ success: true, registration: updated });
  } catch (error: any) {
    console.error('payments/confirm error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}