import type { RequestHandler } from "express";

import { prisma } from "../../infrastructure/database.js";
import { comparePassword } from "./password.js";
import { loginSchema } from "./auth.schema.js";
import { generateToken } from "./token.js";

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: "Invalid email or password format",
      });
      return;
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const passwordMatches = await comparePassword(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        timeZone: user.timeZone,
      },
    });
  } catch (error) {
    next(error);
  }
};