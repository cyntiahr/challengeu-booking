import type { RequestHandler } from "express";
import { verifyToken } from "./token.js";

export const authenticate: RequestHandler = (req, res, next) => {
  const authorization = req.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const token = authorization.slice(7);
  const payload = verifyToken(token);

  if (!payload || !payload.sub) {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }

  req.auth = {
    userId: payload.sub,
    role: payload.role,
  };

  next();
};