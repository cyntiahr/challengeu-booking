import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../../infrastructure/database.js';
import { createBooking } from './booking.service.js';
import { cancelBooking } from './cancellation.service.js';

describe('cancelBooking', () => {
    let studentId: string;
    let coachId: string;

    beforeAll(async () => {
        const student = await prisma.user.create({
            data: {
                email: 'cancellation-student@test.com',
                passwordHash: 'test-hash',
                name: 'Cancellation Student',
                role: 'STUDENT',
            },
        });

        const coach = await prisma.user.create({
            data: {
                email: 'cancellation-coach@test.com',
                passwordHash: 'test-hash',
                name: 'Cancellation Coach',
                role: 'COACH',
            },
        });

        studentId = student.id;
        coachId = coach.id;
    });

    afterAll(async () => {
        await prisma.session.deleteMany({
            where: { studentId },
        });

        await prisma.notification.deleteMany({
            where: { userId: studentId },
        });

        await prisma.availabilityBlock.deleteMany({
            where: { coachId },
        });

        await prisma.user.deleteMany({
            where: { id: { in: [studentId, coachId] } },
        });

        await prisma.$disconnect();
    });

    it('cancels a booked session and reopens its availability', async () => {
        const startAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

        const block = await prisma.availabilityBlock.create({
            data: {
                coachId,
                startAt,
                endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
            },
        });

        const booking = await createBooking({
            studentId,
            availabilityBlockId: block.id,
        });

        const cancelled = await cancelBooking({
            studentId,
            sessionId: booking.id,
        });

        expect(cancelled.status).toBe('CANCELLED');
        expect(cancelled.cancelledAt).not.toBeNull();

        const availability = await prisma.availabilityBlock.findUnique({
            where: { id: block.id },
        });

        expect(availability?.status).toBe('OPEN');
    });
    it('does not allow cancellation less than 24 hours before a session', async () => {
        const startAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

        const block = await prisma.availabilityBlock.create({
            data: {
                coachId,
                startAt,
                endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
                status: 'BOOKED',
            },
        });

        // Create the session directly because the booking service
        // only allows booking future available blocks.
        const session = await prisma.session.create({
            data: {
                studentId,
                availabilityBlockId: block.id,
            },
        });

        await expect(
            cancelBooking({
                studentId,
                sessionId: session.id,
            }),
        ).rejects.toThrow(
            'Sessions must be cancelled at least 24 hours in advance',
        );

        // The rejected cancellation must not change the session.
        const unchangedSession = await prisma.session.findUnique({
            where: { id: session.id },
        });

        expect(unchangedSession?.status).toBe('BOOKED');

        // The availability block must remain booked.
        const unchangedBlock = await prisma.availabilityBlock.findUnique({
            where: { id: block.id },
        });

        expect(unchangedBlock?.status).toBe('BOOKED');
    });
    it('does not allow cancelling an already cancelled session', async () => {
        const startAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

        const block = await prisma.availabilityBlock.create({
            data: {
                coachId,
                startAt,
                endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
            },
        });

        const booking = await createBooking({
            studentId,
            availabilityBlockId: block.id,
        });

        // First cancellation succeeds.
        await cancelBooking({
            studentId,
            sessionId: booking.id,
        });

        // Second cancellation must fail.
        await expect(
            cancelBooking({
                studentId,
                sessionId: booking.id,
            }),
        ).rejects.toThrow('Session is already cancelled');
    });
    it('does not allow two simultaneous cancellations of the same session', async () => {
        const startAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

        const block = await prisma.availabilityBlock.create({
            data: {
                coachId,
                startAt,
                endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
            },
        });

        const booking = await createBooking({
            studentId,
            availabilityBlockId: block.id,
        });

        const results = await Promise.allSettled([
            cancelBooking({
                studentId,
                sessionId: booking.id,
            }),
            cancelBooking({
                studentId,
                sessionId: booking.id,
            }),
        ]);

        const successfulCancellations = results.filter(
            (result) => result.status === 'fulfilled',
        );

        expect(successfulCancellations).toHaveLength(1);

        // Verify the session was cancelled.
        const session = await prisma.session.findUnique({
            where: { id: booking.id },
        });

        expect(session?.status).toBe('CANCELLED');

        // Verify the availability was reopened.
        const availability = await prisma.availabilityBlock.findUnique({
            where: { id: block.id },
        });

        expect(availability?.status).toBe('OPEN');

        // Booking creates one notification, cancellation creates another.
        // Verify that simultaneous cancellation didn't create duplicates.
        const notifications = await prisma.notification.findMany({
            where: {
                userId: studentId,
                createdAt: {
                    gte: booking.createdAt,
                },
            },
        });

        const cancellationNotifications = notifications.filter((notification) =>
            notification.message.includes('cancelled'),
        );

        expect(cancellationNotifications).toHaveLength(1);
    });
});
