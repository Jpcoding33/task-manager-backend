import express from "express";
import {
  updatePassword,
  updateProfile,
  getAllUsers,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.js";
import {
  updatePasswordValidation,
  updateProfileValidation,
} from "../validations/user.validation.js";
import { validate } from "../middleware/validate.js";

const userRouter = express.Router();

userRouter.get("/", protect, getAllUsers);

userRouter.put(
  "/update-profile",
  protect,
  updateProfileValidation,
  validate,
  updateProfile
);
userRouter.put(
  "/update-password",
  protect,
  updatePasswordValidation,
  validate,
  updatePassword
);

export default userRouter;
