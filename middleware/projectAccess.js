import { ERROR_MESSAGES } from "../constants/messages.js";
import { STATUS } from "../constants/statusCodes.js";
import { Project, User } from "../models/index.js";
import { sendError } from "../utils/responseHandler.js";

export const projectAccess = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId;

    const project = await Project.findOne({
      where: { id: projectId, isArchived: false },
      include: [
        { model: User, as: "owner", attributes: ["id", "name", "email"] },
        {
          model: User,
          as: "members",
          attributes: ["id", "name", "email"],
          through: { attributes: ["role"] },
        },
      ],
    });

    if (!project)
      return sendError(res, STATUS.NOT_FOUND, ERROR_MESSAGES.PROJECT_NOT_FOUND);

    const member = project.members.find((user) => user.id === req.user.id);
    if (!member)
      return sendError(
        res,
        STATUS.FORBIDDEN,
        ERROR_MESSAGES.NOT_PROJECT_MEMBER,
      );

    req.project = project;
    req.myRole = member.ProjectMember.role;

    next();
  } catch (err) {
    next(err);
  }
};
