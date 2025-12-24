import { validationResult } from "express-validator";
import { sendError } from "../utils/responseHandler.js";
import { STATUS } from "../constants/statusCodes.js";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return sendError(res, STATUS.BAD_REQUEST, errors.array()[0].msg);
  }

  next();
};
