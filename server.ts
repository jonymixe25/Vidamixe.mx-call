import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server } from "socket.io";

async function startServer() {
  const app = express();
  const PORT = 3000;

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*", // allow all in dev
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO signaling logic for WebRTC
  io.on("connection", (socket) => {
    socket.on("join-room", (roomId: string) => {
      // Check room size
      const clients = io.sockets.adapter.rooms.get(roomId);
      const numClients = clients ? clients.size : 0;

      if (numClients >= 2) {
        socket.emit("room-full");
        return;
      }

      socket.join(roomId);
      
      // If there's already a user in the room, tell everyone a new user connected
      socket.broadcast.to(roomId).emit("user-connected", socket.id);

      socket.on("disconnecting", () => {
        socket.broadcast.to(roomId).emit("user-disconnected", socket.id);
      });
    });

    // WebRTC Signaling Events
    socket.on("offer", (payload: { target: string; caller: string; sdp: any }) => {
      io.to(payload.target).emit("offer", payload);
    });

    socket.on("answer", (payload: { target: string; caller: string; sdp: any }) => {
      io.to(payload.target).emit("answer", payload);
    });

    socket.on("ice-candidate", (payload: { target: string; candidate: any }) => {
      io.to(payload.target).emit("ice-candidate", payload);
    });
  });

  // API route (health check)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
