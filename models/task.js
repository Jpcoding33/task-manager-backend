import { DataTypes } from "sequelize";
import { TASK_PRIORITY, TASK_STATUS } from "../constants/task.js";
import { sequelize } from "../config/database.js";

const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
      },
      set(value) {
        this.setDataValue("title", value.trim());
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 1000],
      },
      set(value) {
        this.setDataValue("description", value.trim());
      },
    },
    status: {
      type: DataTypes.STRING,
      validate: {
        isIn: [Object.values(TASK_STATUS)],
      },
      defaultValue: TASK_STATUS.TODO,
    },
    priority: {
      type: DataTypes.STRING,
      validate: {
        isIn: [Object.values(TASK_PRIORITY)],
      },
      defaultValue: TASK_PRIORITY.MEDIUM,
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["projectId"] },
      { fields: ["status"] },
      { fields: ["assignedTo"] },
      { fields: ["isArchived"] },
    ],
  },
);

export default Task;
