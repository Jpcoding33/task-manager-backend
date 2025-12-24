import {
  ERROR_MESSAGES,
  NOTIFICATION_MESSAGES,
  SUCCESS_MESSAGES,
} from "../constants/messages.js";
import { NOTIFICATION_TYPE } from "../constants/notification.js";
import { STATUS } from "../constants/statusCodes.js";
import { TASK_ACTIVITY } from "../constants/task.js";
import TaskComment from "../models/taskComment.js";
import { createNotification } from "../utils/notificationService.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";
import { logTaskActivity } from "../utils/taskActivityLogger.js";

export const getTaskComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    console.log(req.params);
    const taskComments = await TaskComment.find({
      task: taskId,
      isDeleted: false,
    }).populate("author", "name email");

    const resData = taskComments.map((c) => ({
      id: c._id,
      content: c.content,
      author: {
        name: c.author.name,
        email: c.author.email,
      },
      createdAt: c.createdAt,
    }));

    return sendSuccess(res, resData);
  } catch (err) {
    next(err);
  }
};

export const addTaskComment = async (req, res, next) => {
  try {
    const { content } = req.body;

    const comment = await TaskComment.create({
      task: req.task._id,
      project: req.project._id,
      content,
      author: req.user._id,
    });
    const resData = {
      id: comment._id,
      content: comment.content,
      author: comment.author,
      createdAt: comment.createdAt,
    };

    await logTaskActivity({
      task: req.task._id,
      project: req.project._id,
      user: req.user._id,
      type: TASK_ACTIVITY.TASK_COMMENT_ADDED,
      meta: {
        comment: req.task.status,
      },
    });

    if (!req.task.assignedTo.equals(req.user._id)) {
      await createNotification({
        user: req.task.assignedTo,
        project: req.project._id,
        task: req.task._id,
        message: NOTIFICATION_MESSAGES.TASK_COMMENTED(req.task.title),
        type: NOTIFICATION_TYPE.TASK_COMMENTED,
      });
    }

    return sendSuccess(
      res,
      resData,
      STATUS.OK,
      SUCCESS_MESSAGES.TASK_COMMENT_ADDED
    );
  } catch (err) {
    next(err);
  }
};

export const deleteTaskComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await TaskComment.findOne({
      _id: commentId,
      isDeleted: false,
    });

    if (!comment) {
      return sendError(
        res,
        STATUS.NOT_FOUND,
        ERROR_MESSAGES.TASK_COMMENT_NOT_FOUND
      );
    }

    comment.isDeleted = true;
    await comment.save();

    await logTaskActivity({
      task: req.task._id,
      project: req.project._id,
      user: req.user._id,
      type: TASK_ACTIVITY.TASK_COMMENT_DELETED,
    });

    return sendSuccess(
      res,
      null,
      STATUS.OK,
      SUCCESS_MESSAGES.TASK_COMMENT_DELETED
    );
  } catch (err) {
    next(err);
  }
};
