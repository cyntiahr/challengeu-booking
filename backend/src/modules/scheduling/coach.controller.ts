
import type { Request, Response } from "express";
import { prisma } from "../../infrastructure/database.js";

export async function getCoaches(
  _req: Request,
  res: Response,
) {
  const coaches = await prisma.user.findMany({
    where: {
      role: "COACH",
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  res.json(coaches);
}
