import { sequelize } from "../config/database.js";
import { DataTypes } from "sequelize";

const TaskComment = sequelize.define(
  "TaskComment",
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
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 200],
      },
      set(value) {
        this.setDataValue("content", value.trim());
      },
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    indexes: [{ fields: ["taskId"] }, { fields: ["projectId"] }],
  },
);

export default TaskComment;
