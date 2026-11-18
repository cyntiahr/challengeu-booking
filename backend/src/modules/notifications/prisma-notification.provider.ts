import type { Prisma } from "../../../generated/prisma/client.js";
import type { NotificationProvider } from "./notification.interface.js";

export class PrismaNotificationProvider implements NotificationProvider {
  async notify(
    tx: Prisma.TransactionClient,
    userId: string,
    message: string,
  ): Promise<void> {
    await tx.notification.create({
      data: {
        userId,
        message,
      },
    });
  }
}

export const notificationProvider: NotificationProvider =
  new PrismaNotificationProvider();