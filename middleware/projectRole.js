import { ERROR_MESSAGES } from "../constants/messages.js";
import { STATUS } from "../constants/statusCodes.js";
import { sendError } from "../utils/responseHandler.js";

export const projectRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.myRole)) {
      return sendError(
        res,
        STATUS.FORBIDDEN,
        ERROR_MESSAGES.INSUFFICIENT_PROJECT_ROLE
      );
    }

    next();
  };
};
