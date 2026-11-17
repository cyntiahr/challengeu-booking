import { prisma } from '../../infrastructure/database.js';

interface CancelBookingInput {
    studentId: string;
    sessionId: string;
}

const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function cancelBooking(input: CancelBookingInput) {
    return prisma.$transaction(async (tx) => {
        const session = await tx.session.findUnique({
            where: { id: input.sessionId },
            include: { availabilityBlock: true },
        });

        // 1. Verify that the session exists and belongs to the student.
        if (!session || session.studentId !== input.studentId) {
            throw new Error('Session not found');
        }

        // 2. Prevent cancelling an already cancelled session.
        if (session.status !== 'BOOKED') {
            throw new Error('Session is already cancelled');
        }

        // 3. Enforce the 24-hour cancellation rule.
        const now = new Date();
        const timeUntilSession =
            session.availabilityBlock.startAt.getTime() - now.getTime();

        if (timeUntilSession < CANCELLATION_WINDOW_MS) {
            throw new Error(
                'Sessions must be cancelled at least 24 hours in advance',
            );
        }

        // 4. Mark the session as cancelled.
        const result = await tx.session.updateMany({
            where: {
                id: session.id,
                status: 'BOOKED',
            },
            data: {
                status: 'CANCELLED',
                cancelledAt: now,
            },
        });

        if (result.count === 0) {
            throw new Error('Session is already cancelled');
        }

        const cancelledSession = await tx.session.findUniqueOrThrow({
            where: { id: session.id },
        });

        // 5. Reopen the availability block.
        await tx.availabilityBlock.update({
            where: { id: session.availabilityBlockId },
            data: { status: 'OPEN' },
        });

        // 6. Notify the student.
        await tx.notification.create({
            data: {
                userId: input.studentId,
                message:
                    'Your coaching session has been cancelled successfully.',
            },
        });

        return cancelledSession;
    });
}
