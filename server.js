import express from "express";
// import http from "http";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { createServer } from "http";
// import { Server } from "socket.io";
// import path from "path";
import connectDb from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import projectRouter from "./routes/project.routes.js";
import taskRouter from "./routes/task.routes.js";
import notificationRouter from "./routes/notification.routes.js";

const app = express();
const server = createServer(app);

// const io = new Server(server, { cors: "*" });

// io.on("connection", (socket) => {
//   console.log("New client conneted", socket.id);
//   socket.on("joinUser", (userId) => {
//     socket.join(userId);
//   });
//   socket.on("disconnect", () => {
//     console.log("Client disconnected", socket.id);
//   });
// });

// app.locals.io = io;

app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/projects", projectRouter);
app.use("/api/notifications", notificationRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDb()
  .then(() => {
    console.log("MongoDB connected successfully");
    server.listen(PORT, () => {
      console.log("Server running on port", PORT);
    });
  })
  .catch((err) => {
    console.log("Failed to connect mongodb", err);
    process.exit(1);
  });
