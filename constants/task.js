export const TASK_STATUS = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
};

export const TASK_PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
};

export const TASK_ACTIVITY = {
  TASK_CREATED: "TASK_CREATED",
  TASK_DELETED: "TASK_DELETED",
  TASK_STATUS_CHANGED: "TASK_STATUS_CHANGED",
  TASK_ASSIGNED: "TASK_ASSIGNED",
  TASK_COMMENT_ADDED: "TASK_COMMENT_ADDED",
  TASK_COMMENT_DELETED: "TASK_COMMENT_DELETED",
  TASK_UPDATED: "TASK_UPDATED",
};

export const allowedFields = [
  "title",
  "description",
  "status",
  "priority",
  "dueDate",
  "assignedTo",
];
