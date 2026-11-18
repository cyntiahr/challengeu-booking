import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { registerStudent, updateStudentStatus } from './enrollment.service.js';

import {
    registerStudentSchema,
    updateStudentStatusSchema,
} from './enrollment.schema.js';

export async function registerStudentController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const result = registerStudentSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json(z.flattenError(result.error));
        }

        const student = await registerStudent(result.data);

        return res.status(201).json(student);
    } catch (error) {
        next(error);
        return;
    }
}

export async function updateStudentStatusController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const result = updateStudentStatusSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json(z.flattenError(result.error));
        }

        const studentId = req.params.studentId;

        if (typeof studentId !== 'string' || !studentId) {
            return res.status(400).json({
                message: 'Invalid student ID',
            });
        }

        await updateStudentStatus(studentId, result.data.status);

        return res.status(200).json({
            message: 'Student status updated successfully',
        });
    } catch (error) {
        next(error);
        return;
    }
}
