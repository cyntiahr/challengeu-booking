import { z } from "zod";

export const createBookingSchema = z.object({
  availabilityBlockId: z.string().min(1),
});