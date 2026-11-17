import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../infrastructure/database.js';
import { generateToken } from '../auth/token.js';

describe('POST /sessions', () => {
    let studentId: string;
    let coachId: string;
    let studentToken: string;

    beforeAll(async () => {
        const student = await prisma.user.create({
            data: {
                email: 'booking-api-student@test.com',
                name: 'Booking API Student',
                passwordHash: 'test',
                role: 'STUDENT',
            },
        });

        const coach = await prisma.user.create({
            data: {
                email: 'booking-api-coach@test.com',
                name: 'Booking API Coach',
                passwordHash: 'test',
                role: 'COACH',
            },
        });

        studentId = student.id;
        coachId = coach.id;
        studentToken = generateToken(studentId, 'STUDENT');
    });

    beforeEach(async () => {
        await prisma.session.deleteMany({
            where: { studentId },
        });

        await prisma.notification.deleteMany({
            where: { userId: studentId },
        });

        await prisma.availabilityBlock.deleteMany({
            where: { coachId },
        });
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

    it('allows an authenticated student to book an available session', async () => {
        const startAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

        const block = await prisma.availabilityBlock.create({
            data: {
                coachId,
                startAt,
                endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
            },
        });

        const response = await request(app)
            .post('/sessions')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ availabilityBlockId: block.id });

        expect(response.status).toBe(201);
        expect(response.body.studentId).toBe(studentId);
        expect(response.body.availabilityBlockId).toBe(block.id);
        expect(response.body.status).toBe('BOOKED');
    });
    it('rejects booking requests with invalid data', async () => {
        const response = await request(app)
            .post('/sessions')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid booking data');
        expect(
            response.body.errors.fieldErrors.availabilityBlockId,
        ).toBeDefined();
    });
    it('rejects booking requests without authentication', async () => {
        const response = await request(app)
            .post('/sessions')
            .send({ availabilityBlockId: 'some-block-id' });

        expect(response.status).toBe(401);
    });
    it('rejects booking requests from coaches', async () => {
        const coachToken = generateToken(coachId, 'COACH');

        const response = await request(app)
            .post('/sessions')
            .set('Authorization', `Bearer ${coachToken}`)
            .send({ availabilityBlockId: 'some-block-id' });

        expect(response.status).toBe(403);
    });
    it('rejects booking an already-booked availability block', async () => {
        const startAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

        const block = await prisma.availabilityBlock.create({
            data: {
                coachId,
                startAt,
                endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
            },
        });

        // First booking succeeds
        const firstResponse = await request(app)
            .post('/sessions')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ availabilityBlockId: block.id });

        expect(firstResponse.status).toBe(201);

        // Attempt to book the same block again
        const secondResponse = await request(app)
            .post('/sessions')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ availabilityBlockId: block.id });

        expect(secondResponse.status).toBe(409);
        expect(secondResponse.body.message).toBe(
            'Availability is no longer available',
        );
    });
    it('rejects bookings when a student already has 3 upcoming sessions', async () => {
        const startAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

        for (let i = 0; i < 4; i++) {
            const blockStart = new Date(startAt.getTime() + i * 60 * 60 * 1000);

            const block = await prisma.availabilityBlock.create({
                data: {
                    coachId,
                    startAt: blockStart,
                    endAt: new Date(blockStart.getTime() + 60 * 60 * 1000),
                },
            });

            const response = await request(app)
                .post('/sessions')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ availabilityBlockId: block.id });

            if (i < 3) {
                expect(response.status).toBe(201);
            } else {
                expect(response.status).toBe(409);
                expect(response.body.message).toBe(
                    'Student cannot have more than 3 upcoming sessions',
                );

                const unchangedBlock =
                    await prisma.availabilityBlock.findUnique({
                        where: { id: block.id },
                    });

                expect(unchangedBlock?.status).toBe('OPEN');
            }
        }
    });
});
