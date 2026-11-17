import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../../infrastructure/database.js';
import { createBooking } from './booking.service.js';

describe('createBooking', () => {
    let studentId: string;
    let coachId: string;
    let availabilityBlockId: string;
    let suspendedStudentId: string;
    let secondStudentId: string;

    beforeAll(async () => {
        const student = await prisma.user.upsert({
            where: { email: 'booking-student@test.com' },
            update: {},
            create: {
                email: 'booking-student@test.com',
                passwordHash: 'test-hash',
                name: 'Booking Student',
                role: 'STUDENT',
                status: 'ACTIVE',
            },
        });

        const suspendedStudent = await prisma.user.upsert({
            where: { email: 'suspended-student@test.com' },
            update: {},
            create: {
                email: 'suspended-student@test.com',
                passwordHash: 'test-hash',
                name: 'Suspended Student',
                role: 'STUDENT',
                status: 'SUSPENDED',
            },
        });

        suspendedStudentId = suspendedStudent.id;

        const coach = await prisma.user.upsert({
            where: { email: 'booking-coach@test.com' },
            update: {},
            create: {
                email: 'booking-coach@test.com',
                passwordHash: 'test-hash',
                name: 'Booking Coach',
                role: 'COACH',
            },
        });

        studentId = student.id;
        coachId = coach.id;
    });
    beforeEach(async () => {
        const studentIds = [
            studentId,
            suspendedStudentId,
            secondStudentId,
        ].filter((id): id is string => Boolean(id));

        // Remove sessions created by previous tests.
        await prisma.session.deleteMany({
            where: {
                OR: [
                    { studentId: { in: studentIds } },
                    ...(coachId ? [{ availabilityBlock: { coachId } }] : []),
                ],
            },
        });

        // Remove previous test notifications.
        await prisma.notification.deleteMany({
            where: { userId: { in: studentIds } },
        });

        // Remove previous test availability blocks.
        if (coachId) {
            await prisma.availabilityBlock.deleteMany({
                where: { coachId },
            });
        }

        // Give each test a fresh availability block.
        const availability = await prisma.availabilityBlock.create({
            data: {
                coachId,
                startAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                endAt: new Date(Date.now() + 25 * 60 * 60 * 1000),
            },
        });

        availabilityBlockId = availability.id;
    });
    afterAll(async () => {
        const studentIds = [
            studentId,
            suspendedStudentId,
            secondStudentId,
        ].filter((id): id is string => Boolean(id));

        await prisma.session.deleteMany({
            where: {
                OR: [
                    { studentId: { in: studentIds } },
                    { availabilityBlock: { coachId } },
                ],
            },
        });

        await prisma.notification.deleteMany({
            where: { userId: { in: studentIds } },
        });

        await prisma.availabilityBlock.deleteMany({
            where: { coachId },
        });

        const userIds = [...studentIds, coachId];

        await prisma.user.deleteMany({
            where: { id: { in: userIds } },
        });

        await prisma.$disconnect();
    });

    it('books an available block successfully', async () => {
        const session = await createBooking({
            studentId,
            availabilityBlockId,
        });

        expect(session.status).toBe('BOOKED');
        expect(session.studentId).toBe(studentId);
        expect(session.availabilityBlockId).toBe(availabilityBlockId);
    });

    it('marks the availability block as booked', async () => {
        await createBooking({
            studentId,
            availabilityBlockId,
        });

        const availability = await prisma.availabilityBlock.findUnique({
            where: { id: availabilityBlockId },
        });

        expect(availability?.status).toBe('BOOKED');
    });

    it('creates a notification for the student', async () => {
        await createBooking({
            studentId,
            availabilityBlockId,
        });

        const notifications = await prisma.notification.findMany({
            where: { userId: studentId },
        });

        expect(notifications).toHaveLength(1);
        expect(notifications[0]?.message).toContain('booked');
    });

    it('does not allow suspended students to book', async () => {
        await expect(
            createBooking({
                studentId: suspendedStudentId,
                availabilityBlockId,
            }),
        ).rejects.toThrow('Student is not active');
    });

    it('does not allow booking an already booked block', async () => {
        await createBooking({
            studentId,
            availabilityBlockId,
        });

        await expect(
            createBooking({
                studentId,
                availabilityBlockId,
            }),
        ).rejects.toThrow('Availability is no longer available');
    });

    it('does not allow a student to have more than 3 upcoming sessions', async () => {
        // Create two additional future availability blocks.
        const additionalBlocks =
            await prisma.availabilityBlock.createManyAndReturn({
                data: [1, 2].map((index) => ({
                    coachId,
                    startAt: new Date(
                        Date.now() + (index + 2) * 24 * 60 * 60 * 1000,
                    ),
                    endAt: new Date(
                        Date.now() +
                            (index + 2) * 24 * 60 * 60 * 1000 +
                            60 * 60 * 1000,
                    ),
                })),
            });

        // Book the initial availability block.
        await createBooking({
            studentId,
            availabilityBlockId,
        });

        // Book two additional blocks to reach the limit of three.
        for (const block of additionalBlocks) {
            await createBooking({
                studentId,
                availabilityBlockId: block.id,
            });
        }

        // Create one more available block.
        const fourthBlock = await prisma.availabilityBlock.create({
            data: {
                coachId,
                startAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                endAt: new Date(
                    Date.now() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
                ),
            },
        });

        // The fourth booking must be rejected.
        await expect(
            createBooking({
                studentId,
                availabilityBlockId: fourthBlock.id,
            }),
        ).rejects.toThrow('Student cannot have more than 3 upcoming sessions');

        // The rejected booking must not consume the availability block.
        const availability = await prisma.availabilityBlock.findUnique({
            where: { id: fourthBlock.id },
        });

        expect(availability?.status).toBe('OPEN');
    });

    it('does not allow two students to book the same block simultaneously', async () => {
        const secondStudent = await prisma.user.upsert({
            where: { email: 'booking-student-2@test.com' },
            update: {},
            create: {
                email: 'booking-student-2@test.com',
                passwordHash: 'test-hash',
                name: 'Second Booking Student',
                role: 'STUDENT',
            },
        });

        secondStudentId = secondStudent.id;

        const block = await prisma.availabilityBlock.create({
            data: {
                coachId,
                startAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                endAt: new Date(
                    Date.now() + 10 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
                ),
            },
        });

        const results = await Promise.allSettled([
            createBooking({
                studentId,
                availabilityBlockId: block.id,
            }),
            createBooking({
                studentId: secondStudent.id,
                availabilityBlockId: block.id,
            }),
        ]);

        const successfulBookings = results.filter(
            (result) => result.status === 'fulfilled',
        );

        expect(successfulBookings).toHaveLength(1);
    });
});
