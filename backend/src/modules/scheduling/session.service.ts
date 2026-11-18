import { prisma } from "../../infrastructure/database.js";

export async function getUpcomingSessions(studentId: string) {
  return prisma.session.findMany({
    where: {
      studentId,
      status: "BOOKED",
      availabilityBlock: {
        startAt: {
          gt: new Date(),
        },
      },
    },
    include: {
      availabilityBlock: {
        include: {
          coach: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      availabilityBlock: {
        startAt: "asc",
      },
    },
  });
}