import { ERROR_MESSAGES } from "../constants/messages.js";
import { STATUS } from "../constants/statusCodes.js";
import { sendError } from "../utils/responseHandler.js";

export const errorHandler = async (err, req, res, next) => {
  const statusCode = err.statusCode || STATUS.SERVER_ERROR;
  return sendError(
    res,
    statusCode,
    err.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
  );
};
