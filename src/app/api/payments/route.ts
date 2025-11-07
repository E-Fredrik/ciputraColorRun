import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { PrismaClient, Prisma } from "@prisma/client"; // { changed code }

const prisma = new PrismaClient();

export async function POST(req: Request) {
	try {
		const form = await req.formData();
		const registrationIdStr = form.get("registrationId") as string | null;
		const category = (form.get("category") as string) || undefined;
		const amountStr = (form.get("amount") as string) || undefined;
		const file = form.get("proof") as File | null;

		// optional user/registration fields (send these from the registration page)
		const fullName = (form.get("fullName") as string) || undefined;
		const email = (form.get("email") as string) || undefined;
		const phone = (form.get("phone") as string) || undefined;
		const registrationType =
			(form.get("registrationType") as string) || "individual";

		if (!file) {
			return NextResponse.json(
				{ error: "proof file is required" },
				{ status: 400 }
			);
		}

		// parse amount as number (may be total amount posted by client)
		const amount = amountStr !== undefined ? Number(amountStr) : undefined;

		// save uploaded file (unchanged)
		const txId =
			typeof crypto?.randomUUID === "function"
				? crypto.randomUUID()
				: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

		const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
		await fs.mkdir(uploadsDir, { recursive: true });

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const ext = (file.name?.split(".").pop() || "bin").replace(
			/[^a-zA-Z0-9]/g,
			""
		);
		const filename = `${txId}.${ext}`;
		const filepath = path.join(uploadsDir, filename);
		await fs.writeFile(filepath, buffer);

		// build payment base data
		const paymentData: any = {
			transactionId: txId,
			proofOfPayment: `/uploads/${filename}`,
			status: "pending",
			// don't set createdAt — DB will set timestamps
		};

		// remove category — not a field on Payment model
		// if you need to store category, add it to prisma/schema.prisma (recommended) and then set it here

		if (amount !== undefined && !Number.isNaN(amount)) {
			// if Payment.amount is Decimal in prisma/schema.prisma, use Prisma.Decimal
			paymentData.amount = new Prisma.Decimal(String(amount)); // { changed code }
		}

		// If registrationId provided and valid, use it; otherwise create registration (and user if needed)
		let registrationId: number | undefined = undefined;
		if (registrationIdStr && !Number.isNaN(Number(registrationIdStr))) {
			registrationId = Number(registrationIdStr);
		} else {
			// require basic user info to create registration
			if (!email || !fullName || !phone) {
				return NextResponse.json(
					{
						error:
							"Missing registration data (fullName, email, phone). Provide these to auto-create a registration.",
					},
					{ status: 400 }
				);
			}

			// create/find user and create registration inside a transaction
			const result = await prisma.$transaction(async (prismaTx) => {
				let user = await prismaTx.user.findUnique({ where: { email } });
				if (!user) {
					user = await prismaTx.user.create({
						data: {
							name: fullName,
							email,
							phone,
							accessCode: `${Date.now().toString(36)}`,
							role: "user",
						},
					});
				}

				// <-- FIX: include totalAmount when creating registration -->
				const registration = await prismaTx.registration.create({
					data: {
						userId: user.id,
						registrationType,
						// provide totalAmount (use posted amount or 0 fallback)
						totalAmount:
							amount !== undefined && !Number.isNaN(amount) ? amount : 0,
					},
				});

				return { user, registration };
			});

			registrationId = result.registration.id;
		}

		// attach registrationId (non-nullable) and create payment
		paymentData.registrationId = registrationId;

		const created = await prisma.payment.create({
			data: paymentData,
		});

		return NextResponse.json({ success: true, payment: created });
	} catch (err: any) {
		console.error("payment upload error", err);
		return NextResponse.json(
			{ error: err?.message ?? "internal" },
			{ status: 500 }
		);
	}
}
