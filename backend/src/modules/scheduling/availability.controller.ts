import type { RequestHandler } from "express";

import { createAvailabilitySchema } from "./availability.schema.js";
import { createAvailability } from "./availability.service.js";

export const createAvailabilityHandler: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const result = createAvailabilitySchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: "Invalid availability data",
        errors: result.error.issues,
      });
      return;
    }

    if (!req.auth) {
      res.status(401).json({
        message: "Authentication required",
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