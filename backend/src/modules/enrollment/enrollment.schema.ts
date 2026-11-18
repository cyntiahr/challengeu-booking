import { z } from "zod";

export const registerStudentSchema = z.object({
  email: z.email(),
  name: z.string().trim().min(1),
  password: z.string().min(8),
  timeZone: z.string().min(1),
});

export const updateStudentStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});