import jsonwebtoken from "jsonwebtoken";
import User from "../models/user.js";
import { JWT_SECRET } from "../config/envConfig.js";
import { sendError } from "../utils/responseHandler.js";
import { STATUS } from "../constants/statusCodes.js";
import { ERROR_MESSAGES } from "../constants/messages.js";

export const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token)
    return sendError(res, STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);

  try {
    const decodedToken = jsonwebtoken.decode(token, JWT_SECRET);
    const user = await User.findById(decodedToken.id).select("-password");
    if (!user)
      return sendError(res, STATUS.UNAUTHORIZED, ERROR_MESSAGES.USER_NOT_FOUND);

    req.user = user;
    next();
  } catch (err) {
    return sendError(res, STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(res, STATUS.FORBIDDEN, ERROR_MESSAGES.FORBIDDEN);
    }
    next();
  };
};
