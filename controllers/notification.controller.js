import { ERROR_MESSAGES } from "../constants/messages.js";
import { STATUS } from "../constants/statusCodes.js";
import Notification from "../models/notification.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";

export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const resData = notifications.map((n) => ({
      id: n._id,
      message: n.message,
      isRead: n.isRead,
      type: n.type,
      createdAt: n.createdAt,
    }));

    return sendSuccess(res, resData);
  } catch (err) {
    next(err);
  }
};

export const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const unreadNotificationCount = await Notification.find({
      user: req.user._id,
      isRead: false,
    }).countDocuments();

    return sendSuccess(res, unreadNotificationCount);
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({ _id: id, isRead: false });
    if (!notification) {
      return sendError(
        res,
        STATUS.NOT_FOUND,
        ERROR_MESSAGES.NOTIFICATION_NOT_FOUND
      );
    }

    notification.isRead = true;
    await notification.save();

    return sendSuccess(res);
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    return sendSuccess(res);
  } catch (err) {
    next(err);
  }
};
