import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/auth/password";
import type { SubjectId, UserId } from "../src/domain/ids";
import { DEV_SEED_USER } from "../tests/fixtures/dev-user";
import { seedMvpDemo } from "./seed-mvp-demo";

const prisma = new PrismaClient();

const DEV_USER_ID = DEV_SEED_USER.id as UserId;
const DEV_SUBJECT_ID = DEV_SEED_USER.subjectId as SubjectId;

async function main() {
  const passwordHash = await hashPassword(DEV_SEED_USER.password);

  await prisma.user.upsert({
    where: { id: DEV_USER_ID },
    update: {
      passwordHash,
      preferences: {
        language: "it",
        timezone: "Europe/Rome",
        notificationsEnabled: true,
        dailyGoalMinutes: 30,
        onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
      },
    },
    create: {
      id: DEV_USER_ID,
      firstName: "Paolo",
      lastName: "Dev",
      email: DEV_SEED_USER.email,
      passwordHash,
      language: "it",
      timezone: "Europe/Rome",
      preferences: {
        language: "it",
        timezone: "Europe/Rome",
        notificationsEnabled: true,
        dailyGoalMinutes: 30,
        onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
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

  await seedMvpDemo(prisma, DEV_USER_ID, DEV_SUBJECT_ID);

  console.log("Seed completato.");
  console.log(`DEV_USER_ID=${DEV_USER_ID}`);
  console.log(`DEV_SUBJECT_ID=${DEV_SUBJECT_ID}`);
  console.log(`DEV_USER_EMAIL=${DEV_SEED_USER.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
