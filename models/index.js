import User from "./user.js";
import Project from "./project.js";
import ProjectMember from "./projectMember.js";
import Task from "./task.js";
import TaskActivity from "./taskActivity.js";
import TaskComment from "./taskComment.js";
import Notification from "./notification.js";

User.hasMany(Project, { foreignKey: "ownerId" });
Project.belongsTo(User, { foreignKey: "ownerId", as: "owner" });

User.belongsToMany(Project, {
  through: ProjectMember,
  foreignKey: "userId",
  otherKey: "projectId",
  onDelete: "NO ACTION",
  as: "projects",
});

Project.belongsToMany(User, {
  through: ProjectMember,
  foreignKey: "projectId",
  otherKey: "userId",
  onDelete: "NO ACTION",
  as: "members",
});

Project.hasMany(Task, { foreignKey: "projectId", as: "tasks" });
Task.belongsTo(Project, { foreignKey: "projectId", as: "project" });

User.hasMany(Task, {
  foreignKey: "assignedTo",
  as: "assignedTasks",
  onDelete: "NO ACTION",
});
Task.belongsTo(User, {
  foreignKey: "assignedTo",
  as: "assignee",
  onDelete: "NO ACTION",
});

User.hasMany(Task, {
  foreignKey: "createdBy",
  as: "createdTasks",
  onDelete: "NO ACTION",
});
Task.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
  onDelete: "NO ACTION",
});

Task.hasMany(TaskComment, { foreignKey: "taskId", onDelete: "NO ACTION" });
TaskComment.belongsTo(Task, { foreignKey: "taskId" });

Project.hasMany(TaskComment, {
  foreignKey: "projectId",
  onDelete: "NO ACTION",
});
TaskComment.belongsTo(Project, { foreignKey: "projectId" });

User.hasMany(TaskComment, { foreignKey: "authorId", as: "authoredComments" });
TaskComment.belongsTo(User, { foreignKey: "authorId", as: "author" });

Task.hasMany(TaskActivity, { foreignKey: "taskId", onDelete: "NO ACTION" });
TaskActivity.belongsTo(Task, { foreignKey: "taskId", as: "task" });

Project.hasMany(TaskActivity, {
  foreignKey: "projectId",
  onDelete: "NO ACTION",
});
TaskActivity.belongsTo(Project, { foreignKey: "projectId", as: "project" });

User.hasMany(TaskActivity, { foreignKey: "userId", as: "activities" });
TaskActivity.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(TaskActivity, { foreignKey: "assignedTo" });
TaskActivity.belongsTo(User, { foreignKey: "assignedTo", as: "assignee" });

User.hasMany(Notification, {
  foreignKey: "userId",
  onDelete: "NO ACTION",
  as: "notifications",
});
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });

Project.hasMany(Notification, {
  foreignKey: "projectId",
  as: "notifications",
  onDelete: "NO ACTION",
});
Notification.belongsTo(Project, { foreignKey: "projectId", as: "project" });

Task.hasMany(Notification, {
  foreignKey: "taskId",
  as: "notifications",
  onDelete: "NO ACTION",
});
Notification.belongsTo(Task, { foreignKey: "taskId", as: "task" });

export {
  User,
  Project,
  ProjectMember,
  Task,
  TaskComment,
  TaskActivity,
  Notification,
};
