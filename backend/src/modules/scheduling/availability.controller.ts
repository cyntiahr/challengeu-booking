import type { RequestHandler } from 'express';

import { createAvailabilitySchema } from './availability.schema.js';
import {
    createAvailability,
    getAvailableBlocks,
} from './availability.service.js';
import { z } from 'zod';
import { availabilityQuerySchema } from './availability.query.schema.js';

export const createAvailabilityHandler: RequestHandler = async (
    req,
    res,
    next,
) => {
    try {
        const result = createAvailabilitySchema.safeParse(req.body);

        if (!result.success) {
            res.status(400).json({
                message: 'Invalid availability data',
                errors: result.error.issues,
            });
            return;
        }

        if (!req.auth) {
            res.status(401).json({
                message: 'Authentication required',
            });
            return;
        }

        const availability = await createAvailability({
            coachId: req.auth.userId,
            startAt: new Date(result.data.startAt),
            durationMinutes: result.data.durationMinutes,
        });

        res.status(201).json(availability);
    } catch (error) {
        next(error);
    }
};
export const getAvailabilityHandler: RequestHandler = async (req, res, next) => {
  try {
    const parsed = availabilityQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid availability query",
        errors: z.flattenError(parsed.error),
      });
      return;
    }

    const blocks = await getAvailableBlocks({
      coachId: parsed.data.coachId,
      startAt: new Date(parsed.data.startAt),
      endAt: new Date(parsed.data.endAt),
    });

    res.json(blocks);
  } catch (error) {
    next(error);
  }
};
