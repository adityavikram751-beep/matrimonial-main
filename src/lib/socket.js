import { io } from "socket.io-client";

let socket = null;

export function connectSocket(adminId) {
  if (socket && socket.connected) return socket;

  socket = io("https://merimonial-backend.onrender.com", {
    transports: ["websocket"],
    secure: true,
    reconnection: true,
    reconnectionAttempts: 10,
    path: "/socket.io",
    query: { adminId },
  });

  socket.on("connect", () => {
    console.log(" SOCKET CONNECTED:", socket.id);
    socket.emit("join", adminId);
    console.log(" adminId:", adminId);
  });

  socket.on("disconnect", (reason) => {
    console.log(":red_circle: SOCKET DISCONNECTED — reason:", reason); // :white_check_mark: reason add kiya
  });

  // :white_check_mark: Ye add karo — reconnect pe dobara join karo
  socket.on("reconnect", () => {
    console.log(":repeat: RECONNECTED — rejoining room");
    socket.emit("join", adminId);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    console.log(":red_circle: SOCKET MANUALLY DISCONNECTED");
  }
}

export function getSocket() {
  return socket;
}
