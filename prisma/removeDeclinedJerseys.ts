import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting database update...");

  console.log("🔄 Searching for declined payments and filtering assigned jerseyIds...");

  // Find all participants linked to a declined registration (filter jerseyId in JS
  // to avoid a Prisma where typing mismatch for `not: null`)
  const declinedParticipants = await prisma.participant.findMany({
    where: {
      registration: {
        paymentStatus: "declined"
      }
    }
  });

  const invalidParticipants = declinedParticipants.filter(p => p.jerseyId !== null);

  if (invalidParticipants.length > 0) {
    console.log(`📋 Found ${invalidParticipants.length} participants with declined payments. Removing jerseys...`);
    
    // Create an array of updates to remove the jerseyId
    const removalUpdates = invalidParticipants.map(p => 
      prisma.participant.update({
        where: { id: p.id },
        data: { jersey: { disconnect: true } }
      })
    );
    
    // Execute all updates in a single database transaction
    await prisma.$transaction(removalUpdates);
    console.log(`✅ Successfully removed ${removalUpdates.length} jerseyIds.`);
  } else {
    console.log("✅ No declined participants with a jerseyId found. Skipping removal.");
  }
}

main()
  .catch((e) => {
    console.error("❌ Error updating jerseys:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
