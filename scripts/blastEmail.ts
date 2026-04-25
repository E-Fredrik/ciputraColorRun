/**
 * Blast Email Script — Ciputra Color Run 2026
 *
 * Sends the post-event feedback thank-you email to every user whose
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



// ── Email HTML builder ───────────────────────────────────────────
function buildHtml(): string {
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
        🏃‍♂️🌈 Universitas Ciputra Color Run 2026
      </h1>
      <p style="margin: 12px 0 0 0; color: black; font-size: 16px;">
        Thank you for joining!
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px; text-align: left;">
      <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; line-height: 1.6;">
        Dear Runners,
      </p>

      <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.7;">
        Thank you for being part of the vibrant energy at Universitas Ciputra Color Run 2026! Your participation made this event truly colorful and unforgettable.
      </p>

      <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.7;">
        We would love to hear about your experience. Whether it was the route or the color war. Our feedback is very important to us for making our future events even better.
      </p>

      <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.7;">
        Please take 1-2 minutes to share your thoughts through the link below:
      </p>

      <!-- Feedback Link -->
      <div style="text-align: center; margin: 28px 0;">
        <a href="https://forms.gle/zrJCD227n93BBF76A" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: bold; letter-spacing: 0.5px;">
          📝 Share Your Feedback
        </a>
      </div>

      <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 13px; text-align: center;">
        Or copy this link: <a href="https://forms.gle/zrJCD227n93BBF76A" style="color: #7e22ce; text-decoration: underline;">https://forms.gle/zrJCD227n93BBF76A</a>
      </p>

      <p style="margin: 24px 0 0 0; color: #374151; font-size: 15px; line-height: 1.7;">
        Thank you for your time and for being such an amazing participant. We hope to see you again at our next event!
      </p>

      <p style="margin: 20px 0 0 0; color: #374151; font-size: 15px; line-height: 1.7;">
        Best regards,<br>
        <strong>Universitas Ciputra Color Run 2026</strong>
      </p>
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



	try {
		await transporter.sendMail({
			from: `"Ciputra Color Run 2026" <${emailUser}>`,
			to: testEmail,
			subject:
				"🧪 [TEST] [Feedback] Thank you for joining Universitas Ciputra Color Run 2026! 🏃‍♂️🌈",
			html: buildHtml(),
		});

		console.log(`✅ Test email sent successfully to ${testEmail}`);
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
		},
	});

	console.log(
		`📋 Found ${users.length} user(s) in range [${fromId}, ${toId}]\n`,
	);

	if (users.length === 0) {
		console.log("⚠️  No users to send. Exiting.");
		return;
	}

	// Filter out users without email
	const validUsers = users.filter((u) => u.email);
	const skippedCount = users.length - validUsers.length;
	if (skippedCount > 0) {
		console.log(
			`⚠️  Skipping ${skippedCount} user(s) with no email.\n`,
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
					"[Feedback] Thank you for joining Universitas Ciputra Color Run 2026! 🏃‍♂️🌈",
				html: buildHtml(),
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
