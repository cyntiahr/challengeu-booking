import { Router } from 'express';

import {
    registerStudentController,
    updateStudentStatusController,
} from './enrollment.controller.js';

import { authenticate } from '../auth/auth.middleware.js';
import { authorize } from '../auth/authorize.middleware.js';

const router = Router();

router.post(
    '/students',
    authenticate,
    authorize('ADMIN'),
    registerStudentController,
);

router.patch(
    '/students/:studentId/status',
    authenticate,
    authorize('ADMIN'),
    updateStudentStatusController,
);

export default router;
