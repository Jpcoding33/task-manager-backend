import TaskActivity from "../models/taskActivity.js";
import { sendSuccess } from "../utils/responseHandler.js";

export const getTaskActivity = async (req, res, next) => {
  try {
    const taskActivities = await TaskActivity.find({
      task: req.task._id,
    })
      .populate("user", "name email")
      .populate("meta.assignedTo", "name email");
    console.log(taskActivities);
    const resData = taskActivities.map((t) => ({
      id: t._id,
      type: t.type,
      user: {
        name: t.user.name,
        email: t.user.email,
      },
      meta: {
        from: t.meta.from,
        to: t.meta.to,
        comment: t.meta.comment,
        ...(t.meta.assignedTo && {
          assignedTo: {
            name: t.meta.assignedTo?.name,
            email: t.meta.assignedTo?.email,
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
