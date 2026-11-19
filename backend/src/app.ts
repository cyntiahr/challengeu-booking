import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes.js';
import availabilityRoutes from './modules/scheduling/availability.routes.js';
import sessionRoutes from './modules/scheduling/session.routes.js';
import { errorHandler } from './shared/middleware/error.middleware.js';
import enrollmentRoutes from './modules/enrollment/enrollment.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import { authenticate } from './modules/auth/auth.middleware.js';
import { getCoaches } from './modules/scheduling/coach.controller.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

app.use('/availability', availabilityRoutes);

app.use('/sessions', sessionRoutes);
app.get('/coaches', authenticate, getCoaches);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

app.use('/enrollment', enrollmentRoutes);

app.use('/notifications', notificationRoutes);

app.use(errorHandler);

export default app;
