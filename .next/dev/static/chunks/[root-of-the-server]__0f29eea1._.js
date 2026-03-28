(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[turbopack]/browser/dev/hmr-client/hmr-client.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/// <reference path="../../../shared/runtime-types.d.ts" />
/// <reference path="../../runtime/base/dev-globals.d.ts" />
/// <reference path="../../runtime/base/dev-protocol.d.ts" />
/// <reference path="../../runtime/base/dev-extensions.ts" />
__turbopack_context__.s([
    "connect",
    ()=>connect,
    "setHooks",
    ()=>setHooks,
    "subscribeToUpdate",
    ()=>subscribeToUpdate
]);
function connect({ addMessageListener, sendMessage, onUpdateError = console.error }) {
    addMessageListener((msg)=>{
        switch(msg.type){
            case 'turbopack-connected':
                handleSocketConnected(sendMessage);
                break;
            default:
                try {
                    if (Array.isArray(msg.data)) {
                        for(let i = 0; i < msg.data.length; i++){
                            handleSocketMessage(msg.data[i]);
                        }
                    } else {
                        handleSocketMessage(msg.data);
                    }
                    applyAggregatedUpdates();
                } catch (e) {
                    console.warn('[Fast Refresh] performing full reload\n\n' + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + 'You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n' + 'Consider migrating the non-React component export to a separate file and importing it into both files.\n\n' + 'It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n' + 'Fast Refresh requires at least one parent function component in your React tree.');
                    onUpdateError(e);
                    location.reload();
                }
                break;
        }
    });
    const queued = globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS;
    if (queued != null && !Array.isArray(queued)) {
        throw new Error('A separate HMR handler was already registered');
    }
    globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS = {
        push: ([chunkPath, callback])=>{
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    };
    if (Array.isArray(queued)) {
        for (const [chunkPath, callback] of queued){
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    }
}
const updateCallbackSets = new Map();
function sendJSON(sendMessage, message) {
    sendMessage(JSON.stringify(message));
}
function resourceKey(resource) {
    return JSON.stringify({
        path: resource.path,
        headers: resource.headers || null
    });
}
function subscribeToUpdates(sendMessage, resource) {
    sendJSON(sendMessage, {
        type: 'turbopack-subscribe',
        ...resource
    });
    return ()=>{
        sendJSON(sendMessage, {
            type: 'turbopack-unsubscribe',
            ...resource
        });
    };
}
function handleSocketConnected(sendMessage) {
    for (const key of updateCallbackSets.keys()){
        subscribeToUpdates(sendMessage, JSON.parse(key));
    }
}
// we aggregate all pending updates until the issues are resolved
const chunkListsWithPendingUpdates = new Map();
function aggregateUpdates(msg) {
    const key = resourceKey(msg.resource);
    let aggregated = chunkListsWithPendingUpdates.get(key);
    if (aggregated) {
        aggregated.instruction = mergeChunkListUpdates(aggregated.instruction, msg.instruction);
    } else {
        chunkListsWithPendingUpdates.set(key, msg);
    }
}
function applyAggregatedUpdates() {
    if (chunkListsWithPendingUpdates.size === 0) return;
    hooks.beforeRefresh();
    for (const msg of chunkListsWithPendingUpdates.values()){
        triggerUpdate(msg);
    }
    chunkListsWithPendingUpdates.clear();
    finalizeUpdate();
}
function mergeChunkListUpdates(updateA, updateB) {
    let chunks;
    if (updateA.chunks != null) {
        if (updateB.chunks == null) {
            chunks = updateA.chunks;
        } else {
            chunks = mergeChunkListChunks(updateA.chunks, updateB.chunks);
        }
    } else if (updateB.chunks != null) {
        chunks = updateB.chunks;
    }
    let merged;
    if (updateA.merged != null) {
        if (updateB.merged == null) {
            merged = updateA.merged;
        } else {
            // Since `merged` is an array of updates, we need to merge them all into
            // one, consistent update.
            // Since there can only be `EcmascriptMergeUpdates` in the array, there is
            // no need to key on the `type` field.
            let update = updateA.merged[0];
            for(let i = 1; i < updateA.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateA.merged[i]);
            }
            for(let i = 0; i < updateB.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateB.merged[i]);
            }
            merged = [
                update
            ];
        }
    } else if (updateB.merged != null) {
        merged = updateB.merged;
    }
    return {
        type: 'ChunkListUpdate',
        chunks,
        merged
    };
}
function mergeChunkListChunks(chunksA, chunksB) {
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    return chunks;
}
function mergeChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted' || updateA.type === 'deleted' && updateB.type === 'added') {
        return undefined;
    }
    if (updateA.type === 'partial') {
        invariant(updateA.instruction, 'Partial updates are unsupported');
    }
    if (updateB.type === 'partial') {
        invariant(updateB.instruction, 'Partial updates are unsupported');
    }
    return undefined;
}
function mergeChunkListEcmascriptMergedUpdates(mergedA, mergedB) {
    const entries = mergeEcmascriptChunkEntries(mergedA.entries, mergedB.entries);
    const chunks = mergeEcmascriptChunksUpdates(mergedA.chunks, mergedB.chunks);
    return {
        type: 'EcmascriptMergedUpdate',
        entries,
        chunks
    };
}
function mergeEcmascriptChunkEntries(entriesA, entriesB) {
    return {
        ...entriesA,
        ...entriesB
    };
}
function mergeEcmascriptChunksUpdates(chunksA, chunksB) {
    if (chunksA == null) {
        return chunksB;
    }
    if (chunksB == null) {
        return chunksA;
    }
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeEcmascriptChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    if (Object.keys(chunks).length === 0) {
        return undefined;
    }
    return chunks;
}
function mergeEcmascriptChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted') {
        // These two completely cancel each other out.
        return undefined;
    }
    if (updateA.type === 'deleted' && updateB.type === 'added') {
        const added = [];
        const deleted = [];
        const deletedModules = new Set(updateA.modules ?? []);
        const addedModules = new Set(updateB.modules ?? []);
        for (const moduleId of addedModules){
            if (!deletedModules.has(moduleId)) {
                added.push(moduleId);
            }
        }
        for (const moduleId of deletedModules){
            if (!addedModules.has(moduleId)) {
                deleted.push(moduleId);
            }
        }
        if (added.length === 0 && deleted.length === 0) {
            return undefined;
        }
        return {
            type: 'partial',
            added,
            deleted
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'partial') {
        const added = new Set([
            ...updateA.added ?? [],
            ...updateB.added ?? []
        ]);
        const deleted = new Set([
            ...updateA.deleted ?? [],
            ...updateB.deleted ?? []
        ]);
        if (updateB.added != null) {
            for (const moduleId of updateB.added){
                deleted.delete(moduleId);
            }
        }
        if (updateB.deleted != null) {
            for (const moduleId of updateB.deleted){
                added.delete(moduleId);
            }
        }
        return {
            type: 'partial',
            added: [
                ...added
            ],
            deleted: [
                ...deleted
            ]
        };
    }
    if (updateA.type === 'added' && updateB.type === 'partial') {
        const modules = new Set([
            ...updateA.modules ?? [],
            ...updateB.added ?? []
        ]);
        for (const moduleId of updateB.deleted ?? []){
            modules.delete(moduleId);
        }
        return {
            type: 'added',
            modules: [
                ...modules
            ]
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'deleted') {
        // We could eagerly return `updateB` here, but this would potentially be
        // incorrect if `updateA` has added modules.
        const modules = new Set(updateB.modules ?? []);
        if (updateA.added != null) {
            for (const moduleId of updateA.added){
                modules.delete(moduleId);
            }
        }
        return {
            type: 'deleted',
            modules: [
                ...modules
            ]
        };
    }
    // Any other update combination is invalid.
    return undefined;
}
function invariant(_, message) {
    throw new Error(`Invariant: ${message}`);
}
const CRITICAL = [
    'bug',
    'error',
    'fatal'
];
function compareByList(list, a, b) {
    const aI = list.indexOf(a) + 1 || list.length;
    const bI = list.indexOf(b) + 1 || list.length;
    return aI - bI;
}
const chunksWithIssues = new Map();
function emitIssues() {
    const issues = [];
    const deduplicationSet = new Set();
    for (const [_, chunkIssues] of chunksWithIssues){
        for (const chunkIssue of chunkIssues){
            if (deduplicationSet.has(chunkIssue.formatted)) continue;
            issues.push(chunkIssue);
            deduplicationSet.add(chunkIssue.formatted);
        }
    }
    sortIssues(issues);
    hooks.issues(issues);
}
function handleIssues(msg) {
    const key = resourceKey(msg.resource);
    let hasCriticalIssues = false;
    for (const issue of msg.issues){
        if (CRITICAL.includes(issue.severity)) {
            hasCriticalIssues = true;
        }
    }
    if (msg.issues.length > 0) {
        chunksWithIssues.set(key, msg.issues);
    } else if (chunksWithIssues.has(key)) {
        chunksWithIssues.delete(key);
    }
    emitIssues();
    return hasCriticalIssues;
}
const SEVERITY_ORDER = [
    'bug',
    'fatal',
    'error',
    'warning',
    'info',
    'log'
];
const CATEGORY_ORDER = [
    'parse',
    'resolve',
    'code generation',
    'rendering',
    'typescript',
    'other'
];
function sortIssues(issues) {
    issues.sort((a, b)=>{
        const first = compareByList(SEVERITY_ORDER, a.severity, b.severity);
        if (first !== 0) return first;
        return compareByList(CATEGORY_ORDER, a.category, b.category);
    });
}
const hooks = {
    beforeRefresh: ()=>{},
    refresh: ()=>{},
    buildOk: ()=>{},
    issues: (_issues)=>{}
};
function setHooks(newHooks) {
    Object.assign(hooks, newHooks);
}
function handleSocketMessage(msg) {
    sortIssues(msg.issues);
    handleIssues(msg);
    switch(msg.type){
        case 'issues':
            break;
        case 'partial':
            // aggregate updates
            aggregateUpdates(msg);
            break;
        default:
            // run single update
            const runHooks = chunkListsWithPendingUpdates.size === 0;
            if (runHooks) hooks.beforeRefresh();
            triggerUpdate(msg);
            if (runHooks) finalizeUpdate();
            break;
    }
}
function finalizeUpdate() {
    hooks.refresh();
    hooks.buildOk();
    // This is used by the Next.js integration test suite to notify it when HMR
    // updates have been completed.
    // TODO: Only run this in test environments (gate by `process.env.__NEXT_TEST_MODE`)
    if (globalThis.__NEXT_HMR_CB) {
        globalThis.__NEXT_HMR_CB();
        globalThis.__NEXT_HMR_CB = null;
    }
}
function subscribeToChunkUpdate(chunkListPath, sendMessage, callback) {
    return subscribeToUpdate({
        path: chunkListPath
    }, sendMessage, callback);
}
function subscribeToUpdate(resource, sendMessage, callback) {
    const key = resourceKey(resource);
    let callbackSet;
    const existingCallbackSet = updateCallbackSets.get(key);
    if (!existingCallbackSet) {
        callbackSet = {
            callbacks: new Set([
                callback
            ]),
            unsubscribe: subscribeToUpdates(sendMessage, resource)
        };
        updateCallbackSets.set(key, callbackSet);
    } else {
        existingCallbackSet.callbacks.add(callback);
        callbackSet = existingCallbackSet;
    }
    return ()=>{
        callbackSet.callbacks.delete(callback);
        if (callbackSet.callbacks.size === 0) {
            callbackSet.unsubscribe();
            updateCallbackSets.delete(key);
        }
    };
}
function triggerUpdate(msg) {
    const key = resourceKey(msg.resource);
    const callbackSet = updateCallbackSets.get(key);
    if (!callbackSet) {
        return;
    }
    for (const callback of callbackSet.callbacks){
        callback(msg);
    }
    if (msg.type === 'notFound') {
        // This indicates that the resource which we subscribed to either does not exist or
        // has been deleted. In either case, we should clear all update callbacks, so if a
        // new subscription is created for the same resource, it will send a new "subscribe"
        // message to the server.
        // No need to send an "unsubscribe" message to the server, it will have already
        // dropped the update stream before sending the "notFound" message.
        updateCallbackSets.delete(key);
    }
}
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/lib/socket.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "connectSocket",
    ()=>connectSocket,
    "disconnectSocket",
    ()=>disconnectSocket,
    "getSocket",
    ()=>getSocket
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/socket.io-client/build/esm/index.js [client] (ecmascript) <locals>");
;
let socket = null;
function connectSocket(adminId) {
    if (socket && socket.connected) return socket;
    socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["io"])("https://merimonial-backend.onrender.com", {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/index.js [client] (ecmascript)");
// ⭐ SOCKET IMPORT
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/lib/socket.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const Search = ({ onSearch })=>{
    _s();
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [notifications, setNotifications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [unreadCount, setUnreadCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const dropdownRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
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
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["connectSocket"])(admin._id);
                } else {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["disconnectSocket"])();
                }
            }
        } catch (err) {
            console.log("Admin Pref error:", err);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Search.useEffect": ()=>{
            loadAdminPrefs();
        }
    }["Search.useEffect"], []);
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
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Search.useEffect": ()=>{
            fetchNotifications();
        }
    }["Search.useEffect"], []);
    /* --------------------------------------------
      3) SOCKET SYNC LISTENERS
  -------------------------------------------- */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Search.useEffect": ()=>{
            const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getSocket"])();
            if (!socket) return;
            console.log("🟢 Realtime Listener Enabled");
            socket.on("new-notification", {
                "Search.useEffect": (data)=>{
                    setNotifications({
                        "Search.useEffect": (prev)=>[
                                data,
                                ...prev
                            ]
                    }["Search.useEffect"]);
                    setUnreadCount({
                        "Search.useEffect": (c)=>c + 1
                    }["Search.useEffect"]);
                }
            }["Search.useEffect"]);
            socket.on("all-read", {
                "Search.useEffect": ()=>{
                    setNotifications({
                        "Search.useEffect": (prev)=>prev.map({
                                "Search.useEffect": (n)=>({
                                        ...n,
                                        read: true
                                    })
                            }["Search.useEffect"])
                    }["Search.useEffect"]);
                    setUnreadCount(0);
                }
            }["Search.useEffect"]);
            socket.on("one-read", {
                "Search.useEffect": ({ id })=>{
                    setNotifications({
                        "Search.useEffect": (prev)=>prev.map({
                                "Search.useEffect": (n)=>n._id === id ? {
                                        ...n,
                                        read: true
                                    } : n
                            }["Search.useEffect"])
                    }["Search.useEffect"]);
                    setUnreadCount({
                        "Search.useEffect": (c)=>Math.max(c - 1, 0)
                    }["Search.useEffect"]);
                }
            }["Search.useEffect"]);
            socket.on("delete-one", {
                "Search.useEffect": ({ id })=>{
                    setNotifications({
                        "Search.useEffect": (prev)=>prev.filter({
                                "Search.useEffect": (n)=>n._id !== id
                            }["Search.useEffect"])
                    }["Search.useEffect"]);
                }
            }["Search.useEffect"]);
            socket.on("delete-all", {
                "Search.useEffect": ()=>{
                    setNotifications([]);
                    setUnreadCount(0);
                }
            }["Search.useEffect"]);
            return ({
                "Search.useEffect": ()=>{
                    socket.off("new-notification");
                    socket.off("all-read");
                    socket.off("one-read");
                    socket.off("delete-one");
                    socket.off("delete-all");
                }
            })["Search.useEffect"];
        }
    }["Search.useEffect"], []);
    /* --------------------------------------------
      SEARCH
  -------------------------------------------- */ const handleSearch = ()=>onSearch(searchQuery.toLowerCase());
    const handleKeyDown = (e)=>e.key === "Enter" && handleSearch();
    /* --------------------------------------------
      CLOSE DROPDOWN OUTSIDE CLICK
  -------------------------------------------- */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Search.useEffect": ()=>{
            const handler = {
                "Search.useEffect.handler": (e)=>{
                    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                        setOpen(false);
                    }
                }
            }["Search.useEffect.handler"];
            document.addEventListener("mousedown", handler);
            return ({
                "Search.useEffect": ()=>document.removeEventListener("mousedown", handler)
            })["Search.useEffect"];
        }
    }["Search.useEffect"], []);
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
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getSocket"])()?.emit("all-read");
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
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getSocket"])()?.emit("one-read", {
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
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getSocket"])()?.emit("delete-one", {
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
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getSocket"])()?.emit("delete-all");
    };
    /* --------------------------------------------
      UI - Verification wale style mein
  -------------------------------------------- */ return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-gray-100 px-6 py-4 shadow-sm border-b fixed top-0 z-50 flex items-center justify-between",
        style: {
            left: "250px",
            width: "calc(100% - 250px)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-xl md:text-2xl font-bold text-gray-900",
                children: "Manage SubAdmin"
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                lineNumber: 210,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-3 md:gap-5",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative",
                    ref: dropdownRef,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            onClick: handleBellClick,
                            className: "cursor-pointer",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "28",
                                    height: "28",
                                    viewBox: "0 0 24 24",
                                    fill: "#FFC107",
                                    className: "hover:fill-orange-500 transition-colors",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
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
                                unreadCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                        open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute right-0 mt-3 w-[300px] md:w-[330px] bg-white shadow-lg border rounded-lg p-3 z-50",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-between items-center mb-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "font-bold text-lg",
                                            children: "Notifications"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                            lineNumber: 239,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "max-h-[300px] overflow-y-auto",
                                    children: notifications.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-center py-4",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
                                    }, ("TURBOPACK compile-time value", void 0)) : notifications.map((n)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `p-3 border-b hover:bg-gray-50 ${!n.read ? "bg-yellow-50" : ""}`,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex-1",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                                className: "font-semibold text-gray-800",
                                                                children: n.title
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                                                lineNumber: 260,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-sm text-gray-600 mt-1",
                                                                children: n.message
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                                                lineNumber: 261,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex justify-between items-center mt-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-xs text-gray-400",
                                                                        children: new Date(n.createdAt).toLocaleDateString()
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                                                                        lineNumber: 263,
                                                                        columnNumber: 29
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    !n.read && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                                notifications.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "border-t pt-2 mt-2",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
_s(Search, "kk1XGXjXhVozWOCyp2lPnJbneVs=");
_c = Search;
const __TURBOPACK__default__export__ = Search;
var _c;
__turbopack_context__.k.register(_c, "Search");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react-icons/fa/index.mjs [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
;
;
const API_URL = 'https://merimonial-backend.onrender.com';
const DEFAULT_PERMISSIONS = [
    {
        key: 'CAN_VIEW_USER',
        label: 'Can View User'
    },
    {
        key: 'EDIT_USER_INFO',
        label: 'Edit User Info'
    },
    {
        key: 'ACCESS_ANALYTICS',
        label: 'Access Analytics'
    },
    {
        key: 'MODERATE_REPORTS',
        label: 'Moderate Reports'
    },
    {
        key: 'BLOCK_REPORTED_USERS',
        label: 'Block Reported Users'
    },
    {
        key: 'VERIFY_DOCUMENTS',
        label: 'Verify Documents'
    },
    {
        key: 'APPROVE_PROFILES',
        label: 'Approve Profiles'
    }
];
const ROLE_SUGGESTIONS = [
    'reporter',
    'moderator',
    'verification_officer',
    'analyst',
    'support'
];
const RoleInput = ({ value, onChange })=>{
    _s();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RoleInput.useEffect": ()=>{
            const handler = {
                "RoleInput.useEffect.handler": (e)=>{
                    if (ref.current && !ref.current.contains(e.target)) setOpen(false);
                }
            }["RoleInput.useEffect.handler"];
            document.addEventListener('mousedown', handler);
            return ({
                "RoleInput.useEffect": ()=>document.removeEventListener('mousedown', handler)
            })["RoleInput.useEffect"];
        }
    }["RoleInput.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative w-full",
        ref: ref,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        placeholder: "Type or select role",
                        value: value,
                        onChange: (e)=>onChange(e.target.value),
                        className: "w-full px-3 py-2 text-sm focus:outline-none"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                        lineNumber: 31,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setOpen((p)=>!p),
                        className: "px-3 bg-gray-100 border-l border-gray-300 hover:bg-gray-200 transition",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["FaChevronDown"], {
                            size: 11,
                            className: `text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                            lineNumber: 40,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                        lineNumber: 38,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                lineNumber: 30,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute z-50 top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 overflow-hidden",
                children: ROLE_SUGGESTIONS.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>{
                            onChange(r);
                            setOpen(false);
                        },
                        className: `w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition ${value === r ? 'bg-indigo-50 font-semibold text-indigo-600' : 'text-gray-700'}`,
                        children: r
                    }, r, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                        lineNumber: 46,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                lineNumber: 44,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
        lineNumber: 29,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(RoleInput, "wl9VvfhnMVWQ+kCekFjcRPEi3/0=");
_c = RoleInput;
const PermCheckbox = ({ label, checked, onChange, onDelete, isCustom })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: "flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none group",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "checkbox",
                checked: checked,
                onChange: onChange,
                className: "w-4 h-4 rounded accent-blue-600 cursor-pointer"
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                lineNumber: 60,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "flex-1",
                children: label
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                lineNumber: 62,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            isCustom && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: (e)=>{
                    e.preventDefault();
                    onDelete();
                },
                className: "text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition ml-1",
                title: "Remove",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["FaTimes"], {
                    size: 10
                }, void 0, false, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                    lineNumber: 70,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                lineNumber: 64,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
        lineNumber: 59,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c1 = PermCheckbox;
// ─── Create Sub Admin Modal ───────────────────────────────────────────────────
const CreateSubAdminModal = ({ onClose, onCreated })=>{
    _s1();
    const [step, setStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [createdId, setCreatedId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [form, setForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
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
    const [allPermissions, setAllPermissions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(DEFAULT_PERMISSIONS);
    const [permissions, setPermissions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [customInput, setCustomInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const fileInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const customInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
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
    // ✅ Add custom permission
    const handleAddCustomPermission = ()=>{
        const trimmed = customInput.trim();
        if (!trimmed) return;
        // Convert to UPPER_SNAKE_CASE for key
        const key = trimmed.toUpperCase().replace(/\s+/g, '_');
        const label = trimmed.split(' ').map((w)=>w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        // Check for duplicates
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
            ]); // auto-check it
        setCustomInput('');
        customInputRef.current?.focus();
    };
    // ✅ Delete custom permission
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center p-4",
        style: {
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)'
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[95vh] flex flex-col",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between items-center px-6 py-4 border-b flex-shrink-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    onClick: ()=>fileInputRef.current?.click(),
                                    className: "relative cursor-pointer group w-12 h-12",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: form.profileImage || 'https://via.placeholder.com/48',
                                            className: "w-12 h-12 rounded-full object-cover ring-2 ring-gray-200",
                                            alt: "avatar"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 223,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-white text-xs",
                                                children: "📷"
                                            }, void 0, false, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                lineNumber: 226,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 225,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ref: fileInputRef,
                                            type: "file",
                                            accept: "image/*",
                                            onChange: handleAvatarChange,
                                            className: "hidden"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 228,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 222,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-lg font-bold text-gray-900",
                                            children: form.firstName ? `${form.firstName} ${form.lastName}` : 'New Sub Admin'
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 231,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        form.role && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-gray-500 capitalize",
                                            children: form.role
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 234,
                                            columnNumber: 29
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs font-medium mt-0.5 text-green-600",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "inline-block w-2 h-2 rounded-full mr-1 bg-green-500 align-middle"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 236,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                form.status
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 235,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 230,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                            lineNumber: 221,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "text-gray-400 hover:text-gray-600 text-lg",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["FaTimes"], {}, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                lineNumber: 241,
                                columnNumber: 91
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                            lineNumber: 241,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                    lineNumber: 220,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex gap-2 px-6 pt-4 flex-shrink-0",
                    children: [
                        'Basic Info',
                        'Permissions'
                    ].map((label, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                    style: {
                                        background: step === i + 1 ? '#4f46e5' : step > i + 1 ? '#16a34a' : '#e5e7eb',
                                        color: step >= i + 1 ? '#fff' : '#6b7280'
                                    },
                                    children: step > i + 1 ? '✓' : i + 1
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 248,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: `text-sm font-medium ${step === i + 1 ? 'text-indigo-600' : 'text-gray-400'}`,
                                    children: label
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 255,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                i === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-gray-300 mx-1",
                                    children: "›"
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 256,
                                    columnNumber: 27
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, i, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                            lineNumber: 247,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)))
                }, void 0, false, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                    lineNumber: 245,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "overflow-y-auto flex-1 px-6 py-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("hr", {
                            className: "border-gray-100 mb-4"
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                            lineNumber: 263,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        step === 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 gap-x-4 gap-y-3 text-sm",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "First Name ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 270,
                                                            columnNumber: 96
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 270,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    name: "firstName",
                                                    placeholder: "e.g., Pritam",
                                                    value: form.firstName,
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
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "Last Name ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 275,
                                                            columnNumber: 95
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 275,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    name: "lastName",
                                                    placeholder: "e.g., Sharma",
                                                    value: form.lastName,
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
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "Email ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "email",
                                                    name: "email",
                                                    placeholder: "pritam@gmail.com",
                                                    value: form.email,
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
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "Phone ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 285,
                                                            columnNumber: 91
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 285,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    name: "phone",
                                                    placeholder: "+91 XXXXXXXXXX",
                                                    value: form.phone,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 286,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 284,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "Password ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 290,
                                                            columnNumber: 94
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 290,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "password",
                                                    name: "password",
                                                    placeholder: "At least 6 characters",
                                                    value: form.password,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 291,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 289,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: "Gender"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 296,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                    name: "gender",
                                                    value: form.gender,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-white",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: "male",
                                                            children: "Male"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 299,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: "female",
                                                            children: "Female"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 300,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: "other",
                                                            children: "Other"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 301,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 297,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 295,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: "Status"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 305,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                    name: "status",
                                                    value: form.status,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-white",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: "active",
                                                            children: "Active"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 308,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: "inactive",
                                                            children: "Inactive"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 309,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 306,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 304,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "col-span-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "Role ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 313,
                                                            columnNumber: 90
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 313,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RoleInput, {
                                                    value: form.role,
                                                    onChange: (val)=>setForm((prev)=>({
                                                                ...prev,
                                                                role: val
                                                            }))
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 314,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 312,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "col-span-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: "Profile Photo (optional)"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 317,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    onClick: ()=>fileInputRef.current?.click(),
                                                    className: "flex items-center gap-4 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                            src: form.profileImage || 'https://via.placeholder.com/48',
                                                            className: "w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 flex-shrink-0",
                                                            alt: "preview"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 320,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-sm font-semibold text-indigo-600",
                                                                    children: form.profileImage ? '✅ Photo selected — click to change' : '📷 Click to upload photo'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                                    lineNumber: 323,
                                                                    columnNumber: 23
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-xs text-gray-400 mt-0.5",
                                                                    children: "JPG, PNG, WEBP supported"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                                    lineNumber: 326,
                                                                    columnNumber: 23
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 322,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 318,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 316,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 268,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-red-500 text-xs mt-3",
                                    children: error
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 331,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-end gap-2 pt-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: onClose,
                                            className: "px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition",
                                            children: "Cancel"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 333,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: handleSignUp,
                                            disabled: loading,
                                            className: "px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60",
                                            children: loading ? 'Creating...' : 'Next: Permissions →'
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 334,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 332,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true),
                        step === 2 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "rounded-xl px-4 py-4",
                                    style: {
                                        background: '#fffbf0'
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-sm font-bold text-gray-800 mb-3",
                                            children: [
                                                "Assigned Permissions",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "ml-2 text-xs font-normal text-gray-400",
                                                    children: [
                                                        "(",
                                                        permissions.length,
                                                        " selected)"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 348,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 346,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-2 gap-x-4 gap-y-3 mb-4",
                                            children: [
                                                col1.map((perm)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PermCheckbox, {
                                                        label: perm.label,
                                                        isCustom: perm.isCustom,
                                                        checked: permissions.includes(perm.key),
                                                        onChange: ()=>togglePerm(perm.key),
                                                        onDelete: ()=>handleDeleteCustomPermission(perm.key)
                                                    }, perm.key, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                        lineNumber: 353,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0))),
                                                col2.map((perm)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PermCheckbox, {
                                                        label: perm.label,
                                                        isCustom: perm.isCustom,
                                                        checked: permissions.includes(perm.key),
                                                        onChange: ()=>togglePerm(perm.key),
                                                        onDelete: ()=>handleDeleteCustomPermission(perm.key)
                                                    }, perm.key, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                        lineNumber: 359,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 351,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "border-t border-yellow-200 pt-3 mt-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs font-semibold text-gray-500 mb-2",
                                                    children: "➕ Add Custom Permission"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 368,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            ref: customInputRef,
                                                            type: "text",
                                                            placeholder: "e.g., Manage Payments",
                                                            value: customInput,
                                                            onChange: (e)=>setCustomInput(e.target.value),
                                                            onKeyDown: (e)=>e.key === 'Enter' && handleAddCustomPermission(),
                                                            className: "flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 370,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            type: "button",
                                                            onClick: handleAddCustomPermission,
                                                            disabled: !customInput.trim(),
                                                            className: "flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-40",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["FaPlus"], {
                                                                    size: 10
                                                                }, void 0, false, {
                                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                                    lineNumber: 385,
                                                                    columnNumber: 23
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                " Add"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                            lineNumber: 379,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 369,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-gray-400 mt-1",
                                                    children: "Press Enter or click Add. Hover on custom items to remove them."
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 388,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 367,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 345,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-red-500 text-xs mt-3",
                                    children: error
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 392,
                                    columnNumber: 25
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-between gap-2 pt-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setStep(1),
                                            className: "px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition",
                                            children: "← Back"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 394,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: onClose,
                                                    className: "px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition",
                                                    children: "Cancel"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 396,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: handleAddPermissions,
                                                    disabled: loading,
                                                    className: "px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60",
                                                    children: loading ? 'Saving...' : 'Create Sub Admin ✓'
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 397,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 395,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 393,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                    lineNumber: 262,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
            lineNumber: 217,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
        lineNumber: 215,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s1(CreateSubAdminModal, "hB4yOWk4+477OU4HFYZY2qSnChw=");
_c2 = CreateSubAdminModal;
// ─── Main SubAdminTable ───────────────────────────────────────────────────────
const SubAdminTable = ({ onView })=>{
    _s2();
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [statusFilter, setStatusFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [currentPage, setCurrentPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [admins, setAdmins] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [totalPages, setTotalPages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showCreateModal, setShowCreateModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
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
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SubAdminTable.useEffect": ()=>{
            fetchAdmins();
        }
    }["SubAdminTable.useEffect"], [
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-white border border-gray-400 rounded shadow p-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex border p-1 rounded border-gray-400 shadow flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                        lineNumber: 471,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col sm:flex-row gap-3 w-full sm:w-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: statusFilter,
                                onChange: (e)=>{
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                },
                                className: "border border-gray-300 bg-gray-200 cursor-pointer p-1 rounded w-auto",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "Status"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                        lineNumber: 477,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "active",
                                        children: "Active"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                        lineNumber: 478,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "inactive",
                                        children: "Inactive"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                        lineNumber: 479,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                lineNumber: 475,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setShowCreateModal(true),
                                className: "bg-indigo-600 text-white px-4 py-2 rounded w-full sm:w-auto hover:bg-indigo-700 transition",
                                children: "Create Sub Admin"
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                lineNumber: 481,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                        lineNumber: 474,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                lineNumber: 470,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            showCreateModal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CreateSubAdminModal, {
                onClose: ()=>setShowCreateModal(false),
                onCreated: ()=>{
                    fetchAdmins();
                    setShowCreateModal(false);
                }
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                lineNumber: 489,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "overflow-x-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                    className: "min-w-[700px] w-full border border-gray-400 text-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                className: "bg-gray-100 text-left",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "px-3 py-2",
                                        children: [
                                            "Sub Admin ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["FaSort"], {
                                                className: "inline ml-1"
                                            }, void 0, false, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                lineNumber: 499,
                                                columnNumber: 51
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                        lineNumber: 499,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "px-3 py-2",
                                        children: "Email"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                        lineNumber: 500,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "px-3 py-2",
                                        children: [
                                            "Role ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["FaSort"], {
                                                className: "inline ml-1"
                                            }, void 0, false, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                lineNumber: 501,
                                                columnNumber: 46
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                        lineNumber: 501,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "px-3 py-2",
                                        children: "Phone"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                        lineNumber: 502,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "px-3 py-2",
                                        children: "Status"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                        lineNumber: 503,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "px-3 py-2",
                                        children: "Actions"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                        lineNumber: 504,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                lineNumber: 498,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                            lineNumber: 497,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    colSpan: 6,
                                    className: "text-center py-6 text-gray-400",
                                    children: "Loading..."
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 509,
                                    columnNumber: 19
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                lineNumber: 509,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)) : admins.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    colSpan: 6,
                                    className: "text-center py-6 text-gray-400",
                                    children: "No sub admins found."
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 511,
                                    columnNumber: 19
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                lineNumber: 511,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)) : admins.map((admin)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    className: "border border-gray-400 hover:bg-gray-50",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-3 py-2",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                        src: admin.profileImage || 'https://via.placeholder.com/32',
                                                        className: "w-8 h-8 rounded-full object-cover",
                                                        alt: admin.firstName
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                        lineNumber: 517,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "font-semibold",
                                                                children: [
                                                                    admin.firstName,
                                                                    " ",
                                                                    admin.lastName
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                                lineNumber: 520,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-xs text-gray-500",
                                                                children: [
                                                                    admin.subAdminId,
                                                                    " / ",
                                                                    admin.gender
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                                lineNumber: 521,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                        lineNumber: 519,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                lineNumber: 516,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 515,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-3 py-2",
                                            children: admin.email
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 525,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-3 py-2 capitalize",
                                            children: admin.role
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 526,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-3 py-2",
                                            children: admin.phone
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 527,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-3 py-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `inline-block w-3 h-3 rounded-full mr-2 ${admin.status === 'active' ? 'bg-green-700' : 'bg-red-500'}`
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 529,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "capitalize",
                                                    children: admin.status
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 530,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 528,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-3 py-2 space-x-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>onView && onView(admin),
                                                    className: "text-black hover:underline",
                                                    children: "View"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 533,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>handleRemove(admin._id),
                                                    className: "text-white bg-red-500 px-2 py-1 rounded hover:bg-red-600 transition",
                                                    children: "Remove"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                                    lineNumber: 534,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                            lineNumber: 532,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, admin._id, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                                    lineNumber: 514,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)))
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                            lineNumber: 507,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                    lineNumber: 496,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                lineNumber: 495,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            totalPages > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center mt-4 flex flex-wrap justify-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        disabled: currentPage === 1,
                        onClick: ()=>setCurrentPage((p)=>p - 1),
                        className: "px-3 py-1 rounded bg-gray-200 disabled:opacity-40",
                        children: "◄"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                        lineNumber: 545,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    Array.from({
                        length: totalPages
                    }).map((_, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: `px-3 py-1 rounded ${currentPage === idx + 1 ? 'bg-black text-white' : 'bg-gray-200'}`,
                            onClick: ()=>setCurrentPage(idx + 1),
                            children: idx + 1
                        }, idx, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                            lineNumber: 548,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        disabled: currentPage === totalPages,
                        onClick: ()=>setCurrentPage((p)=>p + 1),
                        className: "px-3 py-1 rounded bg-gray-200 disabled:opacity-40",
                        children: "►"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                        lineNumber: 554,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
                lineNumber: 544,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js",
        lineNumber: 468,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s2(SubAdminTable, "GKp4bxccqzsDWTj54RPTDbMFHw4=");
_c3 = SubAdminTable;
const __TURBOPACK__default__export__ = SubAdminTable;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "RoleInput");
__turbopack_context__.k.register(_c1, "PermCheckbox");
__turbopack_context__.k.register(_c2, "CreateSubAdminModal");
__turbopack_context__.k.register(_c3, "SubAdminTable");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminRemoveModal.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/index.js [client] (ecmascript)");
;
;
const ConfirmDialog = ({ user, onConfirm, onCancel })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 bg-black/30 flex items-center justify-center z-50",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white p-5 rounded shadow w-[300px] text-center",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "mb-4 font-medium",
                    children: [
                        "Are you sure you wanna remove ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-center gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onCancel,
                            className: "bg-green-600 text-white px-4 py-1 rounded",
                            children: "No, Quit"
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminRemoveModal.js",
                            lineNumber: 12,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
_c = ConfirmDialog;
const __TURBOPACK__default__export__ = ConfirmDialog;
var _c;
__turbopack_context__.k.register(_c, "ConfirmDialog");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react-icons/fa/index.mjs [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
;
;
const API_URL = 'https://merimonial-backend.onrender.com';
const ROLE_SUGGESTIONS = [
    'reporter',
    'moderator',
    'verification_officer',
    'analyst',
    'support',
    'backend',
    'frontend'
];
const RoleInput = ({ value, onChange })=>{
    _s();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RoleInput.useEffect": ()=>{
            const handler = {
                "RoleInput.useEffect.handler": (e)=>{
                    if (ref.current && !ref.current.contains(e.target)) setOpen(false);
                }
            }["RoleInput.useEffect.handler"];
            document.addEventListener('mousedown', handler);
            return ({
                "RoleInput.useEffect": ()=>document.removeEventListener('mousedown', handler)
            })["RoleInput.useEffect"];
        }
    }["RoleInput.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative w-full",
        ref: ref,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        placeholder: "Type or select role",
                        value: value,
                        onChange: (e)=>onChange(e.target.value),
                        className: "w-full px-3 py-2 text-sm focus:outline-none"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                        lineNumber: 21,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setOpen((p)=>!p),
                        className: "px-3 bg-gray-100 border-l border-gray-300 hover:bg-gray-200 transition",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["FaChevronDown"], {
                            size: 11,
                            className: `text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                            lineNumber: 30,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                        lineNumber: 28,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                lineNumber: 20,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute z-50 top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 overflow-hidden",
                children: ROLE_SUGGESTIONS.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>{
                            onChange(r);
                            setOpen(false);
                        },
                        className: `w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition ${value === r ? 'bg-indigo-50 font-semibold text-indigo-600' : 'text-gray-700'}`,
                        children: r
                    }, r, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                        lineNumber: 36,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                lineNumber: 34,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
        lineNumber: 19,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(RoleInput, "wl9VvfhnMVWQ+kCekFjcRPEi3/0=");
_c = RoleInput;
const PermCheckbox = ({ label, checked, onChange, onDelete, isCustom })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: "flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none group",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "checkbox",
                checked: checked,
                onChange: onChange,
                className: "w-4 h-4 rounded accent-blue-600 cursor-pointer"
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                lineNumber: 50,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "flex-1",
                children: label
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                lineNumber: 52,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            isCustom && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: (e)=>{
                    e.preventDefault();
                    onDelete();
                },
                className: "text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition ml-1",
                title: "Remove",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["FaTimes"], {
                    size: 10
                }, void 0, false, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                    lineNumber: 60,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                lineNumber: 54,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
        lineNumber: 49,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c1 = PermCheckbox;
const EditModal = ({ data, onClose, onUpdate, onRefresh })=>{
    _s1();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [success, setSuccess] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [debugInfo, setDebugInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [form, setForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
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
    const [allPermissions, setAllPermissions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [permissions, setPermissions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [customInput, setCustomInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const fileInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const customInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Initialize form with data from props
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EditModal.useEffect": ()=>{
            if (data) {
                console.log('Data received in EditModal:', data); // Debug log
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
                // Initialize permissions
                if (data.permissions && Array.isArray(data.permissions)) {
                    const currentPermissions = data.permissions.map({
                        "EditModal.useEffect.currentPermissions": (perm)=>{
                            if (typeof perm === 'string') return {
                                key: perm,
                                label: perm.replace(/_/g, ' '),
                                isCustom: true
                            };
                            return perm;
                        }
                    }["EditModal.useEffect.currentPermissions"]);
                    setAllPermissions(currentPermissions);
                    setPermissions(data.permissions.map({
                        "EditModal.useEffect": (perm)=>typeof perm === 'string' ? perm : perm.key
                    }["EditModal.useEffect"]));
                }
            }
        }
    }["EditModal.useEffect"], [
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
            // First, update the profile using FormData
            const fd = new FormData();
            fd.append('firstName', form.firstName);
            fd.append('lastName', form.lastName);
            fd.append('email', form.email);
            fd.append('phone', form.phone);
            fd.append('role', form.role);
            fd.append('gender', form.gender);
            fd.append('status', form.status);
            if (form.profileImageFile) {
                fd.append('profileImage', form.profileImageFile);
            }
            const token = localStorage.getItem('token');
            const updateUrl = `${API_URL}/api/sub-admin/update/sub-admin-profile/${data._id}`;
            console.log('Updating at URL:', updateUrl); // Debug log
            console.log('Form data being sent:', {
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                phone: form.phone,
                role: form.role,
                gender: form.gender,
                status: form.status,
                hasNewImage: !!form.profileImageFile
            });
            const res = await fetch(updateUrl, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: fd
            });
            const responseData = await res.json();
            console.log('Update response:', responseData); // Debug log
            if (!res.ok) {
                setError(`Update failed: ${responseData.message || 'Unknown error'}`);
                setDebugInfo(`Status: ${res.status}, Response: ${JSON.stringify(responseData)}`);
                setLoading(false);
                return;
            }
            if (!responseData.success) {
                setError(responseData.message || 'Update failed');
                setDebugInfo(`Success flag false: ${JSON.stringify(responseData)}`);
                setLoading(false);
                return;
            }
            setSuccess('Profile updated successfully!');
            // Now update permissions
            if (permissions.length > 0 || data.permissions) {
                const permRes = await fetch(`${API_URL}/api/sub-admin/add/tab-permission`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        subAdminId: data._id,
                        permissionTabs: permissions
                    })
                });
                const permData = await permRes.json();
                console.log('Permission update response:', permData); // Debug log
                if (!permRes.ok || !permData.success) {
                    console.error('Permission update failed:', permData.message);
                    setError('Profile updated but permission update failed');
                } else {
                    setSuccess('Profile and permissions updated successfully!');
                }
            }
            // Call refresh function to update parent component data
            if (onRefresh) {
                await onRefresh(); // Wait for refresh to complete
            }
            // Call onUpdate callback if provided
            if (onUpdate) {
                onUpdate();
            }
            // Close modal after a short delay
            setTimeout(()=>{
                onClose();
            }, 1000);
        } catch (err) {
            console.error('Update error:', err); // Debug log
            setError(`Network error: ${err.message}`);
            setDebugInfo(`Error details: ${JSON.stringify(err)}`);
            setLoading(false);
        } finally{
            setLoading(false);
        }
    };
    const col1 = allPermissions.filter((_, i)=>i % 2 === 0);
    const col2 = allPermissions.filter((_, i)=>i % 2 !== 0);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center p-4",
        style: {
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)'
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[95vh] flex flex-col",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between items-center px-6 py-4 border-b flex-shrink-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    onClick: ()=>fileInputRef.current?.click(),
                                    className: "relative cursor-pointer group w-12 h-12",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            src: form.profileImage || 'https://via.placeholder.com/48',
                                            className: "w-12 h-12 rounded-full object-cover ring-2 ring-gray-200",
                                            alt: "avatar"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 293,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-white text-xs",
                                                children: "📷"
                                            }, void 0, false, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                lineNumber: 299,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 298,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ref: fileInputRef,
                                            type: "file",
                                            accept: "image/*",
                                            onChange: handleAvatarChange,
                                            className: "hidden"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 301,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 292,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-lg font-bold text-gray-900",
                                            children: "Edit Sub Admin"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 310,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-gray-500",
                                            children: "Update profile information"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 311,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 309,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                            lineNumber: 291,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "text-gray-400 hover:text-gray-600 text-lg",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["FaTimes"], {}, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                lineNumber: 315,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                            lineNumber: 314,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                    lineNumber: 290,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "overflow-y-auto flex-1 px-6 py-4",
                    children: [
                        success && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-4 p-3 bg-green-50 border border-green-200 rounded-lg animate-pulse",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-green-700 text-sm flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "✅"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                        lineNumber: 325,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    " ",
                                    success,
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs ml-2",
                                        children: "Closing in a moment..."
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                        lineNumber: 326,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                lineNumber: 324,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                            lineNumber: 323,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-lg",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-red-700 text-sm font-semibold",
                                    children: [
                                        "Error: ",
                                        error
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 334,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                debugInfo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                                    className: "mt-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                                            className: "text-xs text-red-600 cursor-pointer",
                                            children: "Debug Info"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 337,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                            className: "text-xs text-red-500 mt-1 whitespace-pre-wrap",
                                            children: debugInfo
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 338,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 336,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                            lineNumber: 333,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-md font-semibold text-gray-900 mb-3 flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-lg",
                                            children: "📝"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 347,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        " Basic Information"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 346,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 gap-x-4 gap-y-3 text-sm",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "First Name ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 352,
                                                            columnNumber: 30
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 351,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    name: "firstName",
                                                    placeholder: "e.g., Pritam",
                                                    value: form.firstName,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 354,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 350,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "Last Name ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 365,
                                                            columnNumber: 29
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 364,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    name: "lastName",
                                                    placeholder: "e.g., Sharma",
                                                    value: form.lastName,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 367,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 363,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "Email ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 378,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 377,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "email",
                                                    name: "email",
                                                    placeholder: "pritam@gmail.com",
                                                    value: form.email,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 380,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 376,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "Phone ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 391,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 390,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    name: "phone",
                                                    placeholder: "+91 XXXXXXXXXX",
                                                    value: form.phone,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 393,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 389,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: "Gender"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 403,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                    name: "gender",
                                                    value: form.gender,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-white",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: "male",
                                                            children: "Male"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 410,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: "female",
                                                            children: "Female"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 411,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: "other",
                                                            children: "Other"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 412,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 404,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 402,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: "Status"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 416,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                    name: "status",
                                                    value: form.status,
                                                    onChange: handleInput,
                                                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-white",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: "active",
                                                            children: "Active"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 423,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: "inactive",
                                                            children: "Inactive"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 424,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 417,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 415,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "col-span-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "block text-xs font-semibold text-gray-600 mb-1",
                                                    children: [
                                                        "Role ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-red-500",
                                                            children: "*"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 429,
                                                            columnNumber: 24
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 428,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RoleInput, {
                                                    value: form.role,
                                                    onChange: (val)=>setForm((prev)=>({
                                                                ...prev,
                                                                role: val
                                                            }))
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 431,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 427,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 349,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                            lineNumber: 345,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "rounded-xl px-4 py-4",
                            style: {
                                background: '#fffbf0'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-sm font-bold text-gray-800 mb-3",
                                    children: [
                                        "Assigned Permissions",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "ml-2 text-xs font-normal text-gray-400",
                                            children: [
                                                "(",
                                                permissions.length,
                                                " selected)"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 443,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 441,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 gap-x-4 gap-y-3 mb-4",
                                    children: [
                                        col1.map((perm)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PermCheckbox, {
                                                label: perm.label,
                                                isCustom: perm.isCustom,
                                                checked: permissions.includes(perm.key),
                                                onChange: ()=>togglePerm(perm.key),
                                                onDelete: ()=>handleDeleteCustomPermission(perm.key)
                                            }, perm.key, false, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                lineNumber: 448,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))),
                                        col2.map((perm)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PermCheckbox, {
                                                label: perm.label,
                                                isCustom: perm.isCustom,
                                                checked: permissions.includes(perm.key),
                                                onChange: ()=>togglePerm(perm.key),
                                                onDelete: ()=>handleDeleteCustomPermission(perm.key)
                                            }, perm.key, false, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                lineNumber: 458,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 446,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "border-t border-yellow-200 pt-3 mt-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs font-semibold text-gray-500 mb-2",
                                            children: "➕ Add Custom Permission"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 471,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    ref: customInputRef,
                                                    type: "text",
                                                    placeholder: "e.g., Manage Payments",
                                                    value: customInput,
                                                    onChange: (e)=>setCustomInput(e.target.value),
                                                    onKeyDown: (e)=>e.key === 'Enter' && handleAddCustomPermission(),
                                                    className: "flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 473,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: handleAddCustomPermission,
                                                    disabled: !customInput.trim(),
                                                    className: "flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-40",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["FaPlus"], {
                                                            size: 10
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                            lineNumber: 488,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        " Add"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                    lineNumber: 482,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 472,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-gray-400 mt-1",
                                            children: "Press Enter or click Add. Hover on custom items to remove them."
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                            lineNumber: 491,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 470,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                            lineNumber: 440,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: onClose,
                                    className: "px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors",
                                    disabled: loading,
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 497,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: handleUpdate,
                                    disabled: loading,
                                    className: "px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60",
                                    children: loading ? 'Updating...' : 'Update Changes ✓'
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                    lineNumber: 504,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                            lineNumber: 496,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                    lineNumber: 320,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
            lineNumber: 287,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
        lineNumber: 285,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s1(EditModal, "3PYMMVOGapKhawOuxFJrMNh9Mk4=");
_c2 = EditModal;
const __TURBOPACK__default__export__ = EditModal;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "RoleInput");
__turbopack_context__.k.register(_c1, "PermCheckbox");
__turbopack_context__.k.register(_c2, "EditModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// components/SubAdmin/SummaryCards.js
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/index.js [client] (ecmascript)");
;
;
const SummaryCards = ({ title, count, users, borderColor = 'border-gray-400' })=>{
    // Get up to 5 profile images (filter out null/undefined)
    const avatars = users.map((user)=>user.profileImage).filter((src)=>src).slice(0, 5);
    const remaining = users.length - avatars.length;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `border rounded-2xl p-6 shadow-md bg-white text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${borderColor}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1",
                children: title
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js",
                lineNumber: 16,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-3xl font-extrabold text-gray-800 mb-3",
                children: count
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js",
                lineNumber: 19,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-center -space-x-2 overflow-hidden mb-2",
                children: avatars.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        avatars.map((src, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: src,
                                alt: "avatar",
                                className: "inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover shadow-sm",
                                onError: (e)=>e.target.style.display = 'none'
                            }, idx, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js",
                                lineNumber: 25,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))),
                        remaining > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
_c = SummaryCards;
const __TURBOPACK__default__export__ = SummaryCards;
var _c;
__turbopack_context__.k.register(_c, "SummaryCards");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SubAdminTable$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminTable.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SubAdminRemoveModal$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminRemoveModal.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SubAdminViewModal$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SummaryCards$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
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
    _s();
    const [admins, setAdmins] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [viewData, setViewData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [removeId, setRemoveId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
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
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SubAdminPage.useEffect": ()=>{
            const fetchSubAdmins = {
                "SubAdminPage.useEffect.fetchSubAdmins": async ()=>{
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
                        const activeAdmins = (activeData.response || []).map({
                            "SubAdminPage.useEffect.fetchSubAdmins.activeAdmins": (admin)=>transformAdmin(admin, 'Active')
                        }["SubAdminPage.useEffect.fetchSubAdmins.activeAdmins"]);
                        const inactiveAdmins = (inactiveData.response || []).map({
                            "SubAdminPage.useEffect.fetchSubAdmins.inactiveAdmins": (admin)=>transformAdmin(admin, 'Suspended')
                        }["SubAdminPage.useEffect.fetchSubAdmins.inactiveAdmins"]);
                        setAdmins([
                            ...activeAdmins,
                            ...inactiveAdmins
                        ]);
                    } catch (err) {
                        setError(err.message);
                    } finally{
                        setLoading(false);
                    }
                }
            }["SubAdminPage.useEffect.fetchSubAdmins"];
            fetchSubAdmins();
        }
    }["SubAdminPage.useEffect"], []);
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
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex justify-center items-center h-64",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2 justify-around p-4 flex-wrap",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SummaryCards$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                        title: "Total Sub Admin",
                        count: admins.length,
                        users: admins,
                        borderColor: "border-gray-400"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                        lineNumber: 159,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SummaryCards$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                        title: "Active Sub Admin",
                        count: active.length,
                        users: active,
                        borderColor: "border-green-500"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                        lineNumber: 165,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SummaryCards$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-18",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SubAdminTable$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
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
            viewData && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SubAdminViewModal$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                data: viewData,
                onClose: ()=>setViewData(null)
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                lineNumber: 189,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            removeId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SubAdminRemoveModal$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
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
_s(SubAdminPage, "oZHx6mlmojHwDBEHWFk7aG5/Tig=");
_c = SubAdminPage;
const __TURBOPACK__default__export__ = SubAdminPage;
var _c;
__turbopack_context__.k.register(_c, "SubAdminPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/pages/managesubadmin/index.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$Search$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SubAdminPage$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/index.js [client] (ecmascript)");
;
;
;
;
const SubAdmins = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$Search$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/pages/managesubadmin/index.js",
                lineNumber: 9,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pt-[100px] h-screen overflow-y-auto px-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SubAdminPage$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
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
_c = SubAdmins;
const __TURBOPACK__default__export__ = SubAdmins;
var _c;
__turbopack_context__.k.register(_c, "SubAdmins");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/Downloads/matrimonial-main/matrimonial-main/pages/managesubadmin/index.js [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/managesubadmin";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/Downloads/matrimonial-main/matrimonial-main/pages/managesubadmin/index.js [client] (ecmascript)");
    }
]);
// @ts-expect-error module.hot exists
if (module.hot) {
    // @ts-expect-error module.hot exists
    module.hot.dispose(function() {
        window.__NEXT_P.push([
            PAGE_PATH
        ]);
    });
}
}),
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/Downloads/matrimonial-main/matrimonial-main/pages/managesubadmin/index.js\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/Downloads/matrimonial-main/matrimonial-main/pages/managesubadmin/index.js [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__0f29eea1._.js.map