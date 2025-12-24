import { body } from "express-validator";

export const updateProfileValidation = [
  body("name").optional().trim().notEmpty().withMessage("Name is required"),

  body("email").optional().trim().isEmail().withMessage("Invalid email"),
];

export const updatePasswordValidation = [
  body("oldPassword").notEmpty().withMessage("Old password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];
