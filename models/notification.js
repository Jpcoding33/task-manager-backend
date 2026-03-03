import { NOTIFICATION_TYPE } from "../constants/notification.js";
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      validate: {
        isIn: [Object.values(NOTIFICATION_TYPE)],
      },
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    indexes: [{ fields: ["userId"] }, { fields: ["isRead"] }],
  },
);

export default Notification;
