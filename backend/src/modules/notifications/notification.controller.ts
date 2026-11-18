import type { Request, Response, NextFunction } from "express";
import { getNotifications } from "./notification.service.js";

export async function getNotificationsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.auth!.userId;

    const notifications = await getNotifications(userId);

    return res.status(200).json(notifications);
  } catch (error) {
    next(error);
    return;
  }
}