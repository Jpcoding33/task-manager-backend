import {
  ERROR_MESSAGES,
  NOTIFICATION_MESSAGES,
  SUCCESS_MESSAGES,
} from "../constants/messages.js";
import { NOTIFICATION_TYPE } from "../constants/notification.js";
import { STATUS } from "../constants/statusCodes.js";
import Project from "../models/project.js";
import User from "../models/user.js";
import { createNotification } from "../utils/notificationService.js";
import { sendSuccess } from "../utils/responseHandler.js";

export const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: "owner",
        },
      ],
    });

    const resData = {
      id: project._id,
      name: project.name,
      description: project.description,
      owner: project.owner,
      members: project.members,
      createdAt: project.createdAt,
    };
    return sendSuccess(
      res,
      resData,
      STATUS.OK,
      SUCCESS_MESSAGES.PROJECT_CREATED
    );
  } catch (err) {
    next(err);
  }
};

export const updateProject = (rq, res, next) => {};

export const getMyProjects = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      "members.user": req.user._id,
      isArchived: false,
    };

    const [projects, total] = await Promise.all([
      Project.find(query)
        .select("name description owner members createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(query),
    ]);

    const resBody = projects.map((project) => {
      const member = project.members.find((m) =>
        m.user.equals ? m.user.equals(req.user._id) : m.user === req.user._id
      );

      return {
        id: project._id,
        name: project.name,
        description: project.description,
        myRole: member?.role || "member",
        membersCount: project.members.length,
        createdAt: project.createdAt,
      };
    });

    return sendSuccess(res, {
      projects: resBody,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, STATUS.OK);
  } catch (err) {
    next(err);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = req.project;

    const resData = {
      id: project._id,
      name: project.name,
      description: project.description,
      owner: {
        id: project.owner._id,
        name: project.owner.name,
        email: project.owner.email,
      },
      members: project.members.map((m) => ({
        user: {
          id: m.user._id,
          name: m.user.name,
          email: m.user.email,
        },
        role: m.role,
      })),
      myRole: req.myRole,
      createdAt: project.createdAt,
    };
    return sendSuccess(res, resData, STATUS.OK);
  } catch (err) {
    next(err);
  }
};

export const archiveProject = async (req, res, next) => {
  try {
    const project = req.project;

    project.isArchived = true;
    await project.save();

    return sendSuccess(res, null, STATUS.OK, SUCCESS_MESSAGES.PROJECT_ARCHIVED);
  } catch (err) {
    next(err);
  }
};

export const addProjectMembers = async (req, res, next) => {
  try {
    const membersToBeAdded = req.body.members;
    const project = req.project;
    
    const userIds = membersToBeAdded.map(m => m.userId);
    const users = await User.find({ _id: { $in: userIds } }).select("_id name").lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    const added = [];
    const skipped = [];
    const notifications = [];

    for (const member of membersToBeAdded) {
      const { userId, role } = member;
      const user = userMap.get(userId.toString());

      if (!user) {
        skipped.push({ userId, reason: ERROR_MESSAGES.USER_NOT_FOUND });
        continue;
      }

      if (project.members.some((m) => m.user._id ? m.user._id.equals(userId) : m.user.equals(userId))) {
        skipped.push({ userId, reason: ERROR_MESSAGES.ALREADY_MEMBER });
        continue;
      }

      if (project.owner.equals(userId)) {
        skipped.push({ userId, reason: ERROR_MESSAGES.CANNOT_ADD_OWNER });
        continue;
      }

      project.members.push({ user: userId, role });
      added.push({ userId, role: role || "member" });
      
      notifications.push({
        user: userId,
        project: project._id,
        message: NOTIFICATION_MESSAGES.PROJECT_MEMBER_ADDED(project.name),
        type: NOTIFICATION_TYPE.PROJECT_MEMBER_ADDED,
      });
    }

    await project.save();

    // Batch create notifications
    if (notifications.length > 0) {
      await Promise.all(notifications.map(n => createNotification(n)));
    }

    return sendSuccess(
      res,
      { added, skipped },
      STATUS.OK,
      SUCCESS_MESSAGES.MEMBERS_ADDED
    );
  } catch (err) {
    next(err);
  }
};
