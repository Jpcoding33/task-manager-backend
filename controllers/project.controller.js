import { Op } from "sequelize";
import {
  ERROR_MESSAGES,
  NOTIFICATION_MESSAGES,
  SUCCESS_MESSAGES,
} from "../constants/messages.js";
import { NOTIFICATION_TYPE } from "../constants/notification.js";
import { STATUS } from "../constants/statusCodes.js";
import { Task, User, Project, ProjectMember } from "../models/index.js";
import { createNotification } from "../utils/notificationService.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { sequelize } from "../config/database.js";

export const createProject = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { name, description } = req.body;
    const { id: userId } = req.user;

    const project = await Project.create(
      { name, description, ownerId: userId },
      { transaction },
    );

    await ProjectMember.create(
      { projectId: project.id, userId, role: "owner" },
      { transaction },
    );

    await transaction.commit();

    const resData = {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      createdAt: project.createdAt,
    };

    return sendSuccess(
      res,
      resData,
      STATUS.OK,
      SUCCESS_MESSAGES.PROJECT_CREATED,
    );
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = req.project;
    const { name, description } = req.body;

    project.name = name;
    project.description = description;

    await project.save();

    return sendSuccess(
      res,
      {
        id: project.id,
        name: project.name,
        description: project.description,
        updatedAt: project.updatedAt,
      },
      STATUS.OK,
      SUCCESS_MESSAGES.PROJECT_UPDATED,
    );
  } catch (err) {
    next(err);
  }
};

export const getMyProjects = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = (page - 1) * limit;

    const { count: total, rows } = await Project.findAndCountAll({
      where: { isArchived: false },
      include: [
        {
          model: User,
          as: "members",
          attributes: ["id"],
          through: { attributes: ["role"] },
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    const resBody = rows.map((project) => {
      const member = project.members.find((m) => m.id === req.user.id);

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        myRole: member?.ProjectMember.role || "member",
        membersCount: project.members?.length || 0,
        createdAt: project.createdAt,
      };
    });

    return sendSuccess(
      res,
      {
        projects: resBody,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      STATUS.OK,
    );
  } catch (err) {
    next(err);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = req.project;

    const resData = {
      id: project.id,
      name: project.name,
      description: project.description,
      owner: {
        id: project.owner.id,
        name: project.owner.name,
        email: project.owner.email,
      },
      members: project.members.map((m) => ({
        user: { id: m.id, name: m.name, email: m.email },
        role: m.ProjectMember.role,
      })),
      myRole: req.myRole,
      currentUserId: req.user.id,
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

    if (project.isArchived) {
      return sendError(
        res,
        STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PROJECT_ALREADY_ARCHIVED,
      );
    }

    project.isArchived = true;
    await project.save();

    return sendSuccess(res, null, STATUS.OK, SUCCESS_MESSAGES.PROJECT_ARCHIVED);
  } catch (err) {
    next(err);
  }
};

export const addProjectMembers = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const membersToBeAdded = req.body.members;
    const project = req.project;

    const userIds = membersToBeAdded.map((m) => m.userId);
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ["id", "name"],
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const added = [];
    const skipped = [];

    const existingMembers = await ProjectMember.findAll({
      where: { projectId: project.id, userId: userIds },
      attributes: ["userId"],
    });
    const existingSet = new Set(existingMembers.map((m) => m.userId));

    for (const member of membersToBeAdded) {
      const { userId, role } = member;
      const user = userMap.get(userId);

      if (!user) {
        skipped.push({ userId, reason: ERROR_MESSAGES.USER_NOT_FOUND });
        continue;
      }

      if (project.ownerId === userId) {
        skipped.push({ userId, reason: ERROR_MESSAGES.CANNOT_ADD_OWNER });
        continue;
      }

      if (existingSet.has(userId)) {
        skipped.push({ userId, reason: ERROR_MESSAGES.ALREADY_MEMBER });
        continue;
      }

      added.push({ userId, role: role || "member" });
    }

    if (added.length > 0) {
      await ProjectMember.bulkCreate(
        added.map(({ userId, role }) => ({
          projectId: project.id,
          userId,
          role,
        })),
        { transaction },
      );

      await Promise.all(
        added.map(({ userId }) =>
          createNotification({
            userId,
            projectId: project.id,
            message: NOTIFICATION_MESSAGES.PROJECT_MEMBER_ADDED(project.name),
            type: NOTIFICATION_TYPE.PROJECT_MEMBER_ADDED,
            transaction,
          }),
        ),
      );
    }

    await transaction.commit();

    return sendSuccess(
      res,
      { added, skipped },
      STATUS.OK,
      SUCCESS_MESSAGES.MEMBERS_ADDED,
    );
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

export const removeMember = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { userId } = req.params;
    const project = req.project;

    if (project.ownerId === parseInt(userId)) {
      await transaction.rollback();
      return sendError(
        res,
        STATUS.FORBIDDEN,
        ERROR_MESSAGES.CANNOT_REMOVE_OWNER,
      );
    }

    const member = await ProjectMember.findOne({
      where: { projectId: project.id, userId },
    });

    if (!member) {
      await transaction.rollback();
      return sendError(
        res,
        STATUS.NOT_FOUND,
        ERROR_MESSAGES.NOT_PROJECT_MEMBER,
      );
    }

    await member.destroy({ transaction });

    await Task.update(
      { assignedTo: null },
      { where: { projectId: project.id, assignedTo: userId }, transaction },
    );

    await transaction.commit();

    return sendSuccess(res, null, STATUS.OK, SUCCESS_MESSAGES.MEMBER_REMOVED);
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userProjects = await Project.findAll({
      where: { isArchived: false },
      include: [
        {
          model: User,
          as: "members",
          where: { id: userId },
          attributes: [],
          through: { attributes: [] },
        },
      ],
      attributes: ["id"],
      raw: true,
    });

    const projectIds = userProjects.map((p) => p.id);

    if (projectIds.length === 0) {
      return sendSuccess(
        res,
        {
          totalProjects: 0,
          projectTasks: { total: 0, todo: 0, inProgress: 0, done: 0 },
          myTasks: { total: 0, todo: 0, inProgress: 0, done: 0 },
        },
        STATUS.OK,
      );
    }

    const [taskStats, myTaskStats] = await Promise.all([
      Task.findAll({
        where: { projectId: { [Op.in]: projectIds }, isArchived: false },
        attributes: [
          "status",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["status"],
        raw: true,
      }),
      Task.findAll({
        where: {
          assignedTo: userId,
          isArchived: false,
          projectId: { [Op.in]: projectIds },
        },
        attributes: [
          "status",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["status"],
        raw: true,
      }),
    ]);

    const stats = {
      totalProjects: projectIds.length,
      projectTasks: {
        total: taskStats.reduce((acc, curr) => acc + parseInt(curr.count), 0),
        todo: parseInt(taskStats.find((s) => s.status === "TODO")?.count || 0),
        inProgress: parseInt(
          taskStats.find((s) => s.status === "IN_PROGRESS")?.count || 0,
        ),
        done: parseInt(taskStats.find((s) => s.status === "DONE")?.count || 0),
      },
      myTasks: {
        total: myTaskStats.reduce((acc, curr) => acc + parseInt(curr.count), 0),
        todo: parseInt(
          myTaskStats.find((s) => s.status === "TODO")?.count || 0,
        ),
        inProgress: parseInt(
          myTaskStats.find((s) => s.status === "IN_PROGRESS")?.count || 0,
        ),
        done: parseInt(
          myTaskStats.find((s) => s.status === "DONE")?.count || 0,
        ),
      },
    };

    return sendSuccess(res, stats, STATUS.OK);
  } catch (err) {
    next(err);
  }
};

export const getProjectStats = async (req, res, next) => {
  try {
    const projectId = req.project.id;

    const [taskStats, memberCount] = await Promise.all([
      Task.findAll({
        where: { projectId, isArchived: false },
        attributes: [
          "status",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["status"],
        raw: true,
      }),
      ProjectMember.count({ where: { projectId } }),
    ]);

    const stats = {
      totalTasks: taskStats.reduce(
        (acc, curr) => acc + parseInt(curr.count),
        0,
      ),
      statusBreakdown: {
        todo: parseInt(taskStats.find((s) => s.status === "TODO")?.count || 0),
        inProgress: parseInt(
          taskStats.find((s) => s.status === "IN_PROGRESS")?.count || 0,
        ),
        done: parseInt(taskStats.find((s) => s.status === "DONE")?.count || 0),
      },
      memberCount,
    };

    return sendSuccess(res, stats, STATUS.OK);
  } catch (err) {
    next(err);
  }
};
