import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes.js';
import availabilityRoutes from './modules/scheduling/availability.routes.js';
import cancellationRoutes from './modules/scheduling/cancellation.routes.js';
import { errorHandler } from './shared/middleware/error.middleware.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

app.use('/availability', availabilityRoutes);

app.use('/sessions', cancellationRoutes);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

app.use(errorHandler);

export default app;
