import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting database update...");

  console.log("🔄 Searching for declined payments with an assigned jerseyId...");
  
  // Find all participants linked to a declined registration who have a jerseyId
  const invalidParticipants = await prisma.participant.findMany({
    where: {
      registration: {
        paymentStatus: "declined"
      },
      NOT: {
        jerseyId: null
      }
    }
  });

  if (invalidParticipants.length > 0) {
    console.log(`📋 Found ${invalidParticipants.length} participants with declined payments. Removing jerseys...`);
    
    // Create an array of updates to remove the jerseyId
    const removalUpdates = invalidParticipants.map(p => 
      prisma.participant.update({
        where: { id: p.id },
        data: { jerseyId: null }
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
