export const SUCCESS_MESSAGES = {
  // common
  SUCCESS: "Success",

  // auth
  USER_REGISTERED: "User registered successfully",
  LOGIN_SUCCESS: "User logged-in successfully",
  LOGOUT_SUCCESS: "User logged-out successfully",
  RESET_PASSWORD_EMAIL_SENT: "Reset password link sent successfully",
  RESET_PASSWORD_SUCCESS: "Reset password successfully",

  // user
  USER_UPDATED: "User updated successfully",
  PASSWORD_UPDATED: "Password updated successfully",

  // project
  PROJECT_CREATED: "Project created successfully",
  PROJECT_ARCHIVED: "Project archived successfully",
  MEMBERS_ADDED_TO_PROJECT: "Members added successfully",

  // task
  TASK_CREATED: "Task created successfully",
  TASK_UPDATED: "Task updated successfully",
  TASK_DELETED: "Task deleted successfully",

  // task comments
  TASK_COMMENT_ADDED: "Task comment added successfully",
  TASK_COMMENT_DELETED: "Task comment deleted successfully",
};

export const ERROR_MESSAGES = {
  // common
  SOMETHING_WENT_WRONG: "Something went wrong",
  INTERNAL_SERVER_ERROR: "Internal server error",

  // auth
  EMAIL_REGISTERED: "Email already registered",
  INVALID_CREDENTIALS: "Invalid credentials",
  UNAUTHORIZED: "Unauthorized user",
  USER_NOT_FOUND: "User not found",
  INVALID_TOKEN: "Invalid token",
  FORBIDDEN: "Forbidden",
  INVALID_OLD_PASSWORD: "Invalid old password",
  INVALID_RESET_PASSWORD_TOKEN: "Invalid reset password token",

  // project
  PROJECT_NOT_FOUND: "Project not found",
  NOT_PROJECT_MEMBER: "You are not a member of this project",
  PROJECT_ALREADY_ARCHIVED: "Project is already archived",
  INSUFFICIENT_PROJECT_ROLE:
    "You do not have permission to perform this action",
  ALREADY_MEMBER: "Already a member",
  CANNOT_ADD_OWNER: "Cannot add member",

  // task
  TASK_NOT_FOUND: "Task not found",

  // task comment
  TASK_COMMENT_NOT_FOUND: "Task comment not found",
};

export const NOTIFICATION_MESSAGES = {
  PROJECT_MEMBER_ADDED: (projectTitle) =>
    `You were added to project ${projectTitle}`,

  TASK_ASSIGNED: (taskTitle) => `You were assigned to task ${taskTitle}`,

  TASK_COMMENTED: (taskTitle) => `New comment on task ${taskTitle}`,

  TASK_STATUS_CHANGED: (taskTitle, newStatus) =>
    `Task ${taskTitle} moved to ${newStatus}`,
};
