import { ERROR_MESSAGES } from "../constants/messages.js";
import { STATUS } from "../constants/statusCodes.js";
import { Notification } from "../models/index.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";

export const getMyNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const notifications = await Notification.findAll({
      where: {
        userId: req.user.id,
      },
      attributes: ["id", "message", "isRead", "type", "createdAt"],
      order: [["createdAt", "DESC"]],
      offset,
      limit,
    });

    return sendSuccess(res, notifications);
  } catch (err) {
    next(err);
  }
};

export const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const unreadNotificationCount = await Notification.count({
      where: {
        userId: req.user.id,
        isRead: false,
      },
    });

    return sendSuccess(res, unreadNotificationCount);
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [updatedRows] = await Notification.update(
      { isRead: true },
      { where: { id, userId: req.user.id, isRead: false } },
    );

    if (!updatedRows) {
      return sendError(
        res,
        STATUS.NOT_FOUND,
        ERROR_MESSAGES.NOTIFICATION_NOT_FOUND,
      );
    }

    return sendSuccess(res);
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } },
    );

    return sendSuccess(res);
  } catch (err) {
    next(err);
  }
};
