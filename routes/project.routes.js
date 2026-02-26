import express from "express";
import {
  getProjectById,
  createProject,
  getMyProjects,
  archiveProject,
  addProjectMembers,
  removeMember,
  getDashboardStats,
  getProjectStats,
} from "../controllers/project.controller.js";
import { protect } from "../middleware/auth.js";
import {
  addProjectMembersValidation,
  createProjectValidation,
} from "../validations/project.validation.js";
import { validate } from "../middleware/validate.js";
import { projectAccess } from "../middleware/projectAccess.js";
import { projectRole } from "../middleware/projectRole.js";
import taskRouter from "./task.routes.js";

const projectRouter = express.Router();

projectRouter.post(
  "/",
  protect,
  createProjectValidation,
  validate,
  createProject,
);
projectRouter.get("/stats", protect, getDashboardStats);
projectRouter.get("/", protect, getMyProjects);
projectRouter.get("/:id/stats", protect, projectAccess, getProjectStats);
projectRouter.get("/:id", protect, projectAccess, getProjectById);
projectRouter.patch(
  "/:id/archive",
  protect,
  projectAccess,
  projectRole("owner"),
  archiveProject,
);
projectRouter.post(
  "/:id/members",
  protect,
  projectAccess,
  projectRole("owner", "admin"),
  addProjectMembersValidation,
  validate,
  addProjectMembers,
);
projectRouter.delete(
  "/:id/members/:userId",
  protect,
  projectAccess,
  projectRole("owner", "admin"),
  removeMember,
);
projectRouter.use("/:projectId/tasks", protect, projectAccess, taskRouter);

export default projectRouter;
