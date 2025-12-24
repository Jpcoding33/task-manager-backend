import express from "express";
import {
  forgotPassword,
  login,
  logout,
  myDetails,
  register,
  resetPassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";
import {
  forgotPasswordValidation,
  loginValidation,
  registerValidation,
  resetPasswordValidation,
} from "../validations/auth.validation.js";
import { validate } from "../middleware/validate.js";

const authRouter = express.Router();

authRouter.post("/register", registerValidation, validate, register);
authRouter.post("/login", loginValidation, validate, login);
authRouter.post(
  "/forgot-password",
  forgotPasswordValidation,
  validate,
  forgotPassword
);
authRouter.post(
  "/reset-password/:token",
  resetPasswordValidation,
  validate,
  resetPassword
);
authRouter.post("/logout", protect, logout);
authRouter.get("/my-details", protect, myDetails);

export default authRouter;
