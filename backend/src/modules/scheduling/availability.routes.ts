import { Router } from "express";

import { authenticate } from "../auth/auth.middleware.js";
import { authorize } from "../auth/authorize.middleware.js";
import { createAvailabilityHandler } from "./availability.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("COACH"),
  createAvailabilityHandler
);

export default router;