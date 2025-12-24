import mongoose from "mongoose";
import { MONGO_URI } from "./envConfig.js";

export default async function connectDB() {
  return mongoose.connect(MONGO_URI, { dbName: "projecthub" });
}
