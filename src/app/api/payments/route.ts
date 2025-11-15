import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const registrationIdStr = form.get("registrationId") as string | null;
    const amountStr = (form.get("amount") as string) || undefined;
    const proofFile = form.get("proof") as File | null;
    const idCardPhotoFile = form.get("idCardPhoto") as File | null;
    const cartItemsJson = (form.get("items") as string) || (form.get("cartItems") as string) || undefined;

    // User details
    const fullName = (form.get("fullName") as string) || undefined;
    const email = (form.get("email") as string) || undefined;
    const phone = (form.get("phone") as string) || undefined;
    const birthDate = (form.get("birthDate") as string) || undefined;
    const gender = (form.get("gender") as string) || undefined;
    const currentAddress = (form.get("currentAddress") as string) || undefined;
    const nationality = (form.get("nationality") as string) || undefined;
    const emergencyPhone = (form.get("emergencyPhone") as string) || undefined;
    const medicalHistory = (form.get("medicalHistory") as string) || undefined;
    const registrationType = (form.get("registrationType") as string) || "individual";

    if (!proofFile) {
      return NextResponse.json({ error: "proof file is required" }, { status: 400 });
    }

    const amount = amountStr !== undefined ? Number(amountStr) : undefined;

    const txId = typeof crypto?.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Save payment proof
    const proofBuffer = Buffer.from(await proofFile.arrayBuffer());
    const proofExt = (proofFile.name?.split(".").pop() || "bin").replace(/[^a-zA-Z0-9]/g, "");
    const proofFilename = `${txId}_proof.${proofExt}`;
    const proofPath = path.join(uploadsDir, proofFilename);
    await fs.writeFile(proofPath, proofBuffer);

    // Save ID card photo if provided
    let idCardPhotoPath: string | undefined;
    if (idCardPhotoFile) {
      const idBuffer = Buffer.from(await idCardPhotoFile.arrayBuffer());
      const idExt = (idCardPhotoFile.name?.split(".").pop() || "bin").replace(/[^a-zA-Z0-9]/g, "");
      const idFilename = `${txId}_id.${idExt}`;
      const idPath = path.join(uploadsDir, idFilename);
      await fs.writeFile(idPath, idBuffer);
      idCardPhotoPath = `/uploads/${idFilename}`;
    }

    // helper to generate simple access code if needed
    const generateAccessCode = (name?: string) => {
      return `${(name || "u").replace(/\s+/g, "").slice(0, 6)}-${Date.now().toString(36).slice(-6)}`;
    };

    // Use transaction to create user/registration/participants/qr/payment atomically
    const result = await prisma.$transaction(async (tx) => {
      let registrationId: number | undefined;

      if (registrationIdStr && !Number.isNaN(Number(registrationIdStr))) {
        registrationId = Number(registrationIdStr);
      } else {
        if (!email || !fullName || !phone) {
          throw new Error("Missing registration data (fullName, email, phone).");
        }

        let user = await tx.user.findUnique({ where: { email } });
        if (!user) {
          const accessCode = generateAccessCode(fullName);
          user = await tx.user.create({
            data: {
              name: fullName,
              email,
              phone,
              accessCode,
              role: "user",
              birthDate: birthDate ? new Date(birthDate) : undefined,
              gender: gender || undefined,
              currentAddress: currentAddress || undefined,
              nationality: nationality || undefined,
              idCardPhoto: idCardPhotoPath || undefined,
              emergencyPhone: emergencyPhone || undefined,
              medicalHistory: medicalHistory || undefined,
            },
          });
        } else {
          // Update user with new details if provided
          await tx.user.update({
            where: { id: user.id },
            data: {
              birthDate: birthDate ? new Date(birthDate) : undefined,
              gender: gender || undefined,
              currentAddress: currentAddress || undefined,
              nationality: nationality || undefined,
              idCardPhoto: idCardPhotoPath || user.idCardPhoto,
              emergencyPhone: emergencyPhone || undefined,
              medicalHistory: medicalHistory || undefined,
            },
          });
        }

        const registration = await tx.registration.create({
          data: {
            userId: user.id,
            registrationType,
            totalAmount: new Prisma.Decimal(String(amount ?? 0)),
          },
        });

        registrationId = registration.id;
      }

      if (!registrationId) {
        throw new Error("failed to create or resolve registration");
      }

      // Create participants and QR codes (if cart items provided)
      const createdQrCodes: any[] = [];
      if (cartItemsJson) {
        let cartItems: any[] = [];
        try {
          cartItems = JSON.parse(cartItemsJson);
        } catch (e) {
          throw new Error("invalid items JSON");
        }

        const participantRows: Array<{ registrationId: number; categoryId: number; jerseyId: number }> = [];

        for (const item of cartItems) {
          const categoryId = Number(item.categoryId);
          if (item.type === "individual") {
            const size = item.jerseySize;
            const jersey = await tx.jerseyOption.findUnique({ where: { size } });
            if (!jersey) {
              throw new Error(`Jersey option not found for size ${size}`);
            }
            participantRows.push({ registrationId, categoryId, jerseyId: jersey.id });
          } else if (item.type === "community") {
            const jerseys: Record<string, number> = item.jerseys || {};
            for (const [size, count] of Object.entries(jerseys)) {
              const cnt = Number(count || 0);
              if (cnt <= 0) continue;
              const jersey = await tx.jerseyOption.findUnique({ where: { size } });
              if (!jersey) {
                throw new Error(`Jersey option not found for size ${size}`);
              }
              for (let i = 0; i < cnt; i++) {
                participantRows.push({ registrationId, categoryId, jerseyId: jersey.id });
              }
            }
          }
        }

        if (participantRows.length > 0) {
          await tx.participant.createMany({ data: participantRows });
        }

        // Group participants by category to create QrCode per category
        const grouped = participantRows.reduce<Record<number, number>>((acc, r) => {
          acc[r.categoryId] = (acc[r.categoryId] || 0) + 1;
          return acc;
        }, {});

        for (const [catIdStr, totalPacks] of Object.entries(grouped)) {
          const catId = Number(catIdStr);
          const code = typeof crypto?.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
          const maxScans = totalPacks + 3;
          const qr = await tx.qrCode.create({
            data: {
              registrationId,
              categoryId: catId,
              qrCodeData: code,
              totalPacks,
              maxScans,
              scansRemaining: maxScans,
            },
          });
          createdQrCodes.push(qr);
        }
      }

      // Create payment record
      const paymentData: any = {
        registrationId,
        transactionId: txId,
        proofOfPayment: `/uploads/${proofFilename}`,
        status: "pending",
      };

      if (amount !== undefined && !Number.isNaN(amount)) {
        paymentData.amount = new Prisma.Decimal(String(amount));
      }

      const payment = await tx.payment.create({ data: paymentData });

      return { payment, createdQrCodes };
    });

    return NextResponse.json({ success: true, payment: result.payment, qrCodes: result.createdQrCodes });
  } catch (err) {
    // avoid typed catch binding which breaks the parser
    console.error("Payment API error:", err);
    const message = err && (err as any).message ? (err as any).message : "internal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
