import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { authorize } from "../auth/authorize.middleware.js";
import { getNotificationsController } from "./notification.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("STUDENT"),
  getNotificationsController,
);

export default router;