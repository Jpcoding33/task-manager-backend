import { sequelize } from "../config/database.js";
import { DataTypes } from "sequelize";

const ProjectMember = sequelize.define(
  "ProjectMember",
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
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      validate: {
        isIn: [["owner", "admin", "member"]],
      },
      defaultValue: "member",
    },
  },
  {
    timestamps: false,
    indexes: [
      { fields: ["userId"] },
      { fields: ["projectId"] },
      { unique: true, fields: ["userId", "projectId"] },
    ],
  },
);

export default ProjectMember;
