import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Fetching participants from confirmed registrations...");

  // Fetch participants linked to confirmed registrations.
  // We order by Registration creation date first, then by participant ID
  // to ensure fairness (first confirmed registration gets the lowest number).
  const participants = await prisma.participant.findMany({
    where: {
      registration: {
        paymentStatus: "confirmed",
      },
      categoryId: {
        not: null,
      },
    },
    include: {
      registration: true,
      category: true,
    },
    orderBy: [
      { registration: { createdAt: "asc" } },
      { id: "asc" },
    ],
  });

  console.log(`📋 Found ${participants.length} valid participants. Processing new bib numbers...`);

  // Track the current incremental number for each category
  const categoryCounters: Record<string, number> = {
    "3": 1,
    "5": 1,
    "10": 1,
  };

  const updates = [];

  for (const p of participants) {
    const catName = p.category?.name?.toLowerCase().replace(/\s+/g, "") || "";
    let prefix = "0";

    if (catName.includes("3k") || catName === "3km") prefix = "3";
    else if (catName.includes("5k") || catName === "5km") prefix = "5";
    else if (catName.includes("10k") || catName === "10km") prefix = "10";

    if (prefix !== "0") {
      const counter = categoryCounters[prefix]++;
      // Ensure 4 digits padding for the counter (e.g., 0001, 0002)
      const bibNumber = `${prefix}${String(counter).padStart(4, "0")}`;

      updates.push(
        prisma.participant.update({
          where: { id: p.id },
          data: { bibNumber },
        })
      );
    }
  }

  if (updates.length > 0) {
    console.log(`⏳ Applying ${updates.length} bib number updates to the database...`);
    
    // Execute all updates in a single database transaction
    await prisma.$transaction(updates);
    
    console.log(`✅ Successfully updated bib numbers!`);
    console.log(`📊 Final counter standings:`, categoryCounters);
  } else {
    console.log("⚠️ No confirmed participants found to update.");
  }
}

main()
  .catch((e) => {
    console.error("❌ Error updating bib numbers:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });