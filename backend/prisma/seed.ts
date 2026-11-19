import bcrypt from "bcryptjs";
import { prisma } from "../src/infrastructure/database.js";

async function main() {
  const passwordHash = await bcrypt.hash("Demo12345!", 10);

  const users = [
    {
      email: "coach@demo.com",
      name: "Demo Coach",
      role: "COACH" as const,
      timeZone: "America/Toronto",
    },
    {
      email: "student@demo.com",
      name: "Demo Student",
      role: "STUDENT" as const,
      timeZone: "America/Vancouver",
    },
    {
      email: "admin@demo.com",
      name: "Demo Admin",
      role: "ADMIN" as const,
      timeZone: "America/Toronto",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        ...user,
        passwordHash,
        status: "ACTIVE",
      },
    });
  }

  console.log("Demo users created successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());