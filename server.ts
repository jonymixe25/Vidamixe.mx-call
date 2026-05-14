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

  function getActiveRooms() {
    const rooms: { id: string; count: number }[] = [];
    io.sockets.adapter.rooms.forEach((set, roomId) => {
      // If the room ID is not a socket ID (which are stored in sids)
      if (!io.sockets.adapter.sids.has(roomId)) {
        rooms.push({ id: roomId, count: set.size });
      }
    });
    return rooms;
  }

  // Socket.IO signaling logic for WebRTC
  io.on("connection", (socket) => {
    socket.emit("active-rooms", getActiveRooms());

    socket.on("get-rooms", () => {
      socket.emit("active-rooms", getActiveRooms());
    });

    socket.on("join-room", (roomId: string) => {
      // Check room size
      const clients = io.sockets.adapter.rooms.get(roomId);
      const numClients = clients ? clients.size : 0;

      if (numClients >= 2) {
        socket.emit("room-full");
        return;
      }

      socket.join(roomId);
      io.emit("active-rooms", getActiveRooms());
      
      // If there's already a user in the room, tell everyone a new user connected
      socket.broadcast.to(roomId).emit("user-connected", socket.id);

      socket.on("disconnecting", () => {
        socket.broadcast.to(roomId).emit("user-disconnected", socket.id);
      });

      socket.on("toggle-media", (payload) => {
        socket.broadcast.to(roomId).emit("peer-toggled-media", payload);
      });
    });

    socket.on("disconnect", () => {
      // Wait a tick for the socket to actually leave the room
      setTimeout(() => {
        io.emit("active-rooms", getActiveRooms());
      }, 0);
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
