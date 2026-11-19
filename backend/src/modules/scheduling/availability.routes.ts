import { Router } from 'express';

import { authenticate } from '../auth/auth.middleware.js';
import { authorize } from '../auth/authorize.middleware.js';
import {
    createAvailabilityHandler,
    getAvailabilityHandler,
} from './availability.controller.js';
import { getCoaches } from './coach.controller.js';

const router = Router();

router.post('/', authenticate, authorize('COACH'), createAvailabilityHandler);

router.get('/', authenticate, getAvailabilityHandler);

export default router;
