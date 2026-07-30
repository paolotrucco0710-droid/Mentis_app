import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEV_USER_ID = "00000000-0000-4000-8000-000000000001";
const DEV_SUBJECT_ID = "00000000-0000-4000-8000-000000000002";

async function main() {
  await prisma.user.upsert({
    where: { id: DEV_USER_ID },
    update: {},
    create: {
      id: DEV_USER_ID,
      firstName: "Paolo",
      lastName: "Dev",
      email: "paolo.dev@mentis.local",
      passwordHash: "dev-only-not-for-production",
      language: "it",
      timezone: "Europe/Rome",
      preferences: {
        language: "it",
        timezone: "Europe/Rome",
        notificationsEnabled: true,
        dailyGoalMinutes: 30,
      },
    },
  });

  await prisma.subject.upsert({
    where: { id: DEV_SUBJECT_ID },
    update: {},
    create: {
      id: DEV_SUBJECT_ID,
      userId: DEV_USER_ID,
      name: "Generale",
      color: "#4F46E5",
      icon: "book",
      displayOrder: 0,
    },
  });

  console.log("Seed completato.");
  console.log(`DEV_USER_ID=${DEV_USER_ID}`);
  console.log(`DEV_SUBJECT_ID=${DEV_SUBJECT_ID}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
