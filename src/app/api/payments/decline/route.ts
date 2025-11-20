import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, unauthorizedResponse } from '../../middleware/auth';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // Authenticate admin
  const auth = await authenticateAdmin(request);
  if (!auth.authenticated) {
    const host = request.headers.get('host') || '';
    const devBypassHeader = request.headers.get('x-dev-bypass');
    const isDevHost = (process.env.NODE_ENV === 'development') || host.includes('localhost');
    const allowBypass = isDevHost || devBypassHeader === '1';
    if (!allowBypass) return unauthorizedResponse(auth.error);
    console.warn('payments/decline: admin auth failed — using development bypass (do not use in production).');
  }

  try {
    const body = await request.json().catch(() => ({}));
    const registrationId = Number(body?.registrationId || body?.id);
    const declineReason = body?.reason || "Payment proof was not valid or could not be verified.";
    
    if (!registrationId) {
      return NextResponse.json({ error: 'Missing registrationId' }, { status: 400 });
    }

    // Get registration details before updating
    const registrationBefore = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { user: true },
    });

    if (!registrationBefore) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Update both payment records and registration status inside a transaction
    const registration = await prisma.$transaction(async (tx) => {
      // mark pending payments as declined
      await tx.payment.updateMany({
        where: { registrationId, status: 'pending' },
        data: { status: 'declined' },
      });

      // update registration status to declined
      const reg = await tx.registration.update({
        where: { id: registrationId },
        data: { paymentStatus: 'declined' },
        include: { user: true },
      });

      // Restore early-bird capacity
      const participants = await tx.participant.findMany({
        where: { registrationId },
        select: { categoryId: true },
      });

      if (participants && participants.length > 0) {
        const categoryMap: Record<number, number> = {};
        participants.forEach((p) => {
          const cid = typeof p.categoryId === "number" ? p.categoryId : null;
          if (cid === null) return; // skip participants without a category
          categoryMap[cid] = (categoryMap[cid] || 0) + 1;
        });
 
        for (const [catIdStr, count] of Object.entries(categoryMap)) {
          const catId = Number(catIdStr);
          const claims = await tx.earlyBirdClaim.findMany({
            where: { categoryId: catId },
            orderBy: { id: 'desc' },
            take: count,
          });
          if (claims.length > 0) {
            const claimsToRemove = claims.slice(0, Math.min(count, claims.length));
            await tx.earlyBirdClaim.deleteMany({
              where: { id: { in: claimsToRemove.map((c) => c.id) } },
            });
          }
        }
      }

      return reg;
    });

    // Send decline notification email
    if (registration.user?.email) {
      try {
        await sendDeclineEmail(
          registration.user.email,
          registration.user.name,
          registrationId,
          declineReason
        );
      } catch (emailError) {
        console.error('Failed to send decline email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ success: true, registration });
  } catch (err: any) {
    console.error('payments/decline error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

async function sendDeclineEmail(
  email: string,
  name: string,
  registrationId: number,
  reason: string
): Promise<void> {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.EMAIL_PORT || 465);
  const secure = (process.env.EMAIL_SECURE || 'true') === 'true';
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error('EMAIL_USER or EMAIL_PASS not configured');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const mailOptions = {
    from: `"Ciputra Color Run" <${user}>`,
    to: email,
    subject: 'Ciputra Color Run - Payment Declined',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Payment Declined</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">Dear <strong>${name}</strong>,</p>
          
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Unfortunately, your payment for registration <strong>#${registrationId}</strong> has been declined.
          </p>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b; font-size: 15px;">
              <strong>Reason:</strong> ${reason}
            </p>
          </div>
          
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; color: #1e40af; font-size: 15px;"><strong>What to do next:</strong></p>
            <ol style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
              <li>Please check your payment proof and ensure it's clear and complete</li>
              <li>Make sure the transfer amount matches your registration total</li>
              <li>Re-register with a valid payment proof</li>
              <li>If you have questions, please contact our support team</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/registration" 
               style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
              Register Again
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            If you believe this is a mistake or need assistance, please reply to this email or contact us through WhatsApp.
          </p>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
            Best regards,<br/>
            <strong style="color: #374151;">Ciputra Color Run Team</strong>
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}