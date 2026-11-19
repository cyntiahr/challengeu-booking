import { Router } from "express";
import { login } from "./auth.controller.js";
import { authenticate } from './auth.middleware.js';
import { getProfile } from './profile.controller.js';

const router = Router();

router.post("/login", login);
router.get("/me", authenticate, getProfile);

export default router;