import TaskActivity from "../models/taskActivity.js";

export const logTaskActivity = async ({
  taskId,
  projectId,
  userId,
  type,
  meta = {},
  transaction,
}) => {
  await TaskActivity.create(
    {
      taskId,
      projectId,
      userId,
      type,
      meta,
    },
    { transaction },
  );
};
