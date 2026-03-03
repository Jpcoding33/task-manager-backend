import { sequelize } from "../config/database.js";
import {
  ERROR_MESSAGES,
  NOTIFICATION_MESSAGES,
  SUCCESS_MESSAGES,
} from "../constants/messages.js";
import { NOTIFICATION_TYPE } from "../constants/notification.js";
import { STATUS } from "../constants/statusCodes.js";
import { allowedFields, TASK_ACTIVITY } from "../constants/task.js";
import { Task, User, Project, ProjectMember } from "../models/index.js";
import { createNotification } from "../utils/notificationService.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";
import { logTaskActivity } from "../utils/taskActivityLogger.js";

export const createTask = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { title, description, priority, assignedTo, dueDate } = req.body;
    const { id: projectId } = req.project;
    const { id: userId } = req.user;

    const task = await Task.create(
      {
        projectId,
        title,
        description,
        priority,
        assignedTo,
        dueDate,
        createdBy: userId,
      },
      { transaction },
    );

    await logTaskActivity({
      taskId: task.id,
      projectId,
      userId,
      type: TASK_ACTIVITY.TASK_CREATED,
      transaction,
    });

    await transaction.commit();

    return sendSuccess(res, task, STATUS.OK, SUCCESS_MESSAGES.TASK_CREATED);
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

export const getAllTaskByProject = async (req, res, next) => {
  try {
    const { id: projectId } = req.project;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    const { rows: tasks, count: total } = await Task.findAndCountAll({
      where: { projectId, isArchived: false },
      attributes: ["id", "title", "status", "priority", "dueDate", "createdAt"],
      include: [
        {
          model: User,
          as: "assignee",
          attributes: ["name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit,
      distinct: true,
    });

    const resData = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignee
        ? { name: task.assignee.name, email: task.assignee.email }
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
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    const query = {
      assignedTo: req.user.id,
      isArchived: false,
    };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const { rows: tasks, count: total } = await Task.findAndCountAll({
      where: query,
      attributes: [
        "id",
        "title",
        "status",
        "priority",
        "assignedTo",
        "dueDate",
        "createdAt",
      ],
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "assignee",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["dueDate", "ASC"]],
      offset,
      limit,
      distinct: true,
    });

    const resData = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      project: {
        id: task.project?.id,
        name: task.project?.name || "Unknown Project",
      },
      assignedTo: task.assignee
        ? {
            id: task.assignee.id,
            name: task.assignee.name,
            email: task.assignee.email,
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
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignee
        ? {
            id: task.assignee.id,
            name: task.assignee.name,
            email: task.assignee.email,
          }
        : null,
      createdBy: {
        name: task.creator.name,
        email: task.creator.email,
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
  const transaction = await sequelize.transaction();
  try {
    const task = req.task;

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    await task.save({ transaction });

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: "assignee",
          attributes: ["id", "name", "email"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["name", "email"],
        },
      ],
      transaction,
    });

    await logTaskActivity({
      taskId: updatedTask.id,
      projectId: req.project.id,
      userId: req.user.id,
      type: TASK_ACTIVITY.TASK_UPDATED,
      transaction,
    });

    await transaction.commit();

    const resData = {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      priority: updatedTask.priority,
      status: updatedTask.status,
      assignedTo: updatedTask.assignee
        ? {
            id: updatedTask.assignee?.id,
            name: updatedTask.assignee?.name,
            email: updatedTask.assignee?.email,
          }
        : null,
      createdBy: {
        name: updatedTask.creator?.name,
        email: updatedTask.creator?.email,
      },
      dueDate: updatedTask.dueDate,
      createdAt: updatedTask.createdAt,
    };

    return sendSuccess(res, resData, STATUS.OK, SUCCESS_MESSAGES.TASK_UPDATED);
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { status } = req.body;
    const task = req.task;
    const oldStatus = task.status;
    const { id: userId } = req.user;

    if (!task.assignee) {
      return sendError(
        res,
        STATUS.BAD_REQUEST,
        ERROR_MESSAGES.TASK_STATUS_CANNOT_BE_UPDATED,
      );
    }

    if (req.myRole === "member" && task.assignedTo !== userId) {
      await transaction.rollback();
      return sendError(res, STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);
    }

    task.status = status;
    await task.save({ transaction });

    await logTaskActivity({
      taskId: task.id,
      projectId: req.project.id,
      userId: userId,
      type: TASK_ACTIVITY.TASK_STATUS_CHANGED,
      meta: {
        from: oldStatus,
        to: status,
      },
      transaction,
    });

    await createNotification({
      userId: task.assignee.id,
      projectId: req.project.id,
      taskId: task.id,
      message: NOTIFICATION_MESSAGES.TASK_STATUS_CHANGED(
        task.title,
        task.status,
      ),
      type: NOTIFICATION_TYPE.TASK_STATUS_CHANGED,
      transaction,
    });

    await transaction.commit();

    return sendSuccess(res);
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

export const assignTask = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { assignedTo } = req.body;
    const task = req.task;
    const { id: projectId } = req.project;

    const user = await User.findByPk(assignedTo);
    if (!user) {
      await transaction.rollback();
      return sendError(res, STATUS.BAD_REQUEST, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const isMember = await ProjectMember.findOne({
      where: { projectId, userId: assignedTo },
    });
    if (!isMember) {
      await transaction.rollback();
      return sendError(
        res,
        STATUS.BAD_REQUEST,
        ERROR_MESSAGES.NOT_PROJECT_MEMBER,
      );
    }

    task.assignedTo = assignedTo;
    await task.save({ transaction });

    await logTaskActivity({
      taskId: task.id,
      projectId: projectId,
      userId: req.user.id,
      type: TASK_ACTIVITY.TASK_ASSIGNED,
      meta: {
        assignedTo,
      },
      transaction,
    });

    await createNotification({
      userId: assignedTo,
      projectId: projectId,
      taskId: task.id,
      message: NOTIFICATION_MESSAGES.TASK_ASSIGNED(task.title),
      type: NOTIFICATION_TYPE.TASK_ASSIGNED,
      transaction,
    });

    await transaction.commit();

    return sendSuccess(res);
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

export const deleteTask = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const task = req.task;

    task.isArchived = true;
    await task.save({ transaction });

    await logTaskActivity({
      taskId: task.id,
      projectId: req.project.id,
      userId: req.user.id,
      type: TASK_ACTIVITY.TASK_DELETED,
      transaction,
    });

    await transaction.commit();

    return sendSuccess(res, null, STATUS.OK, SUCCESS_MESSAGES.TASK_DELETED);
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
