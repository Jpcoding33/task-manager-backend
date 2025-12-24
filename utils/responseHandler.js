import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants/messages.js";
import { STATUS } from "../constants/statusCodes.js";

export const sendSuccess = (
  res,
  data = null,
  status = STATUS.OK,
  message = SUCCESS_MESSAGES.SUCCESS
) => {
  const response = {
    success: true,
    message,
  };
  if (data) {
    response.data = data;
  }
  return res.status(status).json(response);
};

export const sendError = (
  res,
  status = STATUS.INTERNAL_SERVER_ERROR,
  message = ERROR_MESSAGES.SOMETHING_WENT_WRONG
) => {
  return res.status(status).json({
    success: false,
    message,
  });
};
