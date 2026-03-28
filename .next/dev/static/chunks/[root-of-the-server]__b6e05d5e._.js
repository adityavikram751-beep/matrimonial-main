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
"[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/lucide-react/dist/esm/icons/bell.js [client] (ecmascript) <export default as Bell>");
;
var _s = __turbopack_context__.k.signature();
;
;
const Search = ()=>{
    _s();
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const handleKeyDown = (e)=>{
        if (e.key === "Enter") {
            console.log("Searching:", searchQuery);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-white px-6 py-4 shadow-sm border-b fixed top-0 z-50 flex items-center justify-between",
        style: {
            left: "250px",
            width: "calc(100% - 250px)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-2xl font-bold text-gray-900",
                children: "Manage Sub Admin"
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                lineNumber: 22,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-5",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__["Bell"], {
                            className: "h-7 w-7",
                            color: "#FFC107"
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                            lineNumber: 44,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        " ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"
                        }, void 0, false, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                            lineNumber: 45,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                    lineNumber: 43,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
                lineNumber: 27,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/Search.js",
        lineNumber: 14,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(Search, "4/Qdl0R3tQNJqUS4eMrvY/uMU/4=");
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
;
;
const ViewModal = ({ data, onClose })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 bg-black/40 flex items-center justify-center z-50",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white p-6 rounded-lg w-[600px]",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-start gap-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: data.avatar,
                        className: "w-20 h-20 rounded-full"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                        lineNumber: 8,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-xl font-bold",
                                children: data.name
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                lineNumber: 10,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-500",
                                children: data.role
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                lineNumber: 11,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-green-600 mt-1",
                                children: data.status === 'Active' ? '• Currently Active' : '• Inactive'
                            }, void 0, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                lineNumber: 12,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 bg-gray-50 p-3 rounded",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "font-semibold mb-2",
                                        children: "Basic Info"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                        lineNumber: 16,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid grid-cols-2 gap-4 text-sm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: "Email:"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                        lineNumber: 18,
                                                        columnNumber: 22
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    " ",
                                                    data.email
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                lineNumber: 18,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: "Phone:"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                        lineNumber: 19,
                                                        columnNumber: 22
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    " ",
                                                    data.phone
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                lineNumber: 19,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: "Date:"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                        lineNumber: 20,
                                                        columnNumber: 22
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    " ",
                                                    data.date
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                lineNumber: 20,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: "Sub Admin ID:"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                        lineNumber: 21,
                                                        columnNumber: 22
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    " ",
                                                    data.userId
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                lineNumber: 21,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                        lineNumber: 17,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                lineNumber: 15,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 bg-orange-50 p-3 rounded",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "font-semibold mb-2",
                                        children: "Assigned Permissions"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                        lineNumber: 27,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid grid-cols-2 gap-2",
                                        children: data.permissions.map((perm, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "flex items-center space-x-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "checkbox",
                                                        checked: perm.enabled,
                                                        readOnly: true
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                        lineNumber: 31,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: perm.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                        lineNumber: 32,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, idx, true, {
                                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                                lineNumber: 30,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)))
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                        lineNumber: 28,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                lineNumber: 26,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 flex justify-end gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "bg-green-500 text-white px-4 py-1 rounded",
                                        children: "Save"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                        lineNumber: 40,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: onClose,
                                        className: "bg-gray-500 text-white px-4 py-1 rounded",
                                        children: "Close"
                                    }, void 0, false, {
                                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                        lineNumber: 41,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                                lineNumber: 39,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                        lineNumber: 9,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
                lineNumber: 7,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
            lineNumber: 6,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminViewModal.js",
        lineNumber: 5,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c = ViewModal;
const __TURBOPACK__default__export__ = ViewModal;
var _c;
__turbopack_context__.k.register(_c, "ViewModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/public/data/data.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "adminData",
    ()=>adminData,
    "permissionsList",
    ()=>permissionsList,
    "subAdminsData",
    ()=>subAdminsData
]);
const permissionsList = [
    'Can View User',
    'Moderate Reports',
    'Edit User Info',
    'Block Reported Users',
    'Access Analytics'
];
const subAdminsData = [
    {
        id: 1,
        name: 'Anupam Kumar',
        userId: '#112211',
        gender: 'Male',
        avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
        email: 'Anupam.xyz@gmail.com',
        phone: '+91 191919191919',
        role: 'Report Moderator',
        status: 'Active',
        lastActive: 'Currently Active',
        date: '2 July, 2025',
        permissions: [
            {
                name: 'Can View User',
                enabled: true
            },
            {
                name: 'Moderate Reports',
                enabled: true
            },
            {
                name: 'Edit User Info',
                enabled: false
            },
            {
                name: 'Block Reported Users',
                enabled: false
            },
            {
                name: 'Access Analytics',
                enabled: false
            }
        ]
    },
    {
        id: 2,
        name: 'Priya Sharma',
        userId: '#112212',
        gender: 'Female',
        avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
        email: 'priya.sharma@example.com',
        phone: '+91 9876543210',
        role: 'Verification Officer',
        status: 'Inactive',
        lastActive: '2 days ago',
        date: '5 June, 2025',
        permissions: [
            {
                name: 'Can View User',
                enabled: true
            },
            {
                name: 'Verify Documents',
                enabled: true
            },
            {
                name: 'Edit User Info',
                enabled: true
            },
            {
                name: 'Block Reported Users',
                enabled: false
            },
            {
                name: 'Access Analytics',
                enabled: false
            }
        ]
    },
    {
        id: 3,
        name: 'Ravi Patel',
        userId: '#112213',
        gender: 'Male',
        avatar: 'https://randomuser.me/api/portraits/men/64.jpg',
        email: 'ravi.patel@example.com',
        phone: '+91 9123456780',
        role: 'Report Moderator',
        status: 'Active',
        lastActive: '1 hour ago',
        date: '10 May, 2025',
        permissions: [
            {
                name: 'Can View User',
                enabled: true
            },
            {
                name: 'Moderate Reports',
                enabled: true
            },
            {
                name: 'Block Reported Users',
                enabled: true
            },
            {
                name: 'Access Analytics',
                enabled: false
            },
            {
                name: 'Edit User Info',
                enabled: false
            }
        ]
    },
    {
        id: 4,
        name: 'Neha Verma',
        userId: '#112214',
        gender: 'Female',
        avatar: 'https://randomuser.me/api/portraits/women/55.jpg',
        email: 'neha.verma@example.com',
        phone: '+91 9898989898',
        role: 'Verification Officer',
        status: 'Active',
        lastActive: 'Currently Active',
        date: '15 May, 2025',
        permissions: [
            {
                name: 'Can View User',
                enabled: true
            },
            {
                name: 'Verify Documents',
                enabled: true
            },
            {
                name: 'Edit User Info',
                enabled: false
            },
            {
                name: 'Block Reported Users',
                enabled: false
            },
            {
                name: 'Access Analytics',
                enabled: true
            }
        ]
    },
    {
        id: 5,
        name: 'Amit Singh',
        userId: '#112215',
        gender: 'Male',
        avatar: 'https://randomuser.me/api/portraits/men/85.jpg',
        email: 'amit.singh@example.com',
        phone: '+91 9812312312',
        role: 'Report Moderator',
        status: 'Inactive',
        lastActive: '3 days ago',
        date: '1 April, 2025',
        permissions: [
            {
                name: 'Can View User',
                enabled: true
            },
            {
                name: 'Moderate Reports',
                enabled: true
            },
            {
                name: 'Block Reported Users',
                enabled: false
            },
            {
                name: 'Access Analytics',
                enabled: false
            },
            {
                name: 'Edit User Info',
                enabled: false
            }
        ]
    },
    {
        id: 6,
        name: 'Sneha Rathi',
        userId: '#112216',
        gender: 'Female',
        avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
        email: 'sneha.rathi@example.com',
        phone: '+91 9823423432',
        role: 'Verification Officer',
        status: 'Active',
        lastActive: 'Currently Active',
        date: '12 March, 2025',
        permissions: [
            {
                name: 'Can View User',
                enabled: true
            },
            {
                name: 'Verify Documents',
                enabled: true
            },
            {
                name: 'Edit User Info',
                enabled: true
            },
            {
                name: 'Block Reported Users',
                enabled: true
            },
            {
                name: 'Access Analytics',
                enabled: false
            }
        ]
    },
    {
        id: 7,
        name: 'Karan Mehta',
        userId: '#112217',
        gender: 'Male',
        avatar: 'https://randomuser.me/api/portraits/men/66.jpg',
        email: 'karan.mehta@example.com',
        phone: '+91 9012345678',
        role: 'Report Moderator',
        status: 'Active',
        lastActive: '15 mins ago',
        date: '1 Jan, 2025',
        permissions: [
            {
                name: 'Can View User',
                enabled: true
            },
            {
                name: 'Moderate Reports',
                enabled: true
            },
            {
                name: 'Access Analytics',
                enabled: true
            },
            {
                name: 'Block Reported Users',
                enabled: false
            },
            {
                name: 'Edit User Info',
                enabled: false
            }
        ]
    },
    {
        id: 8,
        name: 'Divya Kapoor',
        userId: '#112218',
        gender: 'Female',
        avatar: 'https://randomuser.me/api/portraits/women/80.jpg',
        email: 'divya.kapoor@example.com',
        phone: '+91 9988776655',
        role: 'Verification Officer',
        status: 'Inactive',
        lastActive: '1 week ago',
        date: '8 Feb, 2025',
        permissions: [
            {
                name: 'Can View User',
                enabled: true
            },
            {
                name: 'Verify Documents',
                enabled: true
            },
            {
                name: 'Access Analytics',
                enabled: true
            },
            {
                name: 'Edit User Info',
                enabled: true
            },
            {
                name: 'Block Reported Users',
                enabled: false
            }
        ]
    },
    {
        id: 9,
        name: 'Rohit Malhotra',
        userId: '#112219',
        gender: 'Male',
        avatar: 'https://randomuser.me/api/portraits/men/99.jpg',
        email: 'rohit.malhotra@example.com',
        phone: '+91 9871234567',
        role: 'Report Moderator',
        status: 'Active',
        lastActive: '2 hours ago',
        date: '25 Jan, 2025',
        permissions: [
            {
                name: 'Can View User',
                enabled: true
            },
            {
                name: 'Moderate Reports',
                enabled: true
            },
            {
                name: 'Access Analytics',
                enabled: false
            },
            {
                name: 'Edit User Info',
                enabled: false
            },
            {
                name: 'Block Reported Users',
                enabled: true
            }
        ]
    },
    {
        id: 10,
        name: 'Tanvi Rao',
        userId: '#112220',
        gender: 'Female',
        avatar: 'https://randomuser.me/api/portraits/women/99.jpg',
        email: 'tanvi.rao@example.com',
        phone: '+91 9988123412',
        role: 'Verification Officer',
        status: 'Active',
        lastActive: 'Currently Active',
        date: '3 March, 2025',
        permissions: [
            {
                name: 'Can View User',
                enabled: true
            },
            {
                name: 'Verify Documents',
                enabled: true
            },
            {
                name: 'Access Analytics',
                enabled: false
            },
            {
                name: 'Block Reported Users',
                enabled: false
            },
            {
                name: 'Edit User Info',
                enabled: true
            }
        ]
    },
    {
        id: 11,
        name: 'Sahil Khanna',
        userId: '#112221',
        gender: 'Male',
        avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
        email: 'sahil.khanna@example.com',
        phone: '+91 9878987898',
        role: 'Report Moderator',
        status: 'Inactive',
        lastActive: '5 days ago',
        date: '10 Feb, 2025',
        permissions: [
            {
                name: 'Can View User',
                enabled: true
            },
            {
                name: 'Moderate Reports',
                enabled: true
            },
            {
                name: 'Access Analytics',
                enabled: false
            },
            {
                name: 'Block Reported Users',
                enabled: false
            },
            {
                name: 'Edit User Info',
                enabled: false
            }
        ]
    },
    {
        id: 12,
        name: 'Meera Nair',
        userId: '#112222',
        gender: 'Female',
        avatar: 'https://randomuser.me/api/portraits/women/30.jpg',
        email: 'meera.nair@example.com',
        phone: '+91 9812456789',
        role: 'Verification Officer',
        status: 'Active',
        lastActive: 'Currently Active',
        date: '18 June, 2025',
        permissions: [
            {
                name: 'Can View User',
                enabled: true
            },
            {
                name: 'Verify Documents',
                enabled: true
            },
            {
                name: 'Access Analytics',
                enabled: true
            },
            {
                name: 'Edit User Info',
                enabled: true
            },
            {
                name: 'Block Reported Users',
                enabled: false
            }
        ]
    },
    {
        id: 13,
        name: 'Vikram Joshi',
        userId: '#112223',
        gender: 'Male',
        avatar: 'https://randomuser.me/api/portraits/men/91.jpg',
        email: 'vikram.joshi@example.com',
        phone: '+91 9900990099',
        role: 'Report Moderator',
        status: 'Active',
        lastActive: 'Currently Active',
        date: '30 June, 2025',
        permissions: [
            {
                name: 'Can View User',
                enabled: true
            },
            {
                name: 'Moderate Reports',
                enabled: true
            },
            {
                name: 'Access Analytics',
                enabled: true
            },
            {
                name: 'Edit User Info',
                enabled: true
            },
            {
                name: 'Block Reported Users',
                enabled: true
            }
        ]
    },
    {
        id: 14,
        name: 'Nikita Desai',
        userId: '#112224',
        gender: 'Female',
        avatar: 'https://randomuser.me/api/portraits/women/39.jpg',
        email: 'nikita.desai@example.com',
        phone: '+91 9080706050',
        role: 'Verification Officer',
        status: 'Inactive',
        lastActive: '10 days ago',
        date: '20 April, 2025',
        permissions: [
            {
                name: 'Can View User',
                enabled: true
            },
            {
                name: 'Verify Documents',
                enabled: true
            },
            {
                name: 'Access Analytics',
                enabled: false
            },
            {
                name: 'Edit User Info',
                enabled: false
            },
            {
                name: 'Block Reported Users',
                enabled: false
            }
        ]
    },
    {
        id: 15,
        name: 'Arjun Chauhan',
        userId: '#112225',
        gender: 'Male',
        avatar: 'https://randomuser.me/api/portraits/men/10.jpg',
        email: 'arjun.chauhan@example.com',
        phone: '+91 9123456711',
        role: 'Report Moderator',
        status: 'Active',
        lastActive: '4 hours ago',
        date: '15 July, 2025',
        permissions: [
            {
                name: 'Can View User',
                enabled: true
            },
            {
                name: 'Moderate Reports',
                enabled: true
            },
            {
                name: 'Access Analytics',
                enabled: false
            },
            {
                name: 'Block Reported Users',
                enabled: false
            },
            {
                name: 'Edit User Info',
                enabled: false
            }
        ]
    },
    {
        id: 16,
        name: 'Shruti Bansal',
        userId: '#112226',
        gender: 'Female',
        avatar: 'https://randomuser.me/api/portraits/women/18.jpg',
        email: 'shruti.bansal@example.com',
        phone: '+91 9012121212',
        role: 'Verification Officer',
        status: 'Active',
        lastActive: 'Currently Active',
        date: '7 July, 2025',
        permissions: [
            {
                name: 'Can View User',
                enabled: true
            },
            {
                name: 'Verify Documents',
                enabled: true
            },
            {
                name: 'Access Analytics',
                enabled: true
            },
            {
                name: 'Edit User Info',
                enabled: true
            },
            {
                name: 'Block Reported Users',
                enabled: true
            }
        ]
    }
];
const adminData = [
    {
        basicInfo: {
            'Full Name': 'Parul Gurg',
            'Role': 'Super Admin',
            'E-mail address': 'Parul.adminXYZ@gmail.com',
            'Phone': '+91 11101011',
            'Assigned Region': 'North Zone / All India'
        },
        security: {
            'Change Password': '********',
            'Two Factor Authentication': true,
            'Recent login Device': 'Desktop XYZ',
            'Alert on suspicious login': true
        },
        preferences: {
            'Language': 'English',
            'Default landing page': 'Dashboard',
            'Theme': '☀️ Light',
            'Notifications': true
        }
    }
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// components/SummaryCard.js
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/node_modules/react/index.js [client] (ecmascript)");
;
;
const SummaryCard = ({ title, count, users = [], borderColor })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-white border-2 flex justify-center items-center border-gray-400 shadow rounded-lg shadow-md p-3 w-60 h-40 text-center",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-2xl mb-3 font-medium text-gray-700",
                    children: title
                }, void 0, false, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js",
                    lineNumber: 6,
                    columnNumber: 5
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between -space-x-3 my-2",
                    children: [
                        users.slice(0, 6).map((user, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: user.avatar,
                                className: `w-10 h-10 rounded-full border-2 ${borderColor} object-cover`,
                                alt: user.name,
                                title: user.name
                            }, idx, false, {
                                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js",
                                lineNumber: 9,
                                columnNumber: 9
                            }, ("TURBOPACK compile-time value", void 0))),
                        users.length > 6 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "w-10 h-10 rounded-full bg-gray-200 text-xs flex items-center justify-center font-medium text-gray-700 border",
                            children: [
                                "+",
                                users.length - 6
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js",
                            lineNumber: 18,
                            columnNumber: 9
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js",
                    lineNumber: 7,
                    columnNumber: 5
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-3xl mt-5 font-semibold",
                    children: count
                }, void 0, false, {
                    fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js",
                    lineNumber: 23,
                    columnNumber: 5
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js",
            lineNumber: 5,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js",
        lineNumber: 4,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c = SummaryCard;
const __TURBOPACK__default__export__ = SummaryCard;
var _c;
__turbopack_context__.k.register(_c, "SummaryCard");
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
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$public$2f$data$2f$data$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/public/data/data.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SummaryCards$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SummaryCards.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
// If you're using an API, define the base URL here
// const API_URL = 'https://your-api.com';
const SubAdminPage = ()=>{
    _s();
    const [viewData, setViewData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [removeId, setRemoveId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [admins, setAdmins] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$public$2f$data$2f$data$2e$js__$5b$client$5d$__$28$ecmascript$29$__["subAdminsData"]);
    const active = admins.filter((a)=>a.status === 'Active');
    const suspended = admins.filter((a)=>a.status === 'Suspended');
    // Handler for adding a new sub‑admin (called from SubAdminTable)
    const handleAdd = async (newAdmin)=>{
        // Optionally, make an API call
        // const response = await fetch(`${API_URL}/subadmins`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(newAdmin),
        // });
        // const created = await response.json();
        // For now, just add to local state with a unique ID
        const adminToAdd = {
            ...newAdmin,
            id: Date.now(),
            lastActive: new Date().toLocaleDateString()
        };
        setAdmins((prev)=>[
                ...prev,
                adminToAdd
            ]);
    };
    // Handler for removing a sub‑admin
    const handleRemove = async ()=>{
        try {
            // await fetch(`${API_URL}/subadmins/${removeId}`, {
            //   method: 'DELETE',
            // });
            setAdmins((prev)=>prev.filter((a)=>a.id !== removeId));
            setRemoveId(null);
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-5 justify-around p-4 flex-wrap",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SummaryCards$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                        title: "Total Sub Admin",
                        count: admins.length,
                        users: admins,
                        borderColor: "border-gray-400"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                        lineNumber: 55,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SummaryCards$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                        title: "Active Sub Admin",
                        count: active.length,
                        users: active,
                        borderColor: "border-green-500"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                        lineNumber: 61,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SummaryCards$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                        title: "Suspended Sub Admin",
                        count: suspended.length,
                        users: suspended,
                        borderColor: "border-red-500"
                    }, void 0, false, {
                        fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                        lineNumber: 67,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                lineNumber: 54,
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
                    lineNumber: 76,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                lineNumber: 75,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            viewData && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SubAdminViewModal$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                data: viewData,
                onClose: ()=>setViewData(null)
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                lineNumber: 85,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            removeId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Downloads$2f$matrimonial$2d$main$2f$matrimonial$2d$main$2f$src$2f$component$2f$subadmin$2f$SubAdminRemoveModal$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                onConfirm: handleRemove,
                onCancel: ()=>setRemoveId(null),
                user: admins.find((a)=>a.id === removeId)
            }, void 0, false, {
                fileName: "[project]/Downloads/matrimonial-main/matrimonial-main/src/component/subadmin/SubAdminPage.js",
                lineNumber: 89,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true);
};
_s(SubAdminPage, "SrTFT7lMmQgjOrELHYqBs42/Row=");
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

//# sourceMappingURL=%5Broot-of-the-server%5D__b6e05d5e._.js.map