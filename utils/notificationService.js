import Notification from "../models/notification.js";

export const createNotification = async ({
  user,
  project,
  task,
  message,
  type,
}) => {
  await Notification.create({
    user,
    project,
    task,
    message,
    type,
  });
};
