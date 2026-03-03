import { TASK_ACTIVITY } from "../constants/task.js";
import { sequelize } from "../config/database.js";
import { DataTypes } from "sequelize";

const TaskActivity = sequelize.define(
  "TaskActivity",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      validate: {
        isIn: [Object.values(TASK_ACTIVITY)],
      },
      allowNull: false,
    },
    from: { type: DataTypes.STRING, allowNull: true },
    to: { type: DataTypes.STRING, allowNull: true },
    comment: { type: DataTypes.STRING, allowNull: true },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [{ fields: ["taskId"] }, { fields: ["projectId"] }],
  },
);

export default TaskActivity;
