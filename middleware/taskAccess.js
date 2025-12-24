import { ERROR_MESSAGES } from "../constants/messages.js";
import { STATUS } from "../constants/statusCodes.js";
import Task from "../models/task.js";
import { sendError } from "../utils/responseHandler.js";

export const taskAccess = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOne({
      _id: taskId,
      project: req.project._id,
      isArchived: false,
    })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!task) {
      return sendError(res, STATUS.NOT_FOUND, ERROR_MESSAGES.TASK_NOT_FOUND);
    }

    req.task = task;
    next();
  } catch (err) {
    next(err);
  }
};
