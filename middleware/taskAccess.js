import { ERROR_MESSAGES } from "../constants/messages.js";
import { STATUS } from "../constants/statusCodes.js";
import { Task, User } from "../models/index.js";
import { sendError } from "../utils/responseHandler.js";

export const taskAccess = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOne({
      where: {
        id: taskId,
        projectId: req.project.id,
        isArchived: false,
      },
      include: [
        { model: User, as: "assignee", attributes: ["id", "name", "email"] },
        { model: User, as: "creator", attributes: ["id", "name", "email"] },
      ],
    });

    if (!task) {
      return sendError(res, STATUS.NOT_FOUND, ERROR_MESSAGES.TASK_NOT_FOUND);
    }

    req.task = task;
    next();
  } catch (err) {
    next(err);
  }
};
