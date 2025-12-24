import TaskActivity from "../models/taskActivity.js";

export const logTaskActivity = async ({
  task,
  project,
  user,
  type,
  meta = {},
}) => {
  await TaskActivity.create({
    task,
    project,
    user,
    type,
    meta,
  });
};
