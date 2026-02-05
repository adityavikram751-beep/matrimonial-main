"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search as SearchIcon } from "lucide-react";

// ⭐ SOCKET SYSTEM
import { connectSocket, disconnectSocket, getSocket } from "@/src/lib/socket";

const Search = ({ setSearch, topSearch, setTopSearch }) => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);

  const BASE_URL = "https://matrimonial-backend-7ahc.onrender.com";

  /* ------------------------------------------------------
        1) LOAD ADMIN → ENABLE SOCKET
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
        3) SOCKET SYNC
  -------------------------------------------------------*/
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    console.log("🟢 Verification Page Socket Active");

    // NEW
    socket.on("new-notification", (data) => {
      setNotifications((prev) => [data, ...prev]);
      setUnread((u) => u + 1);
    });

    // ONE READ
    socket.on("one-read", ({ id }) => {
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnread((u) => Math.max(0, u - 1));
    });

    // ALL READ
    socket.on("all-read", () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    });

    // DELETE ONE
    socket.on("delete-one", ({ id }) => {
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnread((u) => Math.max(0, u - 1));
    });

    // DELETE ALL
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
  const markAsRead = async (id) => {
    const token = localStorage.getItem("token");

    // frontend
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
    setUnread((u) => Math.max(0, u - 1));

    // backend
    await fetch(`${BASE_URL}/api/notification/mark-read/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    // socket
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
        CLICK OUTSIDE CLOSE
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
        UI
  -------------------------------------------------------*/
  return (
    <div
      className="bg-gray-100 px-6 py-4 shadow-sm border-b fixed top-0 z-50 flex items-center justify-between"
      style={{ left: "250px", width: "calc(100% - 250px)" }}
    >
      <h1 className="text-2xl font-bold text-gray-900">Verification Request</h1>

      <div className="flex items-center gap-5">

        {/* SEARCH */}
        <div className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 w-[350px] shadow-sm">
          <SearchIcon className="text-gray-600" size={18} />
          <input
            type="text"
            placeholder="Search By User ID"
            className="ml-2 w-full outline-none bg-transparent"
            value={topSearch}
            onChange={(e) => {
              setTopSearch(e.target.value);
              setSearch(e.target.value);
            }}
          />
        </div>

        {/* NOTIFICATION BELL */}
        <div className="relative" ref={dropdownRef}>
          <div onClick={() => setOpen(!open)} className="cursor-pointer">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#FFC107">
              <path d="M12 24c1.104 0 2-.897 2-2h-4c0 1.103.896 2 2 2zm6.707-5l1.293 1.293V21H4v-1.707L5.293 19H6v-7c0-3.309 2.691-6 6-6s6 2.691 6 6v7h.707z" />
            </svg>

            {unread > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 text-[10px] bg-red-600 text-white rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </div>

          {/* DROPDOWN */}
          {open && (
            <div className="absolute right-0 mt-3 w-[350px] bg-white shadow-lg border rounded-lg p-3 z-50">
              <div className="flex justify-between mb-2">
                <h2 className="font-semibold">Notifications</h2>
                <button onClick={markAll} className="text-blue-600 text-sm">
                  Mark all read
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center py-3 text-gray-500">
                    No notifications
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3 border-b ${
                        !n.read ? "bg-yellow-50" : ""
                      }`}
                    >
                      <div className="flex justify-between">
                        <p className="font-semibold">{n.title}</p>
                        <button
                          onClick={() => deleteOne(n._id)}
                          className="text-red-500 text-xs"
                        >
                          Delete
                        </button>
                      </div>

                      <p className="text-sm text-gray-700">{n.message}</p>
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
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <button
                  onClick={deleteAll}
                  className="w-full mt-2 py-2 text-sm text-red-600 border-t"
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
