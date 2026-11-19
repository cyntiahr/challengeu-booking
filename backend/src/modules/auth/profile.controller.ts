import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../infrastructure/database.js";

export async function getProfile(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: {
        id: true,
        name: true,
        role: true,
        timeZone: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    next(error);
    return;
  }
}