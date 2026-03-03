import { User } from "../models/index.js";
import jsonwebtoken from "jsonwebtoken";
import { sendError, sendSuccess } from "../utils/responseHandler.js";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants/messages.js";
import { STATUS } from "../constants/statusCodes.js";
import crypto from "crypto";
import { Op } from "sequelize";

function signToken(id) {
  return jsonwebtoken.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const lowerEmail = email.toLowerCase();

    let existingUser = await User.findOne({
      where: { email: lowerEmail },
    });
    if (existingUser)
      return sendError(
        res,
        STATUS.BAD_REQUEST,
        ERROR_MESSAGES.EMAIL_REGISTERED,
      );

    const user = await User.create({ name, email: lowerEmail, password });
    const token = signToken(user.id);
    return sendSuccess(
      res,
      {
        token,
        name: user.name,
        role: user.role,
        email: user.email,
      },
      STATUS.OK,
      SUCCESS_MESSAGES.USER_REGISTERED,
    );
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const lowerEmail = email.toLowerCase();

    let user = await User.findOne({ where: { email: lowerEmail } });
    if (!user)
      return sendError(
        res,
        STATUS.BAD_REQUEST,
        ERROR_MESSAGES.INVALID_CREDENTIALS,
      );

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return sendError(
        res,
        STATUS.BAD_REQUEST,
        ERROR_MESSAGES.INVALID_CREDENTIALS,
      );

    const token = signToken(user.id);
    return sendSuccess(
      res,
      {
        token,
        name: user.name,
        role: user.role,
        email: user.email,
      },
      STATUS.OK,
      SUCCESS_MESSAGES.LOGIN_SUCCESS,
    );
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    return sendSuccess(res, null, STATUS.OK, SUCCESS_MESSAGES.LOGOUT_SUCCESS);
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const email = req.body.email.toLowerCase();
    const user = await User.findOne({
      where: { email },
      attributes: { exclude: ["password"] },
    });

    if (!user)
      return sendSuccess(
        res,
        null,
        STATUS.OK,
        ERROR_MESSAGES.RESET_PASSWORD_EMAIL_SENT,
      );

    const resetToken = await user.createResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get(
      "host",
    )}/api/auth/reset-password/${resetToken}`;

    return sendSuccess(
      res,
      null,
      STATUS.OK,
      SUCCESS_MESSAGES.RESET_PASSWORD_EMAIL_SENT,
    );
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashToken,
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user)
      return sendError(
        res,
        STATUS.BAD_REQUEST,
        ERROR_MESSAGES.INVALID_RESET_PASSWORD_TOKEN,
      );

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return sendSuccess(
      res,
      null,
      STATUS.OK,
      SUCCESS_MESSAGES.RESET_PASSWORD_SUCCESS,
    );
  } catch (err) {
    next(err);
  }
};

export const myDetails = async (req, res, next) => {
  try {
    const { name, role, email } = req.user;
    return sendSuccess(res, { name, role, email }, STATUS.OK);
  } catch (err) {
    next(err);
  }
};
