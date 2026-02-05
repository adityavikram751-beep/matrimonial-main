"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search as SearchIcon } from "lucide-react";

// ⭐ SOCKET SYSTEM
import { connectSocket, disconnectSocket, getSocket } from "@/src/lib/socket";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);

  const BASE_URL = "https://matrimonial-backend-7ahc.onrender.com";

  /* ------------------------------------------------------
        1) ADMIN NOTIFICATION PREFERENCES → CONNECT SOCKET
  -------------------------------------------------------*/
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
        connectSocket(admin._id); // connect
      } else {
        disconnectSocket(); // disconnect
      }
    } catch (err) {
      console.log("Admin Pref Error:", err);
    }
  };

  useEffect(() => {
    loadAdminPrefs();
  }, []);

  /* ------------------------------------------------------
        2) FETCH NOTIFICATIONS
  -------------------------------------------------------*/
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
        setUnread(list.filter((n) => !n.read).length);
      }
    } catch (error) {
      console.log("Notification Fetch Error:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  /* ------------------------------------------------------
        3) SOCKET REAL-TIME LISTENERS
  -------------------------------------------------------*/
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    console.log("🟢 REAL-TIME SOCKET ACTIVE (Manage Users)");

    // NEW NOTIFICATION
    socket.on("new-notification", (data) => {
      setNotifications((prev) => [data, ...prev]);
      setUnread((u) => u + 1);
    });

    // MARK ONE READ SYNC
    socket.on("one-read", ({ id }) => {
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnread((u) => Math.max(u - 1, 0));
    });

    // MARK ALL READ SYNC
    socket.on("all-read", () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    });

    // DELETE ONE SYNC
    socket.on("delete-one", ({ id }) => {
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnread((u) => Math.max(u - 1, 0));
    });

    // DELETE ALL SYNC
    socket.on("delete-all", () => {
      setNotifications([]);
      setUnread(0);
    });

    return () => {
      socket.off("new-notification");
      socket.off("one-read");
      socket.off("all-read");
      socket.off("delete-one");
      socket.off("delete-all");
    };
  }, []);

  /* ------------------------------------------------------
        MARK ONE READ
  -------------------------------------------------------*/
  const markRead = async (id) => {
    const token = localStorage.getItem("token");

    // FRONTEND UPDATE
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
    setUnread((u) => Math.max(u - 1, 0));

    // BACKEND UPDATE
    await fetch(`${BASE_URL}/api/notification/mark-read/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    getSocket()?.emit("one-read", { id });
  };

  /* ------------------------------------------------------
        MARK ALL READ 
  -------------------------------------------------------*/
  const markAll = async () => {
    const token = localStorage.getItem("token");

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);

    await fetch(`${BASE_URL}/api/notification/mark-all`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    getSocket()?.emit("all-read");
  };

  /* ------------------------------------------------------
        DELETE ONE 
  -------------------------------------------------------*/
  const deleteOne = async (id) => {
    const token = localStorage.getItem("token");

    setNotifications((prev) => prev.filter((n) => n._id !== id));

    await fetch(`${BASE_URL}/api/notification/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    getSocket()?.emit("delete-one", { id });
  };

  /* ------------------------------------------------------
       DELETE ALL 
  -------------------------------------------------------*/
  const deleteAll = async () => {
    const token = localStorage.getItem("token");

    setNotifications([]);
    setUnread(0);

    await fetch(`${BASE_URL}/api/notification/delete-all`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    getSocket()?.emit("delete-all");
  };

  /* ------------------------------------------------------
        OUTSIDE CLICK CLOSE
  -------------------------------------------------------*/
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ------------------------------------------------------
        BELL CLICK 
  -------------------------------------------------------*/
  const handleBellClick = () => {
    const newOpen = !open;
    setOpen(newOpen);

    if (newOpen) {
      markAll();
    }
  };

  return (
    <div
      className="bg-gray-100 px-6 py-4 shadow-sm border-b fixed top-0 z-50 flex items-center justify-between"
      style={{
        left: "250px",
        width: "calc(100% - 250px)",
      }}
    >
      {/* PAGE HEADING */}
      <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>

      <div className="flex items-center gap-5">

        {/* 🔔 BELL */}
        <div className="relative" ref={dropdownRef}>
          <div className="cursor-pointer" onClick={handleBellClick}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#FFC107">
              <path d="M12 24c1.104 0 2-.897 2-2h-4c0 1.103.896 2 2 2zm6.707-5l1.293 1.293V21H4v-1.707L5.293 19H6v-7c0-3.309 2.691-6 6-6s6 2.691 6 6v7h.707zM18 18H6v-7c0-2.757 2.243-5 5-5s5 2.243 5 5v7z"/>
            </svg>

            {unread > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 text-[10px] flex items-center justify-center bg-red-600 text-white rounded-full">
                {unread}
              </span>
            )}
          </div>

          {/* DROPDOWN */}
          {open && (
            <div className="absolute right-0 mt-3 w-80 bg-white shadow-xl border rounded-lg max-h-96 overflow-y-auto p-3 z-50">

              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">Notifications</h3>
                <button onClick={markAll} className="text-blue-600 text-sm">
                  Mark all read
                </button>
              </div>

              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div key={n._id} className="border-b pb-3 mb-3">

                    <div className="flex justify-between items-center">
                      <p className="font-bold text-[15px] capitalize">
                        {n.title}
                      </p>

                      <button
                        onClick={() => deleteOne(n._id)}
                        className="text-red-600 text-xs"
                      >
                        Delete
                      </button>
                    </div>

                    <p className="text-gray-700 text-sm mt-1">{n.message}</p>

                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>

                    {!n.read && (
                      <button
                        onClick={() => markRead(n._id)}
                        className="text-blue-600 text-xs mt-1"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                ))
              )}

              {notifications.length > 0 && (
                <>
                  <hr className="border-gray-300 my-2" />
                  <button
                    onClick={deleteAll}
                    className="w-full py-2 text-red-600 text-sm"
                  >
                    Delete All
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
