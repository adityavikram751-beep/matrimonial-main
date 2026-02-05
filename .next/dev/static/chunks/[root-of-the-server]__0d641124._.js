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
"[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AnalyticsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$LineChart$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/recharts/es6/chart/LineChart.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$Line$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/recharts/es6/cartesian/Line.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Tooltip$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/recharts/es6/component/Tooltip.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$XAxis$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/recharts/es6/cartesian/XAxis.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$YAxis$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/recharts/es6/cartesian/YAxis.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$ResponsiveContainer$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/recharts/es6/component/ResponsiveContainer.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$CartesianGrid$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/recharts/es6/cartesian/CartesianGrid.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function AnalyticsPage() {
    _s();
    const API = "https://matrimonial-backend-7ahc.onrender.com/admin/getByGender";
    // Month list
    const MONTHS = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];
    // backend lowercase mapping
    const MONTH_MAP = {
        January: "january",
        February: "february",
        March: "march",
        April: "april",
        May: "may",
        June: "june",
        July: "july",
        August: "august",
        September: "september",
        October: "october",
        November: "november",
        December: "december"
    };
    // Auto previous month
    function getPrevMonth(m) {
        const i = MONTHS.indexOf(m);
        return i === 0 ? "December" : MONTHS[i - 1];
    }
    // STATES
    const [selectedMonth, setSelectedMonth] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("December");
    const [previousMonth, setPreviousMonth] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("November");
    const [genderData, setGenderData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [matchData, setMatchData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [signInData, setSignInData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [totalSignIn, setTotalSignIn] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [percentGrowth, setPercentGrowth] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [hover, setHover] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // LOAD DATA BY MONTH
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnalyticsPage.useEffect": ()=>{
            let mounted = true;
            ({
                "AnalyticsPage.useEffect": async ()=>{
                    setLoading(true);
                    const prev = getPrevMonth(selectedMonth);
                    setPreviousMonth(prev);
                    const backendMonth = MONTH_MAP[selectedMonth];
                    try {
                        const res = await fetch(`${API}?month=${backendMonth}&year=2025`);
                        const json = await res.json();
                        if (!mounted) return;
                        setGenderData(json.genderData || []);
                        setMatchData(json.matchData || []);
                        setSignInData(json.signInData || []);
                        setTotalSignIn(json.totalCurrentMonthSignIns ?? 0);
                        setPercentGrowth(json.percentGrowth ?? 0);
                    } catch (err) {
                        console.log("API error:", err);
                    }
                    setLoading(false);
                }
            })["AnalyticsPage.useEffect"]();
            return ({
                "AnalyticsPage.useEffect": ()=>mounted = false
            })["AnalyticsPage.useEffect"];
        }
    }["AnalyticsPage.useEffect"], [
        selectedMonth
    ]);
    // COLORS
    const genderColors = {
        Male: "#34D399",
        Female: "#FDE047",
        Others: "#F87171"
    };
    const matchColors = {
        "Still Looking": "#10B981",
        "Successfully Matched": "#FB923C",
        "Newly Registered": "#06B6D4",
        Inactive: "#FBBF24"
    };
    // 3D PIE CALC
    function build3DSlices(data = [], cx, cy, r, h) {
        const total = Math.max(1, data.reduce((t, a)=>t + (a.value || 0), 0));
        let start = -Math.PI / 2 + 0.2;
        return data.map((item)=>{
            const angle = item.value / total * Math.PI * 2;
            const end = start + angle;
            const x1 = cx + r * Math.cos(start);
            const y1 = cy + r * Math.sin(start);
            const x2 = cx + r * Math.cos(end);
            const y2 = cy + r * Math.sin(end);
            const largeArc = angle > Math.PI ? 1 : 0;
            const topPath = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            const sidePath = `M ${x1} ${y1} L ${x1} ${y1 + h} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2 + h} L ${x2} ${y2} Z`;
            start = end;
            return {
                ...item,
                percent: Math.round(item.value / total * 100),
                topPath,
                sidePath
            };
        });
    }
    const genderSlices = build3DSlices(genderData, 150, 120, 110, 24);
    const matchSlices = build3DSlices(matchData, 150, 150, 110, 30);
    const xTicks = [
        "01",
        "05",
        "10",
        "15",
        "20",
        "25",
        "30"
    ];
    const yTicks = [
        0,
        5,
        10,
        15,
        20,
        25,
        30,
        35,
        40,
        45
    ];
    // Tooltip
    function LineTooltip({ active, payload, label }) {
        if (!active || !payload?.length) return null;
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                background: "#111827",
                color: "#fff",
                padding: 10,
                borderRadius: 8
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                    children: [
                        "Day ",
                        label
                    ]
                }, void 0, true, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                    lineNumber: 148,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: payload[0].value
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                    lineNumber: 149,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
            lineNumber: 147,
            columnNumber: 7
        }, this);
    }
    // Tooltip hover handlers
    function handleSliceEnter(e, slice) {
        setHover({
            ...slice,
            x: e.clientX + 10,
            y: e.clientY - 70
        });
    }
    function handleSliceMove(e, slice) {
        setHover({
            ...slice,
            x: e.clientX + 10,
            y: e.clientY - 70
        });
    }
    function handleSliceLeave() {
        setHover(null);
    }
    if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-8 text-center text-gray-500",
        children: "Loading..."
    }, void 0, false, {
        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
        lineNumber: 174,
        columnNumber: 12
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-4 md:p-8 min-h-screen bg-gray-100",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col xl:flex-row gap-8 max-w-[1250px] mx-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white rounded-2xl shadow-lg border h-[700px] p-6 w-full xl:w-[700px]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between items-start",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-2xl font-bold",
                                            children: "Sign-In Analytics"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 186,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-end gap-4 mt-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-4xl font-extrabold",
                                                    children: [
                                                        totalSignIn,
                                                        "."
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                    lineNumber: 189,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bg-green-100 border border-green-400 px-3 py-1 rounded-lg text-green-700 font-semibold flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            style: {
                                                                fontSize: 18
                                                            },
                                                            children: "↑"
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                            lineNumber: 192,
                                                            columnNumber: 19
                                                        }, this),
                                                        " ",
                                                        percentGrowth,
                                                        "%"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                    lineNumber: 191,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-gray-600 font-medium",
                                                    children: "Vs Last Month"
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                    lineNumber: 195,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 188,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                    lineNumber: 185,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2 text-lg",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "w-3 h-3 rounded-full bg-black"
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                    lineNumber: 203,
                                                    columnNumber: 17
                                                }, this),
                                                selectedMonth
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 202,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2 text-lg",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "w-3 h-3 rounded-full bg-gray-400"
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                    lineNumber: 208,
                                                    columnNumber: 17
                                                }, this),
                                                previousMonth
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 207,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            className: "border rounded-xl px-4 py-2",
                                            value: selectedMonth,
                                            onChange: (e)=>setSelectedMonth(e.target.value),
                                            children: MONTHS.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: m
                                                }, m, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                    lineNumber: 218,
                                                    columnNumber: 19
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 212,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                    lineNumber: 200,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                            lineNumber: 184,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-full h-[540px] mt-2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$ResponsiveContainer$2e$js__$5b$client$5d$__$28$ecmascript$29$__["ResponsiveContainer"], {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$LineChart$2e$js__$5b$client$5d$__$28$ecmascript$29$__["LineChart"], {
                                    data: signInData,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$CartesianGrid$2e$js__$5b$client$5d$__$28$ecmascript$29$__["CartesianGrid"], {
                                            stroke: "#e6e6e6",
                                            strokeDasharray: "4 4"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 229,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$XAxis$2e$js__$5b$client$5d$__$28$ecmascript$29$__["XAxis"], {
                                            dataKey: "day",
                                            ticks: xTicks
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 230,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$YAxis$2e$js__$5b$client$5d$__$28$ecmascript$29$__["YAxis"], {
                                            ticks: yTicks
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 231,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Tooltip$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                            content: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LineTooltip, {}, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                lineNumber: 232,
                                                columnNumber: 37
                                            }, void 0)
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 232,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$Line$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Line"], {
                                            dataKey: "currentMonth",
                                            stroke: "#000",
                                            strokeWidth: 3,
                                            dot: true
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 234,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$Line$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Line"], {
                                            dataKey: "previousMonth",
                                            stroke: "#9ca3af",
                                            strokeDasharray: "6 6",
                                            strokeWidth: 2,
                                            dot: false
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 235,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                    lineNumber: 228,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                lineNumber: 227,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                            lineNumber: 226,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                    lineNumber: 182,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col gap-8 w-full xl:w-[500px]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white rounded-2xl shadow-lg border p-4 relative h-[330px] w-full",
                            children: [
                                hover && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        position: "fixed",
                                        left: hover.x,
                                        top: hover.y,
                                        zIndex: 9999,
                                        background: "#111827",
                                        color: "#fff",
                                        padding: 10,
                                        borderRadius: 6
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                            children: hover.name
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 265,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                hover.percent,
                                                "%"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 266,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                    lineNumber: 253,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-between items-center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-2xl font-bold",
                                            children: "Gender Analytics"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 271,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                width: 22,
                                                                height: 22,
                                                                borderRadius: 6,
                                                                border: `12px solid ${genderColors.Male}`
                                                            }
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                            lineNumber: 274,
                                                            columnNumber: 58
                                                        }, this),
                                                        " Male"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                    lineNumber: 274,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                width: 22,
                                                                height: 22,
                                                                borderRadius: 6,
                                                                border: `12px solid ${genderColors.Female}`
                                                            }
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                            lineNumber: 275,
                                                            columnNumber: 58
                                                        }, this),
                                                        " Female"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                    lineNumber: 275,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                width: 22,
                                                                height: 22,
                                                                borderRadius: 6,
                                                                border: `12px solid ${genderColors.Others}`
                                                            }
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                            lineNumber: 276,
                                                            columnNumber: 58
                                                        }, this),
                                                        " Ots."
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                    lineNumber: 276,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 273,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                    lineNumber: 270,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    width: "100%",
                                    height: "280",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                        transform: "translate(80,16)",
                                        children: [
                                            genderSlices.map((s, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: s.sidePath,
                                                    fill: genderColors[s.name],
                                                    opacity: "0.66"
                                                }, i, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                    lineNumber: 283,
                                                    columnNumber: 19
                                                }, this)),
                                            genderSlices.map((s, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                                    onMouseEnter: (e)=>handleSliceEnter(e, s),
                                                    onMouseMove: (e)=>handleSliceMove(e, s),
                                                    onMouseLeave: handleSliceLeave,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: s.topPath,
                                                        fill: genderColors[s.name],
                                                        stroke: "#fff",
                                                        strokeWidth: 2
                                                    }, void 0, false, {
                                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                        lineNumber: 293,
                                                        columnNumber: 21
                                                    }, this)
                                                }, i, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                    lineNumber: 287,
                                                    columnNumber: 19
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                        lineNumber: 281,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                    lineNumber: 280,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                            lineNumber: 251,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white rounded-2xl shadow-lg border p-4 relative h-[340px] w-full overflow-hidden",
                            children: [
                                hover && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        position: "fixed",
                                        left: hover.x,
                                        top: hover.y,
                                        zIndex: 99999,
                                        background: "#111827",
                                        color: "#fff",
                                        padding: 10,
                                        borderRadius: 8
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                            children: hover.name
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 316,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                hover.percent,
                                                "%"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 317,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                    lineNumber: 304,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex justify-between items-start",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-2xl font-bold",
                                            children: "Matchmaking Status"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 322,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-",
                                            children: Object.keys(matchColors).map((k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                width: 16,
                                                                height: 18,
                                                                borderRadius: 8,
                                                                border: `10px solid ${matchColors[k]}`
                                                            }
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                            lineNumber: 327,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-[14px] font-bold",
                                                            children: k
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                            lineNumber: 328,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, k, true, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                    lineNumber: 326,
                                                    columnNumber: 19
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 324,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                    lineNumber: 321,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute left-1/3 top-[51%] -translate-x-1/2 -translate-y-1/2",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        width: "520",
                                        height: "320",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                            transform: "translate(160,28)",
                                            children: [
                                                matchSlices.map((s, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: s.sidePath,
                                                        fill: matchColors[s.name],
                                                        opacity: "0.65"
                                                    }, i, false, {
                                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                        lineNumber: 338,
                                                        columnNumber: 21
                                                    }, this)),
                                                matchSlices.map((s, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                                                        onMouseEnter: (e)=>handleSliceEnter(e, s),
                                                        onMouseMove: (e)=>handleSliceMove(e, s),
                                                        onMouseLeave: handleSliceLeave,
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            d: s.topPath,
                                                            fill: matchColors[s.name],
                                                            stroke: "#fff",
                                                            strokeWidth: 3
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                            lineNumber: 348,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, i, false, {
                                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                        lineNumber: 342,
                                                        columnNumber: 21
                                                    }, this)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                    cx: "150",
                                                    cy: "150",
                                                    r: "48",
                                                    fill: "#fff"
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                                    lineNumber: 352,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                            lineNumber: 336,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                        lineNumber: 335,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                                    lineNumber: 334,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                            lineNumber: 301,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
                    lineNumber: 248,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
            lineNumber: 179,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js",
        lineNumber: 177,
        columnNumber: 5
    }, this);
}
_s(AnalyticsPage, "q/RewpZQz1U1ltgqomiL7HfjvZE=");
_c = AnalyticsPage;
var _c;
__turbopack_context__.k.register(_c, "AnalyticsPage");
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
"[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react-icons/fa/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$PieChart$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/recharts/es6/chart/PieChart.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$Pie$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/recharts/es6/polar/Pie.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Cell$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/recharts/es6/component/Cell.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/src/component/api/apiURL.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/next/image.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
const Donut = ({ value })=>{
    const data = [
        {
            name: "Completed",
            value
        },
        {
            name: "Remaining",
            value: 100 - value
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$PieChart$2e$js__$5b$client$5d$__$28$ecmascript$29$__["PieChart"], {
        width: 75,
        height: 75,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$polar$2f$Pie$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Pie"], {
            data: data,
            innerRadius: 28,
            outerRadius: 36,
            startAngle: 90,
            endAngle: -270,
            cornerRadius: 8,
            dataKey: "value",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Cell$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Cell"], {
                    fill: "#e60000"
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                    lineNumber: 24,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Cell$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Cell"], {
                    fill: "#fefbe5"
                }, void 0, false, {
                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                    lineNumber: 25,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
            lineNumber: 15,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
        lineNumber: 14,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c = Donut;
const ChangeIndicator = ({ percent })=>{
    const isUp = percent >= 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-start gap-[6px] leading-[15px] mt-[4px]",
        children: [
            isUp ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["FaArrowUp"], {
                size: 17,
                className: "text-green-600 mt-[2px]"
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                lineNumber: 37,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2d$icons$2f$fa$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["FaArrowDown"], {
                size: 17,
                className: "text-red-600 mt-[2px]"
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                lineNumber: 39,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `text-[16px] font-semibold ${isUp ? "text-green-600" : "text-red-600"}`,
                        children: [
                            Math.abs(percent),
                            " % Vs"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                        lineNumber: 43,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `text-[13px] ${isUp ? "text-green-600" : "text-red-600"}`,
                        children: "last week"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                        lineNumber: 50,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                lineNumber: 42,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
        lineNumber: 35,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c1 = ChangeIndicator;
const StatsSplitCard = ()=>{
    _s();
    const [stats, setStats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StatsSplitCard.useEffect": ()=>{
            const fetchStats = {
                "StatsSplitCard.useEffect.fetchStats": async ()=>{
                    try {
                        const response = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__["API_URL"]}/admin/summary`);
                        const data = await response.json();
                        setStats(data);
                    } catch  {
                        setStats(null);
                    }
                }
            }["StatsSplitCard.useEffect.fetchStats"];
            fetchStats();
        }
    }["StatsSplitCard.useEffect"], []);
    if (!stats) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex justify-center items-center py-8",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                src: "/loading2.gif",
                width: 80,
                height: 80,
                alt: "loading"
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                lineNumber: 82,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
            lineNumber: 81,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0));
    }
    const { totalUsers, newSignups, signupChangePercent, verifiedProfiles, verifiedChangePercent, pendingVerifications, pendingChangePercent, activeUsers, activeUsersChangePercent, reportedPercent, blockedPercent } = stats;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col lg:flex-row w-full gap-6 mt-22",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white border border-gray-300 rounded-xl shadow px-4 sm:px-6 lg:px-10 py-4 w-full lg:w-[25%] flex flex-col sm:flex-row lg:flex-col xl:flex-row justify-between items-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center sm:text-left lg:text-center xl:text-left mb-4 sm:mb-0 lg:mb-4 xl:mb-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[14px] sm:text-[16px] font-bold text-gray-800",
                                children: "Total Users"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 109,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-[24px] sm:text-[28px] lg:text-[30px] leading-[32px] font-semibold",
                                children: totalUsers
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 110,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChangeIndicator, {
                                percent: signupChangePercent
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 111,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                        lineNumber: 108,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hidden sm:block lg:hidden xl:block w-[2px] h-[70px] bg-gray-300 mx-4"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                        lineNumber: 115,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "block sm:hidden lg:block xl:hidden w-full h-[1px] bg-gray-300 my-4"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                        lineNumber: 116,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center sm:text-left lg:text-center xl:text-left",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[14px] sm:text-[16px] font-bold text-gray-800",
                                children: "New Signups"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 120,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-[24px] sm:text-[28px] lg:text-[30px] leading-[32px] font-semibold",
                                children: newSignups
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 121,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChangeIndicator, {
                                percent: signupChangePercent
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 122,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                        lineNumber: 119,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                lineNumber: 105,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white border border-gray-300 rounded-xl shadow px-4 sm:px-6 py-4 w-full lg:w-[45%] flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center sm:text-left",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[14px] sm:text-[16px] font-bold text-gray-800",
                                children: "Verified Profile"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 130,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-[24px] sm:text-[28px] lg:text-[30px] leading-[32px] font-semibold",
                                children: verifiedProfiles
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 131,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChangeIndicator, {
                                percent: verifiedChangePercent
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 132,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                        lineNumber: 129,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hidden sm:block w-[2px] h-[70px] bg-gray-300"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                        lineNumber: 135,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "block sm:hidden w-full h-[1px] bg-gray-300"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                        lineNumber: 136,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center sm:text-left",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[14px] sm:text-[16px] font-bold text-gray-800",
                                children: "Daily Active Users"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 139,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-[24px] sm:text-[28px] lg:text-[30px] leading-[32px] font-semibold",
                                children: activeUsers
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 140,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChangeIndicator, {
                                percent: activeUsersChangePercent
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 141,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                        lineNumber: 138,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hidden sm:block w-[2px] h-[70px] bg-gray-300"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                        lineNumber: 144,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "block sm:hidden w-full h-[1px] bg-gray-300"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                        lineNumber: 145,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center sm:text-left",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[14px] sm:text-[16px] font-bold text-gray-800",
                                children: "Pending Verification"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 148,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-[24px] sm:text-[28px] lg:text-[30px] leading-[32px] font-semibold",
                                children: pendingVerifications
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 149,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChangeIndicator, {
                                percent: pendingChangePercent
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 150,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                        lineNumber: 147,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                lineNumber: 127,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white border border-gray-300 rounded-xl shadow px-4 sm:px-6 py-4 w-full lg:w-[26%] flex flex-col sm:flex-row lg:flex-col xl:flex-row justify-between items-center gap-4 sm:gap-0",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[14px] sm:text-[16px] font-bold text-gray-800 mb-[2px]",
                                children: "Reported Users"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 159,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Donut, {
                                        value: reportedPercent
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                        lineNumber: 164,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "absolute top-[28px] left-[30px] text-[14px] font-semibold",
                                        children: [
                                            reportedPercent,
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                        lineNumber: 165,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 163,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                        lineNumber: 158,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hidden sm:block lg:hidden xl:block w-[2px] h-[70px] bg-gray-300 mx-4"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                        lineNumber: 172,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "block sm:hidden lg:block xl:hidden w-full h-[1px] bg-gray-300 my-4"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                        lineNumber: 173,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[14px] sm:text-[16px] font-bold text-gray-800 mb-[2px]",
                                children: "Blocked Users"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 177,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Donut, {
                                        value: blockedPercent
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                        lineNumber: 181,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "absolute top-[28px] left-[30px] text-[14px] font-semibold",
                                        children: [
                                            blockedPercent,
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                        lineNumber: 182,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                                lineNumber: 180,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                        lineNumber: 176,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
                lineNumber: 155,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js",
        lineNumber: 102,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(StatsSplitCard, "QHCAg5+sC7SrLiGx+x4h2IICBFk=");
_c2 = StatsSplitCard;
const __TURBOPACK__default__export__ = StatsSplitCard;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "Donut");
__turbopack_context__.k.register(_c1, "ChangeIndicator");
__turbopack_context__.k.register(_c2, "StatsSplitCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>UsersPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/src/component/api/apiURL.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/next/image.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function UsersPage() {
    _s();
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [statusFilter, setStatusFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [genderFilter, setGenderFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [users, setUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [currentPage, setCurrentPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [totalPages, setTotalPages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    /* ------------------ BANNER STATES ------------------ */ const [banners, setBanners] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [bannerLoading, setBannerLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const limit = 10;
    /* ------------------ USERS FETCH ------------------ */ const fetchUsers = async ()=>{
        try {
            setLoading(true);
            const params = new URLSearchParams({
                search,
                status: statusFilter,
                gender: genderFilter,
                page: currentPage,
                limit
            });
            const res = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__["API_URL"]}/admin/getUser?${params.toString()}`);
            const data = await res.json();
            setUsers(data.data || []);
            setTotalPages(data.totalPages || 1);
            setLoading(false);
        } catch  {
            setLoading(false);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "UsersPage.useEffect": ()=>{
            fetchUsers();
        }
    }["UsersPage.useEffect"], [
        search,
        statusFilter,
        genderFilter,
        currentPage
    ]);
    /* ------------------ EXPORT CSV ------------------ */ const handleExportCSV = ()=>{
        if (!users.length) return;
        const headers = Object.keys(users[0]);
        const csvRows = [];
        csvRows.push(headers.join(","));
        users.forEach((u)=>{
            const row = headers.map((h)=>`"${u[h]}"`);
            csvRows.push(row.join(","));
        });
        const csvString = csvRows.join("\n");
        const blob = new Blob([
            csvString
        ], {
            type: "text/csv"
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "users.csv";
        a.click();
    };
    /* ------------------ BANNER FETCH ------------------ */ const fetchBanners = async ()=>{
        try {
            const res = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__["API_URL"]}/api/banners`);
            const data = await res.json();
            setBanners(data.data || []);
        } catch  {}
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "UsersPage.useEffect": ()=>{
            fetchBanners();
        }
    }["UsersPage.useEffect"], []);
    /* ------------------ ADD BANNER ------------------ */ const handleAddBanner = async (e)=>{
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append("banner", file);
        try {
            setBannerLoading(true);
            const res = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__["API_URL"]}/api/banners`, {
                method: "POST",
                body: fd
            });
            const data = await res.json();
            if (!res.ok) return;
            setBanners((prev)=>[
                    ...prev,
                    ...data.data
                ]);
        } finally{
            setBannerLoading(false);
        }
    };
    /* ------------------ UPDATE BANNER ------------------ */ const handleUpdateBanner = async (id)=>{
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e)=>{
            const file = e.target.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.append("banner", file);
            try {
                setBannerLoading(true);
                const res = await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__["API_URL"]}/api/banners/${id}`, {
                    method: "PUT",
                    body: fd
                });
                const data = await res.json();
                if (!res.ok) return;
                fetchBanners();
            } finally{
                setBannerLoading(false);
            }
        };
        input.click();
    };
    /* ------------------ DELETE BANNER ------------------ */ const handleDeleteBanner = async (id)=>{
        try {
            setBannerLoading(true);
            await fetch(`${__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$api$2f$apiURL$2e$js__$5b$client$5d$__$28$ecmascript$29$__["API_URL"]}/api/banners/${id}`, {
                method: "DELETE"
            });
            setBanners((prev)=>prev.filter((b)=>b._id !== id));
        } finally{
            setBannerLoading(false);
        }
    };
    /* ------------------ PAGINATION ------------------ */ const windowSize = 4;
    const start = Math.floor((currentPage - 1) / windowSize) * windowSize + 1;
    const end = Math.min(start + windowSize - 1, totalPages);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-4 sm:p-6 w-full overflow-x-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-xl sm:rounded-2xl shadow-md border border-gray-500 p-3 sm:p-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 px-3 sm:px-4 py-2 border rounded-xl bg-white shadow-sm w-full sm:w-[300px]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                        src: "/search.png",
                                        width: 18,
                                        height: 18,
                                        alt: "Search"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                        lineNumber: 177,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        placeholder: "Search By User ID",
                                        className: "w-full outline-none text-sm sm:text-base",
                                        value: search,
                                        onChange: (e)=>{
                                            setSearch(e.target.value);
                                            setCurrentPage(1);
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                        lineNumber: 178,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                lineNumber: 176,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        className: "border bg-gray-200 px-3 py-2 rounded-lg text-sm sm:text-base w-full sm:w-auto",
                                        value: statusFilter,
                                        onChange: (e)=>{
                                            setStatusFilter(e.target.value);
                                            setCurrentPage(1);
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "",
                                                children: "Status"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                lineNumber: 200,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                children: "Approved"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                lineNumber: 201,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                children: "Pending"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                lineNumber: 202,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                children: "Blocked"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                lineNumber: 203,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                        lineNumber: 192,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        className: "border bg-gray-200 px-3 py-2 rounded-lg text-sm sm:text-base w-full sm:w-auto",
                                        value: genderFilter,
                                        onChange: (e)=>{
                                            setGenderFilter(e.target.value);
                                            setCurrentPage(1);
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "",
                                                children: "Gender"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                lineNumber: 214,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                children: "Male"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                lineNumber: 215,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                children: "Female"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                lineNumber: 216,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                        lineNumber: 206,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleExportCSV,
                                        className: "px-3 sm:px-4 py-2 bg-gray-200 rounded-lg border border-gray-600 hover:bg-gray-100 text-sm sm:text-base w-full sm:w-auto",
                                        children: "Export CSV"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                        lineNumber: 220,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                lineNumber: 191,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                        lineNumber: 173,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "overflow-x-auto border-t border-gray-300",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: "min-w-[800px] w-full text-xs sm:text-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    className: "bg-gray-100",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: [
                                            "User ID",
                                            "User Name",
                                            "Location",
                                            "Gender",
                                            "Joined",
                                            "Verified",
                                            "Status",
                                            "Last Active"
                                        ].map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-300 font-semibold text-gray-800 whitespace-nowrap",
                                                children: h
                                            }, h, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                lineNumber: 245,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                        lineNumber: 234,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                    lineNumber: 233,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            colSpan: 8,
                                            className: "text-center py-4 text-gray-500",
                                            children: "Loading..."
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                            lineNumber: 258,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                        lineNumber: 257,
                                        columnNumber: 17
                                    }, this) : users.length ? users.map((user, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: "border-b border-gray-200 hover:bg-gray-50",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-3 sm:px-4 py-2 sm:py-3 truncate max-w-[120px]",
                                                    children: user.id
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                    lineNumber: 268,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap",
                                                    children: user.name
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                    lineNumber: 269,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-3 sm:px-4 py-2 sm:py-3 truncate max-w-[150px]",
                                                    children: user.location
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                    lineNumber: 270,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-3 sm:px-4 py-2 sm:py-3",
                                                    children: user.gender
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                    lineNumber: 271,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap",
                                                    children: user.joined
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                    lineNumber: 272,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-3 sm:px-4 py-2 sm:py-3",
                                                    children: user.verified === "Yes" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-green-600",
                                                        children: "✔ Yes"
                                                    }, void 0, false, {
                                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                        lineNumber: 276,
                                                        columnNumber: 25
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-red-600",
                                                        children: "✘ No"
                                                    }, void 0, false, {
                                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                        lineNumber: 278,
                                                        columnNumber: 25
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                    lineNumber: 274,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-3 sm:px-4 py-2 sm:py-3 capitalize",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "flex items-center gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: `w-2 h-2 sm:w-3 sm:h-3 rounded-full ${user.status === "Approved" ? "bg-green-500" : user.status === "Pending" ? "bg-yellow-400" : "bg-red-500"}`
                                                            }, void 0, false, {
                                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                                lineNumber: 284,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "whitespace-nowrap",
                                                                children: user.status
                                                            }, void 0, false, {
                                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                                lineNumber: 293,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                        lineNumber: 283,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                    lineNumber: 282,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap",
                                                    children: user.lastActive
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                    lineNumber: 297,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, idx, true, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                            lineNumber: 264,
                                            columnNumber: 19
                                        }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            colSpan: 8,
                                            className: "text-center py-4 text-gray-500",
                                            children: "No users found."
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                            lineNumber: 302,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                        lineNumber: 301,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                    lineNumber: 255,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                            lineNumber: 232,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                        lineNumber: 231,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap justify-center items-center gap-1 sm:gap-2 mt-4 sm:mt-6 text-gray-700 text-sm sm:text-base",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setCurrentPage(currentPage - 1),
                                disabled: currentPage === 1,
                                className: `px-2 py-1 ${currentPage === 1 ? "text-gray-400" : "hover:underline"}`,
                                children: "◄ Prev"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                lineNumber: 314,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "hidden sm:inline",
                                children: "|"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                lineNumber: 322,
                                columnNumber: 11
                            }, this),
                            Array.from({
                                length: end - start + 1
                            }, (_, i)=>start + i).map((page, idx, arr)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-1 sm:gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setCurrentPage(page),
                                            className: `px-2 py-1 ${page === currentPage ? "font-bold underline" : "hover:underline"}`,
                                            children: page
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                            lineNumber: 327,
                                            columnNumber: 17
                                        }, this),
                                        idx !== arr.length - 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "hidden sm:inline",
                                            children: "|"
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                            lineNumber: 338,
                                            columnNumber: 44
                                        }, this)
                                    ]
                                }, page, true, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                    lineNumber: 326,
                                    columnNumber: 15
                                }, this)),
                            end < totalPages && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "hidden sm:inline",
                                children: "....."
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                lineNumber: 343,
                                columnNumber: 32
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "hidden sm:inline",
                                children: "|"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                lineNumber: 344,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setCurrentPage(currentPage + 1),
                                disabled: currentPage === totalPages,
                                className: `px-2 py-1 ${currentPage === totalPages ? "text-gray-400" : "hover:underline"}`,
                                children: "Next ►"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                lineNumber: 346,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                        lineNumber: 312,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                lineNumber: 170,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-xl sm:rounded-2xl shadow-md border border-gray-500 p-4 sm:p-6 mt-6 sm:mt-10",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900",
                        children: "Current Images"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                        lineNumber: 361,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap gap-3 sm:gap-6 justify-center sm:justify-start",
                        children: [
                            banners.map((banner)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "rounded-xl overflow-hidden shadow-md border border-gray-300 w-full sm:w-[280px] md:w-[300px] relative",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative w-full h-[160px] sm:h-[180px]",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                                src: banner.image,
                                                fill: true,
                                                alt: "banner",
                                                className: "object-cover",
                                                sizes: "(max-width: 640px) 100vw, 300px"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                lineNumber: 371,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                            lineNumber: 370,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "absolute bottom-0 left-0 w-full bg-white/60 backdrop-blur-md px-3 py-3 flex flex-col sm:flex-row justify-between items-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>handleUpdateBanner(banner._id),
                                                    className: "flex items-center justify-center gap-2 px-4 sm:px-6 py-2 border-2 border-red-500 text-red-500 rounded-xl text-sm sm:text-base font-semibold w-full sm:w-auto",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            width: "18",
                                                            height: "18",
                                                            viewBox: "0 0 24 24",
                                                            fill: "none",
                                                            stroke: "red",
                                                            strokeWidth: "2",
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                    d: "M12 20h9"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                                    lineNumber: 397,
                                                                    columnNumber: 21
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                    d: "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                                    lineNumber: 398,
                                                                    columnNumber: 21
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                            lineNumber: 387,
                                                            columnNumber: 19
                                                        }, this),
                                                        "Edit"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                    lineNumber: 383,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>handleDeleteBanner(banner._id),
                                                    className: "flex items-center justify-center gap-2 px-4 sm:px-6 py-2 border-2 border-red-500 text-red-500 rounded-xl text-sm sm:text-base font-semibold w-full sm:w-auto",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            width: "18",
                                                            height: "18",
                                                            viewBox: "0 0 24 24",
                                                            fill: "none",
                                                            stroke: "red",
                                                            strokeWidth: "2",
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                                    points: "3 6 5 6 21 6"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                                    lineNumber: 418,
                                                                    columnNumber: 21
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                    d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                                    lineNumber: 419,
                                                                    columnNumber: 21
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                                    x1: "10",
                                                                    y1: "11",
                                                                    x2: "10",
                                                                    y2: "17"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                                    lineNumber: 420,
                                                                    columnNumber: 21
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                                    x1: "14",
                                                                    y1: "11",
                                                                    x2: "14",
                                                                    y2: "17"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                                    lineNumber: 421,
                                                                    columnNumber: 21
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                            lineNumber: 408,
                                                            columnNumber: 19
                                                        }, this),
                                                        "Delete"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                                    lineNumber: 404,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                            lineNumber: 380,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, banner._id, true, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                    lineNumber: 366,
                                    columnNumber: 13
                                }, this)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "w-full sm:w-[150px] h-[120px] sm:h-[150px] flex flex-col justify-center items-center border-4 border-[#b43f4a] text-[#b43f4a] rounded-xl sm:rounded-2xl cursor-pointer text-xl font-bold hover:bg-gray-50 transition-colors",
                                children: [
                                    "+",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm font-semibold mt-1",
                                        children: "Add More"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                        lineNumber: 433,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "file",
                                        className: "hidden",
                                        onChange: handleAddBanner
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                        lineNumber: 434,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                                lineNumber: 431,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                        lineNumber: 363,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
                lineNumber: 359,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js",
        lineNumber: 167,
        columnNumber: 5
    }, this);
}
_s(UsersPage, "u1N1RVJbxzuDgdhKNzdv8SvMSJI=");
_c = UsersPage;
var _c;
__turbopack_context__.k.register(_c, "UsersPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/OneDrive/Desktop/matrimonial-admin/utils/withAuth.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>useAuthGuard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/next/router.js [client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
function useAuthGuard() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAuthGuard.useEffect": ()=>{
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/');
            } else {
                router.push('/dashboard');
            }
        }
    }["useAuthGuard.useEffect"], []);
}
_s(useAuthGuard, "vQduR7x+OPXj6PSmJyFnf+hU7bg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
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
"[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$dashboard$2f$AnalyticsChart$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/AnalyticsChart.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$dashboard$2f$TopSection$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/TopSection.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$dashboard$2f$UserTable$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/src/component/dashboard/UserTable.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$utils$2f$withAuth$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/utils/withAuth.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/node_modules/react/index.js [client] (ecmascript)");
// SOCKET SYSTEM
var __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/OneDrive/Desktop/matrimonial-admin/src/lib/socket.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
const Index = ()=>{
    _s();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$utils$2f$withAuth$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"])();
    const placeholders = [
        'Search By User Name',
        'Search By User ID',
        'Search By User Mobile'
    ];
    const [index, setIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [notifications, setNotifications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [unread, setUnread] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0); // ⭐ NEW
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const dropdownRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const BASE_URL = "https://matrimonial-backend-7ahc.onrender.com";
    const [adminPref, setAdminPref] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    /* ROTATE PLACEHOLDERS */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Index.useEffect": ()=>{
            const interval = setInterval({
                "Index.useEffect.interval": ()=>{
                    setIndex({
                        "Index.useEffect.interval": (prev)=>(prev + 1) % placeholders.length
                    }["Index.useEffect.interval"]);
                }
            }["Index.useEffect.interval"], 1200);
            return ({
                "Index.useEffect": ()=>clearInterval(interval)
            })["Index.useEffect"];
        }
    }["Index.useEffect"], []);
    /* CLOSE DROPDOWN IF CLICK OUTSIDE */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Index.useEffect": ()=>{
            const handler = {
                "Index.useEffect.handler": (e)=>{
                    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                        setOpen(false);
                    }
                }
            }["Index.useEffect.handler"];
            document.addEventListener("mousedown", handler);
            return ({
                "Index.useEffect": ()=>document.removeEventListener("mousedown", handler)
            })["Index.useEffect"];
        }
    }["Index.useEffect"], []);
    /* FETCH ADMIN NOTIFICATION PREFERENCES */ const loadAdminPrefs = async ()=>{
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/admin/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setAdminPref(data.data);
                // auto connect socket
                if (data.data.notifications) {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["connectSocket"])(data.data._id);
                } else {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["disconnectSocket"])();
                }
            }
        } catch (err) {
            console.log("Admin Pref load error:", err);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Index.useEffect": ()=>{
            loadAdminPrefs();
        }
    }["Index.useEffect"], []);
    /* FETCH NOTIFICATIONS FROM API */ const fetchNotifications = async ()=>{
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
                setUnread(list.filter((n)=>!n.read).length); // ⭐ NEW
            }
        } catch (err) {
            console.log("Notification fetch error:", err);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Index.useEffect": ()=>{
            fetchNotifications();
        }
    }["Index.useEffect"], []);
    /* RECEIVE REAL-TIME NOTIFICATIONS */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Index.useEffect": ()=>{
            if (!adminPref) return;
            const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getSocket"])();
            if (!socket) return;
            // NEW notification
            socket.on("new-notification", {
                "Index.useEffect": (data)=>{
                    setNotifications({
                        "Index.useEffect": (prev)=>[
                                data,
                                ...prev
                            ]
                    }["Index.useEffect"]);
                    setUnread({
                        "Index.useEffect": (u)=>u + 1
                    }["Index.useEffect"]); // ⭐ NEW
                }
            }["Index.useEffect"]);
            // mark-one from other tab
            socket.on("one-read", {
                "Index.useEffect": ({ id })=>{
                    setNotifications({
                        "Index.useEffect": (prev)=>prev.map({
                                "Index.useEffect": (n)=>n._id === id ? {
                                        ...n,
                                        read: true
                                    } : n
                            }["Index.useEffect"])
                    }["Index.useEffect"]);
                    setUnread({
                        "Index.useEffect": (u)=>Math.max(0, u - 1)
                    }["Index.useEffect"]); // ⭐ NEW
                }
            }["Index.useEffect"]);
            // mark-all from other tab
            socket.on("all-read", {
                "Index.useEffect": ()=>{
                    setNotifications({
                        "Index.useEffect": (prev)=>prev.map({
                                "Index.useEffect": (n)=>({
                                        ...n,
                                        read: true
                                    })
                            }["Index.useEffect"])
                    }["Index.useEffect"]);
                    setUnread(0); // ⭐ NEW
                }
            }["Index.useEffect"]);
            // delete-one sync
            socket.on("delete-one", {
                "Index.useEffect": ({ id })=>{
                    setNotifications({
                        "Index.useEffect": (prev)=>prev.filter({
                                "Index.useEffect": (n)=>n._id !== id
                            }["Index.useEffect"])
                    }["Index.useEffect"]);
                }
            }["Index.useEffect"]);
            // delete-all sync
            socket.on("delete-all", {
                "Index.useEffect": ()=>{
                    setNotifications([]);
                    setUnread(0); // ⭐ NEW
                }
            }["Index.useEffect"]);
            return ({
                "Index.useEffect": ()=>{
                    socket.off("new-notification");
                    socket.off("one-read");
                    socket.off("all-read");
                    socket.off("delete-one");
                    socket.off("delete-all");
                }
            })["Index.useEffect"];
        }
    }["Index.useEffect"], [
        adminPref
    ]);
    /* SEND NOTIFICATION */ const sendNotification = async (title, message)=>{
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/notification/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    message
                })
            });
            const data = await res.json();
            if (data.success) {
                setNotifications((prev)=>[
                        data.data,
                        ...prev
                    ]);
                setUnread((u)=>u + 1); // ⭐ NEW
                return true;
            }
        } catch (err) {
            console.log("Send Notification Error:", err);
        }
        return false;
    };
    /* MARK READ */ const markRead = async (id)=>{
        try {
            const token = localStorage.getItem("token");
            await fetch(`${BASE_URL}/api/notification/mark-read/${id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setNotifications((prev)=>prev.map((n)=>n._id === id ? {
                        ...n,
                        read: true
                    } : n));
            setUnread((u)=>Math.max(0, u - 1)); // ⭐ NEW
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getSocket"])()?.emit("one-read", {
                id
            });
        } catch (e) {
            console.log(e);
        }
    };
    /* MARK ALL READ */ const markAll = async ()=>{
        try {
            const token = localStorage.getItem("token");
            await fetch(`${BASE_URL}/api/notification/mark-all`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setNotifications((prev)=>prev.map((n)=>({
                        ...n,
                        read: true
                    })));
            setUnread(0); // ⭐ NEW
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getSocket"])()?.emit("all-read");
        } catch (e) {
            console.log(e);
        }
    };
    /* DELETE ONE */ const deleteOne = async (id)=>{
        try {
            const token = localStorage.getItem("token");
            await fetch(`${BASE_URL}/api/notification/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setNotifications((prev)=>prev.filter((n)=>n._id !== id));
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getSocket"])()?.emit("delete-one", {
                id
            });
        } catch (e) {
            console.log(e);
        }
    };
    /* DELETE ALL */ const deleteAll = async ()=>{
        try {
            const token = localStorage.getItem("token");
            await Promise.all(notifications.map((n)=>fetch(`${BASE_URL}/api/notification/${n._id}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })));
            setNotifications([]);
            setUnread(0); // ⭐ NEW
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getSocket"])()?.emit("delete-all");
        } catch (e) {
            console.log(e);
        }
    };
    /* OPEN/CLOSE DROPDOWN */ const handleBellClick = ()=>{
        const newOpen = !open;
        setOpen(newOpen);
        if (newOpen) {
            setNotifications((prev)=>prev.map((n)=>({
                        ...n,
                        read: true
                    })));
            setUnread(0); // ⭐ NEW
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$lib$2f$socket$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getSocket"])()?.emit("all-read");
        }
    };
    const showRedDot = unread > 0; // ⭐ FIXED
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex w-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed top-0 left-0 h-full w-[250px] bg-white shadow-md border-r p-4"
            }, void 0, false, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                lineNumber: 285,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed top-0 left-[250px] w-[calc(100%-250px)] h-[65px] bg-gray-100 border-b shadow-sm flex items-center justify-between px-10 z-50",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-[28px] font-extrabold text-black",
                        children: "Dashboard"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                        lineNumber: 289,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative cursor-pointer",
                        ref: dropdownRef,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                onClick: handleBellClick,
                                xmlns: "http://www.w3.org/2000/svg",
                                width: "30",
                                height: "30",
                                fill: "#FFC107",
                                viewBox: "0 0 24 24",
                                className: "cursor-pointer",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M12 24c1.104 0 2-.897 2-2h-4c0 1.103.896 2 2 2zm6.707-5l1.293 1.293V21H4v-1.707L5.293 19H6v-7c0-3.309 2.691-6 6-6s6 2.691 6 6v7h.707zM18 18H6v-7c0-2.757 2.243-5 5-5s5 2.243 5 5v7z"
                                }, void 0, false, {
                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                                    lineNumber: 303,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                                lineNumber: 294,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            showRedDot && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "absolute top-0 right-0 w-3 h-3 bg-red-600 rounded-full border border-white"
                            }, void 0, false, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                                lineNumber: 308,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute right-0 mt-3 w-80 bg-white shadow-xl border rounded-lg max-h-96 overflow-y-auto p-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between items-center mb-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "font-semibold text-[16px]",
                                                children: "Notifications"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                                                lineNumber: 316,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: markAll,
                                                className: "text-blue-600 text-sm",
                                                children: "Mark all read"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                                                lineNumber: 317,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                                        lineNumber: 315,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    notifications.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "p-4 text-sm text-gray-500 text-center",
                                        children: "No notifications"
                                    }, void 0, false, {
                                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                                        lineNumber: 321,
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
                                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                                                            lineNumber: 326,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>deleteOne(n._id),
                                                            className: "text-red-600 text-xs",
                                                            children: "Delete"
                                                        }, void 0, false, {
                                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                                                            lineNumber: 327,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                                                    lineNumber: 325,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-gray-600 text-[13px] mt-1",
                                                    children: n.message
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                                                    lineNumber: 335,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-gray-500 text-[11px] mt-1",
                                                    children: new Date(n.createdAt).toLocaleString()
                                                }, void 0, false, {
                                                    fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                                                    lineNumber: 336,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, n._id, true, {
                                            fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                                            lineNumber: 324,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))),
                                    notifications.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("hr", {
                                                className: "border-gray-300 my-2"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                                                lineNumber: 345,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: deleteAll,
                                                className: "w-full py-2 text-red-600 font-semibold text-sm",
                                                children: "Delete All"
                                            }, void 0, false, {
                                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                                                lineNumber: 346,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                                lineNumber: 313,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                        lineNumber: 291,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                lineNumber: 288,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-[7px] w-full px-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$dashboard$2f$TopSection$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                        lineNumber: 362,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$dashboard$2f$AnalyticsChart$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                        lineNumber: 363,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$src$2f$component$2f$dashboard$2f$UserTable$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                        lineNumber: 364,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>sendNotification("Test Notification", "This is a live notification."),
                        className: "mt-10 px-6 py-3 bg-blue-600 text-white rounded-lg",
                        children: "Send Test Notification"
                    }, void 0, false, {
                        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                        lineNumber: 367,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
                lineNumber: 361,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js",
        lineNumber: 282,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(Index, "KHwPFBY2d7tBsczsxSUZQ10kyYg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$OneDrive$2f$Desktop$2f$matrimonial$2d$admin$2f$utils$2f$withAuth$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"]
    ];
});
_c = Index;
const __TURBOPACK__default__export__ = Index;
var _c;
__turbopack_context__.k.register(_c, "Index");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/dashboard";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js [client] (ecmascript)");
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
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/OneDrive/Desktop/matrimonial-admin/pages/dashboard/index.js [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__0d641124._.js.map