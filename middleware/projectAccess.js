import { ERROR_MESSAGES } from "../constants/messages.js";
import { STATUS } from "../constants/statusCodes.js";
import Project from "../models/project.js";
import { sendError } from "../utils/responseHandler.js";

export const projectAccess = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId;

    const project = await Project.findOne({ _id: projectId, isArchived: false })
      .populate("owner", "name email")
      .populate("members.user", "name email");

    if (!project)
      return sendError(res, STATUS.NOT_FOUND, ERROR_MESSAGES.PROJECT_NOT_FOUND);

    const member = project.members.find((m) => m.user._id.equals(req.user._id));
    if (!member)
      return sendError(
        res,
        STATUS.FORBIDDEN,
        ERROR_MESSAGES.NOT_PROJECT_MEMBER
      );

    req.project = project;
    req.myRole = member.role;
    next();
  } catch (err) {
    next(err);
  }
};
