"use client";

import AnalyticsChart from '@/src/component/dashboard/AnalyticsChart';
import TopSection from '@/src/component/dashboard/TopSection';
import UserTable from '@/src/component/dashboard/UserTable';
import useAuthGuard from '@/utils/withAuth';
import React, { useState, useEffect, useRef } from 'react';

// SOCKET SYSTEM
import { connectSocket, disconnectSocket, getSocket } from "@/src/lib/socket";

const Index = () => {
  useAuthGuard();

  const placeholders = ['Search By User Name', 'Search By User ID', 'Search By User Mobile'];
  const [index, setIndex] = useState(0);

  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);   // ⭐ NEW
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);
  const BASE_URL = "https://matrimonial-backend-7ahc.onrender.com";

  const [adminPref, setAdminPref] = useState(null);

  /* ROTATE PLACEHOLDERS */
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % placeholders.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  /* CLOSE DROPDOWN IF CLICK OUTSIDE */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* FETCH ADMIN NOTIFICATION PREFERENCES */
  const loadAdminPrefs = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${BASE_URL}/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        setAdminPref(data.data);

        // auto connect socket
        if (data.data.notifications) {
          connectSocket(data.data._id);
        } else {
          disconnectSocket();
        }
      }
    } catch (err) {
      console.log("Admin Pref load error:", err);
    }
  };

  useEffect(() => {
    loadAdminPrefs();
  }, []);

  /* FETCH NOTIFICATIONS FROM API */
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${BASE_URL}/api/notification/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (data.success) {
        const list = data.data.reverse();
        setNotifications(list);
        setUnread(list.filter((n) => !n.read).length);   // ⭐ NEW
      }
    } catch (err) {
      console.log("Notification fetch error:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  /* RECEIVE REAL-TIME NOTIFICATIONS */
  useEffect(() => {
    if (!adminPref) return;

    const socket = getSocket();
    if (!socket) return;

    // NEW notification
    socket.on("new-notification", (data) => {
      setNotifications((prev) => [data, ...prev]);
      setUnread((u) => u + 1);   // ⭐ NEW
    });

    // mark-one from other tab
    socket.on("one-read", ({ id }) => {
      setNotifications((prev) =>
        prev.map((n) => n._id === id ? { ...n, read: true } : n)
      );
      setUnread((u) => Math.max(0, u - 1));   // ⭐ NEW
    });

    // mark-all from other tab
    socket.on("all-read", () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);   // ⭐ NEW
    });

    // delete-one sync
    socket.on("delete-one", ({ id }) => {
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    });

    // delete-all sync
    socket.on("delete-all", () => {
      setNotifications([]);
      setUnread(0);   // ⭐ NEW
    });

    return () => {
      socket.off("new-notification");
      socket.off("one-read");
      socket.off("all-read");
      socket.off("delete-one");
      socket.off("delete-all");
    };
  }, [adminPref]);

  /* SEND NOTIFICATION */
  const sendNotification = async (title, message) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${BASE_URL}/api/notification/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          message,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setNotifications((prev) => [data.data, ...prev]);
        setUnread((u) => u + 1);   // ⭐ NEW
        return true;
      }
    } catch (err) {
      console.log("Send Notification Error:", err);
    }

    return false;
  };

  /* MARK READ */
  const markRead = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await fetch(`${BASE_URL}/api/notification/mark-read/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications((prev) =>
        prev.map((n) => n._id === id ? { ...n, read: true } : n)
      );

      setUnread((u) => Math.max(0, u - 1));   // ⭐ NEW

      getSocket()?.emit("one-read", { id });

    } catch (e) {
      console.log(e);
    }
  };

  /* MARK ALL READ */
  const markAll = async () => {
    try {
      const token = localStorage.getItem("token");

      await fetch(`${BASE_URL}/api/notification/mark-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);   // ⭐ NEW

      getSocket()?.emit("all-read");

    } catch (e) {
      console.log(e);
    }
  };

  /* DELETE ONE */
  const deleteOne = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await fetch(`${BASE_URL}/api/notification/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications((prev) => prev.filter((n) => n._id !== id));

      getSocket()?.emit("delete-one", { id });

    } catch (e) {
      console.log(e);
    }
  };

  /* DELETE ALL */
  const deleteAll = async () => {
    try {
      const token = localStorage.getItem("token");

      await Promise.all(
        notifications.map((n) =>
          fetch(`${BASE_URL}/api/notification/${n._id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );

      setNotifications([]);
      setUnread(0);   // ⭐ NEW

      getSocket()?.emit("delete-all");

    } catch (e) {
      console.log(e);
    }
  };

  /* OPEN/CLOSE DROPDOWN */
  const handleBellClick = () => {
    const newOpen = !open;
    setOpen(newOpen);

    if (newOpen) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);   // ⭐ NEW

      getSocket()?.emit("all-read");
    }
  };

  const showRedDot = unread > 0;   // ⭐ FIXED

  return (
    <div className="flex w-full">

      {/* SIDEBAR */}
      <div className="fixed top-0 left-0 h-full w-[250px] bg-white shadow-md border-r p-4"></div>

      {/* TOP BAR */}
      <div className="fixed top-0 left-[250px] w-[calc(100%-250px)] h-[65px] bg-gray-100 border-b shadow-sm flex items-center justify-between px-10 z-50">
        <h1 className="text-[28px] font-extrabold text-black">Dashboard</h1>

        <div className="relative cursor-pointer" ref={dropdownRef}>
          
          {/* BELL */}
          <svg
            onClick={handleBellClick}
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            fill="#FFC107"
            viewBox="0 0 24 24"
            className="cursor-pointer"
          >
            <path d="M12 24c1.104 0 2-.897 2-2h-4c0 1.103.896 2 2 2zm6.707-5l1.293 1.293V21H4v-1.707L5.293 19H6v-7c0-3.309 2.691-6 6-6s6 2.691 6 6v7h.707zM18 18H6v-7c0-2.757 2.243-5 5-5s5 2.243 5 5v7z"/>
          </svg>

          {/* RED DOT */}
          {showRedDot && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-600 rounded-full border border-white"></span>
          )}

          {/* DROPDOWN */}
          {open && (
            <div className="absolute right-0 mt-3 w-80 bg-white shadow-xl border rounded-lg max-h-96 overflow-y-auto p-3">

              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-[16px]">Notifications</h3>
                <button onClick={markAll} className="text-blue-600 text-sm">Mark all read</button>
              </div>

              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 text-center">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div key={n._id} className="border-b pb-3 mb-3">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-[15px] capitalize">{n.title}</p>
                      <button
                        onClick={() => deleteOne(n._id)}
                        className="text-red-600 text-xs"
                      >
                        Delete
                      </button>
                    </div>

                    <p className="text-gray-600 text-[13px] mt-1">{n.message}</p>
                    <p className="text-gray-500 text-[11px] mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}

              {notifications.length > 0 && (
                <>
                  <hr className="border-gray-300 my-2" />
                  <button
                    onClick={deleteAll}
                    className="w-full py-2 text-red-600 font-semibold text-sm"
                  >
                    Delete All
                  </button>
                </>
              )}

            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="mt-[7px] w-full px-6">
        <TopSection />
        <AnalyticsChart />
        <UserTable />

        {/* SEND TEST NOTIFICATION */}
        <button
          onClick={() =>
            sendNotification("Test Notification", "This is a live notification.")
          }
          className="mt-10 px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          Send Test Notification
        </button>
      </div>

    </div>
  );
};

export default Index;
