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
"[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ProfileStatsCard.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProfileStatsCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUp$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/lucide-react/dist/esm/icons/arrow-up.js [client] (ecmascript) <export default as ArrowUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDown$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/lucide-react/dist/esm/icons/arrow-down.js [client] (ecmascript) <export default as ArrowDown>");
;
;
function ProfileStatsCard({ profileCompleted, profileIncomplete }) {
    const formatCompact = (n)=>{
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " M";
        if (n >= 1000) return (n / 1000).toFixed(1) + " K";
        return n.toString();
    };
    const StatItem = ({ title, value, change, trend })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex-1 flex flex-col items-center text-center",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-xl font-semibold text-gray-900",
                    children: title
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ProfileStatsCard.js",
                    lineNumber: 14,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-4xl font-bold text-gray-900 mt-1",
                    children: formatCompact(value)
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ProfileStatsCard.js",
                    lineNumber: 19,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: `flex items-center justify-center mt-2 ${trend === "up" ? "text-green-600" : "text-red-600"}`,
                    children: [
                        trend === "up" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUp$3e$__["ArrowUp"], {
                            size: 30,
                            className: "mr-2"
                        }, void 0, false, {
                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ProfileStatsCard.js",
                            lineNumber: 30,
                            columnNumber: 11
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDown$3e$__["ArrowDown"], {
                            size: 30,
                            className: "mr-2"
                        }, void 0, false, {
                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ProfileStatsCard.js",
                            lineNumber: 32,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col text-[15px] leading-tight font-bold",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: [
                                        " ",
                                        Math.abs(change),
                                        " % Vs"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ProfileStatsCard.js",
                                    lineNumber: 36,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "font-normal",
                                    children: "last week"
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ProfileStatsCard.js",
                                    lineNumber: 37,
                                    columnNumber: 11
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ProfileStatsCard.js",
                            lineNumber: 35,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ProfileStatsCard.js",
                    lineNumber: 24,
                    columnNumber: 7
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ProfileStatsCard.js",
            lineNumber: 11,
            columnNumber: 5
        }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-white border border-gray-400 shadow-sm rounded-2xl px-4 py-4 w-full max-w-sm",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatItem, {
                    title: "Profile Com.",
                    value: profileCompleted.count,
                    change: profileCompleted.change,
                    trend: profileCompleted.trend
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ProfileStatsCard.js",
                    lineNumber: 50,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-[2px] h-[75px] bg-gray-300 mx-4"
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ProfileStatsCard.js",
                    lineNumber: 58,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatItem, {
                    title: "Profile Incom.",
                    value: profileIncomplete.count,
                    change: profileIncomplete.change,
                    trend: profileIncomplete.trend
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ProfileStatsCard.js",
                    lineNumber: 61,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ProfileStatsCard.js",
            lineNumber: 47,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ProfileStatsCard.js",
        lineNumber: 45,
        columnNumber: 5
    }, this);
}
_c = ProfileStatsCard;
var _c;
__turbopack_context__.k.register(_c, "ProfileStatsCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ApprovedProfileCard.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ApprovedProfileCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUp$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/lucide-react/dist/esm/icons/arrow-up.js [client] (ecmascript) <export default as ArrowUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/lucide-react/dist/esm/icons/user.js [client] (ecmascript) <export default as User>");
;
;
function ApprovedProfileCard({ data }) {
    const profileImages = Array.isArray(data.profileImage) ? data.profileImage : [];
    // Format 359670 => 359.67 K
    const formatCompact = (n)=>{
        if (!n) return "0";
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + " M";
        if (n >= 1000) return (n / 1000).toFixed(2) + " K";
        return n.toLocaleString();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative bg-white border border-gray-400 rounded-2xl shadow-sm p-4 w-full max-w-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                src: "/mnt/data/Frame 84.png",
                className: "absolute right-3 top-3 w-20 h-10 opacity-80 pointer-events-none",
                alt: "",
                onError: (e)=>e.target.style.display = "none"
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ApprovedProfileCard.js",
                lineNumber: 20,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center space-x-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "inline-flex items-center justify-center w-6 h-6 bg-green-700 text-white rounded-sm text-xs font-bold",
                        children: "✔"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ApprovedProfileCard.js",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-semibold text-gray-900 text-xl",
                        children: "Approved Profile"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ApprovedProfileCard.js",
                        lineNumber: 33,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ApprovedProfileCard.js",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-2 text-4xl font-extrabold text-gray-900 leading-tight",
                children: formatCompact(data.count)
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ApprovedProfileCard.js",
                lineNumber: 39,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute right-4 top-16 flex items-start text-green-600 font-semibold",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUp$3e$__["ArrowUp"], {
                        size: 32,
                        className: "mr-2"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ApprovedProfileCard.js",
                        lineNumber: 45,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col leading-tight text-green-600 text-xl",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    data.change,
                                    "% Vs"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ApprovedProfileCard.js",
                                lineNumber: 48,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-normal",
                                children: "last week"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ApprovedProfileCard.js",
                                lineNumber: 49,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ApprovedProfileCard.js",
                        lineNumber: 47,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ApprovedProfileCard.js",
                lineNumber: 44,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex -space-x-3 mt-8",
                children: profileImages.length > 0 ? profileImages.map((src, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: src,
                        className: "w-9 h-9 rounded-full border-2 border-green-600 object-cover shadow-sm",
                        alt: "Profile",
                        onError: (e)=>e.target.style.display = "none"
                    }, i, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ApprovedProfileCard.js",
                        lineNumber: 57,
                        columnNumber: 13
                    }, this)) : [
                    ...Array(8)
                ].map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white text-gray-500 shadow-sm",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                            size: 16
                        }, void 0, false, {
                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ApprovedProfileCard.js",
                            lineNumber: 71,
                            columnNumber: 15
                        }, this)
                    }, i, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ApprovedProfileCard.js",
                        lineNumber: 67,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ApprovedProfileCard.js",
                lineNumber: 54,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ApprovedProfileCard.js",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
_c = ApprovedProfileCard;
var _c;
__turbopack_context__.k.register(_c, "ApprovedProfileCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/PendingProfileCard.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PendingProfileCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDown$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/lucide-react/dist/esm/icons/arrow-down.js [client] (ecmascript) <export default as ArrowDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ellipsis$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MoreHorizontal$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/lucide-react/dist/esm/icons/ellipsis.js [client] (ecmascript) <export default as MoreHorizontal>");
;
;
function PendingProfileCard({ data }) {
    const images = Array.isArray(data.profileImage) ? data.profileImage : [];
    const formatCount = (value)=>{
        if (value >= 1000000) return (value / 1_000_000).toFixed(2) + " M";
        if (value >= 1000) return (value / 1000).toFixed(2) + " K";
        return value;
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-white border border-gray-400 rounded-xl shadow-sm px-5 py-4 w-full max-w-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center space-x-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$ellipsis$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MoreHorizontal$3e$__["MoreHorizontal"], {
                            size: 14,
                            className: "text-white"
                        }, void 0, false, {
                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/PendingProfileCard.js",
                            lineNumber: 18,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/PendingProfileCard.js",
                        lineNumber: 17,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-bold text-gray-900 text-xl",
                        children: "Pending Profile"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/PendingProfileCard.js",
                        lineNumber: 21,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/PendingProfileCard.js",
                lineNumber: 16,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mt-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-4xl font-bold text-gray-900",
                        children: formatCount(data.count)
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/PendingProfileCard.js",
                        lineNumber: 30,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col items-end leading-tight text-red-600",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center font-bold text-xl",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDown$3e$__["ArrowDown"], {
                                        size: 34,
                                        className: "mr-1"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/PendingProfileCard.js",
                                        lineNumber: 37,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            Math.abs(data.change),
                                            " % Vs"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/PendingProfileCard.js",
                                        lineNumber: 38,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/PendingProfileCard.js",
                                lineNumber: 36,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xl",
                                children: "last week"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/PendingProfileCard.js",
                                lineNumber: 41,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/PendingProfileCard.js",
                        lineNumber: 35,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/PendingProfileCard.js",
                lineNumber: 27,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center mt-4 -space-x-2",
                children: images.map((img, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: img,
                        alt: "profile",
                        className: "w-9 h-9 rounded-full border-2 border-red-600 object-cover shadow",
                        onError: (e)=>e.target.style.display = "none"
                    }, i, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/PendingProfileCard.js",
                        lineNumber: 49,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/PendingProfileCard.js",
                lineNumber: 47,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/PendingProfileCard.js",
        lineNumber: 13,
        columnNumber: 5
    }, this);
}
_c = PendingProfileCard;
var _c;
__turbopack_context__.k.register(_c, "PendingProfileCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/OneDrive/Desktop/matrimonial-admin/src/component/api/apiURL.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "API_URL",
    ()=>API_URL
]);
const API_URL = "https://matrimonial-backend-7ahc.onrender.com";
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>UserTable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/lucide-react/dist/esm/icons/search.js [client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/next/link.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/next/image.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/src/component/api/apiURL.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
function UserTable() {
    _s();
    const [users, setUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [statusFilter, setStatusFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [genderFilter, setGenderFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [currentPage, setCurrentPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [totalPages, setTotalPages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const usersPerPage = 5;
    const fetchUsers = async ()=>{
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: currentPage,
                limit: usersPerPage,
                search,
                statusFilter,
                genderFilter
            });
            const res = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__["API_URL"]}/admin/user-manage?${query}`);
            const data = await res.json();
            if (data.success) {
                // Map users with verification status based on their approval status
                const usersWithVerification = data.data.map((user)=>({
                        ...user,
                        // If status is approved, show verified as Yes, otherwise No
                        verified: user.status === 'approved' ? 'Yes' : user.status === 'pending' || user.status === 'reject' ? 'No' : 'No' // For blocked and other statuses
                    }));
                setUsers(usersWithVerification);
                setTotalPages(data.totalPages);
            }
        } catch (err) {
            console.log("Fetch Error", err);
        } finally{
            setLoading(false);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "UserTable.useEffect": ()=>{
            fetchUsers();
        }
    }["UserTable.useEffect"], [
        currentPage,
        search,
        statusFilter,
        genderFilter
    ]);
    // --- Pagination number shifting logic (EXACT screenshot style) ---
    const getPageNumbers = ()=>{
        let start = Math.floor((currentPage - 1) / 4) * 4 + 1;
        let end = Math.min(start + 3, totalPages);
        const pages = [];
        for(let i = start; i <= end; i++)pages.push(i);
        return pages;
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "overflow-x-auto bg-white border border-gray-400 shadow-md rounded-xl p-4 mt-4 w-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col md:flex-row md:items-center bg-gray-100 border p-2 rounded border-gray-400 justify-between gap-3 mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative w-full md:w-1/3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                placeholder: "Search By User",
                                value: search,
                                onChange: (e)=>setSearch(e.target.value),
                                className: "w-full pl-10 pr-4 py-2 bg-white border border-gray-400 rounded-md text-sm"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                lineNumber: 78,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                className: "absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                lineNumber: 85,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                        lineNumber: 77,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: statusFilter,
                                onChange: (e)=>setStatusFilter(e.target.value),
                                className: "border border-gray-400 bg-gray-200 text-sm rounded-md px-3 py-2 cursor-pointer",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "Status"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                        lineNumber: 95,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "approved",
                                        children: "Approved"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                        lineNumber: 96,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "pending",
                                        children: "Pending"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                        lineNumber: 97,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "blocked",
                                        children: "Blocked"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                        lineNumber: 98,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "reject",
                                        children: "Rejected"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                        lineNumber: 99,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                lineNumber: 90,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: genderFilter,
                                onChange: (e)=>setGenderFilter(e.target.value),
                                className: "border border-gray-400 bg-gray-200 text-sm rounded-md px-3 py-2 cursor-pointer",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "Gender"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                        lineNumber: 107,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Male",
                                        children: "Male"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                        lineNumber: 108,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Female",
                                        children: "Female"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                        lineNumber: 109,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "N/A",
                                        children: "N/A"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                        lineNumber: 110,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                lineNumber: 102,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                        lineNumber: 89,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                lineNumber: 74,
                columnNumber: 7
            }, this),
            loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "flex justify-center py-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                    src: "/loading2.gif",
                    width: 90,
                    height: 90,
                    alt: "loading"
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                    lineNumber: 119,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                lineNumber: 118,
                columnNumber: 9
            }, this),
            !loading && users.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                className: "min-w-full text-sm border border-gray-300",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                        className: "bg-gray-50 text-gray-700 font-medium",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    className: "p-2 border",
                                    children: "User Name"
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                    lineNumber: 128,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    className: "p-2 border",
                                    children: "Location"
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                    lineNumber: 129,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    className: "p-2 border",
                                    children: "Joined"
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                    lineNumber: 130,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    className: "p-2 border text-center",
                                    children: "Verified"
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                    lineNumber: 131,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    className: "p-2 border text-center",
                                    children: "Last Active"
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                    lineNumber: 132,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    className: "p-2 border text-center",
                                    children: "Status"
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                    lineNumber: 133,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    className: "p-2 border text-center",
                                    children: "Actions"
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                    lineNumber: 134,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                            lineNumber: 127,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                        lineNumber: 126,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                        children: users.map((user, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                className: "text-gray-700",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        className: "p-2 border",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                    src: user.profileImage,
                                                    className: "w-10 h-10 rounded-full object-cover",
                                                    alt: "avatar"
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                                    lineNumber: 144,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex flex-col",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "font-medium",
                                                            children: user.fullName
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                                            lineNumber: 150,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-xs text-gray-500",
                                                            children: [
                                                                user.id,
                                                                " / ",
                                                                user.gender
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                                            lineNumber: 151,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                                    lineNumber: 149,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                            lineNumber: 143,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                        lineNumber: 142,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        className: "p-2 border",
                                        children: user.location
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                        lineNumber: 158,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        className: "p-2 border",
                                        children: user.joined
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                        lineNumber: 159,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        className: "p-2 border text-center",
                                        children: user.verified === 'Yes' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-green-600 font-semibold",
                                            children: "✔ Yes"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                            lineNumber: 163,
                                            columnNumber: 21
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-red-600 font-semibold",
                                            children: "✘ No"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                            lineNumber: 165,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                        lineNumber: 161,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        className: "p-2 border text-center",
                                        children: user.lastActive
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                        lineNumber: 169,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        className: "p-2 border text-center",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "inline-flex items-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `w-3 h-3 rounded-full ${user.status === 'approved' ? 'bg-green-600' : user.status === 'pending' ? 'bg-yellow-500' : user.status === 'blocked' ? 'bg-red-600' : user.status === 'reject' ? 'bg-gray-500' : 'bg-gray-300'}`
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                                    lineNumber: 173,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium capitalize",
                                                    children: user.status
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                                    lineNumber: 186,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                            lineNumber: 172,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                        lineNumber: 171,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        className: "p-2 border text-center",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: `/manageusers/${user.mongoId}`,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-black hover:underline cursor-pointer",
                                                children: "View"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                                lineNumber: 194,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                            lineNumber: 193,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                        lineNumber: 192,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, idx, true, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                lineNumber: 140,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                        lineNumber: 138,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                lineNumber: 125,
                columnNumber: 9
            }, this),
            !loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-center items-center mt-4 text-sm text-gray-700 space-x-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setCurrentPage((p)=>Math.max(1, p - 1)),
                        className: "px-2",
                        children: "◄"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                        lineNumber: 211,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setCurrentPage((p)=>Math.max(1, p - 1)),
                        className: "px-2",
                        children: "Prev"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                        lineNumber: 219,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "|"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                        lineNumber: 227,
                        columnNumber: 11
                    }, this),
                    getPageNumbers().map((num)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "flex items-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setCurrentPage(num),
                                    className: currentPage === num ? 'font-bold underline text-black' : 'text-gray-700',
                                    children: num
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                    lineNumber: 232,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "px-1",
                                    children: "|"
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                                    lineNumber: 242,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, num, true, {
                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                            lineNumber: 231,
                            columnNumber: 13
                        }, this)),
                    totalPages > 4 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "….."
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                        lineNumber: 247,
                        columnNumber: 30
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setCurrentPage((p)=>Math.min(totalPages, p + 1)),
                        className: "px-2",
                        children: "Next"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                        lineNumber: 250,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setCurrentPage((p)=>Math.min(totalPages, p + 1)),
                        className: "px-2",
                        children: "►"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                        lineNumber: 258,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
                lineNumber: 208,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js",
        lineNumber: 71,
        columnNumber: 5
    }, this);
}
_s(UserTable, "vACZoVAvRbS1MVCB8g9WhQjBcMI=");
_c = UserTable;
var _c;
__turbopack_context__.k.register(_c, "UserTable");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>UserTable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/lucide-react/dist/esm/icons/search.js [client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/lucide-react/dist/esm/icons/download.js [client] (ecmascript) <export default as Download>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$papaparse$2f$papaparse$2e$min$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/papaparse/papaparse.min.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/src/component/api/apiURL.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function UserTable() {
    _s();
    const [rawUsers, setRawUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]); // API DATA
    const [users, setUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]); // TABLE DATA (FILTERED)
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [statusFilter, setStatusFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [genderFilter, setGenderFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [sortField, setSortField] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [asc, setAsc] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [currentPage, setCurrentPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [totalPages, setTotalPages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const usersPerPage = 5;
    // ⭐ API FETCH (WORKS EVEN IF SEARCH NOT SUPPORTED)
    const fetchUsers = async ()=>{
        try {
            const url = `${__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__["API_URL"]}/admin/user-manage-get?search=${encodeURIComponent(search.trim())}&name=${encodeURIComponent(search.trim())}&status=${statusFilter.toLowerCase()}&gender=${genderFilter}&sortField=${sortField}&sortOrder=${asc ? 'asc' : 'desc'}&page=${currentPage}&limit=${usersPerPage}`;
            const res = await fetch(url);
            const data = await res.json();
            setRawUsers(data.users || []);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };
    // ⭐ Fetch on any change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "UserTable.useEffect": ()=>{
            fetchUsers();
        }
    }["UserTable.useEffect"], [
        statusFilter,
        genderFilter,
        sortField,
        asc,
        currentPage,
        search
    ]);
    // ⭐ LOCAL FILTER (GUARANTEED WORKS EVEN IF API SEARCH FAILS)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "UserTable.useEffect": ()=>{
            const filtered = rawUsers.filter({
                "UserTable.useEffect.filtered": (u)=>u.name?.toLowerCase().includes(search.toLowerCase())
            }["UserTable.useEffect.filtered"]);
            setUsers(filtered);
        }
    }["UserTable.useEffect"], [
        search,
        rawUsers
    ]);
    const toggleSort = (field)=>{
        if (sortField === field) {
            setAsc(!asc);
        } else {
            setSortField(field);
            setAsc(true);
        }
    };
    const handleExportCSV = ()=>{
        const csv = __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$papaparse$2f$papaparse$2e$min$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].unparse(users);
        const blob = new Blob([
            csv
        ], {
            type: 'text/csv;charset=utf-8;'
        });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'users.csv';
        a.click();
    };
    const getStatusColor = (status)=>{
        if (status === 'Approved') return 'text-green-600';
        if (status === 'Pending') return 'text-yellow-500';
        return 'text-red-600';
    };
    const getStatusDotColor = (status)=>{
        if (status === 'Approved') return 'bg-green-500';
        if (status === 'Pending') return 'bg-yellow-400';
        return 'bg-red-500';
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-white shadow-md rounded-xl p-4 border border-gray-400 w-full mt-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col border p-2 rounded bg-gray-100 border-gray-400 md:flex-row md:items-center justify-between gap-3 mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative w-full md:w-1/3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                placeholder: "Search By User Name",
                                value: search,
                                onChange: (e)=>{
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                },
                                className: "w-full pl-10 pr-4 py-2  bg-white border border-gray-300 rounded-md text-sm"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                lineNumber: 93,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                className: "absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                lineNumber: 100,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                        lineNumber: 92,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-2 items-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: statusFilter,
                                onChange: (e)=>{
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                },
                                className: "border border-gray-400 bg-gray-200 cursor-pointer hover:bg-gray-300 text-sm rounded-md px-3 py-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "Status"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                        lineNumber: 110,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Approved",
                                        children: "Approved"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                        lineNumber: 111,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Pending",
                                        children: "Pending"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                        lineNumber: 112,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Reject",
                                        children: "Reject"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                        lineNumber: 113,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                lineNumber: 105,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: genderFilter,
                                onChange: (e)=>{
                                    setGenderFilter(e.target.value);
                                    setCurrentPage(1);
                                },
                                className: "border border-gray-400 bg-gray-200 cursor-pointer hover:bg-gray-300 text-sm rounded-md px-3 py-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "Gender"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                        lineNumber: 121,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Male",
                                        children: "Male"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                        lineNumber: 122,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Female",
                                        children: "Female"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                        lineNumber: 123,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                lineNumber: 116,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleExportCSV,
                                className: "px-3 py-2 text-sm border border-gray-400 bg-gray-200 cursor-pointer hover:bg-gray-300 rounded-md flex items-center gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
                                        size: 16
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                        lineNumber: 130,
                                        columnNumber: 13
                                    }, this),
                                    " Export CSV"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                lineNumber: 126,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                        lineNumber: 103,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                lineNumber: 90,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "overflow-x-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                    className: "min-w-full text-sm border border-gray-300 text-left",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                            className: "bg-gray-100 text-gray-600",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-2",
                                        children: "User ID"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                        lineNumber: 142,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-2 cursor-pointer",
                                        onClick: ()=>toggleSort('name'),
                                        children: "User Name ⬍"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                        lineNumber: 143,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-2 cursor-pointer",
                                        onClick: ()=>toggleSort('location'),
                                        children: "Location ⬍"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                        lineNumber: 144,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-2 cursor-pointer",
                                        onClick: ()=>toggleSort('gender'),
                                        children: "Gender ⬍"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                        lineNumber: 145,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-2 cursor-pointer",
                                        onClick: ()=>toggleSort('joined'),
                                        children: "Joined ⬍"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                        lineNumber: 146,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-2",
                                        children: "Verified"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                        lineNumber: 147,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-2",
                                        children: "Status"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                        lineNumber: 148,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "p-2",
                                        children: "Last Active"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                        lineNumber: 149,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                lineNumber: 141,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                            lineNumber: 140,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            children: users.map((user, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    className: "border-t border-gray-300 text-gray-600",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2",
                                            children: user.id
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                            lineNumber: 156,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2",
                                            children: user.name
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                            lineNumber: 157,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2",
                                            children: user.location || 'Not Mention'
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                            lineNumber: 158,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2",
                                            children: user.gender || 'Not Mention'
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                            lineNumber: 159,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2",
                                            children: user.joined
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                            lineNumber: 160,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2",
                                            children: user.verified ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "inline-block w-6 h-6 bg-green-700 text-white rounded-sm flex items-center justify-center",
                                                        children: "✔"
                                                    }, void 0, false, {
                                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                                        lineNumber: 165,
                                                        columnNumber: 23
                                                    }, this),
                                                    "Yes"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                                lineNumber: 164,
                                                columnNumber: 21
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2 text-red-600",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-bold",
                                                    children: "✘ No"
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                                    lineNumber: 170,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                                lineNumber: 169,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                            lineNumber: 162,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `flex items-center gap-1 ${getStatusColor(user.status)}`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `w-2 h-2 rounded-full ${getStatusDotColor(user.status)}`
                                                    }, void 0, false, {
                                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                                        lineNumber: 177,
                                                        columnNumber: 21
                                                    }, this),
                                                    user.status
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                                lineNumber: 176,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                            lineNumber: 175,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "p-2",
                                            children: user.lastActive
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                            lineNumber: 182,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, index, true, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                    lineNumber: 155,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                            lineNumber: 153,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                    lineNumber: 138,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                lineNumber: 137,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-center items-center mt-4 text-sm text-gray-700 space-x-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setCurrentPage((p)=>Math.max(1, p - 1)),
                        className: "px-2",
                        children: "◄"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                        lineNumber: 193,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setCurrentPage((p)=>Math.max(1, p - 1)),
                        className: "px-2",
                        children: "Prev"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                        lineNumber: 195,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "|"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                        lineNumber: 197,
                        columnNumber: 9
                    }, this),
                    (()=>{
                        let start = Math.max(1, currentPage - 3);
                        let end = Math.min(start + 3, totalPages);
                        return Array.from({
                            length: end - start + 1
                        }, (_, idx)=>{
                            const num = start + idx;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                onClick: ()=>setCurrentPage(num),
                                className: `cursor-pointer px-1 ${currentPage === num ? "font-semibold" : ""}`,
                                children: [
                                    num,
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "|"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                        lineNumber: 207,
                                        columnNumber: 23
                                    }, this)
                                ]
                            }, num, true, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                                lineNumber: 206,
                                columnNumber: 15
                            }, this);
                        });
                    })(),
                    totalPages > 4 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "….."
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                        lineNumber: 213,
                        columnNumber: 28
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "|"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                        lineNumber: 215,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setCurrentPage((p)=>Math.min(totalPages, p + 1)),
                        className: "px-2",
                        children: "Next"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                        lineNumber: 217,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setCurrentPage((p)=>Math.min(totalPages, p + 1)),
                        className: "px-2",
                        children: "►"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                        lineNumber: 219,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
                lineNumber: 191,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js",
        lineNumber: 87,
        columnNumber: 5
    }, this);
}
_s(UserTable, "3FyhNqd/qIaOp9c3LDcSaJmkTa0=");
_c = UserTable;
var _c;
__turbopack_context__.k.register(_c, "UserTable");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/UserSummary.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>StatCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUp$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/lucide-react/dist/esm/icons/arrow-up.js [client] (ecmascript) <export default as ArrowUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDown$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/lucide-react/dist/esm/icons/arrow-down.js [client] (ecmascript) <export default as ArrowDown>");
;
;
function StatCard({ totalUsers, newSignups }) {
    const formatNumber = (num)=>{
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + " M";
        if (num >= 1_000) return (num / 1_000).toFixed(1) + " K";
        return num.toLocaleString();
    };
    const ChangeIndicator = ({ change, trend })=>{
        const isUp = trend === "up";
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-start gap-[6px] mt-[6px]",
            children: [
                isUp ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUp$3e$__["ArrowUp"], {
                    size: 30,
                    className: "text-green-600 mt-[2px]"
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/UserSummary.js",
                    lineNumber: 16,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$down$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowDown$3e$__["ArrowDown"], {
                    size: 30,
                    className: "text-red-600 mt-[2px]"
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/UserSummary.js",
                    lineNumber: 18,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col leading-[15px]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: `text-[16px] font-semibold ${isUp ? "text-green-600" : "text-red-600"}`,
                            children: [
                                Math.abs(change),
                                " % Vs"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/UserSummary.js",
                            lineNumber: 22,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: `text-[15px] ${isUp ? "text-green-600" : "text-red-600"}`,
                            children: "last week"
                        }, void 0, false, {
                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/UserSummary.js",
                            lineNumber: 30,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/UserSummary.js",
                    lineNumber: 21,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/UserSummary.js",
            lineNumber: 14,
            columnNumber: 7
        }, this);
    };
    const StatItem = ({ title, value, change, trend })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex-1 text-center",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-[18px] font-bold text-gray-700 whitespace-nowrap",
                    children: title
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/UserSummary.js",
                    lineNumber: 44,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-[32px] font-bold text-gray-900",
                    children: formatNumber(value)
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/UserSummary.js",
                    lineNumber: 48,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChangeIndicator, {
                    change: change,
                    trend: trend
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/UserSummary.js",
                    lineNumber: 52,
                    columnNumber: 7
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/UserSummary.js",
            lineNumber: 43,
            columnNumber: 5
        }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-white border border-gray-400 shadow rounded-xl px-6 py-4 w-full max-w-md",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatItem, {
                    title: "Total users",
                    value: totalUsers.count,
                    change: totalUsers.change,
                    trend: totalUsers.trend
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/UserSummary.js",
                    lineNumber: 59,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-[2px] h-[60px] bg-gray-300 mx-2"
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/UserSummary.js",
                    lineNumber: 66,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatItem, {
                    title: "New Signups",
                    value: newSignups.count,
                    change: newSignups.change,
                    trend: newSignups.trend
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/UserSummary.js",
                    lineNumber: 68,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/UserSummary.js",
            lineNumber: 58,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/UserSummary.js",
        lineNumber: 57,
        columnNumber: 5
    }, this);
}
_c = StatCard;
var _c;
__turbopack_context__.k.register(_c, "StatCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/OneDrive/Desktop/matrimonial-admin/src/lib/socket.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "connectSocket",
    ()=>connectSocket,
    "disconnectSocket",
    ()=>disconnectSocket,
    "getSocket",
    ()=>getSocket
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/socket.io-client/build/esm/index.js [client] (ecmascript) <locals>");
;
let socket = null;
function connectSocket(adminId) {
    if (socket && socket.connected) return socket;
    socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["io"])("https://matrimonial-backend-7ahc.onrender.com", {
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
"[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/index.js [client] (ecmascript)");
// ⭐ SOCKET SYSTEM
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/src/lib/socket.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const Search = ()=>{
    _s();
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [notifications, setNotifications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [unread, setUnread] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const dropdownRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const BASE_URL = "https://matrimonial-backend-7ahc.onrender.com";
    /* ------------------------------------------------------
        1) ADMIN NOTIFICATION PREFERENCES → CONNECT SOCKET
  -------------------------------------------------------*/ const loadAdminPrefs = async ()=>{
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/admin/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const json = await res.json();
            if (!json.success) return;
            const admin = json.data;
            if (admin.notifications === true) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["connectSocket"])(admin._id); // connect
            } else {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["disconnectSocket"])(); // disconnect
            }
        } catch (err) {
            console.log("Admin Pref Error:", err);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Search.useEffect": ()=>{
            loadAdminPrefs();
        }
    }["Search.useEffect"], []);
    /* ------------------------------------------------------
        2) FETCH NOTIFICATIONS
  -------------------------------------------------------*/ const fetchNotifications = async ()=>{
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
                setUnread(list.filter((n)=>!n.read).length);
            }
        } catch (error) {
            console.log("Notification Fetch Error:", error);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Search.useEffect": ()=>{
            fetchNotifications();
        }
    }["Search.useEffect"], []);
    /* ------------------------------------------------------
        3) SOCKET REAL-TIME LISTENERS
  -------------------------------------------------------*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Search.useEffect": ()=>{
            const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getSocket"])();
            if (!socket) return;
            console.log("🟢 REAL-TIME SOCKET ACTIVE (Manage Users)");
            // NEW NOTIFICATION
            socket.on("new-notification", {
                "Search.useEffect": (data)=>{
                    setNotifications({
                        "Search.useEffect": (prev)=>[
                                data,
                                ...prev
                            ]
                    }["Search.useEffect"]);
                    setUnread({
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
                    setUnread({
                        "Search.useEffect": (u)=>Math.max(u - 1, 0)
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
                    setUnread(0);
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
                    setUnread({
                        "Search.useEffect": (u)=>Math.max(u - 1, 0)
                    }["Search.useEffect"]);
                }
            }["Search.useEffect"]);
            // DELETE ALL SYNC
            socket.on("delete-all", {
                "Search.useEffect": ()=>{
                    setNotifications([]);
                    setUnread(0);
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
    /* ------------------------------------------------------
        MARK ONE READ
  -------------------------------------------------------*/ const markRead = async (id)=>{
        const token = localStorage.getItem("token");
        // FRONTEND UPDATE
        setNotifications((prev)=>prev.map((n)=>n._id === id ? {
                    ...n,
                    read: true
                } : n));
        setUnread((u)=>Math.max(u - 1, 0));
        // BACKEND UPDATE
        await fetch(`${BASE_URL}/api/notification/mark-read/${id}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getSocket"])()?.emit("one-read", {
            id
        });
    };
    /* ------------------------------------------------------
        MARK ALL READ 
  -------------------------------------------------------*/ const markAll = async ()=>{
        const token = localStorage.getItem("token");
        setNotifications((prev)=>prev.map((n)=>({
                    ...n,
                    read: true
                })));
        setUnread(0);
        await fetch(`${BASE_URL}/api/notification/mark-all`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getSocket"])()?.emit("all-read");
    };
    /* ------------------------------------------------------
        DELETE ONE 
  -------------------------------------------------------*/ const deleteOne = async (id)=>{
        const token = localStorage.getItem("token");
        setNotifications((prev)=>prev.filter((n)=>n._id !== id));
        await fetch(`${BASE_URL}/api/notification/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getSocket"])()?.emit("delete-one", {
            id
        });
    };
    /* ------------------------------------------------------
       DELETE ALL 
  -------------------------------------------------------*/ const deleteAll = async ()=>{
        const token = localStorage.getItem("token");
        setNotifications([]);
        setUnread(0);
        await fetch(`${BASE_URL}/api/notification/delete-all`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getSocket"])()?.emit("delete-all");
    };
    /* ------------------------------------------------------
        OUTSIDE CLICK CLOSE
  -------------------------------------------------------*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
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
    /* ------------------------------------------------------
        BELL CLICK 
  -------------------------------------------------------*/ const handleBellClick = ()=>{
        const newOpen = !open;
        setOpen(newOpen);
        if (newOpen) {
            markAll();
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-gray-100 px-6 py-4 shadow-sm border-b fixed top-0 z-50 flex items-center justify-between",
        style: {
            left: "250px",
            width: "calc(100% - 250px)"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-2xl font-bold text-gray-900",
                children: "Manage Users"
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                lineNumber: 232,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-5",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative",
                    ref: dropdownRef,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "cursor-pointer",
                            onClick: handleBellClick,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "30",
                                    height: "30",
                                    viewBox: "0 0 24 24",
                                    fill: "#FFC107",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        d: "M12 24c1.104 0 2-.897 2-2h-4c0 1.103.896 2 2 2zm6.707-5l1.293 1.293V21H4v-1.707L5.293 19H6v-7c0-3.309 2.691-6 6-6s6 2.691 6 6v7h.707zM18 18H6v-7c0-2.757 2.243-5 5-5s5 2.243 5 5v7z"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                                        lineNumber: 240,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                                    lineNumber: 239,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                unread > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "absolute -top-1 -right-1 h-4 w-4 text-[10px] flex items-center justify-center bg-red-600 text-white rounded-full",
                                    children: unread
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                                    lineNumber: 244,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                            lineNumber: 238,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute right-0 mt-3 w-80 bg-white shadow-xl border rounded-lg max-h-96 overflow-y-auto p-3 z-50",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-between items-center mb-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "font-semibold text-lg",
                                            children: "Notifications"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                                            lineNumber: 255,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: markAll,
                                            className: "text-blue-600 text-sm",
                                            children: "Mark all read"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                                            lineNumber: 256,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                                    lineNumber: 254,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                notifications.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "p-4 text-sm text-gray-500",
                                    children: "No notifications"
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                                    lineNumber: 262,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0)) : notifications.map((n)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "border-b pb-3 mb-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex justify-between items-center",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "font-bold text-[15px] capitalize",
                                                        children: n.title
                                                    }, void 0, false, {
                                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                                                        lineNumber: 268,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>deleteOne(n._id),
                                                        className: "text-red-600 text-xs",
                                                        children: "Delete"
                                                    }, void 0, false, {
                                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                                                        lineNumber: 272,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                                                lineNumber: 267,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-gray-700 text-sm mt-1",
                                                children: n.message
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                                                lineNumber: 280,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-gray-400 text-xs mt-1",
                                                children: new Date(n.createdAt).toLocaleString()
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                                                lineNumber: 282,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            !n.read && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>markRead(n._id),
                                                className: "text-blue-600 text-xs mt-1",
                                                children: "Mark as read"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                                                lineNumber: 287,
                                                columnNumber: 23
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, n._id, true, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                                        lineNumber: 265,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0))),
                                notifications.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("hr", {
                                            className: "border-gray-300 my-2"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                                            lineNumber: 300,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: deleteAll,
                                            className: "w-full py-2 text-red-600 text-sm",
                                            children: "Delete All"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                                            lineNumber: 301,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                            lineNumber: 252,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                    lineNumber: 237,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
                lineNumber: 234,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js",
        lineNumber: 224,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(Search, "k/L0Poh/N9VOkq64pWWg+kcqprc=");
_c = Search;
const __TURBOPACK__default__export__ = Search;
var _c;
__turbopack_context__.k.register(_c, "Search");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/OneDrive/Desktop/matrimonial-admin/pages/manageusers/index.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/next/image.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$manageusers$2f$ProfileStatsCard$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ProfileStatsCard.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$manageusers$2f$ApprovedProfileCard$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ApprovedProfileCard.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$manageusers$2f$PendingProfileCard$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/PendingProfileCard.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$manageusers$2f$ManUserTable$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ManUserTable.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$manageusers$2f$ThirdUserTable$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/ThirdUserTable.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/src/component/api/apiURL.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$manageusers$2f$UserSummary$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/UserSummary.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$manageusers$2f$Search$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/src/component/manageusers/Search.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
;
;
;
const ManageUsers = ()=>{
    _s();
    const [stats, setStats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ManageUsers.useEffect": ()=>{
            const fetchStats = {
                "ManageUsers.useEffect.fetchStats": async ()=>{
                    try {
                        const res = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__["API_URL"]}/admin/user-stats`);
                        const data = await res.json();
                        setStats(data);
                    } catch (err) {
                        console.error('Failed to fetch stats:', err);
                    }
                }
            }["ManageUsers.useEffect.fetchStats"];
            fetchStats();
        }
    }["ManageUsers.useEffect"], []);
    if (!stats) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-4 mt-[280px] flex justify-center items-center",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
            src: "/loading2.gif",
            height: 200,
            width: 200,
            alt: "Loading.."
        }, void 0, false, {
            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/manageusers/index.js",
            lineNumber: 33,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/manageusers/index.js",
        lineNumber: 32,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$manageusers$2f$Search$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/manageusers/index.js",
                lineNumber: 40,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pt-[85px] p-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$manageusers$2f$UserSummary$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                totalUsers: stats.totalUsers,
                                newSignups: stats.newSignups
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/manageusers/index.js",
                                lineNumber: 46,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$manageusers$2f$ProfileStatsCard$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                profileCompleted: stats.profileCompleted,
                                profileIncomplete: stats.profileIncomplete
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/manageusers/index.js",
                                lineNumber: 47,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$manageusers$2f$ApprovedProfileCard$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                data: stats.approvedProfiles
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/manageusers/index.js",
                                lineNumber: 51,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$manageusers$2f$PendingProfileCard$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                data: stats.pendingProfiles
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/manageusers/index.js",
                                lineNumber: 52,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/manageusers/index.js",
                        lineNumber: 45,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$manageusers$2f$ManUserTable$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/manageusers/index.js",
                        lineNumber: 55,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$manageusers$2f$ThirdUserTable$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/manageusers/index.js",
                        lineNumber: 56,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/manageusers/index.js",
                lineNumber: 43,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true);
};
_s(ManageUsers, "QHCAg5+sC7SrLiGx+x4h2IICBFk=");
_c = ManageUsers;
const __TURBOPACK__default__export__ = ManageUsers;
var _c;
__turbopack_context__.k.register(_c, "ManageUsers");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/OneDrive/Desktop/matrimonial-admin/pages/manageusers/index.js [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/manageusers";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/OneDrive/Desktop/matrimonial-admin/pages/manageusers/index.js [client] (ecmascript)");
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
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/OneDrive/Desktop/matrimonial-admin/pages/manageusers/index.js\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/OneDrive/Desktop/matrimonial-admin/pages/manageusers/index.js [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__78e3e59d._.js.map