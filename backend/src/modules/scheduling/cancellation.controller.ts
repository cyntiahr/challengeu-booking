import type { RequestHandler } from "express";
import { cancelBooking } from "./cancellation.service.js";

export const cancelBookingHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const sessionId = req.params.sessionId;

    if (typeof sessionId !== "string" || !sessionId) {
      res.status(400).json({ message: "Session ID is required" });
      return;
    }

    const cancelledSession = await cancelBooking({
      studentId: req.auth.userId,
      sessionId,
    });

    res.json(cancelledSession);
  } catch (error) {
    next(error);
  }
};