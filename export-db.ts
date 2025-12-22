import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";

const prisma = new PrismaClient();

// Hardcoded list of models to export (matches your schema)
const MODELS_TO_EXPORT = [
  "User",
  "Registration",
  "Payment",
  "Participant",
  "JerseyOption",
  "RaceCategory",
  "QrCode",
  "EarlyBirdClaim",
  "RacePackClaim",
];

async function exportAllModels() {
  try {
    console.log("Exporting hardcoded models:", MODELS_TO_EXPORT.join(", "));

    const wb = new ExcelJS.Workbook();
    wb.creator = "Prisma Export Script";

    for (const model of MODELS_TO_EXPORT) {
      console.log("Exporting model:", model);
      try {
        // Sanitize model name to avoid injection into SQL identifier
        const safeName = model.replace(/"/g, "");
        // Use Prisma $queryRawUnsafe to query the underlying table directly.
        // Assumes model name == DB table name (default Prisma behavior).
        const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "${safeName}"`);

        const sheet = wb.addWorksheet(model);
        if (!rows || rows.length === 0) {
          sheet.addRow([`(no rows in ${model})`]);
          continue;
        }

        const keys = Object.keys(rows[0]);
        sheet.addRow(keys);

        for (const r of rows) {
          const row = keys.map((k) => {
            const v = r[k];
            if (v === null || v === undefined) return "";
            if (v instanceof Date) return v.toISOString();
            if (Buffer.isBuffer && Buffer.isBuffer(v)) return v.toString("base64");
            if (typeof v === "object") {
              try {
                return JSON.stringify(v);
              } catch {
                return String(v);
              }
            }
            return v;
          });
          sheet.addRow(row);
        }

        sheet.columns.forEach((c) => (c.width = 20));
      } catch (e) {
        console.error(`Failed to export model ${model}:`, e?.message || e);
        const sheet = wb.addWorksheet(model);
        sheet.addRow(["ERROR", String(e?.message || e)]);
      }
    }

    const outFile = "db-export-all.xlsx";
    await wb.xlsx.writeFile(outFile);
    console.log("✅ Export finished — file saved as:", outFile);
  } catch (err: any) {
    console.error("Export failed:", err?.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportAllModels();