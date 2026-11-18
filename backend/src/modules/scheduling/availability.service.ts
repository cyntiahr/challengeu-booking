import { prisma } from "../../infrastructure/database.js";

interface CreateAvailabilityInput {
  coachId: string;
  startAt: Date;
  durationMinutes: 30 | 60;
}

export async function createAvailability(
  input: CreateAvailabilityInput
) {
  const endAt = new Date(
    input.startAt.getTime() + input.durationMinutes * 60 * 1000
  );

  const overlappingBlock = await prisma.availabilityBlock.findFirst({
    where: {
      coachId: input.coachId,
      startAt: { lt: endAt },
      endAt: { gt: input.startAt },
    },
  });

  if (overlappingBlock) {
    throw new Error("Availability blocks cannot overlap");
  }

  return prisma.availabilityBlock.create({
    data: {
      coachId: input.coachId,
      startAt: input.startAt,
      endAt,
    },
  });
}
interface GetAvailabilityInput {
  coachId: string;
  startAt: Date;
  endAt: Date;
}

export async function getAvailableBlocks(input: GetAvailabilityInput) {
  return prisma.availabilityBlock.findMany({
    where: {
      coachId: input.coachId,
      status: "OPEN",
      startAt: {
        gte: input.startAt,
        lt: input.endAt,
        gt: new Date(),
      },
    },
    orderBy: {
      startAt: "asc",
    },
  });
}