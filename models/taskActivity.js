import mongoose from "mongoose";
import { TASK_ACTIVITY } from "../constants/task.js";

const TaskActivitySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(TASK_ACTIVITY),
      required: true,
    },
    meta: {
      from: String,
      to: String,
      comment: String,
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  },
  { timestamps: true }
);

const TaskActivity = mongoose.model("TaskActivity", TaskActivitySchema);

export default TaskActivity;
