import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
<<<<<<< Updated upstream
	const categories = [
		{ name: "3km", price: new Prisma.Decimal("49000") },
		{ name: "5km", price: new Prisma.Decimal("69000") },
		{ name: "10km", price: new Prisma.Decimal("99000") },
	];

	for (const c of categories) {
		await prisma.raceCategory.upsert({
			where: { name: c.name },
			update: { price: c.price },
			create: c,
		});
	}

	console.log("Seeded RaceCategory table");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
=======
  console.log("🚀 Starting database seeding...");

  try {
    // --- Seed Race Categories with Tiered Pricing ---
    console.log("📋 Seeding Race Categories...");
    
    const categories = [
      {
        name: "3km",
        basePrice: new Prisma.Decimal("150000"),
        earlyBirdPrice: new Prisma.Decimal("130000"),
        tier1Price: new Prisma.Decimal("140000"), // 10-29 people
        tier1Min: 10,
        tier1Max: 29,
        tier2Price: new Prisma.Decimal("135000"), // >30 people
        tier2Min: 30,
        tier2Max: null, // unlimited
        tier3Price: null, // 3K doesn't have tier 3
        tier3Min: null,
        bundlePrice: new Prisma.Decimal("145000"), // Family bundle
        bundleSize: 4,
      },
      {
        name: "5km",
        basePrice: new Prisma.Decimal("200000"),
        earlyBirdPrice: new Prisma.Decimal("180000"),
        tier1Price: new Prisma.Decimal("190000"), // 10-29 people
        tier1Min: 10,
        tier1Max: 29,
        tier2Price: new Prisma.Decimal("180000"), // 30-59 people
        tier2Min: 30,
        tier2Max: 59,
        tier3Price: new Prisma.Decimal("170000"), // >60 people
        tier3Min: 60,
        bundlePrice: null,
        bundleSize: null,
      },
      {
        name: "10km",
        basePrice: new Prisma.Decimal("250000"),
        earlyBirdPrice: new Prisma.Decimal("220000"),
        tier1Price: new Prisma.Decimal("235000"), // 10-29 people
        tier1Min: 10,
        tier1Max: 29,
        tier2Price: new Prisma.Decimal("225000"), // 30-59 people
        tier2Min: 30,
        tier2Max: 59,
        tier3Price: new Prisma.Decimal("215000"), // >60 people
        tier3Min: 60,
        bundlePrice: null,
        bundleSize: null,
      },
    ];

    for (const c of categories) {
      await prisma.raceCategory.upsert({
        where: { name: c.name },
        update: c,
        create: c,
      });
      console.log(`✅ Created/Updated category: ${c.name}`);
    }
    console.log("✅ Seeded RaceCategory table");

    // --- Seed Jersey Options (unchanged) ---
    console.log("👕 Seeding Jersey Options...");
    const jerseys = [
      { size: "XS", price: new Prisma.Decimal("0"), quantity: 1000 },
      { size: "S", price: new Prisma.Decimal("0"), quantity: 1000 },
      { size: "M", price: new Prisma.Decimal("0"), quantity: 1000 },
      { size: "L", price: new Prisma.Decimal("0"), quantity: 1000 },
      { size: "XL", price: new Prisma.Decimal("0"), quantity: 1000 },
      { size: "XXL", price: new Prisma.Decimal("0"), quantity: 1000 },
    ];

    for (const j of jerseys) {
      await prisma.jerseyOption.upsert({
        where: { size: j.size },
        update: {},
        create: j,
      });
      console.log(`✅ Created/Updated jersey size: ${j.size}`);
    }
    console.log("✅ Seeded JerseyOption table");

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("💥 Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
>>>>>>> Stashed changes
