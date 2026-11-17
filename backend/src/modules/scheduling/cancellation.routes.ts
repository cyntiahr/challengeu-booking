import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { authorize } from "../auth/authorize.middleware.js";
import { cancelBookingHandler } from "./cancellation.controller.js";

const router = Router();

router.patch(
  "/:sessionId/cancel",
  authenticate,
  authorize("STUDENT"),
  cancelBookingHandler,
);

export default router;