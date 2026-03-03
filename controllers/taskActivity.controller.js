import { TaskActivity, Task, Project, User } from "../models/index.js";
import { sendSuccess } from "../utils/responseHandler.js";

export const getTaskActivity = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    const taskActivities = await TaskActivity.findAll({
      where: { taskId: req.task.id },
      include: [
        { model: Task, as: "task", attributes: ["title"] },
        { model: Project, as: "project", attributes: ["name"] },
        { model: User, as: "user", attributes: ["name", "email"] },
        { model: User, as: "assignee", attributes: ["name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
      offset,
      limit,
    });

    const resData = taskActivities.map((t) => ({
      id: t.id,
      type: t.type,
      task: t.task?.title,
      project: t.project?.name,
      user: {
        name: t.user?.name,
        email: t.user?.email,
      },
      meta: {
        from: t.meta?.from,
        to: t.meta?.to,
        comment: t.meta?.comment,
        ...(t.meta?.assignee && {
          assignedTo: {
            name: t.meta.assignee?.name,
            email: t.meta.assignee?.email,
          },
        }),
      },
      createdAt: t.createdAt,
    }));

    return sendSuccess(res, resData);
  } catch (err) {
    next(err);
  }
};
