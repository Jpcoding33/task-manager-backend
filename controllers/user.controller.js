import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants/messages.js";
import { STATUS } from "../constants/statusCodes.js";
import User from "../models/user.js";
import { sendError, sendSuccess } from "../utils/responseHandler.js";

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.user._id);
    if (!user)
      return sendError(res, STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    return sendSuccess(
      res,
      {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      STATUS.OK,
      SUCCESS_MESSAGES.USER_UPDATED
    );
  } catch (err) {
    next(err);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { newPassword, oldPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user)
      return sendError(res, STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch)
      return sendError(
        res,
        STATUS.BAD_REQUEST,
        ERROR_MESSAGES.INVALID_OLD_PASSWORD
      );

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, null, STATUS.OK, SUCCESS_MESSAGES.PASSWORD_UPDATED);
  } catch (err) {
    next(err);
  }
};
