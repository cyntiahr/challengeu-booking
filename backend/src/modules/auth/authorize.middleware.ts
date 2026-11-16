import type { RequestHandler } from "express";
import type { UserRole } from "./token.js";

export function authorize(...allowedRoles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    if (!req.auth) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    if (!allowedRoles.includes(req.auth.role)) {
      res.status(403).json({
        message: "You don't have permission to access this resource",
      });
      return;
    }

    next();
  };
}