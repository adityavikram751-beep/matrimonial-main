"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

// ⭐ WebSocket imports
import { connectSocket, disconnectSocket, getSocket } from "@/src/lib/socket";

const Search = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);
  const BASE_URL = "https://matrimonial-backend-7ahc.onrender.com";

  /* --------------------------------------------------------
        1) CONNECT SOCKET BASED ON ADMIN PREF
  ---------------------------------------------------------*/
  const loadAdminPrefs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!json.success) return;

      const admin = json.data;

      if (admin.notifications === true) {
        connectSocket(admin._id);
      } else {
        disconnectSocket();
      }
    } catch (err) {
      console.log("Admin Pref Error:", err);
    }
  };

  useEffect(() => {
    loadAdminPrefs();
  }, []);

  /* --------------------------------------------------------
        2) FETCH NOTIFICATIONS
  ---------------------------------------------------------*/
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/notification/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        const list = data.data.reverse();
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.read).length);
      }
    } catch (err) {
      console.log("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  /* --------------------------------------------------------
        3) SOCKET REAL-TIME LISTENERS (SYNC EVERYWHERE)
  ---------------------------------------------------------*/
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    console.log("🟢 REAL-TIME NOTIFICATION LISTENER ACTIVE");

    // NEW notification
    socket.on("new-notification", (data) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((u) => u + 1);
    });

    // MARK ONE READ SYNC
    socket.on("one-read", ({ id }) => {
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((u) => Math.max(0, u - 1));
    });

    // MARK ALL READ SYNC
    socket.on("all-read", () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    });

    // DELETE ONE SYNC
    socket.on("delete-one", ({ id }) => {
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    });

    // DELETE ALL SYNC
    socket.on("delete-all", () => {
      setNotifications([]);
      setUnreadCount(0);
    });

    return () => {
      socket.off("new-notification");
      socket.off("one-read");
      socket.off("all-read");
      socket.off("delete-one");
      socket.off("delete-all");
    };
  }, []);

  /* --------------------------------------------------------
        4) CLICK OUTSIDE → CLOSE DROPDOWN
  ---------------------------------------------------------*/
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* --------------------------------------------------------
        5) MARK ONE READ
  ---------------------------------------------------------*/
  const markAsRead = async (id) => {
    const token = localStorage.getItem("token");

    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((u) => Math.max(0, u - 1));

    await fetch(`${BASE_URL}/api/notification/mark-read/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    getSocket()?.emit("one-read", { id });
  };

  /* --------------------------------------------------------
        6) MARK ALL READ
  ---------------------------------------------------------*/
  const markAll = async () => {
    const token = localStorage.getItem("token");

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    await fetch(`${BASE_URL}/api/notification/mark-all`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    getSocket()?.emit("all-read");
  };

  /* --------------------------------------------------------
        7) DELETE ONE
  ---------------------------------------------------------*/
  const deleteOne = async (id) => {
    const token = localStorage.getItem("token");

    setNotifications((prev) => prev.filter((n) => n._id !== id));

    await fetch(`${BASE_URL}/api/notification/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    getSocket()?.emit("delete-one", { id });
  };

  /* --------------------------------------------------------
        8) DELETE ALL
  ---------------------------------------------------------*/
  const deleteAll = async () => {
    const token = localStorage.getItem("token");

    setNotifications([]);
    setUnreadCount(0);

    await fetch(`${BASE_URL}/api/notification/delete-all`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    getSocket()?.emit("delete-all");
  };

  /* --------------------------------------------------------
        9) BELL CLICK → AUTO MARK ALL READ
  ---------------------------------------------------------*/
  const handleBellClick = () => {
    const show = !open;
    setOpen(show);

    if (show) {
      markAll();
    }
  };

  /* --------------------------------------------------------
        UI
  ---------------------------------------------------------*/
  return (
    <div className="w-full bg-[#f5f5f5] py-3 px-4 border-b flex items-center justify-between">
      {/* TITLE */}
      <h1 className="text-2xl font-bold text-black">Reported Content</h1>

      <div className="flex items-center gap-4">

        {/* 🔔 Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <div
            className="cursor-pointer relative"
            onClick={handleBellClick}
          >
            <Bell className="h-7 w-7 text-yellow-500" />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 text-white 
              text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                {unreadCount}
              </span>
            )}
          </div>

          {/* DROPDOWN */}
          {open && (
            <div className="absolute right-0 mt-3 w-[330px] bg-white shadow-lg border rounded-lg p-3 z-50">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold">Notifications</h2>

                <button onClick={markAll} className="text-blue-600 text-sm">
                  Mark all read
                </button>
              </div>

              {/* LIST */}
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-gray-500 py-3">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3 border-b flex justify-between items-start ${
                        !n.read ? "bg-yellow-50" : ""
                      }`}
                    >
                      <div>
                        <h3 className="font-semibold">{n.title}</h3>
                        <p className="text-sm text-gray-600">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>

                        {!n.read && (
                          <button
                            onClick={() => markAsRead(n._id)}
                            className="text-blue-600 text-xs mt-1"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => deleteOne(n._id)}
                        className="text-red-500 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <button
                  onClick={deleteAll}
                  className="w-full text-red-600 mt-2 py-2 text-sm border-t"
                >
                  Delete All
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
