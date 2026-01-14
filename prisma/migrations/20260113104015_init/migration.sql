-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "currentAddress" TEXT,
    "nationality" TEXT,
    "idCardPhoto" TEXT,
    "emergencyPhone" TEXT,
    "medicalHistory" TEXT,
    "medicationAllergy" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "earlyBirdPrice" DECIMAL(10,2),
    "tier1Price" DECIMAL(10,2),
    "tier1Min" INTEGER DEFAULT 10,
    "tier1Max" INTEGER DEFAULT 29,
    "tier2Price" DECIMAL(10,2),
    "tier2Min" INTEGER DEFAULT 30,
    "tier2Max" INTEGER,
    "tier3Price" DECIMAL(10,2),
    "tier3Min" INTEGER DEFAULT 60,
    "bundlePrice" DECIMAL(10,2),
    "bundleSize" INTEGER DEFAULT 4,
    "earlyBirdCapacity" INTEGER,

    CONSTRAINT "RaceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JerseyOption" (
    "id" SERIAL NOT NULL,
    "size" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'adult',
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER,
    "isExtraSize" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,

    CONSTRAINT "JerseyOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "registrationType" TEXT NOT NULL,
    "groupName" TEXT,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paymentId" INTEGER,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" SERIAL NOT NULL,
    "registrationId" INTEGER NOT NULL,
    "categoryId" INTEGER,
    "jerseyId" INTEGER NOT NULL,
    "bibNumber" TEXT,
    "packClaimed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "transactionId" TEXT NOT NULL,
    "proofOfPayment" TEXT,
    "proofSenderName" TEXT,
    "paidAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrCode" (
    "id" SERIAL NOT NULL,
    "registrationId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "qrCodeData" TEXT NOT NULL,
    "totalPacks" INTEGER NOT NULL,
    "maxScans" INTEGER NOT NULL,
    "scansRemaining" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QrCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RacePackClaim" (
    "id" SERIAL NOT NULL,
    "qrCodeId" INTEGER NOT NULL,
    "claimedBy" TEXT NOT NULL,
    "packsClaimedCount" INTEGER NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RacePackClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimDetail" (
    "id" SERIAL NOT NULL,
    "claimId" INTEGER NOT NULL,
    "participantId" INTEGER NOT NULL,

    CONSTRAINT "ClaimDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarlyBirdClaim" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EarlyBirdClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_accessCode_key" ON "User"("accessCode");

-- CreateIndex
CREATE UNIQUE INDEX "RaceCategory_name_key" ON "RaceCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "JerseyOption_size_key" ON "JerseyOption"("size");

-- CreateIndex
CREATE UNIQUE INDEX "QrCode_qrCodeData_key" ON "QrCode"("qrCodeData");

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RaceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_jerseyId_fkey" FOREIGN KEY ("jerseyId") REFERENCES "JerseyOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RaceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RacePackClaim" ADD CONSTRAINT "RacePackClaim_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QrCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimDetail" ADD CONSTRAINT "ClaimDetail_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "RacePackClaim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimDetail" ADD CONSTRAINT "ClaimDetail_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarlyBirdClaim" ADD CONSTRAINT "EarlyBirdClaim_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RaceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
