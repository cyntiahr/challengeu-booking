import type { RequestHandler } from "express";
import { createBooking } from "./booking.service.js";
import { createBookingSchema  } from "./booking.schema.js";
import { z } from "zod";

export const createBookingHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const result = createBookingSchema .safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: "Invalid booking data",
        errors: z.flattenError(result.error),
      });
      return;
    }

    const booking = await createBooking({
      studentId: req.auth.userId,
      availabilityBlockId: result.data.availabilityBlockId,
    });

    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};