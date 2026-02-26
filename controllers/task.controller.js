import {
  NOTIFICATION_MESSAGES,
  SUCCESS_MESSAGES,
} from "../constants/messages.js";
import { NOTIFICATION_TYPE } from "../constants/notification.js";
import { STATUS } from "../constants/statusCodes.js";
import { allowedFields, TASK_ACTIVITY } from "../constants/task.js";
import Task from "../models/task.js";
import { createNotification } from "../utils/notificationService.js";
import { sendSuccess } from "../utils/responseHandler.js";
import { logTaskActivity } from "../utils/taskActivityLogger.js";

export const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, assignedTo, dueDate } = req.body;

    const project = req.project;

    const task = await Task.create({
      project: project._id,
      title,
      description,
      priority,
      assignedTo,
      dueDate,
      createdBy: req.user._id,
    });

    await logTaskActivity({
      task: task._id,
      project: project._id,
      user: req.user._id,
      type: TASK_ACTIVITY.TASK_CREATED,
    });

    const resData = {
      id: task._id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
      createdBy: task.createdBy,
      createdAt: task.createdAt,
    };

    return sendSuccess(res, resData, STATUS.OK, SUCCESS_MESSAGES.TASK_CREATED);
  } catch (err) {
    next(err);
  }
};

export const getAllTaskByProject = async (req, res, next) => {
  try {
    const project = req.project;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      project: project._id,
      isArchived: false,
    };

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .select("title status priority assignedTo dueDate createdAt")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(query),
    ]);

    const resData = tasks.map((task) => ({
      id: task._id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo
        ? {
            id: task.assignedTo._id,
            name: task.assignedTo.name,
            email: task.assignedTo.email,
          }
        : null,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
    }));

    return sendSuccess(res, {
      tasks: resData,
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

export const getMyTasks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {
      assignedTo: req.user._id,
      isArchived: false,
      status: { $ne: "done" }, // Optional: separate done tasks or include them? Let's include all for now or filter.
      // Actually, user might want to see completed tasks too. Let's just filter archived.
    };

    // If status filter is passed
    if (req.query.status) {
      query.status = req.query.status;
    }

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .select("title status priority assignedTo dueDate createdAt project")
        .populate("project", "name") // Populate project details
        .populate("assignedTo", "name email")
        .sort({ dueDate: 1 }) // Sort by due date ascending usually better for "my tasks"
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(query),
    ]);

    const resData = tasks.map((task) => ({
      id: task._id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      project: {
        id: task.project?._id,
        name: task.project?.name || "Unknown Project",
      },
      assignedTo: task.assignedTo
        ? {
            id: task.assignedTo._id,
            name: task.assignedTo.name,
            email: task.assignedTo.email,
          }
        : null,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
    }));

    return sendSuccess(res, {
      tasks: resData,
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

export const getTaskById = async (req, res, next) => {
  try {
    const task = req.task;
    const resData = {
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo
        ? {
            id: task.assignedTo._id,
            name: task.assignedTo.name,
            email: task.assignedTo.email,
          }
        : null,
      createdBy: {
        name: task.createdBy.name,
        email: task.createdBy.email,
      },
      dueDate: task.dueDate,
      createdAt: task.createdAt,
    };

    return sendSuccess(res, resData);
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = req.task;

    allowedFields.forEach((field) => {
      if (req.body[field] != undefined) {
        task[field] = req.body[field];
      }
    });

    await task.save();

    await task.populate([
      { path: "assignedTo", select: "name email" },
      { path: "createdBy", select: "name email" },
    ]);

    await logTaskActivity({
      task: task._id,
      project: req.project._id,
      user: req.user._id,
      type: TASK_ACTIVITY.TASK_UPDATED,
    });

    const resData = {
      id: task._id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo
        ? {
            id: task.assignedTo._id,
            name: task.assignedTo.name,
            email: task.assignedTo.email,
          }
        : null,
      createdBy: {
        name: task.createdBy?.name,
        email: task.createdBy?.email,
      },
      dueDate: task.dueDate,
      createdAt: task.createdAt,
    };

    return (
      sendSuccess(res, resData),
      STATUS.OK,
      SUCCESS_MESSAGES.TASK_UPDATED
    );
  } catch (err) {
    next(err);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const task = req.task;
    const oldStatus = task.status;
    // Restrict members to only update their own tasks
    if (req.myRole === "member" && !task.assignedTo._id.equals(req.user._id)) {
      return sendError(res, STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);
    }

    task.status = status;
    await task.save();

    await logTaskActivity({
      task: task._id,
      project: req.project._id,
      user: req.user._id,
      type: TASK_ACTIVITY.TASK_STATUS_CHANGED,
      meta: {
        from: oldStatus,
        to: status,
      },
    });

    // await createNotification({
    //   user: task.assignedTo,
    //   project: req.project._id,
    //   task: task._id,
    //   message: NOTIFICATION_MESSAGES.TASK_STATUS_CHANGED(
    //     task.title,
    //     task.status,
    //   ),
    //   type: NOTIFICATION_TYPE.TASK_STATUS_CHANGED,
    // });

    return sendSuccess(res);
  } catch (err) {
    next(err);
  }
};

export const assignTask = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    const task = req.task;

    task.assignedTo = assignedTo;
    await task.save();

    await logTaskActivity({
      task: task._id,
      project: req.project._id,
      user: req.user._id,
      type: TASK_ACTIVITY.TASK_ASSIGNED,
      meta: {
        assignedTo,
      },
    });

    await createNotification({
      user: assignedTo,
      project: req.project._id,
      task: task._id,
      message: NOTIFICATION_MESSAGES.TASK_ASSIGNED(task.title),
      type: NOTIFICATION_TYPE.TASK_ASSIGNED,
    });

    return sendSuccess(res);
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = req.task;

    task.isArchived = true;
    await task.save();

    await logTaskActivity({
      task: task._id,
      project: req.project._id,
      user: req.user._id,
      type: TASK_ACTIVITY.TASK_DELETED,
    });

    return sendSuccess(res, null, STATUS.OK, SUCCESS_MESSAGES.TASK_DELETED);
  } catch (err) {
    next(err);
  }
};
