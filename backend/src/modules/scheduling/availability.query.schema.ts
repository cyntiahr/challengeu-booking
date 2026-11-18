import { z } from "zod";

export const availabilityQuerySchema = z.object({
  coachId: z.string().min(1),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
}).refine(
  (data) => new Date(data.startAt) < new Date(data.endAt),
  {
    message: "End date must be after start date",
    path: ["endAt"],
  },
);