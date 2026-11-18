import { prisma } from '../../infrastructure/database.js';
import type { EnrollmentProvider } from './enrollment.interface.js';

export class PrismaEnrollmentProvider implements EnrollmentProvider {
    async getStudentStatus(
        studentId: string,
    ): Promise<'ACTIVE' | 'SUSPENDED' | null> {
        const student = await prisma.user.findFirst({
            where: {
                id: studentId,
                role: 'STUDENT',
            },
            select: {
                status: true,
            },
        });

        return student?.status ?? null;
    }

    async registerStudent(input: {
        email: string;
        name: string;
        passwordHash: string;
        timeZone: string;
    }): Promise<{ id: string }> {
        const student = await prisma.user.create({
            data: {
                ...input,
                role: 'STUDENT',
                status: 'ACTIVE',
            },
        });

        return { id: student.id };
    }

    async updateStudentStatus(
        studentId: string,
        status: 'ACTIVE' | 'SUSPENDED',
    ): Promise<void> {
        const result = await prisma.user.updateMany({
            where: {
                id: studentId,
                role: 'STUDENT',
            },
            data: {
                status,
            },
        });

        if (result.count === 0) {
            throw new Error('Student not found');
        }
    }
}

export const enrollmentProvider: EnrollmentProvider =
    new PrismaEnrollmentProvider();
