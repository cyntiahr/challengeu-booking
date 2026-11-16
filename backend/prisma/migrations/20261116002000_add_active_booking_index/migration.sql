-- Prevent multiple active bookings for the same availability block.
-- Cancelled sessions are excluded so the slot can be booked again.

CREATE UNIQUE INDEX "unique_active_booking"
ON "Session"("availabilityBlockId")
WHERE "status" = 'BOOKED';