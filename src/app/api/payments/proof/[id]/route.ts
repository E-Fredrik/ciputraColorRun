import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return NextResponse.json({ error: "payment not found" }, { status: 404 });

    const proof = payment.proofOfPayment;
    if (!proof) return NextResponse.json({ error: "no proof stored" }, { status: 404 });

    // If stored as a public URL (S3), redirect browser to it
    if (proof.startsWith("http://") || proof.startsWith("https://")) {
      return NextResponse.redirect(proof);
    }

    // Otherwise attempt to read local file (ephemeral; may not exist on another invocation)
    // Accept either absolute /tmp/... or a path relative to repo/public (e.g. /uploads/...)
    let filePath = proof;
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(process.cwd(), "public", proof.replace(/^\//, ""));
    }

    try {
      const data = await fs.readFile(filePath);
      const ext = path.extname(filePath).slice(1).toLowerCase();
      const contentType =
        ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "application/octet-stream";
      return new NextResponse(data, { headers: { "Content-Type": contentType } });
    } catch (readErr) {
      console.error("payments/proof: file read error", readErr);
      return NextResponse.json({ error: "file not accessible" }, { status: 404 });
    }
  } catch (err: any) {
    console.error("payments/proof error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}