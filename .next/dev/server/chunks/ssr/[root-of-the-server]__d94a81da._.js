module.exports = [
"[externals]/socket.io-client [external] (socket.io-client, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("socket.io-client");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/lib/socket.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "connectSocket",
    ()=>connectSocket,
    "disconnectSocket",
    ()=>disconnectSocket,
    "getSocket",
    ()=>getSocket
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$socket$2e$io$2d$client__$5b$external$5d$__$28$socket$2e$io$2d$client$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/socket.io-client [external] (socket.io-client, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$socket$2e$io$2d$client__$5b$external$5d$__$28$socket$2e$io$2d$client$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$socket$2e$io$2d$client__$5b$external$5d$__$28$socket$2e$io$2d$client$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
let socket = null;
function connectSocket(adminId) {
    if (socket && socket.connected) return socket;
    socket = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$socket$2e$io$2d$client__$5b$external$5d$__$28$socket$2e$io$2d$client$2c$__esm_import$29$__["io"])("https://merimonial-backend.onrender.com", {
        transports: [
            "websocket"
        ],
        secure: true,
        reconnection: true,
        reconnectionAttempts: 10,
        path: "/socket.io",
        query: {
            adminId
        }
    });
    socket.on("connect", ()=>{
        console.log(" SOCKET CONNECTED:", socket.id);
        socket.emit("join", adminId);
        console.log(" adminId:", adminId);
    });
    socket.on("disconnect", (reason)=>{
        console.log(":red_circle: SOCKET DISCONNECTED — reason:", reason); // :white_check_mark: reason add kiya
    });
    // :white_check_mark: Ye add karo — reconnect pe dobara join karo
    socket.on("reconnect", ()=>{
        console.log(":repeat: RECONNECTED — rejoining room");
        socket.emit("join", adminId);
    });
    return socket;
}
function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        console.log(":red_circle: SOCKET MANUALLY DISCONNECTED");
    }
}
function getSocket() {
    return socket;
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
// ⭐ SOCKET IMPORT
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/lib/socket.js [ssr] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
"use client";
;
;
;
;
const Search = ({ onSearch })=>{
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    const [notifications, setNotifications] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [unreadCount, setUnreadCount] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(0);
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const dropdownRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const BASE_URL = "https://merimonial-backend.onrender.com";
    /* --------------------------------------------
      1) ADMIN PREF → CONNECT SOCKET
  -------------------------------------------- */ const loadAdminPrefs = async ()=>{
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/auth/admin/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const json = await res.json();
            if (json.success) {
                const admin = json.data;
                if (admin.notifications === true) {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["connectSocket"])(admin._id);
                } else {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["disconnectSocket"])();
                }
            }
        } catch (err) {
            console.log("Admin Pref error:", err);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        loadAdminPrefs();
    }, []);
    /* --------------------------------------------
      2) FETCH ALL NOTIFICATIONS
  -------------------------------------------- */ const fetchNotifications = async ()=>{
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/notification/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                const list = data.data.reverse();
                setNotifications(list);
                setUnreadCount(list.filter((n)=>!n.read).length);
            }
        } catch (error) {
            console.log("Fetch Notification Error:", error);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        fetchNotifications();
    }, []);
    /* --------------------------------------------
      3) SOCKET SYNC LISTENERS
  -------------------------------------------- */ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["getSocket"])();
        if (!socket) return;
        console.log("🟢 Realtime Listener Enabled");
        socket.on("new-notification", (data)=>{
            setNotifications((prev)=>[
                    data,
                    ...prev
                ]);
            setUnreadCount((c)=>c + 1);
        });
        socket.on("all-read", ()=>{
            setNotifications((prev)=>prev.map((n)=>({
                        ...n,
                        read: true
                    })));
            setUnreadCount(0);
        });
        socket.on("one-read", ({ id })=>{
            setNotifications((prev)=>prev.map((n)=>n._id === id ? {
                        ...n,
                        read: true
                    } : n));
            setUnreadCount((c)=>Math.max(c - 1, 0));
        });
        socket.on("delete-one", ({ id })=>{
            setNotifications((prev)=>prev.filter((n)=>n._id !== id));
        });
        socket.on("delete-all", ()=>{
            setNotifications([]);
            setUnreadCount(0);
        });
        return ()=>{
            socket.off("new-notification");
            socket.off("all-read");
            socket.off("one-read");
            socket.off("delete-one");
            socket.off("delete-all");
        };
    }, []);
    /* --------------------------------------------
      SEARCH
  -------------------------------------------- */ const handleSearch = ()=>onSearch(searchQuery.toLowerCase());
    const handleKeyDown = (e)=>e.key === "Enter" && handleSearch();
    /* --------------------------------------------
      CLOSE DROPDOWN OUTSIDE CLICK
  -------------------------------------------- */ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const handler = (e)=>{
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return ()=>document.removeEventListener("mousedown", handler);
    }, []);
    /* --------------------------------------------
      MARK ALL READ (BELL CLICK)
  -------------------------------------------- */ const handleBellClick = async ()=>{
        const show = !open;
        setOpen(show);
        if (show) {
            markAll();
        }
    };
    /* --------------------------------------------
      MARK ALL READ
  -------------------------------------------- */ const markAll = async ()=>{
        const token = localStorage.getItem("token");
        setNotifications((p)=>p.map((n)=>({
                    ...n,
                    read: true
                })));
        setUnreadCount(0);
        await fetch(`${BASE_URL}/api/notification/mark-all`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["getSocket"])()?.emit("all-read");
    };
    /* --------------------------------------------
      MARK ONE READ
  -------------------------------------------- */ const markAsRead = async (id)=>{
        const token = localStorage.getItem("token");
        setNotifications((p)=>p.map((n)=>n._id === id ? {
                    ...n,
                    read: true
                } : n));
        setUnreadCount((c)=>Math.max(0, c - 1));
        await fetch(`${BASE_URL}/api/notification/mark-read/${id}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["getSocket"])()?.emit("one-read", {
            id
        });
    };
    /* --------------------------------------------
      DELETE ONE
  -------------------------------------------- */ const deleteOne = async (id)=>{
        const token = localStorage.getItem("token");
        setNotifications((p)=>p.filter((n)=>n._id !== id));
        await fetch(`${BASE_URL}/api/notification/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["getSocket"])()?.emit("delete-one", {
            id
        });
    };
    /* --------------------------------------------
      DELETE ALL
  -------------------------------------------- */ const deleteAll = async ()=>{
        const token = localStorage.getItem("token");
        setNotifications([]);
        setUnreadCount(0);
        await fetch(`${BASE_URL}/api/notification/delete-all`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["getSocket"])()?.emit("delete-all");
    };
    /* --------------------------------------------
      UI - Verification wale style mein
  -------------------------------------------- */ return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "bg-gray-100 px-6 py-4 shadow-sm border-b fixed top-0 z-50 flex items-center justify-between",
        style: {
            left: "250px",
            width: "calc(100% - 250px)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                className: "text-xl md:text-2xl font-bold text-gray-900",
                children: "Manage SubAdmin"
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                lineNumber: 210,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-3 md:gap-5",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "relative",
                    ref: dropdownRef,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            onClick: handleBellClick,
                            className: "cursor-pointer",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                    width: "28",
                                    height: "28",
                                    viewBox: "0 0 24 24",
                                    fill: "#FFC107",
                                    className: "hover:fill-orange-500 transition-colors",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                        d: "M12 24c1.104 0 2-.897 2-2h-4c0 1.103.896 2 2 2zm6.707-5l1.293 1.293V21H4v-1.707L5.293 19H6v-7c0-3.309 2.691-6 6-6s6 2.691 6 6v7h.707z"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                        lineNumber: 225,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                    lineNumber: 218,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                unreadCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                    className: "absolute -top-1 -right-1 h-4 w-4 bg-red-600 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white",
                                    children: unreadCount > 9 ? "9+" : unreadCount
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                    lineNumber: 229,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                            lineNumber: 217,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "absolute right-0 mt-3 w-[300px] md:w-[330px] bg-white shadow-lg border rounded-lg p-3 z-50",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "flex justify-between items-center mb-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                            className: "font-bold text-lg",
                                            children: "Notifications"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                            lineNumber: 239,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                            onClick: markAll,
                                            className: "text-blue-600 hover:text-blue-800 text-sm font-medium",
                                            children: "Mark all read"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                            lineNumber: 240,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                    lineNumber: 238,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "max-h-[300px] overflow-y-auto",
                                    children: notifications.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "text-center py-4",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                            className: "text-gray-500",
                                            children: "No notifications"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                            lineNumber: 248,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                        lineNumber: 247,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0)) : notifications.map((n)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: `p-3 border-b hover:bg-gray-50 ${!n.read ? "bg-yellow-50" : ""}`,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "flex-1",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                                className: "font-semibold text-gray-800",
                                                                children: n.title
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                                                lineNumber: 260,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                                className: "text-sm text-gray-600 mt-1",
                                                                children: n.message
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                                                lineNumber: 261,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "flex justify-between items-center mt-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                                        className: "text-xs text-gray-400",
                                                                        children: new Date(n.createdAt).toLocaleDateString()
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                                                        lineNumber: 263,
                                                                        columnNumber: 29
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    !n.read && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>markAsRead(n._id),
                                                                        className: "text-blue-600 hover:text-blue-800 text-xs font-medium",
                                                                        children: "Mark read"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                                                        lineNumber: 267,
                                                                        columnNumber: 31
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                                                lineNumber: 262,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                                        lineNumber: 259,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>deleteOne(n._id),
                                                        className: "text-red-500 hover:text-red-700 text-xs ml-2",
                                                        title: "Delete",
                                                        children: "✕"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                                        lineNumber: 276,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                                lineNumber: 258,
                                                columnNumber: 23
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, n._id, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                            lineNumber: 252,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)))
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                    lineNumber: 245,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                notifications.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "border-t pt-2 mt-2",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        onClick: deleteAll,
                                        className: "w-full py-2 text-red-600 hover:text-red-800 text-sm font-medium",
                                        children: "Delete All"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                        lineNumber: 291,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                    lineNumber: 290,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                            lineNumber: 237,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                    lineNumber: 216,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                lineNumber: 212,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
        lineNumber: 206,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = Search;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react-icons/fa/index.mjs [ssr] (ecmascript)");
;
;
;
const API_URL = 'https://merimonial-backend.onrender.com';
const DEFAULT_PERMISSIONS = [
    {
        key: 'DASHBOARD',
        label: 'Dashboard'
    },
    {
        key: 'ANALYTICS',
        label: 'Analytics'
    },
    {
        key: 'MANAGE_USERS',
        label: 'Manage Users'
    },
    {
        key: 'REPORTED_CONTENT',
        label: 'Reported Content'
    },
    {
        key: 'VARIFICATION_REQUEST',
        label: 'Verification Requests'
    },
    {
        key: 'PROFILE_DETAILS',
        label: 'Profile Details'
    }
];
const ROLE_SUGGESTIONS = [
    'reporter',
    'moderator',
    'verification_officer',
    'analyst'
];
const RoleInput = ({ value, onChange })=>{
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const ref = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const handler = (e)=>{
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return ()=>document.removeEventListener('mousedown', handler);
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "relative w-full",
        ref: ref,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                        type: "text",
                        placeholder: "Type or select role",
                        value: value,
                        onChange: (e)=>onChange(e.target.value),
                        className: "w-full px-3 py-2 text-sm focus:outline-none"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                        lineNumber: 30,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setOpen((p)=>!p),
                        className: "px-3 bg-gray-100 border-l border-gray-300 hover:bg-gray-200 transition",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$ssr$5d$__$28$ecmascript$29$__["FaChevronDown"], {
                            size: 11,
                            className: `text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                            lineNumber: 39,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                        lineNumber: 37,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                lineNumber: 29,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "absolute z-50 top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 overflow-hidden",
                children: ROLE_SUGGESTIONS.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>{
                            onChange(r);
                            setOpen(false);
                        },
                        className: `w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition ${value === r ? 'bg-indigo-50 font-semibold text-indigo-600' : 'text-gray-700'}`,
                        children: r
                    }, r, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                        lineNumber: 45,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                lineNumber: 43,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
        lineNumber: 28,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const PermCheckbox = ({ label, checked, onChange, onDelete, isCustom })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
        className: "flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none group",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                type: "checkbox",
                checked: checked,
                onChange: onChange,
                className: "w-4 h-4 rounded accent-blue-600 cursor-pointer"
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                lineNumber: 59,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                className: "flex-1",
                children: label
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                lineNumber: 61,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            isCustom && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: (e)=>{
                    e.preventDefault();
                    onDelete();
                },
                className: "text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition ml-1",
                title: "Remove",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$ssr$5d$__$28$ecmascript$29$__["FaTimes"], {
                    size: 10
                }, void 0, false, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                    lineNumber: 69,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                lineNumber: 63,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
        lineNumber: 58,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
// ─── Create Sub Admin Modal (with password visibility toggle) ────────────────
const CreateSubAdminModal = ({ onClose, onCreated })=>{
    const [step, setStep] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(1);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [createdId, setCreatedId] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    // 👇 State for password visibility
    const [showPassword, setShowPassword] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [form, setForm] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        gender: 'male',
        status: 'active',
        password: '',
        profileImage: null,
        profileImageFile: null
    });
    const [allPermissions, setAllPermissions] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(DEFAULT_PERMISSIONS);
    const [permissions, setPermissions] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [customInput, setCustomInput] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const fileInputRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const customInputRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const handleInput = (e)=>{
        const { name, value } = e.target;
        setForm((prev)=>({
                ...prev,
                [name]: value
            }));
    };
    const handleAvatarChange = (e)=>{
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev)=>setForm((prev)=>({
                    ...prev,
                    profileImage: ev.target.result,
                    profileImageFile: file
                }));
        reader.readAsDataURL(file);
    };
    const togglePerm = (key)=>setPermissions((prev)=>prev.includes(key) ? prev.filter((k)=>k !== key) : [
                ...prev,
                key
            ]);
    const handleAddCustomPermission = ()=>{
        const trimmed = customInput.trim();
        if (!trimmed) return;
        const key = trimmed.toUpperCase().replace(/\s+/g, '_');
        const label = trimmed.split(' ').map((w)=>w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        if (allPermissions.find((p)=>p.key === key)) {
            setCustomInput('');
            return;
        }
        const newPerm = {
            key,
            label,
            isCustom: true
        };
        setAllPermissions((prev)=>[
                ...prev,
                newPerm
            ]);
        setPermissions((prev)=>[
                ...prev,
                key
            ]);
        setCustomInput('');
        customInputRef.current?.focus();
    };
    const handleDeleteCustomPermission = (key)=>{
        setAllPermissions((prev)=>prev.filter((p)=>p.key !== key));
        setPermissions((prev)=>prev.filter((k)=>k !== key));
    };
    const handleSignUp = async ()=>{
        if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.role) {
            setError('Please fill all required fields');
            return;
        }
        if (!form.password || form.password.length < 6) {
            setError('Password is required and must be at least 6 characters');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('firstName', form.firstName);
            fd.append('lastName', form.lastName);
            fd.append('email', form.email);
            fd.append('phone', form.phone);
            fd.append('role', form.role);
            fd.append('gender', form.gender);
            fd.append('status', form.status);
            fd.append('password', form.password);
            if (form.profileImageFile) fd.append('profileImage', form.profileImageFile);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/sub-admin/signUp`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: fd
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setError(data.message || 'Signup failed');
                return;
            }
            setCreatedId(data.data._id);
            setStep(2);
        } catch (err) {
            setError('Network error. Try again.');
        } finally{
            setLoading(false);
        }
    };
    const handleAddPermissions = async ()=>{
        if (!createdId) return;
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/sub-admin/add/tab-permission`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    subAdminId: createdId,
                    permissionTabs: permissions
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setError(data.message || 'Permission update failed');
                return;
            }
            onCreated();
            onClose();
        } catch (err) {
            setError('Network error. Try again.');
        } finally{
            setLoading(false);
        }
    };
    const col1 = allPermissions.filter((_, i)=>i % 2 === 0);
    const col2 = allPermissions.filter((_, i)=>i % 2 !== 0);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center p-4",
        style: {
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)'
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[95vh] flex flex-col",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "flex justify-between items-center px-6 py-4 border-b flex-shrink-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    onClick: ()=>fileInputRef.current?.click(),
                                    className: "relative cursor-pointer group w-12 h-12",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                                            src: form.profileImage || 'https://via.placeholder.com/48',
                                            className: "w-12 h-12 rounded-full object-cover ring-2 ring-gray-200",
                                            alt: "avatar"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 218,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                className: "text-white text-xs",
                                                children: "📷"
                                            }, void 0, false, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                lineNumber: 221,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 220,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                            ref: fileInputRef,
                                            type: "file",
                                            accept: "image/*",
                                            onChange: handleAvatarChange,
                                            className: "hidden"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 223,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 217,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                            className: "text-lg font-bold text-gray-900",
                                            children: form.firstName ? `${form.firstName} ${form.lastName}` : 'New Sub Admin'
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 226,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        form.role && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-gray-500 capitalize",
                                            children: form.role
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 229,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                            className: "text-xs font-medium mt-0.5 text-green-600",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                    className: "inline-block w-2 h-2 rounded-full mr-1 bg-green-500 align-middle"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 231,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                form.status
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 230,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 225,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                            lineNumber: 216,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "text-gray-400 hover:text-gray-600 text-lg",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$ssr$5d$__$28$ecmascript$29$__["FaTimes"], {}, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                lineNumber: 236,
                                columnNumber: 91
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                            lineNumber: 236,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                    lineNumber: 215,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "flex gap-2 px-6 pt-4 flex-shrink-0",
                    children: [
                        'Basic Info',
                        'Permissions'
                    ].map((label, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                    style: {
                                        background: step === i + 1 ? '#4f46e5' : step > i + 1 ? '#16a34a' : '#e5e7eb',
                                        color: step >= i + 1 ? '#fff' : '#6b7280'
                                    },
                                    children: step > i + 1 ? '✓' : i + 1
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 243,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                    className: `text-sm font-medium ${step === i + 1 ? 'text-indigo-600' : 'text-gray-400'}`,
                                    children: label
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 250,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                i === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                    className: "text-gray-300 mx-1",
                                    children: "›"
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 251,
                                    columnNumber: 27
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, i, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                            lineNumber: 242,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)))
                }, void 0, false, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                    lineNumber: 240,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "overflow-y-auto flex-1 px-6 py-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("hr", {
                            className: "border-gray-100 mb-4"
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                            lineNumber: 258,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        step === 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 gap-x-4 gap-y-3 text-sm",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "First Name ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 265,
                                                            columnNumber: 96
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 265,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    name: "firstName",
                                                    placeholder: "e.g., Pritam",
                                                    value: form.firstName,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 266,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 264,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "Last Name ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 270,
                                                            columnNumber: 95
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 270,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    name: "lastName",
                                                    placeholder: "e.g., Sharma",
                                                    value: form.lastName,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 271,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 269,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "Email ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 275,
                                                            columnNumber: 91
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 275,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                    type: "email",
                                                    name: "email",
                                                    placeholder: "pritam@gmail.com",
                                                    value: form.email,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 276,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 274,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "Phone ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 280,
                                                            columnNumber: 91
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 280,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    name: "phone",
                                                    placeholder: "+91 XXXXXXXXXX",
                                                    value: form.phone,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 281,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 279,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "Password ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 286,
                                                            columnNumber: 94
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 286,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "relative",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                            type: showPassword ? "text" : "password",
                                                            name: "password",
                                                            placeholder: "At least 6 characters",
                                                            value: form.password,
                                                            onChange: handleInput,
                                                            className: "w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 288,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                            type: "button",
                                                            onClick: ()=>setShowPassword(!showPassword),
                                                            className: "absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700",
                                                            children: showPassword ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$ssr$5d$__$28$ecmascript$29$__["FaEyeSlash"], {
                                                                size: 16
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                                lineNumber: 301,
                                                                columnNumber: 39
                                                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$ssr$5d$__$28$ecmascript$29$__["FaEye"], {
                                                                size: 16
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                                lineNumber: 301,
                                                                columnNumber: 66
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 296,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 287,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 285,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: "Gender"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 306,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("select", {
                                                    name: "gender",
                                                    value: form.gender,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-white",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                                            value: "male",
                                                            children: "Male"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 309,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                                            value: "female",
                                                            children: "Female"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 310,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                                            value: "other",
                                                            children: "Other"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 311,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 307,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 305,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: "Status"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 315,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("select", {
                                                    name: "status",
                                                    value: form.status,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-white",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                                            value: "active",
                                                            children: "Active"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 318,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                                            value: "inactive",
                                                            children: "Inactive"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 319,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 316,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 314,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "col-span-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "Role ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 323,
                                                            columnNumber: 90
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 323,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(RoleInput, {
                                                    value: form.role,
                                                    onChange: (val)=>setForm((prev)=>({
                                                                ...prev,
                                                                role: val
                                                            }))
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 324,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 322,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "col-span-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: "Profile Photo (optional)"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 327,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    onClick: ()=>fileInputRef.current?.click(),
                                                    className: "flex items-center gap-4 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                                                            src: form.profileImage || 'https://via.placeholder.com/48',
                                                            className: "w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 flex-shrink-0",
                                                            alt: "preview"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 330,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                                    className: "text-sm font-semibold text-indigo-600",
                                                                    children: form.profileImage ? '✅ Photo selected — click to change' : '📷 Click to upload photo'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                                    lineNumber: 333,
                                                                    columnNumber: 23
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                                    className: "text-xs text-gray-400 mt-0.5",
                                                                    children: "JPG, PNG, WEBP supported"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                                    lineNumber: 336,
                                                                    columnNumber: 23
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 332,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 328,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 326,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 263,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                    className: "text-red-500 text-xs mt-3",
                                    children: error
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 341,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "flex justify-end gap-2 pt-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                            onClick: onClose,
                                            className: "px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition",
                                            children: "Cancel"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 343,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                            onClick: handleSignUp,
                                            disabled: loading,
                                            className: "px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60",
                                            children: loading ? 'Creating...' : 'Next: Permissions →'
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 344,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 342,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true),
                        step === 2 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "rounded-xl px-4 py-4",
                                    style: {
                                        background: '#fffbf0'
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                            className: "text-sm font-bold text-gray-800 mb-3",
                                            children: [
                                                "Assigned Permissions",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                    className: "ml-2 text-xs font-normal text-gray-400",
                                                    children: [
                                                        "(",
                                                        permissions.length,
                                                        " selected)"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 358,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 356,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-2 gap-x-4 gap-y-3 mb-4",
                                            children: [
                                                col1.map((perm)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(PermCheckbox, {
                                                        label: perm.label,
                                                        isCustom: perm.isCustom,
                                                        checked: permissions.includes(perm.key),
                                                        onChange: ()=>togglePerm(perm.key),
                                                        onDelete: ()=>handleDeleteCustomPermission(perm.key)
                                                    }, perm.key, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                        lineNumber: 363,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0))),
                                                col2.map((perm)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(PermCheckbox, {
                                                        label: perm.label,
                                                        isCustom: perm.isCustom,
                                                        checked: permissions.includes(perm.key),
                                                        onChange: ()=>togglePerm(perm.key),
                                                        onDelete: ()=>handleDeleteCustomPermission(perm.key)
                                                    }, perm.key, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                        lineNumber: 369,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 361,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "border-t border-yellow-200 pt-3 mt-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                    className: "text-xs font-semibold text-gray-500 mb-2",
                                                    children: "➕ Add Custom Permission"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 377,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "flex gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                            ref: customInputRef,
                                                            type: "text",
                                                            placeholder: "e.g., Manage Payments",
                                                            value: customInput,
                                                            onChange: (e)=>setCustomInput(e.target.value),
                                                            onKeyDown: (e)=>e.key === 'Enter' && handleAddCustomPermission(),
                                                            className: "flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 379,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                            type: "button",
                                                            onClick: handleAddCustomPermission,
                                                            disabled: !customInput.trim(),
                                                            className: "flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-40",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$ssr$5d$__$28$ecmascript$29$__["FaPlus"], {
                                                                    size: 10
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                                    lineNumber: 394,
                                                                    columnNumber: 23
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                " Add"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 388,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 378,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-gray-400 mt-1",
                                                    children: "Press Enter or click Add. Hover on custom items to remove them."
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 397,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 376,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 355,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                    className: "text-red-500 text-xs mt-3",
                                    children: error
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 401,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "flex justify-between gap-2 pt-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setStep(1),
                                            className: "px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition",
                                            children: "← Back"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 403,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "flex gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                    onClick: onClose,
                                                    className: "px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition",
                                                    children: "Cancel"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 405,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                    onClick: handleAddPermissions,
                                                    disabled: loading,
                                                    className: "px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60",
                                                    children: loading ? 'Saving...' : 'Create Sub Admin ✓'
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 406,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 404,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 402,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                    lineNumber: 257,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
            lineNumber: 212,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
        lineNumber: 210,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
// ─── Main SubAdminTable ───────────────────────────────────────────────────────
const SubAdminTable = ({ onView })=>{
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [statusFilter, setStatusFilter] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [currentPage, setCurrentPage] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(1);
    const [admins, setAdmins] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [totalPages, setTotalPages] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(1);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [showCreateModal, setShowCreateModal] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const limit = 10;
    const fetchAdmins = async ()=>{
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit
            });
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/sub-admin/all/sub-admin/list?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setAdmins(data.data || []);
                setTotalPages(data.totalPages || 1);
            }
        } catch (err) {
            console.error(err);
        } finally{
            setLoading(false);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        fetchAdmins();
    }, [
        search,
        statusFilter,
        currentPage
    ]);
    const handleRemove = async (id)=>{
        if (!confirm('Remove this sub admin?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/sub-admin/delete/sub-admin?id=${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setAdmins((prev)=>prev.filter((a)=>a._id !== id));
            } else {
                alert(data.message || 'Delete failed');
            }
        } catch (err) {
            alert('Network error. Try again.');
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "bg-white border border-gray-400 rounded shadow p-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "flex border p-1 rounded border-gray-400 shadow flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                        type: "text",
                        placeholder: "Search by Name / ID",
                        value: search,
                        onChange: (e)=>{
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        },
                        className: "border border-gray-300 focus:outline-0 px-3 py-2 rounded w-full sm:w-[20%]"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                        lineNumber: 480,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "flex flex-col sm:flex-row gap-3 w-full sm:w-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("select", {
                                value: statusFilter,
                                onChange: (e)=>{
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                },
                                className: "border border-gray-300 bg-gray-200 cursor-pointer p-1 rounded w-auto",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "Status"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                        lineNumber: 486,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                        value: "active",
                                        children: "Active"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                        lineNumber: 487,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                        value: "inactive",
                                        children: "Inactive"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                        lineNumber: 488,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                lineNumber: 484,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                onClick: ()=>setShowCreateModal(true),
                                className: "bg-indigo-600 text-white px-4 py-2 rounded w-full sm:w-auto hover:bg-indigo-700 transition",
                                children: "Create Sub Admin"
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                lineNumber: 490,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                        lineNumber: 483,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                lineNumber: 479,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            showCreateModal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(CreateSubAdminModal, {
                onClose: ()=>setShowCreateModal(false),
                onCreated: ()=>{
                    fetchAdmins();
                    setShowCreateModal(false);
                }
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                lineNumber: 498,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "overflow-x-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("table", {
                    className: "min-w-[700px] w-full border border-gray-400 text-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("thead", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("tr", {
                                className: "bg-gray-100 text-left",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("th", {
                                        className: "px-3 py-2",
                                        children: [
                                            "Sub Admin ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$ssr$5d$__$28$ecmascript$29$__["FaSort"], {
                                                className: "inline ml-1"
                                            }, void 0, false, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                lineNumber: 508,
                                                columnNumber: 51
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                        lineNumber: 508,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("th", {
                                        className: "px-3 py-2",
                                        children: "Email"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                        lineNumber: 509,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("th", {
                                        className: "px-3 py-2",
                                        children: [
                                            "Role ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$ssr$5d$__$28$ecmascript$29$__["FaSort"], {
                                                className: "inline ml-1"
                                            }, void 0, false, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                lineNumber: 510,
                                                columnNumber: 46
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                        lineNumber: 510,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("th", {
                                        className: "px-3 py-2",
                                        children: "Phone"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                        lineNumber: 511,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("th", {
                                        className: "px-3 py-2",
                                        children: "Status"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                        lineNumber: 512,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("th", {
                                        className: "px-3 py-2",
                                        children: "Actions"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                        lineNumber: 513,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                lineNumber: 507,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                            lineNumber: 506,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("tbody", {
                            children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("tr", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("td", {
                                    colSpan: 6,
                                    className: "text-center py-6 text-gray-400",
                                    children: "Loading..."
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 518,
                                    columnNumber: 19
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                lineNumber: 518,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)) : admins.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("tr", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("td", {
                                    colSpan: 6,
                                    className: "text-center py-6 text-gray-400",
                                    children: "No sub admins found."
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 520,
                                    columnNumber: 19
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                lineNumber: 520,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)) : admins.map((admin)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("tr", {
                                    className: "border border-gray-400 hover:bg-gray-50",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("td", {
                                            className: "px-3 py-2",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                                                        src: admin.profileImage || 'https://via.placeholder.com/32',
                                                        className: "w-8 h-8 rounded-full object-cover",
                                                        alt: admin.firstName
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                        lineNumber: 526,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                                className: "font-semibold",
                                                                children: [
                                                                    admin.firstName,
                                                                    " ",
                                                                    admin.lastName
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                                lineNumber: 529,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                                className: "text-xs text-gray-500",
                                                                children: [
                                                                    admin.subAdminId,
                                                                    " / ",
                                                                    admin.gender
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                                lineNumber: 530,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                        lineNumber: 528,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                lineNumber: 525,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 524,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("td", {
                                            className: "px-3 py-2",
                                            children: admin.email
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 534,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("td", {
                                            className: "px-3 py-2 capitalize",
                                            children: admin.role
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 535,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("td", {
                                            className: "px-3 py-2",
                                            children: admin.phone
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 536,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("td", {
                                            className: "px-3 py-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                    className: `inline-block w-3 h-3 rounded-full mr-2 ${admin.status === 'active' ? 'bg-green-700' : 'bg-red-500'}`
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 538,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                    className: "capitalize",
                                                    children: admin.status
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 539,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 537,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("td", {
                                            className: "px-3 py-2 space-x-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>onView && onView(admin),
                                                    className: "text-black hover:underline",
                                                    children: "View"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 542,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>handleRemove(admin._id),
                                                    className: "text-white bg-red-500 px-2 py-1 rounded hover:bg-red-600 transition",
                                                    children: "Remove"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 543,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 541,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, admin._id, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 523,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)))
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                            lineNumber: 516,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                    lineNumber: 505,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                lineNumber: 504,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            totalPages > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "text-center mt-4 flex flex-wrap justify-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        disabled: currentPage === 1,
                        onClick: ()=>setCurrentPage((p)=>p - 1),
                        className: "px-3 py-1 rounded bg-gray-200 disabled:opacity-40",
                        children: "◄"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                        lineNumber: 554,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    Array.from({
                        length: totalPages
                    }).map((_, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                            className: `px-3 py-1 rounded ${currentPage === idx + 1 ? 'bg-black text-white' : 'bg-gray-200'}`,
                            onClick: ()=>setCurrentPage(idx + 1),
                            children: idx + 1
                        }, idx, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                            lineNumber: 557,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        disabled: currentPage === totalPages,
                        onClick: ()=>setCurrentPage((p)=>p + 1),
                        className: "px-3 py-1 rounded bg-gray-200 disabled:opacity-40",
                        children: "►"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                        lineNumber: 563,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                lineNumber: 553,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
        lineNumber: 477,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = SubAdminTable;
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminRemoveModal.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
;
;
const ConfirmDialog = ({ user, onConfirm, onCancel })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 bg-black/30 flex items-center justify-center z-50",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "bg-white p-5 rounded shadow w-[300px] text-center",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                    className: "mb-4 font-medium",
                    children: [
                        "Are you sure you wanna remove ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("br", {}, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminRemoveModal.js",
                            lineNumber: 8,
                            columnNumber: 41
                        }, ("TURBOPACK compile-time value", void 0)),
                        user.name,
                        " (",
                        user.userId,
                        ") from Sub Admin?"
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminRemoveModal.js",
                    lineNumber: 7,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "flex justify-center gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                            onClick: onCancel,
                            className: "bg-green-600 text-white px-4 py-1 rounded",
                            children: "No, Quit"
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminRemoveModal.js",
                            lineNumber: 12,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                            onClick: onConfirm,
                            className: "bg-red-600 text-white px-4 py-1 rounded",
                            children: "Yes, Remove"
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminRemoveModal.js",
                            lineNumber: 13,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminRemoveModal.js",
                    lineNumber: 11,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminRemoveModal.js",
            lineNumber: 6,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminRemoveModal.js",
        lineNumber: 5,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = ConfirmDialog;
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react-icons/fa/index.mjs [ssr] (ecmascript)");
;
;
;
const API_URL = 'https://merimonial-backend.onrender.com';
// ✅ Master list of all available permissions (same as in CreateSubAdminModal)
const MASTER_PERMISSIONS = [
    {
        key: 'DASHBOARD',
        label: 'Dashboard'
    },
    {
        key: 'ANALYTICS',
        label: 'Analytics'
    },
    {
        key: 'MANAGE_USERS',
        label: 'Manage Users'
    },
    {
        key: 'REPORTED_CONTENT',
        label: 'Reported Content'
    },
    {
        key: 'VARIFICATION_REQUEST',
        label: 'Verification Requests'
    },
    {
        key: 'PROFILE_DETAILS',
        label: 'Profile Details'
    }
];
const ROLE_SUGGESTIONS = [
    'reporter',
    'moderator',
    'verification_officer',
    'analyst'
];
const RoleInput = ({ value, onChange })=>{
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const ref = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const handler = (e)=>{
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return ()=>document.removeEventListener('mousedown', handler);
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "relative w-full",
        ref: ref,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                        type: "text",
                        placeholder: "Type or select role",
                        value: value,
                        onChange: (e)=>onChange(e.target.value),
                        className: "w-full px-3 py-2 text-sm focus:outline-none"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                        lineNumber: 31,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setOpen((p)=>!p),
                        className: "px-3 bg-gray-100 border-l border-gray-300 hover:bg-gray-200 transition",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$ssr$5d$__$28$ecmascript$29$__["FaChevronDown"], {
                            size: 11,
                            className: `text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                            lineNumber: 40,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                        lineNumber: 38,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                lineNumber: 30,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "absolute z-50 top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 overflow-hidden",
                children: ROLE_SUGGESTIONS.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>{
                            onChange(r);
                            setOpen(false);
                        },
                        className: `w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition ${value === r ? 'bg-indigo-50 font-semibold text-indigo-600' : 'text-gray-700'}`,
                        children: r
                    }, r, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                        lineNumber: 46,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                lineNumber: 44,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
        lineNumber: 29,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const PermCheckbox = ({ label, checked, onChange })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
        className: "flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                type: "checkbox",
                checked: checked,
                onChange: onChange,
                className: "w-4 h-4 rounded accent-blue-600 cursor-pointer"
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                lineNumber: 60,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                className: "flex-1",
                children: label
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                lineNumber: 62,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
        lineNumber: 59,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const EditModal = ({ data, onClose, onUpdate, onRefresh })=>{
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [success, setSuccess] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [debugInfo, setDebugInfo] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [form, setForm] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        gender: 'male',
        status: 'active',
        profileImage: null,
        profileImageFile: null
    });
    // Permissions state: list of currently assigned permission objects
    const [assignedPermissions, setAssignedPermissions] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [selectedPermissionToAdd, setSelectedPermissionToAdd] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const fileInputRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    // Initialize form and permissions from props
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (data) {
            console.log('Data received in EditModal:', data);
            setForm({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                phone: data.phone || '',
                role: data.role || '',
                gender: data.gender || 'male',
                status: data.status || 'active',
                profileImage: data.profileImage || null,
                profileImageFile: null
            });
            // Initialize permissions from data.permissions (array of strings or objects)
            if (data.permissions && Array.isArray(data.permissions)) {
                const perms = data.permissions.map((perm)=>{
                    if (typeof perm === 'string') {
                        // Find from master list or create a custom object
                        const found = MASTER_PERMISSIONS.find((p)=>p.key === perm);
                        if (found) return found;
                        return {
                            key: perm,
                            label: perm.replace(/_/g, ' '),
                            isCustom: true
                        };
                    }
                    return perm;
                });
                setAssignedPermissions(perms);
            } else {
                setAssignedPermissions([]);
            }
        }
    }, [
        data
    ]);
    const handleInput = (e)=>{
        const { name, value } = e.target;
        setForm((prev)=>({
                ...prev,
                [name]: value
            }));
    };
    const handleAvatarChange = (e)=>{
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev)=>setForm((prev)=>({
                    ...prev,
                    profileImage: ev.target.result,
                    profileImageFile: file
                }));
        reader.readAsDataURL(file);
    };
    // Toggle a permission checkbox
    const togglePerm = (permKey)=>{
        setAssignedPermissions((prev)=>{
            const exists = prev.find((p)=>p.key === permKey);
            if (exists) {
                return prev.filter((p)=>p.key !== permKey);
            } else {
                // Add from master list
                const master = MASTER_PERMISSIONS.find((p)=>p.key === permKey);
                if (master) return [
                    ...prev,
                    master
                ];
                // If not in master (shouldn't happen), add as custom
                return [
                    ...prev,
                    {
                        key: permKey,
                        label: permKey.replace(/_/g, ' ')
                    }
                ];
            }
        });
    };
    // Add permission from dropdown
    const handleAddPermissionFromDropdown = ()=>{
        if (!selectedPermissionToAdd) return;
        // Check if already assigned
        if (assignedPermissions.some((p)=>p.key === selectedPermissionToAdd)) {
            setError('Permission already added');
            setTimeout(()=>setError(''), 2000);
            return;
        }
        const master = MASTER_PERMISSIONS.find((p)=>p.key === selectedPermissionToAdd);
        if (master) {
            setAssignedPermissions((prev)=>[
                    ...prev,
                    master
                ]);
        } else {
            // Fallback (should not happen because dropdown only shows master keys)
            setAssignedPermissions((prev)=>[
                    ...prev,
                    {
                        key: selectedPermissionToAdd,
                        label: selectedPermissionToAdd.replace(/_/g, ' ')
                    }
                ]);
        }
        setSelectedPermissionToAdd('');
    };
    // Remove a permission (only custom ones or any permission)
    const handleRemovePermission = (permKey)=>{
        setAssignedPermissions((prev)=>prev.filter((p)=>p.key !== permKey));
    };
    // Available permissions for dropdown (those not already assigned)
    const availablePermissions = MASTER_PERMISSIONS.filter((master)=>!assignedPermissions.some((assigned)=>assigned.key === master.key));
    const handleUpdate = async ()=>{
        if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.role) {
            setError('Please fill all required fields');
            return;
        }
        setError('');
        setSuccess('');
        setDebugInfo('');
        setLoading(true);
        try {
            // Update profile using FormData
            const fd = new FormData();
            fd.append('firstName', form.firstName);
            fd.append('lastName', form.lastName);
            fd.append('email', form.email);
            fd.append('phone', form.phone);
            fd.append('role', form.role);
            fd.append('gender', form.gender);
            fd.append('status', form.status);
            if (form.profileImageFile) fd.append('profileImage', form.profileImageFile);
            const token = localStorage.getItem('token');
            const updateUrl = `${API_URL}/api/sub-admin/update/sub-admin-profile/${data._id}`;
            const res = await fetch(updateUrl, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: fd
            });
            const responseData = await res.json();
            if (!res.ok || !responseData.success) {
                setError(responseData.message || 'Update failed');
                setLoading(false);
                return;
            }
            // Update permissions
            const permissionKeys = assignedPermissions.map((p)=>p.key);
            const permRes = await fetch(`${API_URL}/api/sub-admin/add/tab-permission`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    subAdminId: data._id,
                    permissionTabs: permissionKeys
                })
            });
            const permData = await permRes.json();
            if (!permRes.ok || !permData.success) {
                console.error('Permission update failed:', permData.message);
                setError('Profile updated but permission update failed');
            } else {
                setSuccess('Profile and permissions updated successfully!');
            }
            if (onRefresh) await onRefresh();
            if (onUpdate) onUpdate();
            setTimeout(()=>onClose(), 1000);
        } catch (err) {
            console.error('Update error:', err);
            setError(`Network error: ${err.message}`);
        } finally{
            setLoading(false);
        }
    };
    // Split assigned permissions into two columns for display
    const col1 = assignedPermissions.filter((_, i)=>i % 2 === 0);
    const col2 = assignedPermissions.filter((_, i)=>i % 2 !== 0);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center p-4",
        style: {
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)'
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[95vh] flex flex-col",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "flex justify-between items-center px-6 py-4 border-b flex-shrink-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    onClick: ()=>fileInputRef.current?.click(),
                                    className: "relative cursor-pointer group w-12 h-12",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                                            src: form.profileImage || 'https://via.placeholder.com/48',
                                            className: "w-12 h-12 rounded-full object-cover ring-2 ring-gray-200",
                                            alt: "avatar"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 270,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                className: "text-white text-xs",
                                                children: "📷"
                                            }, void 0, false, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                lineNumber: 276,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 275,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                            ref: fileInputRef,
                                            type: "file",
                                            accept: "image/*",
                                            onChange: handleAvatarChange,
                                            className: "hidden"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 278,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 269,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                            className: "text-lg font-bold text-gray-900",
                                            children: "Edit Sub Admin"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 281,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-gray-500",
                                            children: "Update profile information"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 282,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 280,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                            lineNumber: 268,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "text-gray-400 hover:text-gray-600 text-lg",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$ssr$5d$__$28$ecmascript$29$__["FaTimes"], {}, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                lineNumber: 285,
                                columnNumber: 91
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                            lineNumber: 285,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                    lineNumber: 267,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "overflow-y-auto flex-1 px-6 py-4",
                    children: [
                        success && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "mb-4 p-3 bg-green-50 border border-green-200 rounded-lg",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                className: "text-green-700 text-sm",
                                children: [
                                    "✅ ",
                                    success
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                lineNumber: 292,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                            lineNumber: 291,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-lg",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                    className: "text-red-700 text-sm",
                                    children: [
                                        "❌ ",
                                        error
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 297,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                debugInfo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("pre", {
                                    className: "text-xs text-red-500 mt-1",
                                    children: debugInfo
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 298,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                            lineNumber: 296,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "mb-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                    className: "text-md font-semibold text-gray-900 mb-3",
                                    children: "📝 Basic Information"
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 304,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 gap-x-4 gap-y-3 text-sm",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "First Name ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 307,
                                                            columnNumber: 94
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 307,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    name: "firstName",
                                                    value: form.firstName,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 308,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 306,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "Last Name ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 312,
                                                            columnNumber: 93
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 312,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    name: "lastName",
                                                    value: form.lastName,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 313,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 311,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "Email ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 317,
                                                            columnNumber: 89
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 317,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                    type: "email",
                                                    name: "email",
                                                    value: form.email,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 318,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 316,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "Phone ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 322,
                                                            columnNumber: 89
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 322,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    name: "phone",
                                                    value: form.phone,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 323,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 321,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: "Gender"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 327,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("select", {
                                                    name: "gender",
                                                    value: form.gender,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                                            value: "male",
                                                            children: "Male"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 330,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                                            value: "female",
                                                            children: "Female"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 331,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                                            value: "other",
                                                            children: "Other"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 332,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 328,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 326,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: "Status"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 336,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("select", {
                                                    name: "status",
                                                    value: form.status,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                                            value: "active",
                                                            children: "Active"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 339,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                                            value: "inactive",
                                                            children: "Inactive"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 340,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 337,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 335,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "col-span-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "Role ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 344,
                                                            columnNumber: 88
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 344,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(RoleInput, {
                                                    value: form.role,
                                                    onChange: (val)=>setForm((prev)=>({
                                                                ...prev,
                                                                role: val
                                                            }))
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 345,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 343,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 305,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                            lineNumber: 303,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "rounded-xl px-4 py-4 bg-amber-50",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                    className: "text-sm font-bold text-gray-800 mb-3",
                                    children: [
                                        "Assigned Permissions",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                            className: "ml-2 text-xs font-normal text-gray-400",
                                            children: [
                                                "(",
                                                assignedPermissions.length,
                                                " selected)"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 354,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 352,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "mb-4 flex gap-2 items-end",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "flex-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: "➕ Add Permission"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 360,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("select", {
                                                    value: selectedPermissionToAdd,
                                                    onChange: (e)=>setSelectedPermissionToAdd(e.target.value),
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 bg-white",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                                            value: "",
                                                            children: "-- Select a permission --"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 366,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        availablePermissions.map((perm)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                                                value: perm.key,
                                                                children: perm.label
                                                            }, perm.key, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                                lineNumber: 368,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 361,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 359,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                            onClick: handleAddPermissionFromDropdown,
                                            disabled: !selectedPermissionToAdd,
                                            className: "flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-40",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$ssr$5d$__$28$ecmascript$29$__["FaPlus"], {
                                                    size: 12
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 377,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                " Add"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 372,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 358,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 gap-x-4 gap-y-3",
                                    children: [
                                        col1.map((perm)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "flex items-center justify-between group",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(PermCheckbox, {
                                                        label: perm.label,
                                                        checked: true,
                                                        onChange: ()=>togglePerm(perm.key)
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                        lineNumber: 385,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>handleRemovePermission(perm.key),
                                                        className: "text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition",
                                                        title: "Remove",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$ssr$5d$__$28$ecmascript$29$__["FaTimes"], {
                                                            size: 10
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 395,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                        lineNumber: 390,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, perm.key, true, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                lineNumber: 384,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))),
                                        col2.map((perm)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "flex items-center justify-between group",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(PermCheckbox, {
                                                        label: perm.label,
                                                        checked: true,
                                                        onChange: ()=>togglePerm(perm.key)
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                        lineNumber: 401,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>handleRemovePermission(perm.key),
                                                        className: "text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition",
                                                        title: "Remove",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$ssr$5d$__$28$ecmascript$29$__["FaTimes"], {
                                                            size: 10
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 411,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                        lineNumber: 406,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, perm.key, true, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                lineNumber: 400,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 382,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                assignedPermissions.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-gray-400 text-center py-2",
                                    children: "No permissions assigned. Use the dropdown to add."
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 418,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                            lineNumber: 351,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                    onClick: onClose,
                                    disabled: loading,
                                    className: "px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300",
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 424,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                    onClick: handleUpdate,
                                    disabled: loading,
                                    className: "px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60",
                                    children: loading ? 'Updating...' : 'Update Changes ✓'
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 428,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                            lineNumber: 423,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                    lineNumber: 289,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
            lineNumber: 264,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
        lineNumber: 262,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = EditModal;
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// components/SubAdmin/SummaryCards.js
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
;
;
const SummaryCards = ({ title, count, users, borderColor = 'border-gray-400' })=>{
    // Get up to 5 profile images (filter out null/undefined)
    const avatars = users.map((user)=>user.profileImage).filter((src)=>src).slice(0, 5);
    const remaining = users.length - avatars.length;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: `border rounded-2xl p-6 shadow-md bg-white text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${borderColor}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                className: "text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1",
                children: title
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js",
                lineNumber: 16,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                className: "text-3xl font-extrabold text-gray-800 mb-3",
                children: count
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js",
                lineNumber: 19,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "flex justify-center -space-x-2 overflow-hidden mb-2",
                children: avatars.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
                    children: [
                        avatars.map((src, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                                src: src,
                                alt: "avatar",
                                className: "inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover shadow-sm",
                                onError: (e)=>e.target.style.display = 'none'
                            }, idx, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js",
                                lineNumber: 25,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))),
                        remaining > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-200 text-gray-600 text-xs font-medium ring-2 ring-white",
                            children: [
                                "+",
                                remaining
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js",
                            lineNumber: 34,
                            columnNumber: 15
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                    className: "text-gray-400 text-sm",
                    children: "No images"
                }, void 0, false, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js",
                    lineNumber: 40,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js",
                lineNumber: 21,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js",
        lineNumber: 15,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = SummaryCards;
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SubAdminTable$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SubAdminRemoveModal$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminRemoveModal.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SubAdminViewModal$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SummaryCards$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js [ssr] (ecmascript)");
;
;
;
;
;
;
// API base URL – adjust if needed
const API_BASE = 'https://merimonial-backend.onrender.com';
// Helper to get auth headers (adjust token key as per your app)
const getAuthHeaders = ()=>{
    const token = localStorage.getItem('token'); // or 'authToken', etc.
    return {
        'Content-Type': 'application/json',
        ...token && {
            Authorization: `Bearer ${token}`
        }
    };
};
const SubAdminPage = ()=>{
    const [admins, setAdmins] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [viewData, setViewData] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [removeId, setRemoveId] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    // Transform API admin to UI format
    const transformAdmin = (apiAdmin, uiStatus)=>({
            ...apiAdmin,
            id: apiAdmin._id,
            status: uiStatus,
            lastActive: apiAdmin.updatedAt ? new Date(apiAdmin.updatedAt).toLocaleDateString() : new Date(apiAdmin.createdAt).toLocaleDateString(),
            // Ensure the following fields are present (if missing, provide defaults)
            firstName: apiAdmin.firstName || '',
            lastName: apiAdmin.lastName || '',
            email: apiAdmin.email || '',
            role: apiAdmin.role || '',
            profileImage: apiAdmin.profileImage || null
        });
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const fetchSubAdmins = async ()=>{
            try {
                const headers = getAuthHeaders();
                // Fetch active and inactive in parallel
                const [activeRes, inactiveRes] = await Promise.all([
                    fetch(`${API_BASE}/api/sub-admin/filter/sub-admin/active`, {
                        headers
                    }),
                    fetch(`${API_BASE}/api/sub-admin/filter/sub-admin/inactive`, {
                        headers
                    })
                ]);
                if (!activeRes.ok || !inactiveRes.ok) {
                    if (activeRes.status === 401 || inactiveRes.status === 401) {
                        throw new Error('Authentication required. Please log in again.');
                    }
                    throw new Error('Failed to fetch sub‑admins');
                }
                const activeData = await activeRes.json();
                const inactiveData = await inactiveRes.json();
                if (!activeData.success || !inactiveData.success) {
                    throw new Error(activeData.message || inactiveData.message || 'API error');
                }
                const activeAdmins = (activeData.response || []).map((admin)=>transformAdmin(admin, 'Active'));
                const inactiveAdmins = (inactiveData.response || []).map((admin)=>transformAdmin(admin, 'Suspended'));
                setAdmins([
                    ...activeAdmins,
                    ...inactiveAdmins
                ]);
            } catch (err) {
                setError(err.message);
            } finally{
                setLoading(false);
            }
        };
        fetchSubAdmins();
    }, []);
    // Handler for adding a new sub‑admin
    const handleAdd = async (newAdmin)=>{
        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${API_BASE}/api/sub-admin`, {
                method: 'POST',
                headers,
                body: JSON.stringify(newAdmin)
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to create sub-admin');
            }
            const created = data.response;
            const uiStatus = created.status === 'active' ? 'Active' : 'Suspended';
            const transformed = transformAdmin(created, uiStatus);
            setAdmins((prev)=>[
                    ...prev,
                    transformed
                ]);
        } catch (err) {
            console.error('Add error:', err);
        // Optionally show an error toast/notification
        }
    };
    // Handler for removing a sub‑admin
    const handleRemove = async ()=>{
        if (!removeId) return;
        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${API_BASE}/api/sub-admin/${removeId}`, {
                method: 'DELETE',
                headers
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to delete sub-admin');
            }
            setAdmins((prev)=>prev.filter((admin)=>admin.id !== removeId));
            setRemoveId(null);
        } catch (err) {
            console.error('Delete error:', err);
        // Optionally show an error message
        }
    };
    // Derived counts for summary cards
    const active = admins.filter((a)=>a.status === 'Active');
    const suspended = admins.filter((a)=>a.status === 'Suspended');
    // Show loading spinner
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "flex justify-center items-center h-64",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                lineNumber: 141,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
            lineNumber: 140,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0));
    }
    // Show error if any
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "text-center text-red-500 p-4 border rounded-xl bg-red-50 m-4",
            children: [
                "Error loading sub‑admins: ",
                error
            ]
        }, void 0, true, {
            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
            lineNumber: 149,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0));
    }
    // Render same UI as original, but with real data
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "flex gap-2 justify-around p-4 flex-wrap",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SummaryCards$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                        title: "Total Sub Admin",
                        count: admins.length,
                        users: admins,
                        borderColor: "border-gray-400"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                        lineNumber: 159,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SummaryCards$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                        title: "Active Sub Admin",
                        count: active.length,
                        users: active,
                        borderColor: "border-green-500"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                        lineNumber: 165,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SummaryCards$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                        title: "Suspended Sub Admin",
                        count: suspended.length,
                        users: suspended,
                        borderColor: "border-red-500"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                        lineNumber: 171,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                lineNumber: 158,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "p-18",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SubAdminTable$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                    data: admins,
                    onView: (admin)=>setViewData(admin),
                    onRemove: (id)=>setRemoveId(id),
                    onAdd: handleAdd
                }, void 0, false, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                    lineNumber: 180,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                lineNumber: 179,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            viewData && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SubAdminViewModal$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                data: viewData,
                onClose: ()=>setViewData(null)
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                lineNumber: 189,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            removeId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SubAdminRemoveModal$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                onConfirm: handleRemove,
                onCancel: ()=>setRemoveId(null),
                user: admins.find((a)=>a.id === removeId)
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                lineNumber: 193,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true);
};
const __TURBOPACK__default__export__ = SubAdminPage;
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/pages/managesubadmin/index.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$Search$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SubAdminPage$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$Search$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$Search$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
const SubAdmins = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$Search$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/pages/managesubadmin/index.js",
                lineNumber: 9,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "pt-[100px] h-screen overflow-y-auto px-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SubAdminPage$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/pages/managesubadmin/index.js",
                    lineNumber: 13,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/pages/managesubadmin/index.js",
                lineNumber: 12,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true);
};
const __TURBOPACK__default__export__ = SubAdmins;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__d94a81da._.js.map