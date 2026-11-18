import type { Prisma } from "../../../generated/prisma/client.js";

export interface NotificationProvider {
  notify(
    tx: Prisma.TransactionClient,
    userId: string,
    message: string,
  ): Promise<void>;
}