import { body } from "express-validator";
import { isValidObjectId } from "mongoose";
import { TASK_PRIORITY, TASK_STATUS } from "../constants/task.js";

export const upsertTaskValidation = [
  body("title")
    .notEmpty()
    .withMessage("Task title is required")
    .isLength({ max: 200 })
    .withMessage("Task title must be at most 200 characters"),

  body("description")
    .notEmpty()
    .withMessage("Task description is required")
    .isLength({ max: 2000 })
    .withMessage("Task description must be at most 200 characters"),

  body("priority")
    .optional()
    .isIn(Object.values(TASK_PRIORITY))
    .withMessage("Invalid task priority"),

  body("assignedTo")
    .optional()
    .custom(isValidObjectId)
    .withMessage("Invalid assigned user id"),

  body("dueDate").optional().isISO8601().withMessage("Invalid due date"),
];

export const updateTaskStatusValidation = [
  body("status")
    .notEmpty()
    .withMessage("Task status is required")
    .isIn(Object.values(TASK_STATUS))
    .withMessage("Invalid task status"),
];

export const assignTaskValidation = [
  body("assignedTo")
    .notEmpty()
    .withMessage("AssignedTo id is required")
    .custom(isValidObjectId)
    .withMessage("Invalid assignedTo id"),
];
