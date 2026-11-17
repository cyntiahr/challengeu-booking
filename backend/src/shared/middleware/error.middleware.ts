import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  const knownErrors: Record<string, number> = {
    "Session not found": 404,
    "Session is already cancelled": 409,
    "Sessions must be cancelled at least 24 hours in advance": 409,
    "Availability is no longer available": 409,
    "Student is not active": 403,
    "Student cannot have more than 3 upcoming sessions": 409,
  };

  const status = knownErrors[error.message] ?? 500;

  res.status(status).json({
    message: status === 500 ? "Internal server error" : error.message,
  });
};