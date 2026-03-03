import { sequelize } from "../config/database.js";
import {
  ERROR_MESSAGES,
  NOTIFICATION_MESSAGES,
  SUCCESS_MESSAGES,
} from "../constants/messages.js";
import { NOTIFICATION_TYPE } from "../constants/notification.js";
import { STATUS } from "../constants/statusCodes.js";
import { TASK_ACTIVITY } from "../constants/task.js";
import { User, TaskComment } from "../models/index.js";
import { createNotification } from "../utils/notificationService.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";
import { logTaskActivity } from "../utils/taskActivityLogger.js";

export const getTaskComments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const { count: total, rows: taskComments } =
      await TaskComment.findAndCountAll({
        where: { taskId: req.task.id, isDeleted: false },
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

    return sendSuccess(res, {
      comments: taskComments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const addTaskComment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { content } = req.body;

    const comment = await TaskComment.create(
      {
        taskId: req.task.id,
        projectId: req.project.id,
        content,
        authorId: req.user.id,
      },
      { transaction },
    );

    await logTaskActivity({
      taskId: req.task.id,
      projectId: req.project.id,
      userId: req.user.id,
      type: TASK_ACTIVITY.TASK_COMMENT_ADDED,
      meta: {
        comment: comment.content,
      },
      transaction,
    });

    if (req.task.assignedTo && req.task.assignedTo !== req.user.id) {
      await createNotification({
        userId: req.task.assignedTo,
        projectId: req.project.id,
        taskId: req.task.id,
        message: NOTIFICATION_MESSAGES.TASK_COMMENTED(req.task.title),
        type: NOTIFICATION_TYPE.TASK_COMMENTED,
        transaction,
      });
    }

    await transaction.commit();

    const resData = {
      id: comment.id,
      content: comment.content,
      author: comment.authorId,
      createdAt: comment.createdAt,
    };

    return sendSuccess(
      res,
      resData,
      STATUS.OK,
      SUCCESS_MESSAGES.TASK_COMMENT_ADDED,
    );
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

export const deleteTaskComment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { commentId } = req.params;

    const comment = await TaskComment.findOne({
      where: { id: commentId, taskId: req.task.id, isDeleted: false },
    });

    if (!comment) {
      await transaction.rollback();
      return sendError(
        res,
        STATUS.NOT_FOUND,
        ERROR_MESSAGES.TASK_COMMENT_NOT_FOUND,
      );
    }

    if (
      comment.authorId !== req.user.id &&
      req.myRole !== "owner" &&
      req.myRole !== "admin"
    ) {
      await transaction.rollback();
      return sendError(res, STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);
    }

    comment.isDeleted = true;
    await comment.save({ transaction });

    await logTaskActivity({
      taskId: req.task.id,
      projectId: req.project.id,
      userId: req.user.id,
      type: TASK_ACTIVITY.TASK_COMMENT_DELETED,
      transaction,
    });

    await transaction.commit();

    return sendSuccess(
      res,
      null,
      STATUS.OK,
      SUCCESS_MESSAGES.TASK_COMMENT_DELETED,
    );
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
