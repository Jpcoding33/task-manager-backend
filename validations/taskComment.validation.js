import { body } from "express-validator";

export const addTaskCommentValidation = [
  body("content")
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ max: 200 })
    .withMessage("Content must be at most 200 characters"),
];
