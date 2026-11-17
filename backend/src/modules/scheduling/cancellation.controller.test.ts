import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../infrastructure/database.js';
import { createBooking } from './booking.service.js';
import { generateToken } from '../auth/token.js';

describe('PATCH /sessions/:sessionId/cancel', () => {
    let studentId: string;
    let coachId: string;
    let studentToken: string;

    beforeAll(async () => {
        const student = await prisma.user.create({
            data: {
                email: 'cancellation-api-student@test.com',
                name: 'Cancellation API Student',
                passwordHash: 'test',
                role: 'STUDENT',
            },
        });

        const coach = await prisma.user.create({
            data: {
                email: 'cancellation-api-coach@test.com',
                name: 'Cancellation API Coach',
                passwordHash: 'test',
                role: 'COACH',
            },
        });

        studentId = student.id;
        coachId = coach.id;

        studentToken = generateToken(studentId, 'STUDENT');
    });

    afterAll(async () => {
        await prisma.session.deleteMany({ where: { studentId } });
        await prisma.notification.deleteMany({ where: { userId: studentId } });
        await prisma.availabilityBlock.deleteMany({ where: { coachId } });
        await prisma.user.deleteMany({
            where: { id: { in: [studentId, coachId] } },
        });

        await prisma.$disconnect();
    });

    it('allows an authenticated student to cancel their session', async () => {
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

        const response = await request(app)
            .patch(`/sessions/${booking.id}/cancel`)
            .set('Authorization', `Bearer ${studentToken}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(booking.id);
        expect(response.body.status).toBe('CANCELLED');
    });
    it('rejects cancellation requests without authentication', async () => {
        const response = await request(app).patch(
            '/sessions/some-session-id/cancel',
        );

        expect(response.status).toBe(401);
    });
    it('rejects cancellation requests from coaches', async () => {
        const coachToken = generateToken(coachId, 'COACH');

        const response = await request(app)
            .patch('/sessions/some-session-id/cancel')
            .set('Authorization', `Bearer ${coachToken}`);

        expect(response.status).toBe(403);
    });
    it("prevents a student from cancelling another student's session", async () => {
        const otherStudent = await prisma.user.create({
            data: {
                email: 'cancellation-api-other-student@test.com',
                name: 'Other Student',
                passwordHash: 'test',
                role: 'STUDENT',
            },
        });

        try {
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

            const otherStudentToken = generateToken(otherStudent.id, 'STUDENT');

            const response = await request(app)
                .patch(`/sessions/${booking.id}/cancel`)
                .set('Authorization', `Bearer ${otherStudentToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Session not found');

            const session = await prisma.session.findUnique({
                where: { id: booking.id },
            });

            expect(session?.status).toBe('BOOKED');
        } finally {
            await prisma.user.delete({
                where: { id: otherStudent.id },
            });
        }
    });
    it('rejects cancellations less than 24 hours before the session', async () => {
        const startAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

        const block = await prisma.availabilityBlock.create({
            data: {
                coachId,
                startAt,
                endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
                status: 'BOOKED',
            },
        });

        const booking = await prisma.session.create({
            data: {
                studentId,
                availabilityBlockId: block.id,
            },
        });

        const response = await request(app)
            .patch(`/sessions/${booking.id}/cancel`)
            .set('Authorization', `Bearer ${studentToken}`);

        expect(response.status).toBe(409);
        expect(response.body.message).toBe(
            'Sessions must be cancelled at least 24 hours in advance',
        );

        const session = await prisma.session.findUnique({
            where: { id: booking.id },
        });

        expect(session?.status).toBe('BOOKED');
    });
});
