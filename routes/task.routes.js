import express from "express";
import {
  assignTaskValidation,
  updateTaskStatusValidation,
  upsertTaskValidation,
} from "../validations/task.validation.js";
import { validate } from "../middleware/validate.js";
import {
  assignTask,
  createTask,
  deleteTask,
  getAllTaskByProject,
  getMyTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
} from "../controllers/task.controller.js";
import { projectRole } from "../middleware/projectRole.js";
import { taskAccess } from "../middleware/taskAccess.js";
import taskCommentRouter from "./taskComment.routes.js";
import taskActivityRouter from "./taskActivity.routes.js";
import { protect } from "../middleware/auth.js";

const taskRouter = express.Router({ mergeParams: true });

taskRouter.post(
  "/",
  projectRole("owner", "admin"),
  upsertTaskValidation,
  validate,
  createTask,
);
taskRouter.get("/my-tasks", protect, getMyTasks);
taskRouter.get("/", getAllTaskByProject);
taskRouter.get("/:taskId", taskAccess, getTaskById);
taskRouter.put(
  "/:taskId",
  projectRole("owner", "admin"),
  taskAccess,
  upsertTaskValidation,
  validate,
  updateTask,
);
taskRouter.patch(
  "/:taskId/status",
  projectRole("owner", "admin", "member"),
  taskAccess,
  updateTaskStatusValidation,
  validate,
  updateTaskStatus,
);
taskRouter.patch(
  "/:taskId/assign",
  projectRole("owner", "admin", "member"),
  taskAccess,
  assignTaskValidation,
  validate,
  assignTask,
);
taskRouter.delete(
  "/:taskId",
  projectRole("owner", "admin"),
  taskAccess,
  deleteTask,
);
taskRouter.use(
  "/:taskId/comments",
  projectRole("owner", "admin", "member"),
  taskAccess,
  taskCommentRouter,
);
taskRouter.use(
  "/:taskId/task-activity",
  projectRole("owner", "admin", "member"),
  taskAccess,
  taskActivityRouter,
);

export default taskRouter;
