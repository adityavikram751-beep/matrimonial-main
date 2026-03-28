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
        console.log("🔵 SOCKET CONNECTED:", socket.id);
    });
    socket.on("disconnect", ()=>{
        console.log("🔴 SOCKET DISCONNECTED");
    });
    return socket;
}
function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        console.log("🔴 SOCKET MANUALLY DISCONNECTED");
    }
}
function getSocket() {
    return socket;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/lucide-react/dist/esm/icons/bell.js [client] (ecmascript) <export default as Bell>");
// ⭐ WebSocket imports
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/lib/socket.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const Search = ()=>{
    _s();
    const [notifications, setNotifications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [unreadCount, setUnreadCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const dropdownRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const BASE_URL = "https://merimonial-backend.onrender.com";
    /* --------------------------------------------------------
        1) CONNECT SOCKET BASED ON ADMIN PREF
  ---------------------------------------------------------*/ const loadAdminPrefs = async ()=>{
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/auth/admin/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const json = await res.json();
            if (!json.success) return;
            const admin = json.data;
            if (admin.notifications === true) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["connectSocket"])(admin._id);
            } else {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["disconnectSocket"])();
            }
        } catch (err) {
            console.log("Admin Pref Error:", err);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Search.useEffect": ()=>{
            loadAdminPrefs();
        }
    }["Search.useEffect"], []);
    /* --------------------------------------------------------
        2) FETCH NOTIFICATIONS
  ---------------------------------------------------------*/ const fetchNotifications = async ()=>{
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
        } catch (err) {
            console.log("Fetch error:", err);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Search.useEffect": ()=>{
            fetchNotifications();
        }
    }["Search.useEffect"], []);
    /* --------------------------------------------------------
        3) SOCKET REAL-TIME LISTENERS (SYNC EVERYWHERE)
  ---------------------------------------------------------*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Search.useEffect": ()=>{
            const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getSocket"])();
            if (!socket) return;
            console.log("🟢 REAL-TIME NOTIFICATION LISTENER ACTIVE");
            // NEW notification
            socket.on("new-notification", {
                "Search.useEffect": (data)=>{
                    setNotifications({
                        "Search.useEffect": (prev)=>[
                                data,
                                ...prev
                            ]
                    }["Search.useEffect"]);
                    setUnreadCount({
                        "Search.useEffect": (u)=>u + 1
                    }["Search.useEffect"]);
                }
            }["Search.useEffect"]);
            // MARK ONE READ SYNC
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
                        "Search.useEffect": (u)=>Math.max(0, u - 1)
                    }["Search.useEffect"]);
                }
            }["Search.useEffect"]);
            // MARK ALL READ SYNC
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
            // DELETE ONE SYNC
            socket.on("delete-one", {
                "Search.useEffect": ({ id })=>{
                    setNotifications({
                        "Search.useEffect": (prev)=>prev.filter({
                                "Search.useEffect": (n)=>n._id !== id
                            }["Search.useEffect"])
                    }["Search.useEffect"]);
                }
            }["Search.useEffect"]);
            // DELETE ALL SYNC
            socket.on("delete-all", {
                "Search.useEffect": ()=>{
                    setNotifications([]);
                    setUnreadCount(0);
                }
            }["Search.useEffect"]);
            return ({
                "Search.useEffect": ()=>{
                    socket.off("new-notification");
                    socket.off("one-read");
                    socket.off("all-read");
                    socket.off("delete-one");
                    socket.off("delete-all");
                }
            })["Search.useEffect"];
        }
    }["Search.useEffect"], []);
    /* --------------------------------------------------------
        4) CLICK OUTSIDE → CLOSE DROPDOWN
  ---------------------------------------------------------*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
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
    /* --------------------------------------------------------
        5) MARK ONE READ
  ---------------------------------------------------------*/ const markAsRead = async (id)=>{
        const token = localStorage.getItem("token");
        setNotifications((prev)=>prev.map((n)=>n._id === id ? {
                    ...n,
                    read: true
                } : n));
        setUnreadCount((u)=>Math.max(0, u - 1));
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
    /* --------------------------------------------------------
        6) MARK ALL READ
  ---------------------------------------------------------*/ const markAll = async ()=>{
        const token = localStorage.getItem("token");
        setNotifications((prev)=>prev.map((n)=>({
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
    /* --------------------------------------------------------
        7) DELETE ONE
  ---------------------------------------------------------*/ const deleteOne = async (id)=>{
        const token = localStorage.getItem("token");
        setNotifications((prev)=>prev.filter((n)=>n._id !== id));
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
    /* --------------------------------------------------------
        8) DELETE ALL
  ---------------------------------------------------------*/ const deleteAll = async ()=>{
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
    /* --------------------------------------------------------
        9) BELL CLICK → AUTO MARK ALL READ
  ---------------------------------------------------------*/ const handleBellClick = ()=>{
        const show = !open;
        setOpen(show);
        if (show) {
            markAll();
        }
    };
    /* --------------------------------------------------------
        UI
  ---------------------------------------------------------*/ return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full bg-[#f5f5f5] py-3 px-4 border-b flex items-center justify-between",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-2xl font-bold text-black",
                children: "Reported Content"
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                lineNumber: 222,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative",
                    ref: dropdownRef,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "cursor-pointer relative",
                            onClick: handleBellClick,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__["Bell"], {
                                    className: "h-7 w-7 text-yellow-500"
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                                    lineNumber: 232,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                unreadCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "absolute -top-1 -right-1 h-4 w-4 bg-red-600 text-white  text-[10px] flex items-center justify-center rounded-full border-2 border-white",
                                    children: unreadCount
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                                    lineNumber: 235,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                            lineNumber: 228,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute right-0 mt-3 w-[330px] bg-white shadow-lg border rounded-lg p-3 z-50",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-between items-center mb-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "font-semibold",
                                            children: "Notifications"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                                            lineNumber: 246,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: markAll,
                                            className: "text-blue-600 text-sm",
                                            children: "Mark all read"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                                            lineNumber: 248,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                                    lineNumber: 245,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "max-h-[300px] overflow-y-auto",
                                    children: notifications.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-center text-gray-500 py-3",
                                        children: "No notifications"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                                        lineNumber: 256,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0)) : notifications.map((n)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `p-3 border-b flex justify-between items-start ${!n.read ? "bg-yellow-50" : ""}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                            className: "font-semibold",
                                                            children: n.title
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                                                            lineNumber: 266,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm text-gray-600",
                                                            children: n.message
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                                                            lineNumber: 267,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xs text-gray-400 mt-1",
                                                            children: new Date(n.createdAt).toLocaleString()
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                                                            lineNumber: 268,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        !n.read && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>markAsRead(n._id),
                                                            className: "text-blue-600 text-xs mt-1",
                                                            children: "Mark as read"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                                                            lineNumber: 273,
                                                            columnNumber: 27
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                                                    lineNumber: 265,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>deleteOne(n._id),
                                                    className: "text-red-500 text-sm",
                                                    children: "Delete"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                                                    lineNumber: 282,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, n._id, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                                            lineNumber: 259,
                                            columnNumber: 21
                                        }, ("TURBOPACK compile-time value", void 0)))
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                                    lineNumber: 254,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                notifications.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: deleteAll,
                                    className: "w-full text-red-600 mt-2 py-2 text-sm border-t",
                                    children: "Delete All"
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                                    lineNumber: 294,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                            lineNumber: 244,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                    lineNumber: 227,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
                lineNumber: 224,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js",
        lineNumber: 220,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(Search, "kSvySaEGxPJUYLDopZPnLSdyV5I=");
_c = Search;
const __TURBOPACK__default__export__ = Search;
var _c;
__turbopack_context__.k.register(_c, "Search");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/component/api/apiURL.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "API_URL",
    ()=>API_URL
]);
const API_URL = "https://merimonial-backend.onrender.com";
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/lucide-react/dist/esm/icons/eye.js [client] (ecmascript) <export default as Eye>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/lucide-react/dist/esm/icons/circle-check-big.js [client] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ban$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Ban$3e$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/lucide-react/dist/esm/icons/ban.js [client] (ecmascript) <export default as Ban>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ellipsis$2d$vertical$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MoreVertical$3e$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/lucide-react/dist/esm/icons/ellipsis-vertical.js [client] (ecmascript) <export default as MoreVertical>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/lucide-react/dist/esm/icons/user.js [client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/lucide-react/dist/esm/icons/mail.js [client] (ecmascript) <export default as Mail>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/lucide-react/dist/esm/icons/calendar.js [client] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/component/api/apiURL.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
const ReportedContent = ({ report, currentPage, totalPages, setCurrentPage, itemsPerPage, refreshReports, onDataUpdate, loading })=>{
    _s();
    const [actionLoading, setActionLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [selectedReport, setSelectedReport] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showDetails, setShowDetails] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // ✅ Format date
    const formatDate = (dateString)=>{
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };
    // ✅ Get status badge style
    const getStatusBadge = (status)=>{
        const statusLower = status?.toLowerCase();
        switch(statusLower){
            case 'pending':
                return {
                    bg: 'bg-yellow-100',
                    text: 'text-yellow-800',
                    label: 'Pending'
                };
            case 'reviewed':
                return {
                    bg: 'bg-blue-100',
                    text: 'text-blue-800',
                    label: 'Reviewed'
                };
            case 'approved':
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-800',
                    label: 'Approved'
                };
            case 'blocked':
                return {
                    bg: 'bg-red-100',
                    text: 'text-red-800',
                    label: 'Blocked'
                };
            default:
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-800',
                    label: status || 'Unknown'
                };
        }
    };
    // ✅ Handle view details
    const handleViewDetails = (report)=>{
        setSelectedReport(report);
        setShowDetails(true);
    };
    // ✅ Handle status update
    const handleStatusUpdate = async (reportId, newStatus)=>{
        if (!window.confirm(`Are you sure you want to mark this as ${newStatus}?`)) return;
        setActionLoading((prev)=>({
                ...prev,
                [reportId]: true
            }));
        try {
            const response = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__["API_URL"]}/admin/update-report-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reportId,
                    status: newStatus,
                    updatedAt: new Date().toISOString()
                })
            });
            const result = await response.json();
            if (response.ok) {
                // ✅ OPTION 1: Optimistic Update
                // const updatedReports = report.map(r => 
                //   r._id === reportId ? { ...r, status: newStatus } : r
                // );
                // onReportsUpdate(updatedReports);
                // ✅ OPTION 2: Refresh from server (Recommended)
                if (refreshReports) {
                    refreshReports();
                }
                if (onDataUpdate) {
                    onDataUpdate();
                }
                // Show success message
                alert(`Report marked as ${newStatus} successfully!`);
            } else {
                throw new Error(result.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert(`Error: ${error.message}`);
        } finally{
            setActionLoading((prev)=>({
                    ...prev,
                    [reportId]: false
                }));
        }
    };
    // ✅ Handle block user
    const handleBlockUser = async (userId, userName)=>{
        if (!window.confirm(`Are you sure you want to block ${userName || 'this user'}?`)) return;
        try {
            console.log('🚫 Blocking user:', userId);
            const response = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__["API_URL"]}/admin/block-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    reason: 'Reported by admin',
                    blockedAt: new Date().toISOString()
                })
            });
            const result = await response.json();
            if (response.ok) {
                console.log('✅ User blocked successfully:', result);
                // ✅ TRIGGER DATA REFRESH - यहाँ fix है
                if (refreshReports) {
                    console.log('🔄 Calling refreshReports from parent');
                    refreshReports();
                }
                if (onDataUpdate) {
                    console.log('🔄 Calling onDataUpdate callback');
                    onDataUpdate();
                }
                // ✅ Also update local status if needed
                // const updatedReports = report.map(r => 
                //   r.userId === userId ? { ...r, status: 'blocked' } : r
                // );
                // onReportsUpdate(updatedReports);
                alert(`User ${userName || ''} has been blocked successfully!`);
            } else {
                throw new Error(result.message || 'Failed to block user');
            }
        } catch (error) {
            console.error('❌ Error blocking user:', error);
            alert(`Error: ${error.message}`);
        }
    };
    // ✅ Pagination
    const handlePageChange = (page)=>{
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };
    // ✅ Calculate pagination range
    const getPaginationRange = ()=>{
        const delta = 2;
        const range = [];
        const rangeWithDots = [];
        for(let i = 1; i <= totalPages; i++){
            if (i === 1 || i === totalPages || i >= currentPage - delta && i <= currentPage + delta) {
                range.push(i);
            }
        }
        let prev = 0;
        for (const i of range){
            if (i - prev > 1) {
                rangeWithDots.push('...');
            }
            rangeWithDots.push(i);
            prev = i;
        }
        return rangeWithDots;
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "overflow-x-auto rounded-lg border border-gray-300",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                    className: "min-w-full divide-y divide-gray-300",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                            className: "bg-gray-100",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider",
                                        children: "Reported User"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                        lineNumber: 202,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider",
                                        children: "Details"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                        lineNumber: 205,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider",
                                        children: "Status"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                        lineNumber: 208,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider",
                                        children: "Date"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                        lineNumber: 211,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider",
                                        children: "Actions"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                        lineNumber: 214,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                lineNumber: 201,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                            lineNumber: 200,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            className: "bg-white divide-y divide-gray-200",
                            children: report.map((item)=>{
                                const statusBadge = getStatusBadge(item.status);
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    className: "hover:bg-gray-50 transition-colors",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-4 py-4",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                                            className: "h-6 w-6 text-blue-600"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                            lineNumber: 231,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 230,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "ml-4",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-sm font-medium text-gray-900",
                                                                children: item.reportedUserName || 'Unknown User'
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 234,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-sm text-gray-500 flex items-center gap-1",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__["Mail"], {
                                                                        className: "w-3 h-3"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                        lineNumber: 238,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    item.reportedUserEmail || 'No email'
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 237,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xs text-gray-400 mt-1",
                                                                children: [
                                                                    "ID: ",
                                                                    item.userId?.substring(0, 8),
                                                                    "..."
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 241,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 233,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                lineNumber: 229,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                            lineNumber: 228,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-4 py-4",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "max-w-xs",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm text-gray-900 font-medium",
                                                        children: item.reportType || 'General Report'
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 251,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm text-gray-500 truncate",
                                                        children: item.reportDescription || 'No description provided'
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 254,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>handleViewDetails(item),
                                                        className: "text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center gap-1",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                                                className: "w-3 h-3"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 261,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            "View details"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 257,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                lineNumber: 250,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                            lineNumber: 249,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-4 py-4",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`,
                                                children: statusBadge.label
                                            }, void 0, false, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                lineNumber: 269,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                            lineNumber: 268,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-4 py-4 whitespace-nowrap",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-sm text-gray-900",
                                                    children: formatDate(item.createdAt)
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                    lineNumber: 276,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xs text-gray-500 flex items-center gap-1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {
                                                            className: "w-3 h-3"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                            lineNumber: 280,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        }) : 'N/A'
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                    lineNumber: 279,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                            lineNumber: 275,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "px-4 py-4",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>handleStatusUpdate(item._id || item.id, 'reviewed'),
                                                        disabled: actionLoading[item._id] || item.status === 'reviewed',
                                                        className: "p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed",
                                                        title: "Mark as Reviewed",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$eye$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Eye$3e$__["Eye"], {
                                                            className: "w-4 h-4"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                            lineNumber: 295,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 289,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>handleStatusUpdate(item._id || item.id, 'approved'),
                                                        disabled: actionLoading[item._id] || item.status === 'approved',
                                                        className: "p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed",
                                                        title: "Approve Report",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                                            className: "w-4 h-4"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                            lineNumber: 305,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 299,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>handleBlockUser(item.userId, item.reportedUserName),
                                                        disabled: actionLoading[item.userId] || item.status === 'blocked',
                                                        className: "p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed",
                                                        title: "Block User",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ban$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Ban$3e$__["Ban"], {
                                                            className: "w-4 h-4"
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                            lineNumber: 315,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 309,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "relative",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            className: "p-2 text-gray-600 hover:bg-gray-100 rounded-lg",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ellipsis$2d$vertical$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MoreVertical$3e$__["MoreVertical"], {
                                                                className: "w-4 h-4"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 321,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                            lineNumber: 320,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 319,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                lineNumber: 287,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                            lineNumber: 286,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, item._id || item.id, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                    lineNumber: 223,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0));
                            })
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                            lineNumber: 219,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                    lineNumber: 199,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                lineNumber: 198,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            totalPages > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t border-gray-300",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-sm text-gray-700 mb-4 sm:mb-0",
                        children: [
                            "Showing ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-medium",
                                children: (currentPage - 1) * itemsPerPage + 1
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                lineNumber: 337,
                                columnNumber: 21
                            }, ("TURBOPACK compile-time value", void 0)),
                            " to",
                            ' ',
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-medium",
                                children: Math.min(currentPage * itemsPerPage, report.length)
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                lineNumber: 338,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            " of",
                            ' ',
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-medium",
                                children: report.length
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                lineNumber: 339,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            " results"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                        lineNumber: 336,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>handlePageChange(currentPage - 1),
                                disabled: currentPage === 1 || loading,
                                className: "px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed",
                                children: "Previous"
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                lineNumber: 344,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            getPaginationRange().map((pageNum, index)=>pageNum === '...' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "px-3 py-2 text-gray-500",
                                    children: "..."
                                }, `dots-${index}`, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                    lineNumber: 355,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>handlePageChange(pageNum),
                                    disabled: loading,
                                    className: `px-3 py-2 border rounded-md text-sm font-medium ${currentPage === pageNum ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} disabled:opacity-50 disabled:cursor-not-allowed`,
                                    children: pageNum
                                }, pageNum, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                    lineNumber: 359,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>handlePageChange(currentPage + 1),
                                disabled: currentPage === totalPages || loading,
                                className: "px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed",
                                children: "Next"
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                lineNumber: 375,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                        lineNumber: 342,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                lineNumber: 335,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            showDetails && selectedReport && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between items-start mb-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-xl font-bold text-gray-900",
                                                children: "Report Details"
                                            }, void 0, false, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                lineNumber: 393,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-gray-600",
                                                children: [
                                                    "ID: ",
                                                    selectedReport._id
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                lineNumber: 394,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                        lineNumber: 392,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setShowDetails(false),
                                        className: "text-gray-400 hover:text-gray-600",
                                        children: "✕"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                        lineNumber: 396,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                lineNumber: 391,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-gray-50 p-4 rounded-lg",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                className: "font-semibold text-gray-800 mb-3",
                                                children: "Reported User"
                                            }, void 0, false, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                lineNumber: 407,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "grid grid-cols-2 gap-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-sm text-gray-600",
                                                                children: "Name"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 410,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "font-medium",
                                                                children: selectedReport.reportedUserName || 'N/A'
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 411,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 409,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-sm text-gray-600",
                                                                children: "Email"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 414,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "font-medium",
                                                                children: selectedReport.reportedUserEmail || 'N/A'
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 415,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 413,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-sm text-gray-600",
                                                                children: "User ID"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 418,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "font-medium text-sm font-mono",
                                                                children: selectedReport.userId || 'N/A'
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 419,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 417,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-sm text-gray-600",
                                                                children: "Gender"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 422,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "font-medium",
                                                                children: selectedReport.gender || 'N/A'
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 423,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 421,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                lineNumber: 408,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                        lineNumber: 406,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                className: "font-semibold text-gray-800 mb-3",
                                                children: "Report Information"
                                            }, void 0, false, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                lineNumber: 430,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-sm text-gray-600",
                                                                children: "Report Type"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 433,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "font-medium",
                                                                children: selectedReport.reportType || 'General'
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 434,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 432,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-sm text-gray-600",
                                                                children: "Description"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 437,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "font-medium mt-1 p-3 bg-gray-50 rounded-lg",
                                                                children: selectedReport.reportDescription || 'No description provided'
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 438,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 436,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-sm text-gray-600",
                                                                children: "Reporter Info"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 443,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "font-medium",
                                                                children: selectedReport.reporterName || 'Anonymous'
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 444,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 442,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                lineNumber: 431,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                        lineNumber: 429,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                className: "font-semibold text-gray-800 mb-3",
                                                children: "Timeline"
                                            }, void 0, false, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                lineNumber: 451,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex justify-between",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-sm text-gray-600",
                                                                children: "Created"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 454,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "font-medium",
                                                                children: formatDate(selectedReport.createdAt)
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 455,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 453,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    selectedReport.updatedAt && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex justify-between",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-sm text-gray-600",
                                                                children: "Last Updated"
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 459,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "font-medium",
                                                                children: formatDate(selectedReport.updatedAt)
                                                            }, void 0, false, {
                                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                                lineNumber: 460,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 458,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                lineNumber: 452,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                        lineNumber: 450,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                className: "font-semibold text-gray-800 mb-3",
                                                children: "Current Status"
                                            }, void 0, false, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                lineNumber: 468,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedReport.status).bg} ${getStatusBadge(selectedReport.status).text}`,
                                                        children: getStatusBadge(selectedReport.status).label
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 470,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-sm text-gray-600",
                                                        children: [
                                                            "Last action by: ",
                                                            selectedReport.actionBy || 'System'
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                        lineNumber: 473,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                lineNumber: 469,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                        lineNumber: 467,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                lineNumber: 404,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-end gap-3 mt-8 pt-6 border-t",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setShowDetails(false),
                                        className: "px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50",
                                        children: "Close"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                        lineNumber: 482,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            if (window.confirm('Are you sure you want to block this user?')) {
                                                handleBlockUser(selectedReport.userId, selectedReport.reportedUserName);
                                                setShowDetails(false);
                                            }
                                        },
                                        className: "px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ban$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Ban$3e$__["Ban"], {
                                                className: "w-4 h-4"
                                            }, void 0, false, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                                lineNumber: 497,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            "Block User"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                        lineNumber: 488,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                                lineNumber: 481,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                        lineNumber: 390,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                    lineNumber: 389,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx",
                lineNumber: 388,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true);
};
_s(ReportedContent, "IKTpfS8d7oulyNPCeec+c+hTnGQ=");
_c = ReportedContent;
const __TURBOPACK__default__export__ = ReportedContent;
var _c;
__turbopack_context__.k.register(_c, "ReportedContent");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/next/dist/build/polyfills/process.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/lucide-react/dist/esm/icons/search.js [client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [client] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/lucide-react/dist/esm/icons/circle-alert.js [client] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$reportedcontent$2f$ReportedContent$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportedContent.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/component/api/apiURL.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
const ReportDashboard = ()=>{
    _s();
    const [reports, setReports] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [searchTerm, setSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [statusFilter, setStatusFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('all');
    const [genderFilter, setGenderFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [currentPage, setCurrentPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [totalPages, setTotalPages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [refreshKey, setRefreshKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const itemsPerPage = 10;
    // ✅ Fetch reports with proper error handling
    const fetchReports = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ReportDashboard.useCallback[fetchReports]": async ()=>{
            setLoading(true);
            setError('');
            try {
                console.log('📡 Fetching reports...', {
                    searchTerm,
                    statusFilter,
                    genderFilter,
                    currentPage,
                    refreshKey
                });
                const res = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__["API_URL"]}/admin/report-analize?search=${searchTerm}&status=${statusFilter}&gender=${genderFilter}&page=${currentPage}&limit=${itemsPerPage}&t=${Date.now()}`);
                if (!res.ok) {
                    throw new Error(`API Error: ${res.status}`);
                }
                const data = await res.json();
                console.log('✅ Data received:', data);
                setReports(data.reports || []);
                setTotalPages(data.totalPages || 1);
            } catch (err) {
                console.error('❌ Failed to fetch reports:', err);
                setError(err.message);
                setReports([]);
            } finally{
                setLoading(false);
            }
        }
    }["ReportDashboard.useCallback[fetchReports]"], [
        searchTerm,
        statusFilter,
        genderFilter,
        currentPage,
        itemsPerPage,
        refreshKey
    ]);
    // ✅ Manual refresh function
    const handleManualRefresh = ()=>{
        console.log('🔄 Manual refresh triggered');
        setRefreshKey((prev)=>prev + 1);
        setCurrentPage(1);
    };
    // ✅ Trigger fetch on dependencies change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ReportDashboard.useEffect": ()=>{
            fetchReports();
        }
    }["ReportDashboard.useEffect"], [
        fetchReports
    ]);
    // ✅ Top cards calculations
    const totalReports = reports.length;
    const pendingReports = reports.filter((r)=>r.status?.toLowerCase() === 'pending').length;
    const reviewedReports = reports.filter((r)=>r.status?.toLowerCase() === 'reviewed' || r.status?.toLowerCase() === 'approved').length;
    const blockedReports = reports.filter((r)=>r.status?.toLowerCase() === 'blocked').length;
    const formatK = (num)=>num >= 1000 ? (num / 1000).toFixed(1) + 'K' : num;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-3 sm:p-4 md:p-5 lg:p-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-2xl sm:text-3xl font-bold text-gray-900",
                                children: "Report Dashboard"
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 83,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-600 mt-1",
                                children: "Manage and review user reports"
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 84,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                        lineNumber: 82,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleManualRefresh,
                        disabled: loading,
                        className: "flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                size: 18,
                                className: loading ? 'animate-spin' : ''
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 92,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            loading ? 'Refreshing...' : 'Refresh Data'
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                        lineNumber: 87,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                lineNumber: 81,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                        className: "text-red-500 mt-0.5 flex-shrink-0"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                        lineNumber: 100,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-red-700 font-medium",
                                children: "Error loading data"
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 102,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-red-600 text-sm",
                                children: error
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 103,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleManualRefresh,
                                className: "mt-2 text-sm text-red-600 hover:text-red-800 underline",
                                children: "Try again"
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 104,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                        lineNumber: 101,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                lineNumber: 99,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 px-2 sm:px-4 md:px-6 lg:px-10 mb-8 sm:mb-10",
                children: [
                    {
                        label: 'Total Reports',
                        value: totalReports,
                        bgColor: 'bg-blue-50',
                        borderColor: 'border-blue-200'
                    },
                    {
                        label: 'Pending Review',
                        value: pendingReports,
                        bgColor: 'bg-yellow-50',
                        borderColor: 'border-yellow-200'
                    },
                    {
                        label: 'Action Taken',
                        value: reviewedReports,
                        bgColor: 'bg-green-50',
                        borderColor: 'border-green-200'
                    },
                    {
                        label: 'Blocked Users',
                        value: blockedReports,
                        bgColor: 'bg-red-50',
                        borderColor: 'border-red-200'
                    }
                ].map(({ label, value, bgColor, borderColor })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `${bgColor} border ${borderColor} rounded-xl shadow-sm p-4 sm:p-5 md:p-6 flex flex-col justify-center items-center transition-all hover:shadow-md`,
                        style: {
                            minHeight: "140px"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm sm:text-base md:text-lg font-semibold text-gray-800 text-center px-2",
                                children: label
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 147,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-3 sm:mt-4",
                                children: formatK(value)
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 148,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-500 mt-2",
                                children: "Updated just now"
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 149,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, label, true, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                        lineNumber: 142,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                lineNumber: 115,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "border mt-5 p-3 sm:p-4 bg-white border-gray-400 rounded-lg sm:rounded-xl shadow-sm",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-gray-50 p-3 sm:p-4 rounded-lg shadow-sm border border-gray-300 mb-4 sm:mb-5",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-5",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative w-full lg:max-w-md",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                            className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                            lineNumber: 163,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "text",
                                            placeholder: "Search by name, email or report ID",
                                            value: searchTerm,
                                            onChange: (e)=>{
                                                setCurrentPage(1);
                                                setSearchTerm(e.target.value);
                                            },
                                            className: "w-full pl-10 pr-4 py-2.5 bg-white border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 text-sm sm:text-base transition"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                            lineNumber: 164,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                    lineNumber: 162,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-wrap gap-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            value: statusFilter,
                                            onChange: (e)=>{
                                                setCurrentPage(1);
                                                setStatusFilter(e.target.value);
                                            },
                                            className: "px-4 py-2.5 border bg-white border-gray-400 rounded-lg text-sm sm:text-base min-w-[140px] focus:ring-2 focus:ring-blue-300",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "all",
                                                    children: "All Status"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                                    lineNumber: 186,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "pending",
                                                    children: "Pending"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                                    lineNumber: 187,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "reviewed",
                                                    children: "Reviewed"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                                    lineNumber: 188,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "approved",
                                                    children: "Approved"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                                    lineNumber: 189,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "blocked",
                                                    children: "Blocked"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                                    lineNumber: 190,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                            lineNumber: 178,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            value: genderFilter,
                                            onChange: (e)=>{
                                                setCurrentPage(1);
                                                setGenderFilter(e.target.value);
                                            },
                                            className: "px-4 py-2.5 border bg-white border-gray-400 rounded-lg text-sm sm:text-base min-w-[140px] focus:ring-2 focus:ring-blue-300",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "All Gender"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                                    lineNumber: 201,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "Male",
                                                    children: "Male"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                                    lineNumber: 202,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "Female",
                                                    children: "Female"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                                    lineNumber: 203,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "Other",
                                                    children: "Other"
                                                }, void 0, false, {
                                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                                    lineNumber: 204,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                            lineNumber: 193,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        (searchTerm || statusFilter !== 'all' || genderFilter) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                setSearchTerm('');
                                                setStatusFilter('all');
                                                setGenderFilter('');
                                                setCurrentPage(1);
                                            },
                                            className: "px-4 py-2.5 border border-gray-400 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm sm:text-base",
                                            children: "Clear Filters"
                                        }, void 0, false, {
                                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                            lineNumber: 209,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                    lineNumber: 177,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                            lineNumber: 159,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                        lineNumber: 158,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-center items-center py-20",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                    lineNumber: 229,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "mt-4 text-gray-600",
                                    children: "Loading reports..."
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                    lineNumber: 230,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                            lineNumber: 228,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                        lineNumber: 227,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$reportedcontent$2f$ReportedContent$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                        report: reports,
                        currentPage: currentPage,
                        totalPages: totalPages,
                        setCurrentPage: setCurrentPage,
                        itemsPerPage: itemsPerPage,
                        refreshReports: fetchReports,
                        onDataUpdate: ()=>setRefreshKey((prev)=>prev + 1),
                        loading: loading
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                        lineNumber: 234,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    !loading && reports.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center py-12",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "inline-block p-4 bg-gray-100 rounded-full mb-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                    className: "w-12 h-12 text-gray-400"
                                }, void 0, false, {
                                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                    lineNumber: 250,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 249,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-xl font-semibold text-gray-700 mb-2",
                                children: "No reports found"
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 252,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-500 mb-6",
                                children: searchTerm || statusFilter !== 'all' || genderFilter ? 'Try changing your filters or search term' : 'No reports have been submitted yet'
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 253,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            (searchTerm || statusFilter !== 'all' || genderFilter) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                    setGenderFilter('');
                                },
                                className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700",
                                children: "Clear All Filters"
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 260,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                        lineNumber: 248,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                lineNumber: 155,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            ("TURBOPACK compile-time value", "development") === 'development' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-8 p-4 bg-gray-900 text-gray-100 rounded-lg text-sm font-mono",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 mb-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-green-400",
                                children: "⚡"
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 280,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Debug Info"
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 281,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                        lineNumber: 279,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    "Reports Count: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-yellow-300",
                                        children: reports.length
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                        lineNumber: 284,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 284,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    "Page: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-yellow-300",
                                        children: [
                                            currentPage,
                                            "/",
                                            totalPages
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                        lineNumber: 285,
                                        columnNumber: 24
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 285,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    "Refresh Key: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-yellow-300",
                                        children: refreshKey
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                        lineNumber: 286,
                                        columnNumber: 31
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 286,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    "Status Filter: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-yellow-300",
                                        children: statusFilter
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                        lineNumber: 287,
                                        columnNumber: 33
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                                lineNumber: 287,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                        lineNumber: 283,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
                lineNumber: 278,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js",
        lineNumber: 79,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(ReportDashboard, "qpaxcZMGcPajFzWCc8LIzARDsaE=");
_c = ReportDashboard;
const __TURBOPACK__default__export__ = ReportDashboard;
var _c;
__turbopack_context__.k.register(_c, "ReportDashboard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/pages/reportedcontent/index.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$reportedcontent$2f$Search$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/Search.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$reportedcontent$2f$ReportDashboard$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/component/reportedcontent/ReportDashboard.js [client] (ecmascript)");
;
;
;
;
const ReportDashboardPage = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-screen flex flex-col",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "shadow-md sticky top-0 z-30 bg-[#f5f5f5]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$reportedcontent$2f$Search$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/pages/reportedcontent/index.js",
                    lineNumber: 11,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/pages/reportedcontent/index.js",
                lineNumber: 10,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 overflow-y-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$reportedcontent$2f$ReportDashboard$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/pages/reportedcontent/index.js",
                    lineNumber: 16,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/pages/reportedcontent/index.js",
                lineNumber: 15,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/pages/reportedcontent/index.js",
        lineNumber: 7,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c = ReportDashboardPage;
const __TURBOPACK__default__export__ = ReportDashboardPage;
var _c;
__turbopack_context__.k.register(_c, "ReportDashboardPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/Downloads/matrimonial-main/matrimonial-main/pages/reportedcontent/index.js [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/reportedcontent";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/Downloads/matrimonial-main/matrimonial-main/pages/reportedcontent/index.js [client] (ecmascript)");
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
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/Downloads/matrimonial-main/matrimonial-main/pages/reportedcontent/index.js\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/Downloads/matrimonial-main/matrimonial-main/pages/reportedcontent/index.js [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__47666543._.js.map