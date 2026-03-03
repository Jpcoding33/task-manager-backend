import Notification from "../models/notification.js";
import { getIO } from "./socket.js";

export const createNotification = async ({
  userId,
  projectId,
  taskId,
  message,
  type,
  transaction,
}) => {
  const notification = await Notification.create(
    {
      userId,
      projectId,
      taskId,
      message,
      type,
    },
    { transaction },
  );

  if (transaction) {
    transaction.afterCommit(() => {
      try {
        const io = getIO();
        io.to(userId.toString()).emit("new-notification", {
          id: notification.id,
          message: notification.message,
          type: notification.type,
          project: notification.projectId,
          task: notification.taskId,
          createdAt: notification.createdAt,
        });
      } catch (err) {
        console.error("Socket error in notification service:", err.message);
      }
    });
  }

  return notification;
};
