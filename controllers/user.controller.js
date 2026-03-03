import { Op } from "sequelize";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants/messages.js";
import { STATUS } from "../constants/statusCodes.js";
import User from "../models/user.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = req.user;

    if (name) user.name = name;

    if (email && email !== user.email) {
      const lowerEmail = email.toLowerCase();

      if (lowerEmail !== user.email) {
        const existing = await User.findOne({
          where: { email: lowerEmail },
        });
        if (existing)
          return sendError(
            res,
            STATUS.BAD_REQUEST,
            ERROR_MESSAGES.EMAIL_REGISTERED,
          );
        user.email = lowerEmail;
      }
    }

    await user.save();

    return sendSuccess(
      res,
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      STATUS.OK,
      SUCCESS_MESSAGES.USER_UPDATED,
    );
  } catch (err) {
    next(err);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { newPassword, oldPassword } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user)
      return sendError(res, STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch)
      return sendError(
        res,
        STATUS.BAD_REQUEST,
        ERROR_MESSAGES.INVALID_OLD_PASSWORD,
      );

    const isSame = await user.comparePassword(newPassword);
    if (isSame)
      return sendError(res, STATUS.BAD_REQUEST, ERROR_MESSAGES.SAME_PASSWORD);

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, null, STATUS.OK, SUCCESS_MESSAGES.PASSWORD_UPDATED);
  } catch (err) {
    next(err);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: {
        isDeleted: false,
        role: { [Op.in]: ["member", "manager"] },
      },
      attributes: ["id", "name", "email"],
    });

    return sendSuccess(res, users, STATUS.OK);
  } catch (err) {
    next(err);
  }
};
