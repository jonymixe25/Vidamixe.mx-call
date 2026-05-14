import { io } from "socket.io-client";

// In our preview environment, the WebSocket needs to share the Express port (3000)
// and handles relative paths.
export const socket = io("/", {
  autoConnect: false, // We'll manage connection manually
});
