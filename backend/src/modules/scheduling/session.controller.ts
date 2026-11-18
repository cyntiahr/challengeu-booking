import type { RequestHandler } from "express";
import { getUpcomingSessions } from "./session.service.js";

export const getUpcomingSessionsHandler: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    if (!req.auth) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const sessions = await getUpcomingSessions(req.auth.userId);

    res.json(sessions);
  } catch (error) {
    next(error);
  }
};