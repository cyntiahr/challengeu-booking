import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../infrastructure/database.js";
import { createAvailability } from "./availability.service.js";

let coachId: string;

describe("Availability service", () => {
  beforeAll(async () => {
  const coach = await prisma.user.upsert({
    where: { email: "availability-test@example.com" },
    update: {},
    create: {
      email: "availability-test@example.com",
      passwordHash: "test-hash",
      name: "Availability Test Coach",
      role: "COACH",
    },
  });

  coachId = coach.id;
  });

  beforeEach(async () => {
    await prisma.availabilityBlock.deleteMany({
      where: { coachId },
    });
  });

  afterAll(async () => {
     await prisma.session.deleteMany({
    where: {
      OR: [
        { studentId: coachId },
        { availabilityBlock: { coachId } },
      ],
    },
  });

  await prisma.notification.deleteMany({
    where: { userId: coachId },
  });

  await prisma.availabilityBlock.deleteMany({
    where: { coachId },
  });

  await prisma.user.delete({
    where: { id: coachId },
  });

  await prisma.$disconnect();
  });

  it("should create a 60-minute availability block", async () => {
    const startAt = new Date("2026-11-20T14:00:00.000Z");

    const block = await createAvailability({
      coachId,
      startAt,
      durationMinutes: 60,
    });

    expect(block.startAt.toISOString()).toBe(startAt.toISOString());
    expect(block.endAt.toISOString()).toBe("2026-11-20T15:00:00.000Z");
  });

  it("should reject overlapping availability blocks", async () => {
    const startAt = new Date("2026-11-20T14:00:00.000Z");

    await createAvailability({
      coachId,
      startAt,
      durationMinutes: 60,
    });

    await expect(
      createAvailability({
        coachId,
        startAt: new Date("2026-11-20T14:30:00.000Z"),
        durationMinutes: 30,
      })
    ).rejects.toThrow("Availability blocks cannot overlap");
  });

  it("should allow adjacent availability blocks", async () => {
    await createAvailability({
      coachId,
      startAt: new Date("2026-11-20T14:00:00.000Z"),
      durationMinutes: 60,
    });

    const secondBlock = await createAvailability({
      coachId,
      startAt: new Date("2026-11-20T15:00:00.000Z"),
      durationMinutes: 30,
    });

    expect(secondBlock.startAt.toISOString()).toBe("2026-11-20T15:00:00.000Z");
  });
});