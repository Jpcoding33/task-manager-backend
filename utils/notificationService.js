import Notification from "../models/notification.js";
import { getIO } from "./socket.js";

export const createNotification = async ({
  user,
  project,
  task,
  message,
  type,
}) => {
  const notification = await Notification.create({
    user,
    project,
    task,
    message,
    type,
  });

  try {
    const io = getIO();
    io.to(user.toString()).emit("new-notification", {
      id: notification._id,
      message: notification.message,
      type: notification.type,
      project: notification.project,
      task: notification.task,
      createdAt: notification.createdAt,
    });
  } catch (err) {
    console.error("Socket error in notification service:", err.message);
  }
};
