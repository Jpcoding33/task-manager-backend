import express from "express";
import { getTaskActivity } from "../controllers/taskActivity.controller.js";

const taskActivityRouter = express.Router({ mergeParams: true });

taskActivityRouter.get("/", getTaskActivity);

export default taskActivityRouter;
