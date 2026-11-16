import { z } from "zod";

export const createAvailabilitySchema = z.object({
  startAt: z.iso.datetime(),
  durationMinutes: z.union([
    z.literal(30),
    z.literal(60),
  ]),
});