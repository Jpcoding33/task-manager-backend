import express from "express";
import {
  deleteTaskComment,
  addTaskComment,
  getTaskComments,
} from "../controllers/taskComment.controller.js";
import { addTaskCommentValidation } from "../validations/taskComment.validation.js";
import { validate } from "../middleware/validate.js";

const taskCommentRouter = express.Router({ mergeParams: true });

taskCommentRouter.get("/", getTaskComments);
taskCommentRouter.post("/", addTaskCommentValidation, validate, addTaskComment);
taskCommentRouter.delete("/:commentId", deleteTaskComment);

export default taskCommentRouter;
