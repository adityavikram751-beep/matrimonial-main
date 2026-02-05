"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search as SearchIcon } from "lucide-react";

// ⭐ SOCKET IMPORT
import { connectSocket, disconnectSocket, getSocket } from "@/src/lib/socket";

const Search = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);
  const BASE_URL = "https://matrimonial-backend-7ahc.onrender.com";

  /* --------------------------------------------
      1) ADMIN PREF → CONNECT SOCKET
  -------------------------------------------- */
  const loadAdminPrefs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (json.success) {
        const admin = json.data;
        if (admin.notifications === true) {
          connectSocket(admin._id);
        } else {
          disconnectSocket();
        }
      }
    } catch (err) {
      console.log("Admin Pref error:", err);
    }
  };

  useEffect(() => {
    loadAdminPrefs();
  }, []);

  /* --------------------------------------------
      2) FETCH ALL NOTIFICATIONS
  -------------------------------------------- */
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
    } catch (error) {
      console.log("Fetch Notification Error:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  /* --------------------------------------------
      3) SOCKET SYNC LISTENERS
  -------------------------------------------- */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    console.log("🟢 Realtime Listener Enabled");

    socket.on("new-notification", (data) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    socket.on("all-read", () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    });

    socket.on("one-read", ({ id }) => {
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(c - 1, 0));
    });

    socket.on("delete-one", ({ id }) => {
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    });

    socket.on("delete-all", () => {
      setNotifications([]);
      setUnreadCount(0);
    });

    return () => {
      socket.off("new-notification");
      socket.off("all-read");
      socket.off("one-read");
      socket.off("delete-one");
      socket.off("delete-all");
    };
  }, []);

  /* --------------------------------------------
      SEARCH
  -------------------------------------------- */
  const handleSearch = () => onSearch(searchQuery.toLowerCase());
  const handleKeyDown = (e) => e.key === "Enter" && handleSearch();

  /* --------------------------------------------
      CLOSE DROPDOWN OUTSIDE CLICK
  -------------------------------------------- */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* --------------------------------------------
      MARK ALL READ (BELL CLICK)
  -------------------------------------------- */
  const handleBellClick = async () => {
    const show = !open;
    setOpen(show);
    if (show) {
      markAll();
    }
  };

  /* --------------------------------------------
      MARK ALL READ
  -------------------------------------------- */
  const markAll = async () => {
    const token = localStorage.getItem("token");
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await fetch(`${BASE_URL}/api/notification/mark-all`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    getSocket()?.emit("all-read");
  };

  /* --------------------------------------------
      MARK ONE READ
  -------------------------------------------- */
  const markAsRead = async (id) => {
    const token = localStorage.getItem("token");
    setNotifications((p) =>
      p.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch(`${BASE_URL}/api/notification/mark-read/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    getSocket()?.emit("one-read", { id });
  };

  /* --------------------------------------------
      DELETE ONE
  -------------------------------------------- */
  const deleteOne = async (id) => {
    const token = localStorage.getItem("token");
    setNotifications((p) => p.filter((n) => n._id !== id));
    await fetch(`${BASE_URL}/api/notification/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    getSocket()?.emit("delete-one", { id });
  };

  /* --------------------------------------------
      DELETE ALL
  -------------------------------------------- */
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

  /* --------------------------------------------
      UI - Verification wale style mein
  -------------------------------------------- */
  return (
    <div
      className="bg-gray-100 px-6 py-4 shadow-sm border-b fixed top-0 z-50 flex items-center justify-between"
      style={{ left: "250px", width: "calc(100% - 250px)" }}
    >
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Profile Details</h1>

      <div className="flex items-center gap-3 md:gap-5">

        {/* SEARCH */}
        <div className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 w-[250px] md:w-[300px] lg:w-[350px] shadow-sm">
          <SearchIcon 
            className="text-gray-600 cursor-pointer" 
            size={18} 
            onClick={handleSearch} 
          />
          <input
            type="text"
            placeholder="Search..."
            className="ml-2 w-full outline-none text-sm bg-transparent"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch(e.target.value.toLowerCase());
            }}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* NOTIFICATION BELL */}
        <div className="relative" ref={dropdownRef}>
          <div onClick={handleBellClick} className="cursor-pointer">
            <svg 
              width="28" 
              height="28" 
              viewBox="0 0 24 24" 
              fill="#FFC107"
              className="hover:fill-orange-500 transition-colors"
            >
              <path d="M12 24c1.104 0 2-.897 2-2h-4c0 1.103.896 2 2 2zm6.707-5l1.293 1.293V21H4v-1.707L5.293 19H6v-7c0-3.309 2.691-6 6-6s6 2.691 6 6v7h.707z" />
            </svg>

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>

          {/* DROPDOWN */}
          {open && (
            <div className="absolute right-0 mt-3 w-[300px] md:w-[330px] bg-white shadow-lg border rounded-lg p-3 z-50">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold text-lg">Notifications</h2>
                <button onClick={markAll} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Mark all read
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3 border-b hover:bg-gray-50 ${
                        !n.read ? "bg-yellow-50" : ""
                      }`}
                    >
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{n.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-gray-400">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </p>
                            {!n.read && (
                              <button 
                                onClick={() => markAsRead(n._id)} 
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteOne(n._id)} 
                          className="text-red-500 hover:text-red-700 text-xs ml-2"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="border-t pt-2 mt-2">
                  <button
                    onClick={deleteAll}
                    className="w-full py-2 text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;