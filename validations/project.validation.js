import { body } from "express-validator";
import { isValidObjectId } from "mongoose";

export const createProjectValidation = [
  body("name").trim().notEmpty().withMessage("Project name is required"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Project description is required"),
];

export const addProjectMembersValidation = [
  body("members")
    .isArray({ min: 1 })
    .withMessage("Members must contain at least one member "),

  body("members.*.userId")
    .notEmpty()
    .withMessage("One or more member userIds are missing")
    .custom(isValidObjectId)
    .withMessage("One or more member userIds are invalid"),

  body("members.*.role")
    .optional()
    .isIn(["member", "admin"])
    .withMessage("One or more member roles are invalid"),
];
