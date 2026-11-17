import { prisma } from "../../infrastructure/database.js";

interface CreateBookingInput {
  studentId: string;
  availabilityBlockId: string;
}

export async function createBooking(input: CreateBookingInput) {
  return prisma.$transaction(async (tx) => {
    // 1. Verify that the student exists and is active.
    const student = await tx.user.findUnique({
      where: { id: input.studentId },
    });

    if (!student || student.status !== "ACTIVE") {
      throw new Error("Student is not active");
    }

    // 2. Atomically claim the availability block.
    const claimedBlock = await tx.availabilityBlock.updateMany({
      where: {
        id: input.availabilityBlockId,
        status: "OPEN",
        startAt: { gt: new Date() },
      },
      data: {
        status: "BOOKED",
      },
    });

    if (claimedBlock.count === 0) {
      throw new Error("Availability is no longer available");
    }

    // 3. Check the student's upcoming bookings.
    const upcomingSessions = await tx.session.count({
      where: {
        studentId: input.studentId,
        status: "BOOKED",
        availabilityBlock: {
          startAt: { gt: new Date() },
        },
      },
    });

    if (upcomingSessions >= 3) {
      throw new Error("Student cannot have more than 3 upcoming sessions");
    }

    // 4. Create the session.
    const session = await tx.session.create({
      data: {
        studentId: input.studentId,
        availabilityBlockId: input.availabilityBlockId,
      },
      include: {
        availabilityBlock: true,
      },
    });

    // 5. Create an in-app notification.
    await tx.notification.create({
      data: {
        userId: input.studentId,
        message: "Your coaching session has been booked successfully.",
      },
    });

    return session;
  });
}