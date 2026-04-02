/**
 * Blast Email Script — Ciputra Color Run 2026
 *
 * Sends the racepack-pickup announcement to every user whose
 * id is in the range [--from, --to] (inclusive).
 *
 * Usage:
 *   npx tsx scripts/blastEmail.ts --from 1 --to 400
 *   npx tsx scripts/blastEmail.ts --test your@email.com     # send 1 test email
 *
 * Options:
 *   --from <id>    Starting user ID (inclusive)
 *   --to   <id>    Ending user ID (inclusive)
 *   --delay <ms>   Delay between emails in ms (default: 1500)
 *   --dry-run      Print user list without actually sending emails
 *   --test <email> Send a single test email with sample data to this address
 */

import "dotenv/config";
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

// ── CLI arg parsing ──────────────────────────────────────────────
function getArg(flag: string): string | undefined {
	const idx = process.argv.indexOf(flag);
	return idx !== -1 && idx + 1 < process.argv.length
		? process.argv[idx + 1]
		: undefined;
}

const fromId = Number(getArg("--from"));
const toId = Number(getArg("--to"));
const delay = Number(getArg("--delay") ?? "1500");
const dryRun = process.argv.includes("--dry-run");
const testEmail = getArg("--test");

if (!testEmail && (!fromId || !toId || fromId > toId)) {
	console.error(
		"❌ Usage:\n" +
			"  npx tsx scripts/blastEmail.ts --from <startId> --to <endId> [--delay <ms>] [--dry-run]\n" +
			"  npx tsx scripts/blastEmail.ts --test <your@email.com>",
	);
	process.exit(1);
}

// ── Prisma ───────────────────────────────────────────────────────
const prisma = new PrismaClient();

// ── PDF attachments ──────────────────────────────────────────────
const pdfDir = path.resolve(__dirname, "..", "public", "pdf");
const denahBazaarPath = path.join(pdfDir, "DenahBazaar.pdf");
const denahParkiranPath = path.join(pdfDir, "DenahParkiran.pdf");

for (const f of [denahBazaarPath, denahParkiranPath]) {
	if (!fs.existsSync(f)) {
		console.error(`❌ PDF not found: ${f}`);
		process.exit(1);
	}
}

// ── Email HTML builder ───────────────────────────────────────────
function buildHtml(userName: string, accessCode: string): string {
	return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <style>
    :root { color-scheme: light; }
    body, .email-bg { background-color: #ffffff !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff;">
  <!-- Outer white wrapper table for dark mode protection -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">

    <!-- Header -->
    <div style="background: linear-gradient(
    90deg,
    rgba(161, 213, 173, 0.38) 0%,
    rgba(222, 159, 169, 0.38) 100%
  ); padding: 40px 24px; text-align: center;">
      <h1 style="margin: 0; color: black; font-size: 26px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.15);">
        🎨🏃 Universitas Ciputra Color Run 2026
      </h1>
      <p style="margin: 12px 0 0 0; color: black; font-size: 16px;">
        Pengumuman Penting — Racepack & Race Day
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px; text-align: left;">
      <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; line-height: 1.6;">
        Halo <strong>${userName}</strong>! 👋
      </p>

      <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.7;">
        Kami ingin menginformasikan bahwa <strong>pengambilan racepack</strong> akan diselenggarakan selama <strong>3 hari</strong> dengan detail sebagai berikut:
      </p>

      <!-- Schedule -->
      <div style="margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; color: #000000; font-size: 18px; font-weight: bold;">
          📅 Jadwal Pengambilan Racepack
        </h3>

        <p style="margin: 0 0 4px 0; color: #000000; font-weight: bold; font-size: 15px;">DAY 1</p>
        <p style="margin: 4px 0 16px 0; color: #000000; font-size: 14px; line-height: 1.6;">
          📅 <strong>Kamis, 9 April 2026</strong><br>
          ⏰ 08.00 – 17.00 WIB<br>
          📍 Corepreneur, 1st Floor UC Tower, Universitas Ciputra Surabaya
        </p>

        <p style="margin: 0 0 4px 0; color: #000000; font-weight: bold; font-size: 15px;">DAY 2</p>
        <p style="margin: 4px 0 16px 0; color: #000000; font-size: 14px; line-height: 1.6;">
          📅 <strong>Jumat, 10 April 2026</strong><br>
          ⏰ 08.00 – 17.00 WIB<br>
          📍 Corepreneur, 1st Floor UC Tower, Universitas Ciputra Surabaya
        </p>

        <p style="margin: 0 0 4px 0; color: #000000; font-weight: bold; font-size: 15px;">DAY 3</p>
        <p style="margin: 4px 0 0 0; color: #000000; font-size: 14px; line-height: 1.6;">
          📅 <strong>Sabtu, 11 April 2026</strong><br>
          ⏰ 08.00 – 16.00 WIB<br>
          📍 Corepreneur, 1st Floor UC Tower, Universitas Ciputra Surabaya
        </p>
      </div>

      <!-- What to bring -->
      <div style="margin: 24px 0;">
        <h3 style="margin: 0 0 12px 0; color: #000000; font-size: 16px; font-weight: bold;">
          🎒 Yang perlu dibawa saat pengambilan racepack:
        </h3>
        <ol style="margin: 0; padding-left: 20px; color: #000000; font-size: 14px; line-height: 1.8;">
          <li style="margin-bottom: 6px;">Kartu identitas sesuai yang didaftarkan di website</li>
          <li style="margin-bottom: 6px;">QR Code (yang telah dikirimkan melalui email)</li>
          <li style="margin-bottom: 6px;">Surat kuasa (jika pengambilan racepack diwakilkan)</li>
        </ol>
      </div>

      <!-- Race Day Info -->
      <div style="margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; color: #000000; font-size: 16px; font-weight: bold;">
          🏁 Informasi Hari-H (Race Day)
        </h3>

        <p style="margin: 0 0 8px 0; color: #000000; font-weight: 600; font-size: 14px;">Flag Off:</p>
        <p style="margin: 4px 0; color: #000000; font-size: 14px; line-height: 1.8;">
          🏃 <strong>10K</strong> — 05.25 WIB<br>
          🏃 <strong>5K</strong> — 05.45 WIB<br>
          🏃 <strong>3K</strong> — 05.55 WIB
        </p>

        <p style="margin: 12px 0 4px 0; color: #000000; font-size: 14px;">
          ⏳ <strong>Cut Off Time:</strong> 07.25 WIB
        </p>
        <p style="margin: 4px 0; color: #000000; font-size: 14px;">
          🎉 <strong>Open Area:</strong> 04.00 WIB
        </p>
      </div>

      <p style="margin: 20px 0; color: #374151; font-size: 15px; line-height: 1.7;">
        Dimohon untuk para peserta memperhatikan jadwal serta mempersiapkan seluruh kebutuhan dengan baik ya!
      </p>

      <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.7;">
        Kami lampirkan <strong>denah parkir</strong> dan <strong>denah race village/bazaar</strong> untuk memudahkan peserta saat di hari-H.
      </p>

      <!-- Access Code Section -->
      <div style="background: linear-gradient(135deg, #fdf4ff 0%, #f5d0fe 100%); border: 3px solid #a855f7; border-radius: 12px; padding: 28px; margin: 28px 0; text-align: center;">
        <p style="margin: 0 0 16px 0; color: #7e22ce; font-size: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
          🔑 Access Code Kamu
        </p>
        <div style="background: #ffffff; border: 3px dashed #a855f7; border-radius: 10px; padding: 20px; margin: 16px 0;">
          <code style="font-size: 28px; font-weight: bold; color: #7e22ce; font-family: 'Courier New', Consolas, monospace; letter-spacing: 3px; display: block; word-break: break-all;">
            ${accessCode}
          </code>
        </div>
        <p style="margin: 16px 0 0 0; color: #7e22ce; font-size: 13px; line-height: 1.6;">
          Gunakan access code ini untuk login dan melihat detail registrasi serta QR Code kamu di website.
        </p>
      </div>

      <!-- Closing -->
      <p style="margin: 24px 0 0 0; color: #374151; font-size: 15px; line-height: 1.7;">
        Thank you & see you all! 😁🙌🏻
      </p>

      <!-- Support -->
      <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
        <p style="margin: 0 0 12px 0; color: #111827; font-weight: bold; font-size: 14px;">
          Need Help?
        </p>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
          Hubungi tim support kami:
        </p>
        <div style="margin-top: 12px;">
          <p style="margin: 6px 0; color: #374151; font-size: 14px;">
            <strong>📱 Abel</strong> — WhatsApp: <a href="https://wa.me/6289541031967" style="color: #059669; text-decoration: none;">0895410319676</a>
          </p>
          <p style="margin: 6px 0; color: #374151; font-size: 14px;">
            <strong>📱 Elysian</strong> — WhatsApp: <a href="https://wa.me/62811306658" style="color: #059669; text-decoration: none;">0811306658</a>
          </p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
        © 2026 Universitas Ciputra Color Run. All rights reserved.
      </p>
      <p style="margin: 0; color: #9ca3af; font-size: 11px;">
        Organized by Student Council of Universitas Ciputra
      </p>
    </div>
  </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Sleep helper ─────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── SMTP transporter setup (shared) ──────────────────────────────
function createTransporter() {
	const host = process.env.EMAIL_HOST;
	const port = Number(process.env.EMAIL_PORT);
	const secure = process.env.EMAIL_SECURE === "true";
	const emailUser = process.env.EMAIL_USER;
	const pass = process.env.EMAIL_PASS;

	if (!emailUser || !pass) {
		console.error(
			"❌ SMTP not configured. Check EMAIL_USER and EMAIL_PASS in .env",
		);
		process.exit(1);
	}

	const transporter = nodemailer.createTransport({
		host,
		port,
		secure,
		auth: { user: emailUser, pass },
	});

	return { transporter, emailUser };
}

// ── Test mode ────────────────────────────────────────────────────
async function runTest() {
	console.log("═══════════════════════════════════════════════════════");
	console.log("  🧪 Ciputra Color Run 2026 — TEST EMAIL");
	console.log("═══════════════════════════════════════════════════════");
	console.log(`  Sending to : ${testEmail}`);
	console.log("═══════════════════════════════════════════════════════\n");

	const { transporter, emailUser } = createTransporter();

	try {
		await transporter.verify();
		console.log("✅ SMTP connection verified.\n");
	} catch (err) {
		console.error("❌ SMTP verification failed:", err);
		process.exit(1);
	}

	const sampleName = "Test User";
	const sampleAccessCode = "TEST-XXXX-XXXX-XXXX";

	try {
		await transporter.sendMail({
			from: `"Ciputra Color Run 2026" <${emailUser}>`,
			to: testEmail,
			subject:
				"🧪 [TEST] Info Penting — Jadwal Racepack & Hari-H Universitas Ciputra Color Run 2026",
			html: buildHtml(sampleName, sampleAccessCode),
			attachments: [
				{
					filename: "Denah_Bazaar_RaceVillage.pdf",
					path: denahBazaarPath,
					contentType: "application/pdf",
				},
				{
					filename: "Denah_Parkiran.pdf",
					path: denahParkiranPath,
					contentType: "application/pdf",
				},
			],
		});

		console.log(`✅ Test email sent successfully to ${testEmail}`);
		console.log("   Name shown  : " + sampleName);
		console.log("   Access code : " + sampleAccessCode);
	} catch (err: any) {
		console.error(`❌ Failed to send test email: ${err?.message || err}`);
	}
}

// ── Main (blast mode) ────────────────────────────────────────────
async function main() {
	// If --test flag is used, run test mode instead
	if (testEmail) {
		await runTest();
		return;
	}

	console.log("═══════════════════════════════════════════════════════");
	console.log("  📧 Ciputra Color Run 2026 — Blast Email Script");
	console.log("═══════════════════════════════════════════════════════");
	console.log(`  Range  : User ID ${fromId} → ${toId}`);
	console.log(`  Delay  : ${delay}ms between emails`);
	console.log(
		`  Mode   : ${dryRun ? "🔍 DRY RUN (no emails sent)" : "🚀 LIVE"}`,
	);
	console.log("═══════════════════════════════════════════════════════\n");

	// Fetch users in range (only those with confirmed payments)
	const users = await prisma.user.findMany({
		where: {
			id: { gte: fromId, lte: toId },
			role: { not: "admin" },
			registrations: {
				some: {
					paymentStatus: "confirmed",
				},
			},
		},
		orderBy: { id: "asc" },
		select: {
			id: true,
			name: true,
			email: true,
			accessCode: true,
		},
	});

	console.log(
		`📋 Found ${users.length} user(s) in range [${fromId}, ${toId}]\n`,
	);

	if (users.length === 0) {
		console.log("⚠️  No users to send. Exiting.");
		return;
	}

	// Filter out users without email/accessCode
	const validUsers = users.filter((u) => u.email && u.accessCode);
	const skippedCount = users.length - validUsers.length;
	if (skippedCount > 0) {
		console.log(
			`⚠️  Skipping ${skippedCount} user(s) with no email or access code.\n`,
		);
	}

	if (dryRun) {
		console.log("🔍 DRY RUN — Users that would receive emails:\n");
		for (const u of validUsers) {
			console.log(`   ID: ${u.id} | ${u.name || "(no name)"} | ${u.email}`);
		}
		console.log(`\n✅ Total: ${validUsers.length} emails would be sent.`);
		return;
	}

	const { transporter, emailUser } = createTransporter();

	// Verify SMTP connection
	try {
		await transporter.verify();
		console.log("✅ SMTP connection verified.\n");
	} catch (err) {
		console.error("❌ SMTP verification failed:", err);
		process.exit(1);
	}

	let sent = 0;
	let failed = 0;

	for (let i = 0; i < validUsers.length; i++) {
		const u = validUsers[i];
		const progress = `[${i + 1}/${validUsers.length}]`;

		try {
			await transporter.sendMail({
				from: `"Ciputra Color Run 2026" <${emailUser}>`,
				to: u.email,
				subject:
					"📢 Info Penting — Jadwal Racepack & Hari-H Universitas Ciputra Color Run 2026",
				html: buildHtml(u.name || "Peserta", u.accessCode),
				attachments: [
					{
						filename: "Denah_Bazaar_RaceVillage.pdf",
						path: denahBazaarPath,
						contentType: "application/pdf",
					},
					{
						filename: "Denah_Parkiran.pdf",
						path: denahParkiranPath,
						contentType: "application/pdf",
					},
				],
			});

			sent++;
			console.log(
				`${progress} ✅ Sent to ID ${u.id} — ${u.name || "(no name)"} <${u.email}>`,
			);
		} catch (err: any) {
			failed++;
			console.error(
				`${progress} ❌ FAILED ID ${u.id} — ${u.email}: ${err?.message || err}`,
			);
		}

		// Delay between emails (skip after last one)
		if (i < validUsers.length - 1) {
			await sleep(delay);
		}
	}

	console.log("\n═══════════════════════════════════════════════════════");
	console.log("  📊 Blast Email Summary");
	console.log("═══════════════════════════════════════════════════════");
	console.log(`  ✅ Sent     : ${sent}`);
	console.log(`  ❌ Failed   : ${failed}`);
	console.log(`  ⏭️  Skipped  : ${skippedCount}`);
	console.log(`  📧 Total    : ${validUsers.length}`);
	console.log("═══════════════════════════════════════════════════════");
}

main()
	.catch((err) => {
		console.error("💥 Fatal error:", err);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
