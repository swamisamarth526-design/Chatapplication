const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const app = express();
const socket = require("socket.io");
require("dotenv").config();

app.use(cors());
app.use(express.json());

const clientBuildPath = path.join(__dirname, "..", "public", "build");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientBuildPath));
}

const mongoUrl =
  process.env.MONGO_URL || "mongodb://127.0.0.1:27017/chat-app";

mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log("DB Connection Successful");
  })
  .catch((err) => {
    console.error("DB connection error:", err.message);
    process.exit(1);
  });

app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

if (process.env.NODE_ENV === "production") {
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

const port = process.env.PORT || 5000;
const server = app.listen(port, () =>
  console.log(`Server started on ${port}`)
);
const io = socket(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});
