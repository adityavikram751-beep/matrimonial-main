import { io } from "socket.io-client";

let socket = null;

export function connectSocket(adminId) {
  if (socket && socket.connected) return socket;

  socket = io("https://matrimonial-backend-7ahc.onrender.com", {
    transports: ["websocket"],
    secure: true,
    reconnection: true,
    reconnectionAttempts: 10,
    path: "/socket.io",
    query: { adminId },
  });

  socket.on("connect", () => {
    console.log("🔵 SOCKET CONNECTED:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("🔴 SOCKET DISCONNECTED");
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    console.log("🔴 SOCKET MANUALLY DISCONNECTED");
  }
}

export function getSocket() {
  return socket;
}
