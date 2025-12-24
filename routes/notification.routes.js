import express from "express";
import {
  markAllAsRead,
  getMyNotifications,
  markAsRead,
  getUnreadNotificationCount,
} from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.js";

const notificationRouter = express.Router();

notificationRouter.get("/", protect, getMyNotifications);
notificationRouter.get("/unread-count", protect, getUnreadNotificationCount);
notificationRouter.patch("/:id/read", protect, markAsRead);
notificationRouter.patch("/read-all", protect, markAllAsRead);

export default notificationRouter;
