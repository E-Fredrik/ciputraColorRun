import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // or use SMTP settings
  auth: {
    user: process.env.EMAIL_USER, // Add to .env
    pass: process.env.EMAIL_PASSWORD, // Add to .env
  },
});

export async function POST(request: Request) {
  try {
    const { registrationId, email } = await request.json();
    if (!registrationId || !email) {
      return NextResponse.json({ error: 'Missing registrationId or email' }, { status: 400 });
    }

    // Get registration details
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        participants: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Group participants by category
    const categoryGroups = registration.participants.reduce((acc, participant) => {
      const categoryId = participant.categoryId;
      if (!acc[categoryId]) {
        acc[categoryId] = {
          category: participant.category,
          participants: [],
        };
      }
      acc[categoryId].participants.push(participant);
      return acc;
    }, {} as Record<number, { category: any; participants: any[] }>);

    // Generate QR codes for each category
    const qrCodes = [];
    for (const [categoryId, group] of Object.entries(categoryGroups)) {
      const totalPacks = group.participants.length;
      const maxScans = totalPacks + 3;
      const qrData = `registration:${registrationId}:category:${categoryId}`;
      const qrCodeUrl = await QRCode.toDataURL(qrData);

      // Save QR code to database
      const qrCode = await prisma.qrCode.create({
        data: {
          registrationId,
          categoryId: parseInt(categoryId),
          qrCodeData: qrData,
          totalPacks,
          maxScans,
          scansRemaining: maxScans,
        },
      });

      qrCodes.push({
        category: group.category.name,
        qrCodeUrl,
        totalPacks,
      });
    }

    // Send email with QR codes
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Ciputra Color Run - Your QR Codes for Race Pack Collection',
      html: `
        <h1>Thank you for registering!</h1>
        <p>Your payment has been confirmed. Please use the QR codes below to claim your race packs:</p>
        ${qrCodes.map(qr => `
          <div style="margin: 20px 0;">
            <h3>${qr.category} (${qr.totalPacks} pack(s))</h3>
            <img src="${qr.qrCodeUrl}" alt="QR Code" style="width: 300px; height: 300px;" />
          </div>
        `).join('')}
        <p>Show these QR codes at the race pack collection point.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, qrCodes });
  } catch (error) {
    console.error('Error sending QR codes:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
