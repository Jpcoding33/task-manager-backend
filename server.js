import express from "express";
// import http from "http";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { createServer } from "http";
// import { Server } from "socket.io";
// import path from "path";
import connectDb, { sequelize } from "./config/database.js";
import { init } from "./utils/socket.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import projectRouter from "./routes/project.routes.js";
import taskRouter from "./routes/task.routes.js";
import notificationRouter from "./routes/notification.routes.js";

const app = express();
const server = createServer(app);

const io = init(server);

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/projects", projectRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/notifications", notificationRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDb()
  .then(async () => {
    console.log("✅ MSSQL Connected via Sequelize");

    // This creates the table
    await sequelize.sync({ force: false });

    server.listen(PORT, () => {
      console.log("Server running on port", PORT);
    });
  })
  .catch((err) => {
    console.error("❌ Unable to connect:", err);
    process.exit(1);
  });
