module.exports = [
"[project]/path/path-web/node_modules/@aws-sdk/middleware-eventstream/dist-es/eventStreamConfiguration.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveEventStreamConfig",
    ()=>resolveEventStreamConfig
]);
function resolveEventStreamConfig(input) {
    const eventSigner = input.signer;
    const messageSigner = input.signer;
    const newInput = Object.assign(input, {
        eventSigner,
        messageSigner
    });
    const eventStreamPayloadHandler = newInput.eventStreamPayloadHandlerProvider(newInput);
    return Object.assign(newInput, {
        eventStreamPayloadHandler
    });
}
}),
"[project]/path/path-web/node_modules/@smithy/protocol-http/dist-es/httpRequest.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HttpRequest",
    ()=>HttpRequest
]);
class HttpRequest {
    method;
    protocol;
    hostname;
    port;
    path;
    query;
    headers;
    username;
    password;
    fragment;
    body;
    constructor(options){
        this.method = options.method || "GET";
        this.hostname = options.hostname || "localhost";
        this.port = options.port;
        this.query = options.query || {};
        this.headers = options.headers || {};
        this.body = options.body;
        this.protocol = options.protocol ? options.protocol.slice(-1) !== ":" ? `${options.protocol}:` : options.protocol : "https:";
        this.path = options.path ? options.path.charAt(0) !== "/" ? `/${options.path}` : options.path : "/";
        this.username = options.username;
        this.password = options.password;
        this.fragment = options.fragment;
    }
    static clone(request) {
        const cloned = new HttpRequest({
            ...request,
            headers: {
                ...request.headers
            }
        });
        if (cloned.query) {
            cloned.query = cloneQuery(cloned.query);
        }
        return cloned;
    }
    static isInstance(request) {
        if (!request) {
            return false;
        }
        const req = request;
        return "method" in req && "protocol" in req && "hostname" in req && "path" in req && typeof req["query"] === "object" && typeof req["headers"] === "object";
    }
    clone() {
        return HttpRequest.clone(this);
    }
}
function cloneQuery(query) {
    return Object.keys(query).reduce((carry, paramName)=>{
        const param = query[paramName];
        return {
            ...carry,
            [paramName]: Array.isArray(param) ? [
                ...param
            ] : param
        };
    }, {});
}
}),
"[project]/path/path-web/node_modules/@smithy/protocol-http/dist-es/httpResponse.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HttpResponse",
    ()=>HttpResponse
]);
class HttpResponse {
    statusCode;
    reason;
    headers;
    body;
    constructor(options){
        this.statusCode = options.statusCode;
        this.reason = options.reason;
        this.headers = options.headers || {};
        this.body = options.body;
    }
    static isInstance(response) {
        if (!response) return false;
        const resp = response;
        return typeof resp.statusCode === "number" && typeof resp.headers === "object";
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/protocol-http/dist-es/extensions/httpExtensionConfiguration.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getHttpHandlerExtensionConfiguration",
    ()=>getHttpHandlerExtensionConfiguration,
    "resolveHttpHandlerRuntimeConfig",
    ()=>resolveHttpHandlerRuntimeConfig
]);
const getHttpHandlerExtensionConfiguration = (runtimeConfig)=>{
    return {
        setHttpHandler (handler) {
            runtimeConfig.httpHandler = handler;
        },
        httpHandler () {
            return runtimeConfig.httpHandler;
        },
        updateHttpClientConfig (key, value) {
            runtimeConfig.httpHandler?.updateHttpClientConfig(key, value);
        },
        httpHandlerConfigs () {
            return runtimeConfig.httpHandler.httpHandlerConfigs();
        }
    };
};
const resolveHttpHandlerRuntimeConfig = (httpHandlerExtensionConfiguration)=>{
    return {
        httpHandler: httpHandlerExtensionConfiguration.httpHandler()
    };
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/middleware-host-header/dist-es/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getHostHeaderPlugin",
    ()=>getHostHeaderPlugin,
    "hostHeaderMiddleware",
    ()=>hostHeaderMiddleware,
    "hostHeaderMiddlewareOptions",
    ()=>hostHeaderMiddlewareOptions,
    "resolveHostHeaderConfig",
    ()=>resolveHostHeaderConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/protocol-http/dist-es/httpRequest.js [app-route] (ecmascript)");
;
function resolveHostHeaderConfig(input) {
    return input;
}
const hostHeaderMiddleware = (options)=>(next)=>async (args)=>{
            if (!__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpRequest"].isInstance(args.request)) return next(args);
            const { request } = args;
            const { handlerProtocol = "" } = options.requestHandler.metadata || {};
            if (handlerProtocol.indexOf("h2") >= 0 && !request.headers[":authority"]) {
                delete request.headers["host"];
                request.headers[":authority"] = request.hostname + (request.port ? ":" + request.port : "");
            } else if (!request.headers["host"]) {
                let host = request.hostname;
                if (request.port != null) host += `:${request.port}`;
                request.headers["host"] = host;
            }
            return next(args);
        };
const hostHeaderMiddlewareOptions = {
    name: "hostHeaderMiddleware",
    step: "build",
    priority: "low",
    tags: [
        "HOST"
    ],
    override: true
};
const getHostHeaderPlugin = (options)=>({
        applyToStack: (clientStack)=>{
            clientStack.add(hostHeaderMiddleware(options), hostHeaderMiddlewareOptions);
        }
    });
}),
"[project]/path/path-web/node_modules/@aws-sdk/middleware-logger/dist-es/loggerMiddleware.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getLoggerPlugin",
    ()=>getLoggerPlugin,
    "loggerMiddleware",
    ()=>loggerMiddleware,
    "loggerMiddlewareOptions",
    ()=>loggerMiddlewareOptions
]);
const loggerMiddleware = ()=>(next, context)=>async (args)=>{
            try {
                const response = await next(args);
                const { clientName, commandName, logger, dynamoDbDocumentClientOptions = {} } = context;
                const { overrideInputFilterSensitiveLog, overrideOutputFilterSensitiveLog } = dynamoDbDocumentClientOptions;
                const inputFilterSensitiveLog = overrideInputFilterSensitiveLog ?? context.inputFilterSensitiveLog;
                const outputFilterSensitiveLog = overrideOutputFilterSensitiveLog ?? context.outputFilterSensitiveLog;
                const { $metadata, ...outputWithoutMetadata } = response.output;
                logger?.info?.({
                    clientName,
                    commandName,
                    input: inputFilterSensitiveLog(args.input),
                    output: outputFilterSensitiveLog(outputWithoutMetadata),
                    metadata: $metadata
                });
                return response;
            } catch (error) {
                const { clientName, commandName, logger, dynamoDbDocumentClientOptions = {} } = context;
                const { overrideInputFilterSensitiveLog } = dynamoDbDocumentClientOptions;
                const inputFilterSensitiveLog = overrideInputFilterSensitiveLog ?? context.inputFilterSensitiveLog;
                logger?.error?.({
                    clientName,
                    commandName,
                    input: inputFilterSensitiveLog(args.input),
                    error,
                    metadata: error.$metadata
                });
                throw error;
            }
        };
const loggerMiddlewareOptions = {
    name: "loggerMiddleware",
    tags: [
        "LOGGER"
    ],
    step: "initialize",
    override: true
};
const getLoggerPlugin = (options)=>({
        applyToStack: (clientStack)=>{
            clientStack.add(loggerMiddleware(), loggerMiddlewareOptions);
        }
    });
}),
"[project]/path/path-web/node_modules/@aws-sdk/middleware-recursion-detection/dist-es/configuration.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "recursionDetectionMiddlewareOptions",
    ()=>recursionDetectionMiddlewareOptions
]);
const recursionDetectionMiddlewareOptions = {
    step: "build",
    tags: [
        "RECURSION_DETECTION"
    ],
    name: "recursionDetectionMiddleware",
    override: true,
    priority: "low"
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/middleware-recursion-detection/dist-es/recursionDetectionMiddleware.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "recursionDetectionMiddleware",
    ()=>recursionDetectionMiddleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2f$lambda$2d$invoke$2d$store$2f$dist$2d$es$2f$invoke$2d$store$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws/lambda-invoke-store/dist-es/invoke-store.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/protocol-http/dist-es/httpRequest.js [app-route] (ecmascript)");
;
;
const TRACE_ID_HEADER_NAME = "X-Amzn-Trace-Id";
const ENV_LAMBDA_FUNCTION_NAME = "AWS_LAMBDA_FUNCTION_NAME";
const ENV_TRACE_ID = "_X_AMZN_TRACE_ID";
const recursionDetectionMiddleware = ()=>(next)=>async (args)=>{
            const { request } = args;
            if (!__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpRequest"].isInstance(request)) {
                return next(args);
            }
            const traceIdHeader = Object.keys(request.headers ?? {}).find((h)=>h.toLowerCase() === TRACE_ID_HEADER_NAME.toLowerCase()) ?? TRACE_ID_HEADER_NAME;
            if (request.headers.hasOwnProperty(traceIdHeader)) {
                return next(args);
            }
            const functionName = process.env[ENV_LAMBDA_FUNCTION_NAME];
            const traceIdFromEnv = process.env[ENV_TRACE_ID];
            const invokeStore = await __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2f$lambda$2d$invoke$2d$store$2f$dist$2d$es$2f$invoke$2d$store$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["InvokeStore"].getInstanceAsync();
            const traceIdFromInvokeStore = invokeStore?.getXRayTraceId();
            const traceId = traceIdFromInvokeStore ?? traceIdFromEnv;
            const nonEmptyString = (str)=>typeof str === "string" && str.length > 0;
            if (nonEmptyString(functionName) && nonEmptyString(traceId)) {
                request.headers[TRACE_ID_HEADER_NAME] = traceId;
            }
            return next({
                ...args,
                request
            });
        };
}),
"[project]/path/path-web/node_modules/@aws-sdk/middleware-recursion-detection/dist-es/getRecursionDetectionPlugin.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getRecursionDetectionPlugin",
    ()=>getRecursionDetectionPlugin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$recursion$2d$detection$2f$dist$2d$es$2f$configuration$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/middleware-recursion-detection/dist-es/configuration.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$recursion$2d$detection$2f$dist$2d$es$2f$recursionDetectionMiddleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/middleware-recursion-detection/dist-es/recursionDetectionMiddleware.js [app-route] (ecmascript)");
;
;
const getRecursionDetectionPlugin = (options)=>({
        applyToStack: (clientStack)=>{
            clientStack.add((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$recursion$2d$detection$2f$dist$2d$es$2f$recursionDetectionMiddleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recursionDetectionMiddleware"])(), __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$recursion$2d$detection$2f$dist$2d$es$2f$configuration$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["recursionDetectionMiddlewareOptions"]);
        }
    });
}),
"[project]/path/path-web/node_modules/@aws/lambda-invoke-store/dist-es/invoke-store.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "InvokeStore",
    ()=>InvokeStore,
    "InvokeStoreBase",
    ()=>InvokeStoreBase
]);
const PROTECTED_KEYS = {
    REQUEST_ID: Symbol.for("_AWS_LAMBDA_REQUEST_ID"),
    X_RAY_TRACE_ID: Symbol.for("_AWS_LAMBDA_X_RAY_TRACE_ID"),
    TENANT_ID: Symbol.for("_AWS_LAMBDA_TENANT_ID")
};
const NO_GLOBAL_AWS_LAMBDA = [
    "true",
    "1"
].includes(process.env?.AWS_LAMBDA_NODEJS_NO_GLOBAL_AWSLAMBDA ?? "");
if (!NO_GLOBAL_AWS_LAMBDA) {
    globalThis.awslambda = globalThis.awslambda || {};
}
class InvokeStoreBase {
    static PROTECTED_KEYS = PROTECTED_KEYS;
    isProtectedKey(key) {
        return Object.values(PROTECTED_KEYS).includes(key);
    }
    getRequestId() {
        return this.get(PROTECTED_KEYS.REQUEST_ID) ?? "-";
    }
    getXRayTraceId() {
        return this.get(PROTECTED_KEYS.X_RAY_TRACE_ID);
    }
    getTenantId() {
        return this.get(PROTECTED_KEYS.TENANT_ID);
    }
}
class InvokeStoreSingle extends InvokeStoreBase {
    currentContext;
    getContext() {
        return this.currentContext;
    }
    hasContext() {
        return this.currentContext !== undefined;
    }
    get(key) {
        return this.currentContext?.[key];
    }
    set(key, value) {
        if (this.isProtectedKey(key)) {
            throw new Error(`Cannot modify protected Lambda context field: ${String(key)}`);
        }
        this.currentContext = this.currentContext || {};
        this.currentContext[key] = value;
    }
    run(context, fn) {
        this.currentContext = context;
        return fn();
    }
}
class InvokeStoreMulti extends InvokeStoreBase {
    als;
    static async create() {
        const instance = new InvokeStoreMulti();
        const asyncHooks = await __turbopack_context__.A("[externals]/node:async_hooks [external] (node:async_hooks, cjs, async loader)");
        instance.als = new asyncHooks.AsyncLocalStorage();
        return instance;
    }
    getContext() {
        return this.als.getStore();
    }
    hasContext() {
        return this.als.getStore() !== undefined;
    }
    get(key) {
        return this.als.getStore()?.[key];
    }
    set(key, value) {
        if (this.isProtectedKey(key)) {
            throw new Error(`Cannot modify protected Lambda context field: ${String(key)}`);
        }
        const store = this.als.getStore();
        if (!store) {
            throw new Error("No context available");
        }
        store[key] = value;
    }
    run(context, fn) {
        return this.als.run(context, fn);
    }
}
var InvokeStore;
(function(InvokeStore) {
    let instance = null;
    async function getInstanceAsync() {
        if (!instance) {
            instance = (async ()=>{
                const isMulti = "AWS_LAMBDA_MAX_CONCURRENCY" in process.env;
                const newInstance = isMulti ? await InvokeStoreMulti.create() : new InvokeStoreSingle();
                if (!NO_GLOBAL_AWS_LAMBDA && globalThis.awslambda?.InvokeStore) {
                    return globalThis.awslambda.InvokeStore;
                } else if (!NO_GLOBAL_AWS_LAMBDA && globalThis.awslambda) {
                    globalThis.awslambda.InvokeStore = newInstance;
                    return newInstance;
                } else {
                    return newInstance;
                }
            })();
        }
        return instance;
    }
    InvokeStore.getInstanceAsync = getInstanceAsync;
    InvokeStore._testing = process.env.AWS_LAMBDA_BENCHMARK_MODE === "1" ? {
        reset: ()=>{
            instance = null;
            if (globalThis.awslambda?.InvokeStore) {
                delete globalThis.awslambda.InvokeStore;
            }
            globalThis.awslambda = {};
        }
    } : undefined;
})(InvokeStore || (InvokeStore = {}));
;
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/customEndpointFunctions.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "customEndpointFunctions",
    ()=>customEndpointFunctions
]);
const customEndpointFunctions = {};
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/isValidHostLabel.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isValidHostLabel",
    ()=>isValidHostLabel
]);
const VALID_HOST_LABEL_REGEX = new RegExp(`^(?!.*-$)(?!-)[a-zA-Z0-9-]{1,63}$`);
const isValidHostLabel = (value, allowSubDomains = false)=>{
    if (!allowSubDomains) {
        return VALID_HOST_LABEL_REGEX.test(value);
    }
    const labels = value.split(".");
    for (const label of labels){
        if (!isValidHostLabel(label)) {
            return false;
        }
    }
    return true;
};
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/isIpAddress.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isIpAddress",
    ()=>isIpAddress
]);
const IP_V4_REGEX = new RegExp(`^(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}$`);
const isIpAddress = (value)=>IP_V4_REGEX.test(value) || value.startsWith("[") && value.endsWith("]");
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/cache/EndpointCache.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EndpointCache",
    ()=>EndpointCache
]);
class EndpointCache {
    capacity;
    data = new Map();
    parameters = [];
    constructor({ size, params }){
        this.capacity = size ?? 50;
        if (params) {
            this.parameters = params;
        }
    }
    get(endpointParams, resolver) {
        const key = this.hash(endpointParams);
        if (key === false) {
            return resolver();
        }
        if (!this.data.has(key)) {
            if (this.data.size > this.capacity + 10) {
                const keys = this.data.keys();
                let i = 0;
                while(true){
                    const { value, done } = keys.next();
                    this.data.delete(value);
                    if (done || ++i > 10) {
                        break;
                    }
                }
            }
            this.data.set(key, resolver());
        }
        return this.data.get(key);
    }
    size() {
        return this.data.size;
    }
    hash(endpointParams) {
        let buffer = "";
        const { parameters } = this;
        if (parameters.length === 0) {
            return false;
        }
        for (const param of parameters){
            const val = String(endpointParams[param] ?? "");
            if (val.includes("|;")) {
                return false;
            }
            buffer += val + "|;";
        }
        return buffer;
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/debug/debugId.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "debugId",
    ()=>debugId
]);
const debugId = "endpoints";
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/debug/toDebugString.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toDebugString",
    ()=>toDebugString
]);
function toDebugString(input) {
    if (typeof input !== "object" || input == null) {
        return input;
    }
    if ("ref" in input) {
        return `$${toDebugString(input.ref)}`;
    }
    if ("fn" in input) {
        return `${input.fn}(${(input.argv || []).map(toDebugString).join(", ")})`;
    }
    return JSON.stringify(input, null, 2);
}
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/types/EndpointError.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EndpointError",
    ()=>EndpointError
]);
class EndpointError extends Error {
    constructor(message){
        super(message);
        this.name = "EndpointError";
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/booleanEquals.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "booleanEquals",
    ()=>booleanEquals
]);
const booleanEquals = (value1, value2)=>value1 === value2;
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/getAttrPathList.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAttrPathList",
    ()=>getAttrPathList
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/types/EndpointError.js [app-route] (ecmascript)");
;
const getAttrPathList = (path)=>{
    const parts = path.split(".");
    const pathList = [];
    for (const part of parts){
        const squareBracketIndex = part.indexOf("[");
        if (squareBracketIndex !== -1) {
            if (part.indexOf("]") !== part.length - 1) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EndpointError"](`Path: '${path}' does not end with ']'`);
            }
            const arrayIndex = part.slice(squareBracketIndex + 1, -1);
            if (Number.isNaN(parseInt(arrayIndex))) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EndpointError"](`Invalid array index: '${arrayIndex}' in path: '${path}'`);
            }
            if (squareBracketIndex !== 0) {
                pathList.push(part.slice(0, squareBracketIndex));
            }
            pathList.push(arrayIndex);
        } else {
            pathList.push(part);
        }
    }
    return pathList;
};
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/getAttr.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAttr",
    ()=>getAttr
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/types/EndpointError.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$getAttrPathList$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/getAttrPathList.js [app-route] (ecmascript)");
;
;
const getAttr = (value, path)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$getAttrPathList$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAttrPathList"])(path).reduce((acc, index)=>{
        if (typeof acc !== "object") {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EndpointError"](`Index '${index}' in '${path}' not found in '${JSON.stringify(value)}'`);
        } else if (Array.isArray(acc)) {
            return acc[parseInt(index)];
        }
        return acc[index];
    }, value);
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/isSet.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isSet",
    ()=>isSet
]);
const isSet = (value)=>value != null;
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/not.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "not",
    ()=>not
]);
const not = (value)=>!value;
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/parseURL.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseURL",
    ()=>parseURL
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$endpoint$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/types/dist-es/endpoint.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$isIpAddress$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/isIpAddress.js [app-route] (ecmascript)");
;
;
const DEFAULT_PORTS = {
    [__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$endpoint$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EndpointURLScheme"].HTTP]: 80,
    [__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$endpoint$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EndpointURLScheme"].HTTPS]: 443
};
const parseURL = (value)=>{
    const whatwgURL = (()=>{
        try {
            if (value instanceof URL) {
                return value;
            }
            if (typeof value === "object" && "hostname" in value) {
                const { hostname, port, protocol = "", path = "", query = {} } = value;
                const url = new URL(`${protocol}//${hostname}${port ? `:${port}` : ""}${path}`);
                url.search = Object.entries(query).map(([k, v])=>`${k}=${v}`).join("&");
                return url;
            }
            return new URL(value);
        } catch (error) {
            return null;
        }
    })();
    if (!whatwgURL) {
        console.error(`Unable to parse ${JSON.stringify(value)} as a whatwg URL.`);
        return null;
    }
    const urlString = whatwgURL.href;
    const { host, hostname, pathname, protocol, search } = whatwgURL;
    if (search) {
        return null;
    }
    const scheme = protocol.slice(0, -1);
    if (!Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$endpoint$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EndpointURLScheme"]).includes(scheme)) {
        return null;
    }
    const isIp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$isIpAddress$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isIpAddress"])(hostname);
    const inputContainsDefaultPort = urlString.includes(`${host}:${DEFAULT_PORTS[scheme]}`) || typeof value === "string" && value.includes(`${host}:${DEFAULT_PORTS[scheme]}`);
    const authority = `${host}${inputContainsDefaultPort ? `:${DEFAULT_PORTS[scheme]}` : ``}`;
    return {
        scheme,
        authority,
        path: pathname,
        normalizedPath: pathname.endsWith("/") ? pathname : `${pathname}/`,
        isIp
    };
};
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/stringEquals.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "stringEquals",
    ()=>stringEquals
]);
const stringEquals = (value1, value2)=>value1 === value2;
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/substring.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "substring",
    ()=>substring
]);
const substring = (input, start, stop, reverse)=>{
    if (start >= stop || input.length < stop) {
        return null;
    }
    if (!reverse) {
        return input.substring(start, stop);
    }
    return input.substring(input.length - stop, input.length - start);
};
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/uriEncode.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "uriEncode",
    ()=>uriEncode
]);
const uriEncode = (value)=>encodeURIComponent(value).replace(/[!*'()]/g, (c)=>`%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/endpointFunctions.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "endpointFunctions",
    ()=>endpointFunctions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$booleanEquals$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/booleanEquals.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$getAttr$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/getAttr.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$isSet$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/isSet.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$isValidHostLabel$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/isValidHostLabel.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$not$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/not.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$parseURL$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/parseURL.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$stringEquals$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/stringEquals.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$substring$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/substring.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$uriEncode$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/uriEncode.js [app-route] (ecmascript)");
;
const endpointFunctions = {
    booleanEquals: __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$booleanEquals$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["booleanEquals"],
    getAttr: __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$getAttr$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAttr"],
    isSet: __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$isSet$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSet"],
    isValidHostLabel: __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$isValidHostLabel$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isValidHostLabel"],
    not: __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$not$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["not"],
    parseURL: __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$parseURL$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseURL"],
    stringEquals: __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$stringEquals$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stringEquals"],
    substring: __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$substring$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["substring"],
    uriEncode: __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$uriEncode$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["uriEncode"]
};
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateTemplate.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "evaluateTemplate",
    ()=>evaluateTemplate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$getAttr$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/getAttr.js [app-route] (ecmascript)");
;
const evaluateTemplate = (template, options)=>{
    const evaluatedTemplateArr = [];
    const templateContext = {
        ...options.endpointParams,
        ...options.referenceRecord
    };
    let currentIndex = 0;
    while(currentIndex < template.length){
        const openingBraceIndex = template.indexOf("{", currentIndex);
        if (openingBraceIndex === -1) {
            evaluatedTemplateArr.push(template.slice(currentIndex));
            break;
        }
        evaluatedTemplateArr.push(template.slice(currentIndex, openingBraceIndex));
        const closingBraceIndex = template.indexOf("}", openingBraceIndex);
        if (closingBraceIndex === -1) {
            evaluatedTemplateArr.push(template.slice(openingBraceIndex));
            break;
        }
        if (template[openingBraceIndex + 1] === "{" && template[closingBraceIndex + 1] === "}") {
            evaluatedTemplateArr.push(template.slice(openingBraceIndex + 1, closingBraceIndex));
            currentIndex = closingBraceIndex + 2;
        }
        const parameterName = template.substring(openingBraceIndex + 1, closingBraceIndex);
        if (parameterName.includes("#")) {
            const [refName, attrName] = parameterName.split("#");
            evaluatedTemplateArr.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$getAttr$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAttr"])(templateContext[refName], attrName));
        } else {
            evaluatedTemplateArr.push(templateContext[parameterName]);
        }
        currentIndex = closingBraceIndex + 1;
    }
    return evaluatedTemplateArr.join("");
};
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/getReferenceValue.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getReferenceValue",
    ()=>getReferenceValue
]);
const getReferenceValue = ({ ref }, options)=>{
    const referenceRecord = {
        ...options.endpointParams,
        ...options.referenceRecord
    };
    return referenceRecord[ref];
};
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateExpression.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "callFunction",
    ()=>callFunction,
    "evaluateExpression",
    ()=>evaluateExpression,
    "group",
    ()=>group
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/types/EndpointError.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$customEndpointFunctions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/customEndpointFunctions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$endpointFunctions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/endpointFunctions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateTemplate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateTemplate.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$getReferenceValue$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/getReferenceValue.js [app-route] (ecmascript)");
;
;
;
;
;
const evaluateExpression = (obj, keyName, options)=>{
    if (typeof obj === "string") {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateTemplate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["evaluateTemplate"])(obj, options);
    } else if (obj["fn"]) {
        return group.callFunction(obj, options);
    } else if (obj["ref"]) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$getReferenceValue$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getReferenceValue"])(obj, options);
    }
    throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EndpointError"](`'${keyName}': ${String(obj)} is not a string, function or reference.`);
};
const callFunction = ({ fn, argv }, options)=>{
    const evaluatedArgs = argv.map((arg)=>[
            "boolean",
            "number"
        ].includes(typeof arg) ? arg : group.evaluateExpression(arg, "arg", options));
    const fnSegments = fn.split(".");
    if (fnSegments[0] in __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$customEndpointFunctions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["customEndpointFunctions"] && fnSegments[1] != null) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$customEndpointFunctions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["customEndpointFunctions"][fnSegments[0]][fnSegments[1]](...evaluatedArgs);
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$endpointFunctions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["endpointFunctions"][fn](...evaluatedArgs);
};
const group = {
    evaluateExpression,
    callFunction
};
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateCondition.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "evaluateCondition",
    ()=>evaluateCondition
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$debugId$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/debug/debugId.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$toDebugString$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/debug/toDebugString.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/types/EndpointError.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateExpression$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateExpression.js [app-route] (ecmascript)");
;
;
;
const evaluateCondition = ({ assign, ...fnArgs }, options)=>{
    if (assign && assign in options.referenceRecord) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EndpointError"](`'${assign}' is already defined in Reference Record.`);
    }
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateExpression$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["callFunction"])(fnArgs, options);
    options.logger?.debug?.(`${__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$debugId$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["debugId"]} evaluateCondition: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$toDebugString$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toDebugString"])(fnArgs)} = ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$toDebugString$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toDebugString"])(value)}`);
    return {
        result: value === "" ? true : !!value,
        ...assign != null && {
            toAssign: {
                name: assign,
                value
            }
        }
    };
};
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateConditions.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "evaluateConditions",
    ()=>evaluateConditions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$debugId$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/debug/debugId.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$toDebugString$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/debug/toDebugString.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateCondition$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateCondition.js [app-route] (ecmascript)");
;
;
const evaluateConditions = (conditions = [], options)=>{
    const conditionsReferenceRecord = {};
    for (const condition of conditions){
        const { result, toAssign } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateCondition$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["evaluateCondition"])(condition, {
            ...options,
            referenceRecord: {
                ...options.referenceRecord,
                ...conditionsReferenceRecord
            }
        });
        if (!result) {
            return {
                result
            };
        }
        if (toAssign) {
            conditionsReferenceRecord[toAssign.name] = toAssign.value;
            options.logger?.debug?.(`${__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$debugId$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["debugId"]} assign: ${toAssign.name} := ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$toDebugString$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toDebugString"])(toAssign.value)}`);
        }
    }
    return {
        result: true,
        referenceRecord: conditionsReferenceRecord
    };
};
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/getEndpointHeaders.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getEndpointHeaders",
    ()=>getEndpointHeaders
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/types/EndpointError.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateExpression$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateExpression.js [app-route] (ecmascript)");
;
;
const getEndpointHeaders = (headers, options)=>Object.entries(headers).reduce((acc, [headerKey, headerVal])=>({
            ...acc,
            [headerKey]: headerVal.map((headerValEntry)=>{
                const processedExpr = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateExpression$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["evaluateExpression"])(headerValEntry, "Header value entry", options);
                if (typeof processedExpr !== "string") {
                    throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EndpointError"](`Header '${headerKey}' value '${processedExpr}' is not a string`);
                }
                return processedExpr;
            })
        }), {});
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/getEndpointProperties.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getEndpointProperties",
    ()=>getEndpointProperties,
    "getEndpointProperty",
    ()=>getEndpointProperty,
    "group",
    ()=>group
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/types/EndpointError.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateTemplate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateTemplate.js [app-route] (ecmascript)");
;
;
const getEndpointProperties = (properties, options)=>Object.entries(properties).reduce((acc, [propertyKey, propertyVal])=>({
            ...acc,
            [propertyKey]: group.getEndpointProperty(propertyVal, options)
        }), {});
const getEndpointProperty = (property, options)=>{
    if (Array.isArray(property)) {
        return property.map((propertyEntry)=>getEndpointProperty(propertyEntry, options));
    }
    switch(typeof property){
        case "string":
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateTemplate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["evaluateTemplate"])(property, options);
        case "object":
            if (property === null) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EndpointError"](`Unexpected endpoint property: ${property}`);
            }
            return group.getEndpointProperties(property, options);
        case "boolean":
            return property;
        default:
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EndpointError"](`Unexpected endpoint property type: ${typeof property}`);
    }
};
const group = {
    getEndpointProperty,
    getEndpointProperties
};
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/getEndpointUrl.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getEndpointUrl",
    ()=>getEndpointUrl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/types/EndpointError.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateExpression$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateExpression.js [app-route] (ecmascript)");
;
;
const getEndpointUrl = (endpointUrl, options)=>{
    const expression = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateExpression$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["evaluateExpression"])(endpointUrl, "Endpoint URL", options);
    if (typeof expression === "string") {
        try {
            return new URL(expression);
        } catch (error) {
            console.error(`Failed to construct URL with ${expression}`, error);
            throw error;
        }
    }
    throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EndpointError"](`Endpoint URL must be a string, got ${typeof expression}`);
};
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateEndpointRule.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "evaluateEndpointRule",
    ()=>evaluateEndpointRule
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$debugId$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/debug/debugId.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$toDebugString$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/debug/toDebugString.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateConditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateConditions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$getEndpointHeaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/getEndpointHeaders.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$getEndpointProperties$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/getEndpointProperties.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$getEndpointUrl$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/getEndpointUrl.js [app-route] (ecmascript)");
;
;
;
;
;
const evaluateEndpointRule = (endpointRule, options)=>{
    const { conditions, endpoint } = endpointRule;
    const { result, referenceRecord } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateConditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["evaluateConditions"])(conditions, options);
    if (!result) {
        return;
    }
    const endpointRuleOptions = {
        ...options,
        referenceRecord: {
            ...options.referenceRecord,
            ...referenceRecord
        }
    };
    const { url, properties, headers } = endpoint;
    options.logger?.debug?.(`${__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$debugId$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["debugId"]} Resolving endpoint from template: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$toDebugString$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toDebugString"])(endpoint)}`);
    return {
        ...headers != undefined && {
            headers: (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$getEndpointHeaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getEndpointHeaders"])(headers, endpointRuleOptions)
        },
        ...properties != undefined && {
            properties: (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$getEndpointProperties$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getEndpointProperties"])(properties, endpointRuleOptions)
        },
        url: (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$getEndpointUrl$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getEndpointUrl"])(url, endpointRuleOptions)
    };
};
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateErrorRule.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "evaluateErrorRule",
    ()=>evaluateErrorRule
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/types/EndpointError.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateConditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateConditions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateExpression$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateExpression.js [app-route] (ecmascript)");
;
;
;
const evaluateErrorRule = (errorRule, options)=>{
    const { conditions, error } = errorRule;
    const { result, referenceRecord } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateConditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["evaluateConditions"])(conditions, options);
    if (!result) {
        return;
    }
    throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EndpointError"]((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateExpression$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["evaluateExpression"])(error, "Error", {
        ...options,
        referenceRecord: {
            ...options.referenceRecord,
            ...referenceRecord
        }
    }));
};
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateRules.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "evaluateRules",
    ()=>evaluateRules,
    "evaluateTreeRule",
    ()=>evaluateTreeRule,
    "group",
    ()=>group
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/types/EndpointError.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateConditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateConditions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateEndpointRule$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateEndpointRule.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateErrorRule$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateErrorRule.js [app-route] (ecmascript)");
;
;
;
;
const evaluateRules = (rules, options)=>{
    for (const rule of rules){
        if (rule.type === "endpoint") {
            const endpointOrUndefined = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateEndpointRule$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["evaluateEndpointRule"])(rule, options);
            if (endpointOrUndefined) {
                return endpointOrUndefined;
            }
        } else if (rule.type === "error") {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateErrorRule$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["evaluateErrorRule"])(rule, options);
        } else if (rule.type === "tree") {
            const endpointOrUndefined = group.evaluateTreeRule(rule, options);
            if (endpointOrUndefined) {
                return endpointOrUndefined;
            }
        } else {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EndpointError"](`Unknown endpoint rule: ${rule}`);
        }
    }
    throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EndpointError"](`Rules evaluation failed`);
};
const evaluateTreeRule = (treeRule, options)=>{
    const { conditions, rules } = treeRule;
    const { result, referenceRecord } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateConditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["evaluateConditions"])(conditions, options);
    if (!result) {
        return;
    }
    return group.evaluateRules(rules, {
        ...options,
        referenceRecord: {
            ...options.referenceRecord,
            ...referenceRecord
        }
    });
};
const group = {
    evaluateRules,
    evaluateTreeRule
};
}),
"[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/resolveEndpoint.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveEndpoint",
    ()=>resolveEndpoint
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$debugId$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/debug/debugId.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$toDebugString$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/debug/toDebugString.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/types/EndpointError.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateRules$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/evaluateRules.js [app-route] (ecmascript)");
;
;
;
const resolveEndpoint = (ruleSetObject, options)=>{
    const { endpointParams, logger } = options;
    const { parameters, rules } = ruleSetObject;
    options.logger?.debug?.(`${__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$debugId$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["debugId"]} Initial EndpointParams: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$toDebugString$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toDebugString"])(endpointParams)}`);
    const paramsWithDefault = Object.entries(parameters).filter(([, v])=>v.default != null).map(([k, v])=>[
            k,
            v.default
        ]);
    if (paramsWithDefault.length > 0) {
        for (const [paramKey, paramDefaultValue] of paramsWithDefault){
            endpointParams[paramKey] = endpointParams[paramKey] ?? paramDefaultValue;
        }
    }
    const requiredParams = Object.entries(parameters).filter(([, v])=>v.required).map(([k])=>k);
    for (const requiredParam of requiredParams){
        if (endpointParams[requiredParam] == null) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EndpointError"](`Missing required parameter: '${requiredParam}'`);
        }
    }
    const endpoint = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$evaluateRules$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["evaluateRules"])(rules, {
        endpointParams,
        logger,
        referenceRecord: {}
    });
    options.logger?.debug?.(`${__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$debugId$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["debugId"]} Resolved endpoint: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$debug$2f$toDebugString$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toDebugString"])(endpoint)}`);
    return endpoint;
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/lib/isIpAddress.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
;
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/lib/aws/isVirtualHostableS3Bucket.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isVirtualHostableS3Bucket",
    ()=>isVirtualHostableS3Bucket
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$isValidHostLabel$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/isValidHostLabel.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$isIpAddress$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/lib/isIpAddress.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$isIpAddress$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/isIpAddress.js [app-route] (ecmascript)");
;
;
const isVirtualHostableS3Bucket = (value, allowSubDomains = false)=>{
    if (allowSubDomains) {
        for (const label of value.split(".")){
            if (!isVirtualHostableS3Bucket(label)) {
                return false;
            }
        }
        return true;
    }
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$isValidHostLabel$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isValidHostLabel"])(value)) {
        return false;
    }
    if (value.length < 3 || value.length > 63) {
        return false;
    }
    if (value !== value.toLowerCase()) {
        return false;
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$isIpAddress$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isIpAddress"])(value)) {
        return false;
    }
    return true;
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/lib/aws/parseArn.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseArn",
    ()=>parseArn
]);
const ARN_DELIMITER = ":";
const RESOURCE_DELIMITER = "/";
const parseArn = (value)=>{
    const segments = value.split(ARN_DELIMITER);
    if (segments.length < 6) return null;
    const [arn, partition, service, region, accountId, ...resourcePath] = segments;
    if (arn !== "arn" || partition === "" || service === "" || resourcePath.join(ARN_DELIMITER) === "") return null;
    const resourceId = resourcePath.map((resource)=>resource.split(RESOURCE_DELIMITER)).flat();
    return {
        partition,
        service,
        region,
        accountId,
        resourceId
    };
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/lib/aws/partitions.json (json)", ((__turbopack_context__) => {

__turbopack_context__.v({"partitions":[{"id":"aws","outputs":{"dnsSuffix":"amazonaws.com","dualStackDnsSuffix":"api.aws","implicitGlobalRegion":"us-east-1","name":"aws","supportsDualStack":true,"supportsFIPS":true},"regionRegex":"^(us|eu|ap|sa|ca|me|af|il|mx)\\-\\w+\\-\\d+$","regions":{"af-south-1":{"description":"Africa (Cape Town)"},"ap-east-1":{"description":"Asia Pacific (Hong Kong)"},"ap-east-2":{"description":"Asia Pacific (Taipei)"},"ap-northeast-1":{"description":"Asia Pacific (Tokyo)"},"ap-northeast-2":{"description":"Asia Pacific (Seoul)"},"ap-northeast-3":{"description":"Asia Pacific (Osaka)"},"ap-south-1":{"description":"Asia Pacific (Mumbai)"},"ap-south-2":{"description":"Asia Pacific (Hyderabad)"},"ap-southeast-1":{"description":"Asia Pacific (Singapore)"},"ap-southeast-2":{"description":"Asia Pacific (Sydney)"},"ap-southeast-3":{"description":"Asia Pacific (Jakarta)"},"ap-southeast-4":{"description":"Asia Pacific (Melbourne)"},"ap-southeast-5":{"description":"Asia Pacific (Malaysia)"},"ap-southeast-6":{"description":"Asia Pacific (New Zealand)"},"ap-southeast-7":{"description":"Asia Pacific (Thailand)"},"aws-global":{"description":"aws global region"},"ca-central-1":{"description":"Canada (Central)"},"ca-west-1":{"description":"Canada West (Calgary)"},"eu-central-1":{"description":"Europe (Frankfurt)"},"eu-central-2":{"description":"Europe (Zurich)"},"eu-north-1":{"description":"Europe (Stockholm)"},"eu-south-1":{"description":"Europe (Milan)"},"eu-south-2":{"description":"Europe (Spain)"},"eu-west-1":{"description":"Europe (Ireland)"},"eu-west-2":{"description":"Europe (London)"},"eu-west-3":{"description":"Europe (Paris)"},"il-central-1":{"description":"Israel (Tel Aviv)"},"me-central-1":{"description":"Middle East (UAE)"},"me-south-1":{"description":"Middle East (Bahrain)"},"mx-central-1":{"description":"Mexico (Central)"},"sa-east-1":{"description":"South America (Sao Paulo)"},"us-east-1":{"description":"US East (N. Virginia)"},"us-east-2":{"description":"US East (Ohio)"},"us-west-1":{"description":"US West (N. California)"},"us-west-2":{"description":"US West (Oregon)"}}},{"id":"aws-cn","outputs":{"dnsSuffix":"amazonaws.com.cn","dualStackDnsSuffix":"api.amazonwebservices.com.cn","implicitGlobalRegion":"cn-northwest-1","name":"aws-cn","supportsDualStack":true,"supportsFIPS":true},"regionRegex":"^cn\\-\\w+\\-\\d+$","regions":{"aws-cn-global":{"description":"aws-cn global region"},"cn-north-1":{"description":"China (Beijing)"},"cn-northwest-1":{"description":"China (Ningxia)"}}},{"id":"aws-eusc","outputs":{"dnsSuffix":"amazonaws.eu","dualStackDnsSuffix":"api.amazonwebservices.eu","implicitGlobalRegion":"eusc-de-east-1","name":"aws-eusc","supportsDualStack":true,"supportsFIPS":true},"regionRegex":"^eusc\\-(de)\\-\\w+\\-\\d+$","regions":{"eusc-de-east-1":{"description":"EU (Germany)"}}},{"id":"aws-iso","outputs":{"dnsSuffix":"c2s.ic.gov","dualStackDnsSuffix":"api.aws.ic.gov","implicitGlobalRegion":"us-iso-east-1","name":"aws-iso","supportsDualStack":true,"supportsFIPS":true},"regionRegex":"^us\\-iso\\-\\w+\\-\\d+$","regions":{"aws-iso-global":{"description":"aws-iso global region"},"us-iso-east-1":{"description":"US ISO East"},"us-iso-west-1":{"description":"US ISO WEST"}}},{"id":"aws-iso-b","outputs":{"dnsSuffix":"sc2s.sgov.gov","dualStackDnsSuffix":"api.aws.scloud","implicitGlobalRegion":"us-isob-east-1","name":"aws-iso-b","supportsDualStack":true,"supportsFIPS":true},"regionRegex":"^us\\-isob\\-\\w+\\-\\d+$","regions":{"aws-iso-b-global":{"description":"aws-iso-b global region"},"us-isob-east-1":{"description":"US ISOB East (Ohio)"},"us-isob-west-1":{"description":"US ISOB West"}}},{"id":"aws-iso-e","outputs":{"dnsSuffix":"cloud.adc-e.uk","dualStackDnsSuffix":"api.cloud-aws.adc-e.uk","implicitGlobalRegion":"eu-isoe-west-1","name":"aws-iso-e","supportsDualStack":true,"supportsFIPS":true},"regionRegex":"^eu\\-isoe\\-\\w+\\-\\d+$","regions":{"aws-iso-e-global":{"description":"aws-iso-e global region"},"eu-isoe-west-1":{"description":"EU ISOE West"}}},{"id":"aws-iso-f","outputs":{"dnsSuffix":"csp.hci.ic.gov","dualStackDnsSuffix":"api.aws.hci.ic.gov","implicitGlobalRegion":"us-isof-south-1","name":"aws-iso-f","supportsDualStack":true,"supportsFIPS":true},"regionRegex":"^us\\-isof\\-\\w+\\-\\d+$","regions":{"aws-iso-f-global":{"description":"aws-iso-f global region"},"us-isof-east-1":{"description":"US ISOF EAST"},"us-isof-south-1":{"description":"US ISOF SOUTH"}}},{"id":"aws-us-gov","outputs":{"dnsSuffix":"amazonaws.com","dualStackDnsSuffix":"api.aws","implicitGlobalRegion":"us-gov-west-1","name":"aws-us-gov","supportsDualStack":true,"supportsFIPS":true},"regionRegex":"^us\\-gov\\-\\w+\\-\\d+$","regions":{"aws-us-gov-global":{"description":"aws-us-gov global region"},"us-gov-east-1":{"description":"AWS GovCloud (US-East)"},"us-gov-west-1":{"description":"AWS GovCloud (US-West)"}}}],"version":"1.1"});}),
"[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/lib/aws/partition.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getUserAgentPrefix",
    ()=>getUserAgentPrefix,
    "partition",
    ()=>partition,
    "setPartitionInfo",
    ()=>setPartitionInfo,
    "useDefaultPartitionInfo",
    ()=>useDefaultPartitionInfo
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$aws$2f$partitions$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/lib/aws/partitions.json (json)");
;
let selectedPartitionsInfo = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$aws$2f$partitions$2e$json__$28$json$29$__["default"];
let selectedUserAgentPrefix = "";
const partition = (value)=>{
    const { partitions } = selectedPartitionsInfo;
    for (const partition of partitions){
        const { regions, outputs } = partition;
        for (const [region, regionData] of Object.entries(regions)){
            if (region === value) {
                return {
                    ...outputs,
                    ...regionData
                };
            }
        }
    }
    for (const partition of partitions){
        const { regionRegex, outputs } = partition;
        if (new RegExp(regionRegex).test(value)) {
            return {
                ...outputs
            };
        }
    }
    const DEFAULT_PARTITION = partitions.find((partition)=>partition.id === "aws");
    if (!DEFAULT_PARTITION) {
        throw new Error("Provided region was not found in the partition array or regex," + " and default partition with id 'aws' doesn't exist.");
    }
    return {
        ...DEFAULT_PARTITION.outputs
    };
};
const setPartitionInfo = (partitionsInfo, userAgentPrefix = "")=>{
    selectedPartitionsInfo = partitionsInfo;
    selectedUserAgentPrefix = userAgentPrefix;
};
const useDefaultPartitionInfo = ()=>{
    setPartitionInfo(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$aws$2f$partitions$2e$json__$28$json$29$__["default"], "");
};
const getUserAgentPrefix = ()=>selectedUserAgentPrefix;
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/aws.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "awsEndpointFunctions",
    ()=>awsEndpointFunctions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$customEndpointFunctions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/utils/customEndpointFunctions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$aws$2f$isVirtualHostableS3Bucket$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/lib/aws/isVirtualHostableS3Bucket.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$aws$2f$parseArn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/lib/aws/parseArn.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$aws$2f$partition$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/lib/aws/partition.js [app-route] (ecmascript)");
;
;
;
;
const awsEndpointFunctions = {
    isVirtualHostableS3Bucket: __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$aws$2f$isVirtualHostableS3Bucket$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isVirtualHostableS3Bucket"],
    parseArn: __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$aws$2f$parseArn$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseArn"],
    partition: __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$aws$2f$partition$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["partition"]
};
__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$utils$2f$customEndpointFunctions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["customEndpointFunctions"].aws = awsEndpointFunctions;
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/resolveDefaultAwsRegionalEndpointsConfig.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveDefaultAwsRegionalEndpointsConfig",
    ()=>resolveDefaultAwsRegionalEndpointsConfig,
    "toEndpointV1",
    ()=>toEndpointV1
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$url$2d$parser$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/url-parser/dist-es/index.js [app-route] (ecmascript)");
;
const resolveDefaultAwsRegionalEndpointsConfig = (input)=>{
    if (typeof input.endpointProvider !== "function") {
        throw new Error("@aws-sdk/util-endpoint - endpointProvider and endpoint missing in config for this client.");
    }
    const { endpoint } = input;
    if (endpoint === undefined) {
        input.endpoint = async ()=>{
            return toEndpointV1(input.endpointProvider({
                Region: typeof input.region === "function" ? await input.region() : input.region,
                UseDualStack: typeof input.useDualstackEndpoint === "function" ? await input.useDualstackEndpoint() : input.useDualstackEndpoint,
                UseFIPS: typeof input.useFipsEndpoint === "function" ? await input.useFipsEndpoint() : input.useFipsEndpoint,
                Endpoint: undefined
            }, {
                logger: input.logger
            }));
        };
    }
    return input;
};
const toEndpointV1 = (endpoint)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$url$2d$parser$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseUrl"])(endpoint.url);
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/resolveEndpoint.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
;
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/types/EndpointError.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
;
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/types/EndpointRuleObject.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
;
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/types/ErrorRuleObject.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
;
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/types/RuleSetObject.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
;
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/types/TreeRuleObject.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
;
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/types/shared.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
;
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/types/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/types/EndpointError.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$EndpointRuleObject$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/types/EndpointRuleObject.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$ErrorRuleObject$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/types/ErrorRuleObject.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$RuleSetObject$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/types/RuleSetObject.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$TreeRuleObject$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/types/TreeRuleObject.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$shared$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/types/shared.js [app-route] (ecmascript)");
;
;
;
;
;
;
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$aws$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/aws.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$aws$2f$partition$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/lib/aws/partition.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$isIpAddress$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/lib/isIpAddress.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$resolveDefaultAwsRegionalEndpointsConfig$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/resolveDefaultAwsRegionalEndpointsConfig.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$resolveEndpoint$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/resolveEndpoint.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$types$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/types/index.js [app-route] (ecmascript) <locals>");
;
;
;
;
;
;
}),
"[project]/path/path-web/node_modules/@smithy/querystring-parser/dist-es/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseQueryString",
    ()=>parseQueryString
]);
function parseQueryString(querystring) {
    const query = {};
    querystring = querystring.replace(/^\?/, "");
    if (querystring) {
        for (const pair of querystring.split("&")){
            let [key, value = null] = pair.split("=");
            key = decodeURIComponent(key);
            if (value) {
                value = decodeURIComponent(value);
            }
            if (!(key in query)) {
                query[key] = value;
            } else if (Array.isArray(query[key])) {
                query[key].push(value);
            } else {
                query[key] = [
                    query[key],
                    value
                ];
            }
        }
    }
    return query;
}
}),
"[project]/path/path-web/node_modules/@smithy/url-parser/dist-es/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseUrl",
    ()=>parseUrl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$querystring$2d$parser$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/querystring-parser/dist-es/index.js [app-route] (ecmascript)");
;
const parseUrl = (url)=>{
    if (typeof url === "string") {
        return parseUrl(new URL(url));
    }
    const { hostname, pathname, port, protocol, search } = url;
    let query;
    if (search) {
        query = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$querystring$2d$parser$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseQueryString"])(search);
    }
    return {
        hostname,
        port: port ? parseInt(port) : undefined,
        protocol,
        path: pathname,
        query
    };
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/client/setFeature.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "setFeature",
    ()=>setFeature
]);
function setFeature(context, feature, value) {
    if (!context.__aws_sdk_context) {
        context.__aws_sdk_context = {
            features: {}
        };
    } else if (!context.__aws_sdk_context.features) {
        context.__aws_sdk_context.features = {};
    }
    context.__aws_sdk_context.features[feature] = value;
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/client/setCredentialFeature.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "setCredentialFeature",
    ()=>setCredentialFeature
]);
function setCredentialFeature(credentials, feature, value) {
    if (!credentials.$source) {
        credentials.$source = {};
    }
    credentials.$source[feature] = value;
    return credentials;
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/resolveAwsSdkSigV4Config.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveAWSSDKSigV4Config",
    ()=>resolveAWSSDKSigV4Config,
    "resolveAwsSdkSigV4Config",
    ()=>resolveAwsSdkSigV4Config
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$client$2f$setCredentialFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/client/setCredentialFeature.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$util$2d$identity$2d$and$2d$auth$2f$memoizeIdentityProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/util-identity-and-auth/memoizeIdentityProvider.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/normalizeProvider.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$SignatureV4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/SignatureV4.js [app-route] (ecmascript)");
;
;
;
const resolveAwsSdkSigV4Config = (config)=>{
    let inputCredentials = config.credentials;
    let isUserSupplied = !!config.credentials;
    let resolvedCredentials = undefined;
    Object.defineProperty(config, "credentials", {
        set (credentials) {
            if (credentials && credentials !== inputCredentials && credentials !== resolvedCredentials) {
                isUserSupplied = true;
            }
            inputCredentials = credentials;
            const memoizedProvider = normalizeCredentialProvider(config, {
                credentials: inputCredentials,
                credentialDefaultProvider: config.credentialDefaultProvider
            });
            const boundProvider = bindCallerConfig(config, memoizedProvider);
            if (isUserSupplied && !boundProvider.attributed) {
                resolvedCredentials = async (options)=>boundProvider(options).then((creds)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$client$2f$setCredentialFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setCredentialFeature"])(creds, "CREDENTIALS_CODE", "e"));
                resolvedCredentials.memoized = boundProvider.memoized;
                resolvedCredentials.configBound = boundProvider.configBound;
                resolvedCredentials.attributed = true;
            } else {
                resolvedCredentials = boundProvider;
            }
        },
        get () {
            return resolvedCredentials;
        },
        enumerable: true,
        configurable: true
    });
    config.credentials = inputCredentials;
    const { signingEscapePath = true, systemClockOffset = config.systemClockOffset || 0, sha256 } = config;
    let signer;
    if (config.signer) {
        signer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeProvider"])(config.signer);
    } else if (config.regionInfoProvider) {
        signer = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeProvider"])(config.region)().then(async (region)=>[
                    await config.regionInfoProvider(region, {
                        useFipsEndpoint: await config.useFipsEndpoint(),
                        useDualstackEndpoint: await config.useDualstackEndpoint()
                    }) || {},
                    region
                ]).then(([regionInfo, region])=>{
                const { signingRegion, signingService } = regionInfo;
                config.signingRegion = config.signingRegion || signingRegion || region;
                config.signingName = config.signingName || signingService || config.serviceId;
                const params = {
                    ...config,
                    credentials: config.credentials,
                    region: config.signingRegion,
                    service: config.signingName,
                    sha256,
                    uriEscapePath: signingEscapePath
                };
                const SignerCtor = config.signerConstructor || __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$SignatureV4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SignatureV4"];
                return new SignerCtor(params);
            });
    } else {
        signer = async (authScheme)=>{
            authScheme = Object.assign({}, {
                name: "sigv4",
                signingName: config.signingName || config.defaultSigningName,
                signingRegion: await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeProvider"])(config.region)(),
                properties: {}
            }, authScheme);
            const signingRegion = authScheme.signingRegion;
            const signingService = authScheme.signingName;
            config.signingRegion = config.signingRegion || signingRegion;
            config.signingName = config.signingName || signingService || config.serviceId;
            const params = {
                ...config,
                credentials: config.credentials,
                region: config.signingRegion,
                service: config.signingName,
                sha256,
                uriEscapePath: signingEscapePath
            };
            const SignerCtor = config.signerConstructor || __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$SignatureV4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SignatureV4"];
            return new SignerCtor(params);
        };
    }
    const resolvedConfig = Object.assign(config, {
        systemClockOffset,
        signingEscapePath,
        signer
    });
    return resolvedConfig;
};
const resolveAWSSDKSigV4Config = resolveAwsSdkSigV4Config;
function normalizeCredentialProvider(config, { credentials, credentialDefaultProvider }) {
    let credentialsProvider;
    if (credentials) {
        if (!credentials?.memoized) {
            credentialsProvider = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$util$2d$identity$2d$and$2d$auth$2f$memoizeIdentityProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["memoizeIdentityProvider"])(credentials, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$util$2d$identity$2d$and$2d$auth$2f$memoizeIdentityProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isIdentityExpired"], __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$util$2d$identity$2d$and$2d$auth$2f$memoizeIdentityProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["doesIdentityRequireRefresh"]);
        } else {
            credentialsProvider = credentials;
        }
    } else {
        if (credentialDefaultProvider) {
            credentialsProvider = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeProvider"])(credentialDefaultProvider(Object.assign({}, config, {
                parentClientConfig: config
            })));
        } else {
            credentialsProvider = async ()=>{
                throw new Error("@aws-sdk/core::resolveAwsSdkSigV4Config - `credentials` not provided and no credentialDefaultProvider was configured.");
            };
        }
    }
    credentialsProvider.memoized = true;
    return credentialsProvider;
}
function bindCallerConfig(config, credentialsProvider) {
    if (credentialsProvider.configBound) {
        return credentialsProvider;
    }
    const fn = async (options)=>credentialsProvider({
            ...options,
            callerClientConfig: config
        });
    fn.memoized = credentialsProvider.memoized;
    fn.configBound = true;
    return fn;
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getDateHeader.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getDateHeader",
    ()=>getDateHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpResponse$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/protocol-http/dist-es/httpResponse.js [app-route] (ecmascript)");
;
const getDateHeader = (response)=>__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpResponse$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpResponse"].isInstance(response) ? response.headers?.date ?? response.headers?.Date : undefined;
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getSkewCorrectedDate.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSkewCorrectedDate",
    ()=>getSkewCorrectedDate
]);
const getSkewCorrectedDate = (systemClockOffset)=>new Date(Date.now() + systemClockOffset);
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/isClockSkewed.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isClockSkewed",
    ()=>isClockSkewed
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$getSkewCorrectedDate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getSkewCorrectedDate.js [app-route] (ecmascript)");
;
const isClockSkewed = (clockTime, systemClockOffset)=>Math.abs((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$getSkewCorrectedDate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSkewCorrectedDate"])(systemClockOffset).getTime() - clockTime) >= 300000;
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getUpdatedSystemClockOffset.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getUpdatedSystemClockOffset",
    ()=>getUpdatedSystemClockOffset
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$isClockSkewed$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/isClockSkewed.js [app-route] (ecmascript)");
;
const getUpdatedSystemClockOffset = (clockTime, currentSystemClockOffset)=>{
    const clockTimeInMs = Date.parse(clockTime);
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$isClockSkewed$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isClockSkewed"])(clockTimeInMs, currentSystemClockOffset)) {
        return clockTimeInMs - Date.now();
    }
    return currentSystemClockOffset;
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/AwsSdkSigV4Signer.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AWSSDKSigV4Signer",
    ()=>AWSSDKSigV4Signer,
    "AwsSdkSigV4Signer",
    ()=>AwsSdkSigV4Signer,
    "validateSigningProperties",
    ()=>validateSigningProperties
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/protocol-http/dist-es/httpRequest.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$getDateHeader$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getDateHeader.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$getSkewCorrectedDate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getSkewCorrectedDate.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$getUpdatedSystemClockOffset$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getUpdatedSystemClockOffset.js [app-route] (ecmascript)");
;
;
const throwSigningPropertyError = (name, property)=>{
    if (!property) {
        throw new Error(`Property \`${name}\` is not resolved for AWS SDK SigV4Auth`);
    }
    return property;
};
const validateSigningProperties = async (signingProperties)=>{
    const context = throwSigningPropertyError("context", signingProperties.context);
    const config = throwSigningPropertyError("config", signingProperties.config);
    const authScheme = context.endpointV2?.properties?.authSchemes?.[0];
    const signerFunction = throwSigningPropertyError("signer", config.signer);
    const signer = await signerFunction(authScheme);
    const signingRegion = signingProperties?.signingRegion;
    const signingRegionSet = signingProperties?.signingRegionSet;
    const signingName = signingProperties?.signingName;
    return {
        config,
        signer,
        signingRegion,
        signingRegionSet,
        signingName
    };
};
class AwsSdkSigV4Signer {
    async sign(httpRequest, identity, signingProperties) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpRequest"].isInstance(httpRequest)) {
            throw new Error("The request is not an instance of `HttpRequest` and cannot be signed");
        }
        const validatedProps = await validateSigningProperties(signingProperties);
        const { config, signer } = validatedProps;
        let { signingRegion, signingName } = validatedProps;
        const handlerExecutionContext = signingProperties.context;
        if (handlerExecutionContext?.authSchemes?.length ?? 0 > 1) {
            const [first, second] = handlerExecutionContext.authSchemes;
            if (first?.name === "sigv4a" && second?.name === "sigv4") {
                signingRegion = second?.signingRegion ?? signingRegion;
                signingName = second?.signingName ?? signingName;
            }
        }
        const signedRequest = await signer.sign(httpRequest, {
            signingDate: (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$getSkewCorrectedDate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSkewCorrectedDate"])(config.systemClockOffset),
            signingRegion: signingRegion,
            signingService: signingName
        });
        return signedRequest;
    }
    errorHandler(signingProperties) {
        return (error)=>{
            const serverTime = error.ServerTime ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$getDateHeader$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getDateHeader"])(error.$response);
            if (serverTime) {
                const config = throwSigningPropertyError("config", signingProperties.config);
                const initialSystemClockOffset = config.systemClockOffset;
                config.systemClockOffset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$getUpdatedSystemClockOffset$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUpdatedSystemClockOffset"])(serverTime, config.systemClockOffset);
                const clockSkewCorrected = config.systemClockOffset !== initialSystemClockOffset;
                if (clockSkewCorrected && error.$metadata) {
                    error.$metadata.clockSkewCorrected = true;
                }
            }
            throw error;
        };
    }
    successHandler(httpResponse, signingProperties) {
        const dateHeader = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$getDateHeader$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getDateHeader"])(httpResponse);
        if (dateHeader) {
            const config = throwSigningPropertyError("config", signingProperties.config);
            config.systemClockOffset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$getUpdatedSystemClockOffset$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUpdatedSystemClockOffset"])(dateHeader, config.systemClockOffset);
        }
    }
}
const AWSSDKSigV4Signer = AwsSdkSigV4Signer;
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getArrayForCommaSeparatedString.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getArrayForCommaSeparatedString",
    ()=>getArrayForCommaSeparatedString
]);
const getArrayForCommaSeparatedString = (str)=>typeof str === "string" && str.length > 0 ? str.split(",").map((item)=>item.trim()) : [];
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getBearerTokenEnvKey.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getBearerTokenEnvKey",
    ()=>getBearerTokenEnvKey
]);
const getBearerTokenEnvKey = (signingName)=>`AWS_BEARER_TOKEN_${signingName.replace(/[\s-]/g, "_").toUpperCase()}`;
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/aws_sdk/NODE_AUTH_SCHEME_PREFERENCE_OPTIONS.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NODE_AUTH_SCHEME_PREFERENCE_OPTIONS",
    ()=>NODE_AUTH_SCHEME_PREFERENCE_OPTIONS
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$getArrayForCommaSeparatedString$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getArrayForCommaSeparatedString.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$getBearerTokenEnvKey$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getBearerTokenEnvKey.js [app-route] (ecmascript)");
;
;
const NODE_AUTH_SCHEME_PREFERENCE_ENV_KEY = "AWS_AUTH_SCHEME_PREFERENCE";
const NODE_AUTH_SCHEME_PREFERENCE_CONFIG_KEY = "auth_scheme_preference";
const NODE_AUTH_SCHEME_PREFERENCE_OPTIONS = {
    environmentVariableSelector: (env, options)=>{
        if (options?.signingName) {
            const bearerTokenKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$getBearerTokenEnvKey$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getBearerTokenEnvKey"])(options.signingName);
            if (bearerTokenKey in env) return [
                "httpBearerAuth"
            ];
        }
        if (!(NODE_AUTH_SCHEME_PREFERENCE_ENV_KEY in env)) return undefined;
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$getArrayForCommaSeparatedString$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getArrayForCommaSeparatedString"])(env[NODE_AUTH_SCHEME_PREFERENCE_ENV_KEY]);
    },
    configFileSelector: (profile)=>{
        if (!(NODE_AUTH_SCHEME_PREFERENCE_CONFIG_KEY in profile)) return undefined;
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$getArrayForCommaSeparatedString$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getArrayForCommaSeparatedString"])(profile[NODE_AUTH_SCHEME_PREFERENCE_CONFIG_KEY]);
    },
    default: []
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/client/emitWarningIfUnsupportedVersion.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "emitWarningIfUnsupportedVersion",
    ()=>emitWarningIfUnsupportedVersion,
    "state",
    ()=>state
]);
const state = {
    warningEmitted: false
};
const emitWarningIfUnsupportedVersion = (version)=>{
    if (version && !state.warningEmitted && parseInt(version.substring(1, version.indexOf("."))) < 20) {
        state.warningEmitted = true;
        process.emitWarning(`NodeDeprecationWarning: The AWS SDK for JavaScript (v3) will
no longer support Node.js ${version} in January 2026.

To continue receiving updates to AWS services, bug fixes, and security
updates please upgrade to a supported Node.js LTS version.

More information can be found at: https://a.co/c895JFp`);
    }
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/client/setTokenFeature.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "setTokenFeature",
    ()=>setTokenFeature
]);
function setTokenFeature(token, feature, value) {
    if (!token.$source) {
        token.$source = {};
    }
    token.$source[feature] = value;
    return token;
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/ProtocolLib.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProtocolLib",
    ()=>ProtocolLib
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$schemas$2f$NormalizedSchema$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/schema/schemas/NormalizedSchema.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$TypeRegistry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/schema/TypeRegistry.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$smithy$2d$client$2f$dist$2d$es$2f$exceptions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/smithy-client/dist-es/exceptions.js [app-route] (ecmascript)");
;
;
class ProtocolLib {
    queryCompat;
    constructor(queryCompat = false){
        this.queryCompat = queryCompat;
    }
    resolveRestContentType(defaultContentType, inputSchema) {
        const members = inputSchema.getMemberSchemas();
        const httpPayloadMember = Object.values(members).find((m)=>{
            return !!m.getMergedTraits().httpPayload;
        });
        if (httpPayloadMember) {
            const mediaType = httpPayloadMember.getMergedTraits().mediaType;
            if (mediaType) {
                return mediaType;
            } else if (httpPayloadMember.isStringSchema()) {
                return "text/plain";
            } else if (httpPayloadMember.isBlobSchema()) {
                return "application/octet-stream";
            } else {
                return defaultContentType;
            }
        } else if (!inputSchema.isUnitSchema()) {
            const hasBody = Object.values(members).find((m)=>{
                const { httpQuery, httpQueryParams, httpHeader, httpLabel, httpPrefixHeaders } = m.getMergedTraits();
                const noPrefixHeaders = httpPrefixHeaders === void 0;
                return !httpQuery && !httpQueryParams && !httpHeader && !httpLabel && noPrefixHeaders;
            });
            if (hasBody) {
                return defaultContentType;
            }
        }
    }
    async getErrorSchemaOrThrowBaseException(errorIdentifier, defaultNamespace, response, dataObject, metadata, getErrorSchema) {
        let namespace = defaultNamespace;
        let errorName = errorIdentifier;
        if (errorIdentifier.includes("#")) {
            [namespace, errorName] = errorIdentifier.split("#");
        }
        const errorMetadata = {
            $metadata: metadata,
            $fault: response.statusCode < 500 ? "client" : "server"
        };
        const registry = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$TypeRegistry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TypeRegistry"].for(namespace);
        try {
            const errorSchema = getErrorSchema?.(registry, errorName) ?? registry.getSchema(errorIdentifier);
            return {
                errorSchema,
                errorMetadata
            };
        } catch (e) {
            dataObject.message = dataObject.message ?? dataObject.Message ?? "UnknownError";
            const synthetic = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$TypeRegistry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TypeRegistry"].for("smithy.ts.sdk.synthetic." + namespace);
            const baseExceptionSchema = synthetic.getBaseException();
            if (baseExceptionSchema) {
                const ErrorCtor = synthetic.getErrorCtor(baseExceptionSchema) ?? Error;
                throw this.decorateServiceException(Object.assign(new ErrorCtor({
                    name: errorName
                }), errorMetadata), dataObject);
            }
            throw this.decorateServiceException(Object.assign(new Error(errorName), errorMetadata), dataObject);
        }
    }
    decorateServiceException(exception, additions = {}) {
        if (this.queryCompat) {
            const msg = exception.Message ?? additions.Message;
            const error = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$smithy$2d$client$2f$dist$2d$es$2f$exceptions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["decorateServiceException"])(exception, additions);
            if (msg) {
                error.message = msg;
            }
            error.Error = {
                ...error.Error,
                Type: error.Error.Type,
                Code: error.Error.Code,
                Message: error.Error.message ?? error.Error.Message ?? msg
            };
            const reqId = error.$metadata.requestId;
            if (reqId) {
                error.RequestId = reqId;
            }
            return error;
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$smithy$2d$client$2f$dist$2d$es$2f$exceptions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["decorateServiceException"])(exception, additions);
    }
    setQueryCompatError(output, response) {
        const queryErrorHeader = response.headers?.["x-amzn-query-error"];
        if (output !== undefined && queryErrorHeader != null) {
            const [Code, Type] = queryErrorHeader.split(";");
            const entries = Object.entries(output);
            const Error1 = {
                Code,
                Type
            };
            Object.assign(output, Error1);
            for (const [k, v] of entries){
                Error1[k === "message" ? "Message" : k] = v;
            }
            delete Error1.__type;
            output.Error = Error1;
        }
    }
    queryCompatOutput(queryCompatErrorData, errorData) {
        if (queryCompatErrorData.Error) {
            errorData.Error = queryCompatErrorData.Error;
        }
        if (queryCompatErrorData.Type) {
            errorData.Type = queryCompatErrorData.Type;
        }
        if (queryCompatErrorData.Code) {
            errorData.Code = queryCompatErrorData.Code;
        }
    }
    findQueryCompatibleError(registry, errorName) {
        try {
            return registry.getSchema(errorName);
        } catch (e) {
            return registry.find((schema)=>__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$schemas$2f$NormalizedSchema$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NormalizedSchema"].of(schema).getMergedTraits().awsQueryError?.[0] === errorName);
        }
    }
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/ConfigurableSerdeContext.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SerdeContextConfig",
    ()=>SerdeContextConfig
]);
class SerdeContextConfig {
    serdeContext;
    setSerdeContext(serdeContext) {
        this.serdeContext = serdeContext;
    }
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/structIterator.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deserializingStructIterator",
    ()=>deserializingStructIterator,
    "serializingStructIterator",
    ()=>serializingStructIterator
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$schemas$2f$NormalizedSchema$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/schema/schemas/NormalizedSchema.js [app-route] (ecmascript)");
;
function* serializingStructIterator(ns, sourceObject) {
    if (ns.isUnitSchema()) {
        return;
    }
    const struct = ns.getSchema();
    for(let i = 0; i < struct[4].length; ++i){
        const key = struct[4][i];
        const memberSchema = struct[5][i];
        const memberNs = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$schemas$2f$NormalizedSchema$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NormalizedSchema"]([
            memberSchema,
            0
        ], key);
        if (!(key in sourceObject) && !memberNs.isIdempotencyToken()) {
            continue;
        }
        yield [
            key,
            memberNs
        ];
    }
}
function* deserializingStructIterator(ns, sourceObject, nameTrait) {
    if (ns.isUnitSchema()) {
        return;
    }
    const struct = ns.getSchema();
    let keysRemaining = Object.keys(sourceObject).filter((k)=>k !== "__type").length;
    for(let i = 0; i < struct[4].length; ++i){
        if (keysRemaining === 0) {
            break;
        }
        const key = struct[4][i];
        const memberSchema = struct[5][i];
        const memberNs = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$schemas$2f$NormalizedSchema$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NormalizedSchema"]([
            memberSchema,
            0
        ], key);
        let serializationKey = key;
        if (nameTrait) {
            serializationKey = memberNs.getMergedTraits()[nameTrait] ?? key;
        }
        if (!(serializationKey in sourceObject)) {
            continue;
        }
        yield [
            key,
            memberNs
        ];
        keysRemaining -= 1;
    }
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/jsonReviver.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "jsonReviver",
    ()=>jsonReviver
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$value$2f$NumericValue$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/serde/value/NumericValue.js [app-route] (ecmascript)");
;
function jsonReviver(key, value, context) {
    if (context?.source) {
        const numericString = context.source;
        if (typeof value === "number") {
            if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER || numericString !== String(value)) {
                const isFractional = numericString.includes(".");
                if (isFractional) {
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$value$2f$NumericValue$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NumericValue"](numericString, "bigDecimal");
                } else {
                    return BigInt(numericString);
                }
            }
        }
    }
    return value;
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/common.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "collectBodyString",
    ()=>collectBodyString
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$collect$2d$stream$2d$body$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/protocols/collect-stream-body.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-utf8/dist-es/toUtf8.js [app-route] (ecmascript)");
;
;
const collectBodyString = (streamBody, context)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$collect$2d$stream$2d$body$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["collectBody"])(streamBody, context).then((body)=>(context?.utf8Encoder ?? __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toUtf8"])(body));
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/parseJsonBody.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "loadRestJsonErrorCode",
    ()=>loadRestJsonErrorCode,
    "parseJsonBody",
    ()=>parseJsonBody,
    "parseJsonErrorBody",
    ()=>parseJsonErrorBody
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$common$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/common.js [app-route] (ecmascript)");
;
const parseJsonBody = (streamBody, context)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$common$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["collectBodyString"])(streamBody, context).then((encoded)=>{
        if (encoded.length) {
            try {
                return JSON.parse(encoded);
            } catch (e) {
                if (e?.name === "SyntaxError") {
                    Object.defineProperty(e, "$responseBodyText", {
                        value: encoded
                    });
                }
                throw e;
            }
        }
        return {};
    });
const parseJsonErrorBody = async (errorBody, context)=>{
    const value = await parseJsonBody(errorBody, context);
    value.message = value.message ?? value.Message;
    return value;
};
const loadRestJsonErrorCode = (output, data)=>{
    const findKey = (object, key)=>Object.keys(object).find((k)=>k.toLowerCase() === key.toLowerCase());
    const sanitizeErrorCode = (rawValue)=>{
        let cleanValue = rawValue;
        if (typeof cleanValue === "number") {
            cleanValue = cleanValue.toString();
        }
        if (cleanValue.indexOf(",") >= 0) {
            cleanValue = cleanValue.split(",")[0];
        }
        if (cleanValue.indexOf(":") >= 0) {
            cleanValue = cleanValue.split(":")[0];
        }
        if (cleanValue.indexOf("#") >= 0) {
            cleanValue = cleanValue.split("#")[1];
        }
        return cleanValue;
    };
    const headerKey = findKey(output.headers, "x-amzn-errortype");
    if (headerKey !== undefined) {
        return sanitizeErrorCode(output.headers[headerKey]);
    }
    if (data && typeof data === "object") {
        const codeKey = findKey(data, "code");
        if (codeKey && data[codeKey] !== undefined) {
            return sanitizeErrorCode(data[codeKey]);
        }
        if (data["__type"] !== undefined) {
            return sanitizeErrorCode(data["__type"]);
        }
    }
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/JsonShapeDeserializer.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "JsonShapeDeserializer",
    ()=>JsonShapeDeserializer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$serde$2f$determineTimestampFormat$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/protocols/serde/determineTimestampFormat.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$schemas$2f$NormalizedSchema$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/schema/schemas/NormalizedSchema.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$lazy$2d$json$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/serde/lazy-json.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$value$2f$NumericValue$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/serde/value/NumericValue.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$date$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/serde/date-utils.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$base64$2f$dist$2d$es$2f$fromBase64$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-base64/dist-es/fromBase64.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$ConfigurableSerdeContext$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/ConfigurableSerdeContext.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$structIterator$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/structIterator.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$json$2f$jsonReviver$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/jsonReviver.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$json$2f$parseJsonBody$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/parseJsonBody.js [app-route] (ecmascript)");
;
;
;
;
;
;
;
;
class JsonShapeDeserializer extends __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$ConfigurableSerdeContext$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SerdeContextConfig"] {
    settings;
    constructor(settings){
        super();
        this.settings = settings;
    }
    async read(schema, data) {
        return this._read(schema, typeof data === "string" ? JSON.parse(data, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$json$2f$jsonReviver$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsonReviver"]) : await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$json$2f$parseJsonBody$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseJsonBody"])(data, this.serdeContext));
    }
    readObject(schema, data) {
        return this._read(schema, data);
    }
    _read(schema, value) {
        const isObject = value !== null && typeof value === "object";
        const ns = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$schemas$2f$NormalizedSchema$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NormalizedSchema"].of(schema);
        if (isObject) {
            if (ns.isStructSchema()) {
                const out = {};
                for (const [memberName, memberSchema] of (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$structIterator$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["deserializingStructIterator"])(ns, value, this.settings.jsonName ? "jsonName" : false)){
                    const fromKey = this.settings.jsonName ? memberSchema.getMergedTraits().jsonName ?? memberName : memberName;
                    const deserializedValue = this._read(memberSchema, value[fromKey]);
                    if (deserializedValue != null) {
                        out[memberName] = deserializedValue;
                    }
                }
                return out;
            }
            if (Array.isArray(value) && ns.isListSchema()) {
                const listMember = ns.getValueSchema();
                const out = [];
                const sparse = !!ns.getMergedTraits().sparse;
                for (const item of value){
                    if (sparse || item != null) {
                        out.push(this._read(listMember, item));
                    }
                }
                return out;
            }
            if (ns.isMapSchema()) {
                const mapMember = ns.getValueSchema();
                const out = {};
                const sparse = !!ns.getMergedTraits().sparse;
                for (const [_k, _v] of Object.entries(value)){
                    if (sparse || _v != null) {
                        out[_k] = this._read(mapMember, _v);
                    }
                }
                return out;
            }
        }
        if (ns.isBlobSchema() && typeof value === "string") {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$base64$2f$dist$2d$es$2f$fromBase64$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromBase64"])(value);
        }
        const mediaType = ns.getMergedTraits().mediaType;
        if (ns.isStringSchema() && typeof value === "string" && mediaType) {
            const isJson = mediaType === "application/json" || mediaType.endsWith("+json");
            if (isJson) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$lazy$2d$json$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LazyJsonString"].from(value);
            }
            return value;
        }
        if (ns.isTimestampSchema() && value != null) {
            const format = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$serde$2f$determineTimestampFormat$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["determineTimestampFormat"])(ns, this.settings);
            switch(format){
                case 5:
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$date$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseRfc3339DateTimeWithOffset"])(value);
                case 6:
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$date$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseRfc7231DateTime"])(value);
                case 7:
                    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$date$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseEpochTimestamp"])(value);
                default:
                    console.warn("Missing timestamp format, parsing value with Date constructor:", value);
                    return new Date(value);
            }
        }
        if (ns.isBigIntegerSchema() && (typeof value === "number" || typeof value === "string")) {
            return BigInt(value);
        }
        if (ns.isBigDecimalSchema() && value != undefined) {
            if (value instanceof __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$value$2f$NumericValue$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NumericValue"]) {
                return value;
            }
            const untyped = value;
            if (untyped.type === "bigDecimal" && "string" in untyped) {
                return new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$value$2f$NumericValue$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NumericValue"](untyped.string, untyped.type);
            }
            return new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$value$2f$NumericValue$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NumericValue"](String(value), "bigDecimal");
        }
        if (ns.isNumericSchema() && typeof value === "string") {
            switch(value){
                case "Infinity":
                    return Infinity;
                case "-Infinity":
                    return -Infinity;
                case "NaN":
                    return NaN;
            }
            return value;
        }
        if (ns.isDocumentSchema()) {
            if (isObject) {
                const out = Array.isArray(value) ? [] : {};
                for (const [k, v] of Object.entries(value)){
                    if (v instanceof __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$value$2f$NumericValue$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NumericValue"]) {
                        out[k] = v;
                    } else {
                        out[k] = this._read(ns, v);
                    }
                }
                return out;
            } else {
                return structuredClone(value);
            }
        }
        return value;
    }
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/jsonReplacer.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "JsonReplacer",
    ()=>JsonReplacer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$value$2f$NumericValue$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/serde/value/NumericValue.js [app-route] (ecmascript)");
;
const NUMERIC_CONTROL_CHAR = String.fromCharCode(925);
class JsonReplacer {
    values = new Map();
    counter = 0;
    stage = 0;
    createReplacer() {
        if (this.stage === 1) {
            throw new Error("@aws-sdk/core/protocols - JsonReplacer already created.");
        }
        if (this.stage === 2) {
            throw new Error("@aws-sdk/core/protocols - JsonReplacer exhausted.");
        }
        this.stage = 1;
        return (key, value)=>{
            if (value instanceof __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$value$2f$NumericValue$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NumericValue"]) {
                const v = `${NUMERIC_CONTROL_CHAR + "nv" + this.counter++}_` + value.string;
                this.values.set(`"${v}"`, value.string);
                return v;
            }
            if (typeof value === "bigint") {
                const s = value.toString();
                const v = `${NUMERIC_CONTROL_CHAR + "b" + this.counter++}_` + s;
                this.values.set(`"${v}"`, s);
                return v;
            }
            return value;
        };
    }
    replaceInJson(json) {
        if (this.stage === 0) {
            throw new Error("@aws-sdk/core/protocols - JsonReplacer not created yet.");
        }
        if (this.stage === 2) {
            throw new Error("@aws-sdk/core/protocols - JsonReplacer exhausted.");
        }
        this.stage = 2;
        if (this.counter === 0) {
            return json;
        }
        for (const [key, value] of this.values){
            json = json.replace(key, value);
        }
        return json;
    }
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/JsonShapeSerializer.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "JsonShapeSerializer",
    ()=>JsonShapeSerializer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$serde$2f$determineTimestampFormat$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/protocols/serde/determineTimestampFormat.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$schemas$2f$NormalizedSchema$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/schema/schemas/NormalizedSchema.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$date$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/serde/date-utils.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$uuid$2f$dist$2d$es$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__v4__as__generateIdempotencyToken$3e$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/uuid/dist-es/v4.js [app-route] (ecmascript) <export v4 as generateIdempotencyToken>");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$lazy$2d$json$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/serde/lazy-json.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$value$2f$NumericValue$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/serde/value/NumericValue.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$base64$2f$dist$2d$es$2f$toBase64$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-base64/dist-es/toBase64.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$ConfigurableSerdeContext$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/ConfigurableSerdeContext.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$structIterator$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/structIterator.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$json$2f$jsonReplacer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/jsonReplacer.js [app-route] (ecmascript)");
;
;
;
;
;
;
;
class JsonShapeSerializer extends __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$ConfigurableSerdeContext$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SerdeContextConfig"] {
    settings;
    buffer;
    useReplacer = false;
    rootSchema;
    constructor(settings){
        super();
        this.settings = settings;
    }
    write(schema, value) {
        this.rootSchema = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$schemas$2f$NormalizedSchema$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NormalizedSchema"].of(schema);
        this.buffer = this._write(this.rootSchema, value);
    }
    writeDiscriminatedDocument(schema, value) {
        this.write(schema, value);
        if (typeof this.buffer === "object") {
            this.buffer.__type = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$schemas$2f$NormalizedSchema$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NormalizedSchema"].of(schema).getName(true);
        }
    }
    flush() {
        const { rootSchema, useReplacer } = this;
        this.rootSchema = undefined;
        this.useReplacer = false;
        if (rootSchema?.isStructSchema() || rootSchema?.isDocumentSchema()) {
            if (!useReplacer) {
                return JSON.stringify(this.buffer);
            }
            const replacer = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$json$2f$jsonReplacer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["JsonReplacer"]();
            return replacer.replaceInJson(JSON.stringify(this.buffer, replacer.createReplacer(), 0));
        }
        return this.buffer;
    }
    _write(schema, value, container) {
        const isObject = value !== null && typeof value === "object";
        const ns = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$schemas$2f$NormalizedSchema$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NormalizedSchema"].of(schema);
        if (isObject) {
            if (ns.isStructSchema()) {
                const out = {};
                for (const [memberName, memberSchema] of (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$structIterator$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["serializingStructIterator"])(ns, value)){
                    const serializableValue = this._write(memberSchema, value[memberName], ns);
                    if (serializableValue !== undefined) {
                        const jsonName = memberSchema.getMergedTraits().jsonName;
                        const targetKey = this.settings.jsonName ? jsonName ?? memberName : memberName;
                        out[targetKey] = serializableValue;
                    }
                }
                return out;
            }
            if (Array.isArray(value) && ns.isListSchema()) {
                const listMember = ns.getValueSchema();
                const out = [];
                const sparse = !!ns.getMergedTraits().sparse;
                for (const item of value){
                    if (sparse || item != null) {
                        out.push(this._write(listMember, item));
                    }
                }
                return out;
            }
            if (ns.isMapSchema()) {
                const mapMember = ns.getValueSchema();
                const out = {};
                const sparse = !!ns.getMergedTraits().sparse;
                for (const [_k, _v] of Object.entries(value)){
                    if (sparse || _v != null) {
                        out[_k] = this._write(mapMember, _v);
                    }
                }
                return out;
            }
            if (value instanceof Uint8Array && (ns.isBlobSchema() || ns.isDocumentSchema())) {
                if (ns === this.rootSchema) {
                    return value;
                }
                return (this.serdeContext?.base64Encoder ?? __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$base64$2f$dist$2d$es$2f$toBase64$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toBase64"])(value);
            }
            if (value instanceof Date && (ns.isTimestampSchema() || ns.isDocumentSchema())) {
                const format = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$serde$2f$determineTimestampFormat$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["determineTimestampFormat"])(ns, this.settings);
                switch(format){
                    case 5:
                        return value.toISOString().replace(".000Z", "Z");
                    case 6:
                        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$date$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["dateToUtcString"])(value);
                    case 7:
                        return value.getTime() / 1000;
                    default:
                        console.warn("Missing timestamp format, using epoch seconds", value);
                        return value.getTime() / 1000;
                }
            }
            if (value instanceof __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$value$2f$NumericValue$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NumericValue"]) {
                this.useReplacer = true;
            }
        }
        if (value === null && container?.isStructSchema()) {
            return void 0;
        }
        if (ns.isStringSchema()) {
            if (typeof value === "undefined" && ns.isIdempotencyToken()) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$uuid$2f$dist$2d$es$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__v4__as__generateIdempotencyToken$3e$__["generateIdempotencyToken"])();
            }
            const mediaType = ns.getMergedTraits().mediaType;
            if (value != null && mediaType) {
                const isJson = mediaType === "application/json" || mediaType.endsWith("+json");
                if (isJson) {
                    return __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$lazy$2d$json$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LazyJsonString"].from(value);
                }
            }
            return value;
        }
        if (typeof value === "number" && ns.isNumericSchema()) {
            if (Math.abs(value) === Infinity || isNaN(value)) {
                return String(value);
            }
            return value;
        }
        if (typeof value === "string" && ns.isBlobSchema()) {
            if (ns === this.rootSchema) {
                return value;
            }
            return (this.serdeContext?.base64Encoder ?? __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$base64$2f$dist$2d$es$2f$toBase64$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toBase64"])(value);
        }
        if (typeof value === "bigint") {
            this.useReplacer = true;
        }
        if (ns.isDocumentSchema()) {
            if (isObject) {
                const out = Array.isArray(value) ? [] : {};
                for (const [k, v] of Object.entries(value)){
                    if (v instanceof __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$value$2f$NumericValue$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NumericValue"]) {
                        this.useReplacer = true;
                        out[k] = v;
                    } else {
                        out[k] = this._write(ns, v);
                    }
                }
                return out;
            } else {
                return structuredClone(value);
            }
        }
        return value;
    }
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/JsonCodec.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "JsonCodec",
    ()=>JsonCodec
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$ConfigurableSerdeContext$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/ConfigurableSerdeContext.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$json$2f$JsonShapeDeserializer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/JsonShapeDeserializer.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$json$2f$JsonShapeSerializer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/JsonShapeSerializer.js [app-route] (ecmascript)");
;
;
;
class JsonCodec extends __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$ConfigurableSerdeContext$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SerdeContextConfig"] {
    settings;
    constructor(settings){
        super();
        this.settings = settings;
    }
    createSerializer() {
        const serializer = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$json$2f$JsonShapeSerializer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["JsonShapeSerializer"](this.settings);
        serializer.setSerdeContext(this.serdeContext);
        return serializer;
    }
    createDeserializer() {
        const deserializer = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$json$2f$JsonShapeDeserializer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["JsonShapeDeserializer"](this.settings);
        deserializer.setSerdeContext(this.serdeContext);
        return deserializer;
    }
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/AwsRestJsonProtocol.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AwsRestJsonProtocol",
    ()=>AwsRestJsonProtocol
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$HttpBindingProtocol$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/protocols/HttpBindingProtocol.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$serde$2f$HttpInterceptingShapeDeserializer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/protocols/serde/HttpInterceptingShapeDeserializer.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$serde$2f$HttpInterceptingShapeSerializer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/protocols/serde/HttpInterceptingShapeSerializer.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$schemas$2f$NormalizedSchema$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/schema/schemas/NormalizedSchema.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$TypeRegistry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/schema/TypeRegistry.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$ProtocolLib$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/ProtocolLib.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$json$2f$JsonCodec$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/JsonCodec.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$json$2f$parseJsonBody$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/protocols/json/parseJsonBody.js [app-route] (ecmascript)");
;
;
;
;
;
class AwsRestJsonProtocol extends __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$HttpBindingProtocol$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpBindingProtocol"] {
    serializer;
    deserializer;
    codec;
    mixin = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$ProtocolLib$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ProtocolLib"]();
    constructor({ defaultNamespace }){
        super({
            defaultNamespace
        });
        const settings = {
            timestampFormat: {
                useTrait: true,
                default: 7
            },
            httpBindings: true,
            jsonName: true
        };
        this.codec = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$json$2f$JsonCodec$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["JsonCodec"](settings);
        this.serializer = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$serde$2f$HttpInterceptingShapeSerializer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpInterceptingShapeSerializer"](this.codec.createSerializer(), settings);
        this.deserializer = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$serde$2f$HttpInterceptingShapeDeserializer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpInterceptingShapeDeserializer"](this.codec.createDeserializer(), settings);
    }
    getShapeId() {
        return "aws.protocols#restJson1";
    }
    getPayloadCodec() {
        return this.codec;
    }
    setSerdeContext(serdeContext) {
        this.codec.setSerdeContext(serdeContext);
        super.setSerdeContext(serdeContext);
    }
    async serializeRequest(operationSchema, input, context) {
        const request = await super.serializeRequest(operationSchema, input, context);
        const inputSchema = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$schemas$2f$NormalizedSchema$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NormalizedSchema"].of(operationSchema.input);
        if (!request.headers["content-type"]) {
            const contentType = this.mixin.resolveRestContentType(this.getDefaultContentType(), inputSchema);
            if (contentType) {
                request.headers["content-type"] = contentType;
            }
        }
        if (request.body == null && request.headers["content-type"] === this.getDefaultContentType()) {
            request.body = "{}";
        }
        return request;
    }
    async deserializeResponse(operationSchema, context, response) {
        const output = await super.deserializeResponse(operationSchema, context, response);
        const outputSchema = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$schemas$2f$NormalizedSchema$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NormalizedSchema"].of(operationSchema.output);
        for (const [name, member] of outputSchema.structIterator()){
            if (member.getMemberTraits().httpPayload && !(name in output)) {
                output[name] = null;
            }
        }
        return output;
    }
    async handleError(operationSchema, context, response, dataObject, metadata) {
        const errorIdentifier = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$json$2f$parseJsonBody$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["loadRestJsonErrorCode"])(response, dataObject) ?? "Unknown";
        const { errorSchema, errorMetadata } = await this.mixin.getErrorSchemaOrThrowBaseException(errorIdentifier, this.options.defaultNamespace, response, dataObject, metadata);
        const ns = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$schemas$2f$NormalizedSchema$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NormalizedSchema"].of(errorSchema);
        const message = dataObject.message ?? dataObject.Message ?? "Unknown";
        const ErrorCtor = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$TypeRegistry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TypeRegistry"].for(errorSchema[1]).getErrorCtor(errorSchema) ?? Error;
        const exception = new ErrorCtor(message);
        await this.deserializeHttpMessage(errorSchema, context, response, dataObject);
        const output = {};
        for (const [name, member] of ns.structIterator()){
            const target = member.getMergedTraits().jsonName ?? name;
            output[name] = this.codec.createDeserializer().readObject(member, dataObject[target]);
        }
        throw this.mixin.decorateServiceException(Object.assign(exception, errorMetadata, {
            $fault: ns.getMergedTraits().error,
            message
        }, output), dataObject);
    }
    getDefaultContentType() {
        return "application/json";
    }
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/middleware-user-agent/dist-es/check-features.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "checkFeatures",
    ()=>checkFeatures
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$client$2f$setFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/client/setFeature.js [app-route] (ecmascript)");
;
const ACCOUNT_ID_ENDPOINT_REGEX = /\d{12}\.ddb/;
async function checkFeatures(context, config, args) {
    const request = args.request;
    if (request?.headers?.["smithy-protocol"] === "rpc-v2-cbor") {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$client$2f$setFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setFeature"])(context, "PROTOCOL_RPC_V2_CBOR", "M");
    }
    if (typeof config.retryStrategy === "function") {
        const retryStrategy = await config.retryStrategy();
        if (typeof retryStrategy.acquireInitialRetryToken === "function") {
            if (retryStrategy.constructor?.name?.includes("Adaptive")) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$client$2f$setFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setFeature"])(context, "RETRY_MODE_ADAPTIVE", "F");
            } else {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$client$2f$setFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setFeature"])(context, "RETRY_MODE_STANDARD", "E");
            }
        } else {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$client$2f$setFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setFeature"])(context, "RETRY_MODE_LEGACY", "D");
        }
    }
    if (typeof config.accountIdEndpointMode === "function") {
        const endpointV2 = context.endpointV2;
        if (String(endpointV2?.url?.hostname).match(ACCOUNT_ID_ENDPOINT_REGEX)) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$client$2f$setFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setFeature"])(context, "ACCOUNT_ID_ENDPOINT", "O");
        }
        switch(await config.accountIdEndpointMode?.()){
            case "disabled":
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$client$2f$setFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setFeature"])(context, "ACCOUNT_ID_MODE_DISABLED", "Q");
                break;
            case "preferred":
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$client$2f$setFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setFeature"])(context, "ACCOUNT_ID_MODE_PREFERRED", "P");
                break;
            case "required":
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$client$2f$setFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setFeature"])(context, "ACCOUNT_ID_MODE_REQUIRED", "R");
                break;
        }
    }
    const identity = context.__smithy_context?.selectedHttpAuthScheme?.identity;
    if (identity?.$source) {
        const credentials = identity;
        if (credentials.accountId) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$client$2f$setFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setFeature"])(context, "RESOLVED_ACCOUNT_ID", "T");
        }
        for (const [key, value] of Object.entries(credentials.$source ?? {})){
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$client$2f$setFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setFeature"])(context, key, value);
        }
    }
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/middleware-user-agent/dist-es/constants.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SPACE",
    ()=>SPACE,
    "UA_ESCAPE_CHAR",
    ()=>UA_ESCAPE_CHAR,
    "UA_NAME_ESCAPE_REGEX",
    ()=>UA_NAME_ESCAPE_REGEX,
    "UA_NAME_SEPARATOR",
    ()=>UA_NAME_SEPARATOR,
    "UA_VALUE_ESCAPE_REGEX",
    ()=>UA_VALUE_ESCAPE_REGEX,
    "USER_AGENT",
    ()=>USER_AGENT,
    "X_AMZ_USER_AGENT",
    ()=>X_AMZ_USER_AGENT
]);
const USER_AGENT = "user-agent";
const X_AMZ_USER_AGENT = "x-amz-user-agent";
const SPACE = " ";
const UA_NAME_SEPARATOR = "/";
const UA_NAME_ESCAPE_REGEX = /[^!$%&'*+\-.^_`|~\w]/g;
const UA_VALUE_ESCAPE_REGEX = /[^!$%&'*+\-.^_`|~\w#]/g;
const UA_ESCAPE_CHAR = "-";
}),
"[project]/path/path-web/node_modules/@aws-sdk/middleware-user-agent/dist-es/encode-features.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "encodeFeatures",
    ()=>encodeFeatures
]);
const BYTE_LIMIT = 1024;
function encodeFeatures(features) {
    let buffer = "";
    for(const key in features){
        const val = features[key];
        if (buffer.length + val.length + 1 <= BYTE_LIMIT) {
            if (buffer.length) {
                buffer += "," + val;
            } else {
                buffer += val;
            }
            continue;
        }
        break;
    }
    return buffer;
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/middleware-user-agent/dist-es/user-agent-middleware.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getUserAgentMiddlewareOptions",
    ()=>getUserAgentMiddlewareOptions,
    "getUserAgentPlugin",
    ()=>getUserAgentPlugin,
    "userAgentMiddleware",
    ()=>userAgentMiddleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$aws$2f$partition$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-endpoints/dist-es/lib/aws/partition.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/protocol-http/dist-es/httpRequest.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$check$2d$features$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/middleware-user-agent/dist-es/check-features.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/middleware-user-agent/dist-es/constants.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$encode$2d$features$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/middleware-user-agent/dist-es/encode-features.js [app-route] (ecmascript)");
;
;
;
;
;
const userAgentMiddleware = (options)=>(next, context)=>async (args)=>{
            const { request } = args;
            if (!__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpRequest"].isInstance(request)) {
                return next(args);
            }
            const { headers } = request;
            const userAgent = context?.userAgent?.map(escapeUserAgent) || [];
            const defaultUserAgent = (await options.defaultUserAgentProvider()).map(escapeUserAgent);
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$check$2d$features$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["checkFeatures"])(context, options, args);
            const awsContext = context;
            defaultUserAgent.push(`m/${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$encode$2d$features$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["encodeFeatures"])(Object.assign({}, context.__smithy_context?.features, awsContext.__aws_sdk_context?.features))}`);
            const customUserAgent = options?.customUserAgent?.map(escapeUserAgent) || [];
            const appId = await options.userAgentAppId();
            if (appId) {
                defaultUserAgent.push(escapeUserAgent([
                    `app`,
                    `${appId}`
                ]));
            }
            const prefix = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$aws$2f$partition$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUserAgentPrefix"])();
            const sdkUserAgentValue = (prefix ? [
                prefix
            ] : []).concat([
                ...defaultUserAgent,
                ...userAgent,
                ...customUserAgent
            ]).join(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SPACE"]);
            const normalUAValue = [
                ...defaultUserAgent.filter((section)=>section.startsWith("aws-sdk-")),
                ...customUserAgent
            ].join(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SPACE"]);
            if (options.runtime !== "browser") {
                if (normalUAValue) {
                    headers[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["X_AMZ_USER_AGENT"]] = headers[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["X_AMZ_USER_AGENT"]] ? `${headers[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["USER_AGENT"]]} ${normalUAValue}` : normalUAValue;
                }
                headers[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["USER_AGENT"]] = sdkUserAgentValue;
            } else {
                headers[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["X_AMZ_USER_AGENT"]] = sdkUserAgentValue;
            }
            return next({
                ...args,
                request
            });
        };
const escapeUserAgent = (userAgentPair)=>{
    const name = userAgentPair[0].split(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UA_NAME_SEPARATOR"]).map((part)=>part.replace(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UA_NAME_ESCAPE_REGEX"], __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UA_ESCAPE_CHAR"])).join(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UA_NAME_SEPARATOR"]);
    const version = userAgentPair[1]?.replace(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UA_VALUE_ESCAPE_REGEX"], __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UA_ESCAPE_CHAR"]);
    const prefixSeparatorIndex = name.indexOf(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UA_NAME_SEPARATOR"]);
    const prefix = name.substring(0, prefixSeparatorIndex);
    let uaName = name.substring(prefixSeparatorIndex + 1);
    if (prefix === "api") {
        uaName = uaName.toLowerCase();
    }
    return [
        prefix,
        uaName,
        version
    ].filter((item)=>item && item.length > 0).reduce((acc, item, index)=>{
        switch(index){
            case 0:
                return item;
            case 1:
                return `${acc}/${item}`;
            default:
                return `${acc}#${item}`;
        }
    }, "");
};
const getUserAgentMiddlewareOptions = {
    name: "getUserAgentMiddleware",
    step: "build",
    priority: "low",
    tags: [
        "SET_USER_AGENT",
        "USER_AGENT"
    ],
    override: true
};
const getUserAgentPlugin = (config)=>({
        applyToStack: (clientStack)=>{
            clientStack.add(userAgentMiddleware(config), getUserAgentMiddlewareOptions);
        }
    });
}),
"[project]/path/path-web/node_modules/@aws-sdk/middleware-user-agent/dist-es/configurations.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_UA_APP_ID",
    ()=>DEFAULT_UA_APP_ID,
    "resolveUserAgentConfig",
    ()=>resolveUserAgentConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/normalizeProvider.js [app-route] (ecmascript)");
;
const DEFAULT_UA_APP_ID = undefined;
function isValidUserAgentAppId(appId) {
    if (appId === undefined) {
        return true;
    }
    return typeof appId === "string" && appId.length <= 50;
}
function resolveUserAgentConfig(input) {
    const normalizedAppIdProvider = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeProvider"])(input.userAgentAppId ?? DEFAULT_UA_APP_ID);
    const { customUserAgent } = input;
    return Object.assign(input, {
        customUserAgent: typeof customUserAgent === "string" ? [
            [
                customUserAgent
            ]
        ] : customUserAgent,
        userAgentAppId: async ()=>{
            const appId = await normalizedAppIdProvider();
            if (!isValidUserAgentAppId(appId)) {
                const logger = input.logger?.constructor?.name === "NoOpLogger" || !input.logger ? console : input.logger;
                if (typeof appId !== "string") {
                    logger?.warn("userAgentAppId must be a string or undefined.");
                } else if (appId.length > 50) {
                    logger?.warn("The provided userAgentAppId exceeds the maximum length of 50 characters.");
                }
            }
            return appId;
        }
    });
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/middleware-websocket/dist-es/utils.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isWebSocketRequest",
    ()=>isWebSocketRequest
]);
const isWebSocketRequest = (request)=>request.protocol === "ws:" || request.protocol === "wss:";
}),
"[project]/path/path-web/node_modules/@aws-sdk/middleware-websocket/dist-es/WebsocketSignatureV4.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WebsocketSignatureV4",
    ()=>WebsocketSignatureV4
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/protocol-http/dist-es/httpRequest.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$websocket$2f$dist$2d$es$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/middleware-websocket/dist-es/utils.js [app-route] (ecmascript)");
;
;
class WebsocketSignatureV4 {
    signer;
    constructor(options){
        this.signer = options.signer;
    }
    presign(originalRequest, options = {}) {
        return this.signer.presign(originalRequest, options);
    }
    async sign(toSign, options) {
        if (__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpRequest"].isInstance(toSign) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$websocket$2f$dist$2d$es$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isWebSocketRequest"])(toSign)) {
            const signedRequest = await this.signer.presign({
                ...toSign,
                body: ""
            }, {
                ...options,
                expiresIn: 60,
                unsignableHeaders: new Set(Object.keys(toSign.headers).filter((header)=>header !== "host"))
            });
            return {
                ...signedRequest,
                body: toSign.body
            };
        } else {
            return this.signer.sign(toSign, options);
        }
    }
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/middleware-websocket/dist-es/websocket-configuration.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveWebSocketConfig",
    ()=>resolveWebSocketConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$websocket$2f$dist$2d$es$2f$WebsocketSignatureV4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/middleware-websocket/dist-es/WebsocketSignatureV4.js [app-route] (ecmascript)");
;
const resolveWebSocketConfig = (input)=>{
    const { signer } = input;
    return Object.assign(input, {
        signer: async (authScheme)=>{
            const signerObj = await signer(authScheme);
            if (validateSigner(signerObj)) {
                return new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$websocket$2f$dist$2d$es$2f$WebsocketSignatureV4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["WebsocketSignatureV4"]({
                    signer: signerObj
                });
            }
            throw new Error("Expected WebsocketSignatureV4 signer, please check the client constructor.");
        }
    });
};
const validateSigner = (signer)=>!!signer;
}),
"[project]/path/path-web/node_modules/@smithy/config-resolver/dist-es/regionConfig/checkRegion.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "checkRegion",
    ()=>checkRegion
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$isValidHostLabel$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-endpoints/dist-es/lib/isValidHostLabel.js [app-route] (ecmascript)");
;
const validRegions = new Set();
const checkRegion = (region, check = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$endpoints$2f$dist$2d$es$2f$lib$2f$isValidHostLabel$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isValidHostLabel"])=>{
    if (!validRegions.has(region) && !check(region)) {
        if (region === "*") {
            console.warn(`@smithy/config-resolver WARN - Please use the caller region instead of "*". See "sigv4a" in https://github.com/aws/aws-sdk-js-v3/blob/main/supplemental-docs/CLIENTS.md.`);
        } else {
            throw new Error(`Region not accepted: region="${region}" is not a valid hostname component.`);
        }
    } else {
        validRegions.add(region);
    }
};
}),
"[project]/path/path-web/node_modules/@smithy/config-resolver/dist-es/regionConfig/isFipsRegion.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isFipsRegion",
    ()=>isFipsRegion
]);
const isFipsRegion = (region)=>typeof region === "string" && (region.startsWith("fips-") || region.endsWith("-fips"));
}),
"[project]/path/path-web/node_modules/@smithy/config-resolver/dist-es/regionConfig/getRealRegion.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getRealRegion",
    ()=>getRealRegion
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$config$2d$resolver$2f$dist$2d$es$2f$regionConfig$2f$isFipsRegion$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/config-resolver/dist-es/regionConfig/isFipsRegion.js [app-route] (ecmascript)");
;
const getRealRegion = (region)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$config$2d$resolver$2f$dist$2d$es$2f$regionConfig$2f$isFipsRegion$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isFipsRegion"])(region) ? [
        "fips-aws-global",
        "aws-fips"
    ].includes(region) ? "us-east-1" : region.replace(/fips-(dkr-|prod-)?|-fips/, "") : region;
}),
"[project]/path/path-web/node_modules/@smithy/config-resolver/dist-es/regionConfig/resolveRegionConfig.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveRegionConfig",
    ()=>resolveRegionConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$config$2d$resolver$2f$dist$2d$es$2f$regionConfig$2f$checkRegion$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/config-resolver/dist-es/regionConfig/checkRegion.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$config$2d$resolver$2f$dist$2d$es$2f$regionConfig$2f$getRealRegion$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/config-resolver/dist-es/regionConfig/getRealRegion.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$config$2d$resolver$2f$dist$2d$es$2f$regionConfig$2f$isFipsRegion$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/config-resolver/dist-es/regionConfig/isFipsRegion.js [app-route] (ecmascript)");
;
;
;
const resolveRegionConfig = (input)=>{
    const { region, useFipsEndpoint } = input;
    if (!region) {
        throw new Error("Region is missing");
    }
    return Object.assign(input, {
        region: async ()=>{
            const providedRegion = typeof region === "function" ? await region() : region;
            const realRegion = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$config$2d$resolver$2f$dist$2d$es$2f$regionConfig$2f$getRealRegion$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getRealRegion"])(providedRegion);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$config$2d$resolver$2f$dist$2d$es$2f$regionConfig$2f$checkRegion$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["checkRegion"])(realRegion);
            return realRegion;
        },
        useFipsEndpoint: async ()=>{
            const providedRegion = typeof region === "string" ? region : await region();
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$config$2d$resolver$2f$dist$2d$es$2f$regionConfig$2f$isFipsRegion$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isFipsRegion"])(providedRegion)) {
                return true;
            }
            return typeof useFipsEndpoint !== "function" ? Promise.resolve(!!useFipsEndpoint) : useFipsEndpoint();
        }
    });
};
}),
"[project]/path/path-web/node_modules/@smithy/config-resolver/dist-es/regionConfig/config.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NODE_REGION_CONFIG_FILE_OPTIONS",
    ()=>NODE_REGION_CONFIG_FILE_OPTIONS,
    "NODE_REGION_CONFIG_OPTIONS",
    ()=>NODE_REGION_CONFIG_OPTIONS,
    "REGION_ENV_NAME",
    ()=>REGION_ENV_NAME,
    "REGION_INI_NAME",
    ()=>REGION_INI_NAME
]);
const REGION_ENV_NAME = "AWS_REGION";
const REGION_INI_NAME = "region";
const NODE_REGION_CONFIG_OPTIONS = {
    environmentVariableSelector: (env)=>env[REGION_ENV_NAME],
    configFileSelector: (profile)=>profile[REGION_INI_NAME],
    default: ()=>{
        throw new Error("Region is missing");
    }
};
const NODE_REGION_CONFIG_FILE_OPTIONS = {
    preferredFile: "credentials"
};
}),
"[project]/path/path-web/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseDualstackEndpointConfigOptions.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CONFIG_USE_DUALSTACK_ENDPOINT",
    ()=>CONFIG_USE_DUALSTACK_ENDPOINT,
    "DEFAULT_USE_DUALSTACK_ENDPOINT",
    ()=>DEFAULT_USE_DUALSTACK_ENDPOINT,
    "ENV_USE_DUALSTACK_ENDPOINT",
    ()=>ENV_USE_DUALSTACK_ENDPOINT,
    "NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS",
    ()=>NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$config$2d$provider$2f$dist$2d$es$2f$booleanSelector$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-config-provider/dist-es/booleanSelector.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$config$2d$provider$2f$dist$2d$es$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-config-provider/dist-es/types.js [app-route] (ecmascript)");
;
const ENV_USE_DUALSTACK_ENDPOINT = "AWS_USE_DUALSTACK_ENDPOINT";
const CONFIG_USE_DUALSTACK_ENDPOINT = "use_dualstack_endpoint";
const DEFAULT_USE_DUALSTACK_ENDPOINT = false;
const NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS = {
    environmentVariableSelector: (env)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$config$2d$provider$2f$dist$2d$es$2f$booleanSelector$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["booleanSelector"])(env, ENV_USE_DUALSTACK_ENDPOINT, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$config$2d$provider$2f$dist$2d$es$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SelectorType"].ENV),
    configFileSelector: (profile)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$config$2d$provider$2f$dist$2d$es$2f$booleanSelector$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["booleanSelector"])(profile, CONFIG_USE_DUALSTACK_ENDPOINT, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$config$2d$provider$2f$dist$2d$es$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SelectorType"].CONFIG),
    default: false
};
}),
"[project]/path/path-web/node_modules/@smithy/config-resolver/dist-es/endpointsConfig/NodeUseFipsEndpointConfigOptions.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CONFIG_USE_FIPS_ENDPOINT",
    ()=>CONFIG_USE_FIPS_ENDPOINT,
    "DEFAULT_USE_FIPS_ENDPOINT",
    ()=>DEFAULT_USE_FIPS_ENDPOINT,
    "ENV_USE_FIPS_ENDPOINT",
    ()=>ENV_USE_FIPS_ENDPOINT,
    "NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS",
    ()=>NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$config$2d$provider$2f$dist$2d$es$2f$booleanSelector$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-config-provider/dist-es/booleanSelector.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$config$2d$provider$2f$dist$2d$es$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-config-provider/dist-es/types.js [app-route] (ecmascript)");
;
const ENV_USE_FIPS_ENDPOINT = "AWS_USE_FIPS_ENDPOINT";
const CONFIG_USE_FIPS_ENDPOINT = "use_fips_endpoint";
const DEFAULT_USE_FIPS_ENDPOINT = false;
const NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS = {
    environmentVariableSelector: (env)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$config$2d$provider$2f$dist$2d$es$2f$booleanSelector$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["booleanSelector"])(env, ENV_USE_FIPS_ENDPOINT, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$config$2d$provider$2f$dist$2d$es$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SelectorType"].ENV),
    configFileSelector: (profile)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$config$2d$provider$2f$dist$2d$es$2f$booleanSelector$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["booleanSelector"])(profile, CONFIG_USE_FIPS_ENDPOINT, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$config$2d$provider$2f$dist$2d$es$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SelectorType"].CONFIG),
    default: false
};
}),
"[project]/path/path-web/node_modules/@smithy/types/dist-es/middleware.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SMITHY_CONTEXT_KEY",
    ()=>SMITHY_CONTEXT_KEY
]);
const SMITHY_CONTEXT_KEY = "__smithy_context";
}),
"[project]/path/path-web/node_modules/@smithy/types/dist-es/profile.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "IniSectionType",
    ()=>IniSectionType
]);
var IniSectionType;
(function(IniSectionType) {
    IniSectionType["PROFILE"] = "profile";
    IniSectionType["SSO_SESSION"] = "sso-session";
    IniSectionType["SERVICES"] = "services";
})(IniSectionType || (IniSectionType = {}));
}),
"[project]/path/path-web/node_modules/@smithy/types/dist-es/endpoint.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EndpointURLScheme",
    ()=>EndpointURLScheme
]);
var EndpointURLScheme;
(function(EndpointURLScheme) {
    EndpointURLScheme["HTTP"] = "http";
    EndpointURLScheme["HTTPS"] = "https";
})(EndpointURLScheme || (EndpointURLScheme = {}));
}),
"[project]/path/path-web/node_modules/@smithy/types/dist-es/extensions/checksum.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AlgorithmId",
    ()=>AlgorithmId,
    "getChecksumConfiguration",
    ()=>getChecksumConfiguration,
    "resolveChecksumRuntimeConfig",
    ()=>resolveChecksumRuntimeConfig
]);
var AlgorithmId;
(function(AlgorithmId) {
    AlgorithmId["MD5"] = "md5";
    AlgorithmId["CRC32"] = "crc32";
    AlgorithmId["CRC32C"] = "crc32c";
    AlgorithmId["SHA1"] = "sha1";
    AlgorithmId["SHA256"] = "sha256";
})(AlgorithmId || (AlgorithmId = {}));
const getChecksumConfiguration = (runtimeConfig)=>{
    const checksumAlgorithms = [];
    if (runtimeConfig.sha256 !== undefined) {
        checksumAlgorithms.push({
            algorithmId: ()=>AlgorithmId.SHA256,
            checksumConstructor: ()=>runtimeConfig.sha256
        });
    }
    if (runtimeConfig.md5 != undefined) {
        checksumAlgorithms.push({
            algorithmId: ()=>AlgorithmId.MD5,
            checksumConstructor: ()=>runtimeConfig.md5
        });
    }
    return {
        addChecksumAlgorithm (algo) {
            checksumAlgorithms.push(algo);
        },
        checksumAlgorithms () {
            return checksumAlgorithms;
        }
    };
};
const resolveChecksumRuntimeConfig = (clientConfig)=>{
    const runtimeConfig = {};
    clientConfig.checksumAlgorithms().forEach((checksumAlgorithm)=>{
        runtimeConfig[checksumAlgorithm.algorithmId()] = checksumAlgorithm.checksumConstructor();
    });
    return runtimeConfig;
};
}),
"[project]/path/path-web/node_modules/@smithy/util-middleware/dist-es/getSmithyContext.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSmithyContext",
    ()=>getSmithyContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$middleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/types/dist-es/middleware.js [app-route] (ecmascript)");
;
const getSmithyContext = (context)=>context[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$middleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SMITHY_CONTEXT_KEY"]] || (context[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$middleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SMITHY_CONTEXT_KEY"]] = {});
}),
"[project]/path/path-web/node_modules/@smithy/util-middleware/dist-es/normalizeProvider.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "normalizeProvider",
    ()=>normalizeProvider
]);
const normalizeProvider = (input)=>{
    if (typeof input === "function") return input;
    const promisified = Promise.resolve(input);
    return ()=>promisified;
};
}),
"[project]/path/path-web/node_modules/@smithy/eventstream-serde-config-resolver/dist-es/EventStreamSerdeConfig.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveEventStreamSerdeConfig",
    ()=>resolveEventStreamSerdeConfig
]);
const resolveEventStreamSerdeConfig = (input)=>Object.assign(input, {
        eventStreamMarshaller: input.eventStreamSerdeProvider(input)
    });
}),
"[project]/path/path-web/node_modules/@smithy/middleware-content-length/dist-es/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "contentLengthMiddleware",
    ()=>contentLengthMiddleware,
    "contentLengthMiddlewareOptions",
    ()=>contentLengthMiddlewareOptions,
    "getContentLengthPlugin",
    ()=>getContentLengthPlugin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/protocol-http/dist-es/httpRequest.js [app-route] (ecmascript)");
;
const CONTENT_LENGTH_HEADER = "content-length";
function contentLengthMiddleware(bodyLengthChecker) {
    return (next)=>async (args)=>{
            const request = args.request;
            if (__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpRequest"].isInstance(request)) {
                const { body, headers } = request;
                if (body && Object.keys(headers).map((str)=>str.toLowerCase()).indexOf(CONTENT_LENGTH_HEADER) === -1) {
                    try {
                        const length = bodyLengthChecker(body);
                        request.headers = {
                            ...request.headers,
                            [CONTENT_LENGTH_HEADER]: String(length)
                        };
                    } catch (error) {}
                }
            }
            return next({
                ...args,
                request
            });
        };
}
const contentLengthMiddlewareOptions = {
    step: "build",
    tags: [
        "SET_CONTENT_LENGTH",
        "CONTENT_LENGTH"
    ],
    name: "contentLengthMiddleware",
    override: true
};
const getContentLengthPlugin = (options)=>({
        applyToStack: (clientStack)=>{
            clientStack.add(contentLengthMiddleware(options.bodyLengthChecker), contentLengthMiddlewareOptions);
        }
    });
}),
"[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/ProviderError.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProviderError",
    ()=>ProviderError
]);
class ProviderError extends Error {
    name = "ProviderError";
    tryNextLink;
    constructor(message, options = true){
        let logger;
        let tryNextLink = true;
        if (typeof options === "boolean") {
            logger = undefined;
            tryNextLink = options;
        } else if (options != null && typeof options === "object") {
            logger = options.logger;
            tryNextLink = options.tryNextLink ?? true;
        }
        super(message);
        this.tryNextLink = tryNextLink;
        Object.setPrototypeOf(this, ProviderError.prototype);
        logger?.debug?.(`@smithy/property-provider ${tryNextLink ? "->" : "(!)"} ${message}`);
    }
    static from(error, options = true) {
        return Object.assign(new this(error.message, options), error);
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/chain.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "chain",
    ()=>chain
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$ProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/ProviderError.js [app-route] (ecmascript)");
;
const chain = (...providers)=>async ()=>{
        if (providers.length === 0) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$ProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ProviderError"]("No providers in chain");
        }
        let lastProviderError;
        for (const provider of providers){
            try {
                const credentials = await provider();
                return credentials;
            } catch (err) {
                lastProviderError = err;
                if (err?.tryNextLink) {
                    continue;
                }
                throw err;
            }
        }
        throw lastProviderError;
    };
}),
"[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/memoize.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "memoize",
    ()=>memoize
]);
const memoize = (provider, isExpired, requiresRefresh)=>{
    let resolved;
    let pending;
    let hasResult;
    let isConstant = false;
    const coalesceProvider = async ()=>{
        if (!pending) {
            pending = provider();
        }
        try {
            resolved = await pending;
            hasResult = true;
            isConstant = false;
        } finally{
            pending = undefined;
        }
        return resolved;
    };
    if (isExpired === undefined) {
        return async (options)=>{
            if (!hasResult || options?.forceRefresh) {
                resolved = await coalesceProvider();
            }
            return resolved;
        };
    }
    return async (options)=>{
        if (!hasResult || options?.forceRefresh) {
            resolved = await coalesceProvider();
        }
        if (isConstant) {
            return resolved;
        }
        if (requiresRefresh && !requiresRefresh(resolved)) {
            isConstant = true;
            return resolved;
        }
        if (isExpired(resolved)) {
            await coalesceProvider();
            return resolved;
        }
        return resolved;
    };
};
}),
"[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/CredentialsProviderError.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CredentialsProviderError",
    ()=>CredentialsProviderError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$ProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/ProviderError.js [app-route] (ecmascript)");
;
class CredentialsProviderError extends __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$ProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ProviderError"] {
    name = "CredentialsProviderError";
    constructor(message, options = true){
        super(message, options);
        Object.setPrototypeOf(this, CredentialsProviderError.prototype);
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/fromStatic.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromStatic",
    ()=>fromStatic
]);
const fromStatic = (staticValue)=>()=>Promise.resolve(staticValue);
}),
"[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/TokenProviderError.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TokenProviderError",
    ()=>TokenProviderError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$ProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/ProviderError.js [app-route] (ecmascript)");
;
class TokenProviderError extends __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$ProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ProviderError"] {
    name = "TokenProviderError";
    constructor(message, options = true){
        super(message, options);
        Object.setPrototypeOf(this, TokenProviderError.prototype);
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/node-config-provider/dist-es/getSelectorName.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSelectorName",
    ()=>getSelectorName
]);
function getSelectorName(functionString) {
    try {
        const constants = new Set(Array.from(functionString.match(/([A-Z_]){3,}/g) ?? []));
        constants.delete("CONFIG");
        constants.delete("CONFIG_PREFIX_SEPARATOR");
        constants.delete("ENV");
        return [
            ...constants
        ].join(", ");
    } catch (e) {
        return functionString;
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/node-config-provider/dist-es/fromEnv.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromEnv",
    ()=>fromEnv
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$CredentialsProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/CredentialsProviderError.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$config$2d$provider$2f$dist$2d$es$2f$getSelectorName$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/node-config-provider/dist-es/getSelectorName.js [app-route] (ecmascript)");
;
;
const fromEnv = (envVarSelector, options)=>async ()=>{
        try {
            const config = envVarSelector(process.env, options);
            if (config === undefined) {
                throw new Error();
            }
            return config;
        } catch (e) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$CredentialsProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CredentialsProviderError"](e.message || `Not found in ENV: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$config$2d$provider$2f$dist$2d$es$2f$getSelectorName$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSelectorName"])(envVarSelector.toString())}`, {
                logger: options?.logger
            });
        }
    };
}),
"[project]/path/path-web/node_modules/@smithy/node-config-provider/dist-es/fromSharedConfigFiles.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromSharedConfigFiles",
    ()=>fromSharedConfigFiles
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$CredentialsProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/CredentialsProviderError.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getProfileName$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getProfileName.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$loadSharedConfigFiles$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/loadSharedConfigFiles.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$config$2d$provider$2f$dist$2d$es$2f$getSelectorName$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/node-config-provider/dist-es/getSelectorName.js [app-route] (ecmascript)");
;
;
;
const fromSharedConfigFiles = (configSelector, { preferredFile = "config", ...init } = {})=>async ()=>{
        const profile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getProfileName$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getProfileName"])(init);
        const { configFile, credentialsFile } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$loadSharedConfigFiles$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["loadSharedConfigFiles"])(init);
        const profileFromCredentials = credentialsFile[profile] || {};
        const profileFromConfig = configFile[profile] || {};
        const mergedProfile = preferredFile === "config" ? {
            ...profileFromCredentials,
            ...profileFromConfig
        } : {
            ...profileFromConfig,
            ...profileFromCredentials
        };
        try {
            const cfgFile = preferredFile === "config" ? configFile : credentialsFile;
            const configValue = configSelector(mergedProfile, cfgFile);
            if (configValue === undefined) {
                throw new Error();
            }
            return configValue;
        } catch (e) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$CredentialsProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CredentialsProviderError"](e.message || `Not found in config files w/ profile [${profile}]: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$config$2d$provider$2f$dist$2d$es$2f$getSelectorName$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSelectorName"])(configSelector.toString())}`, {
                logger: init.logger
            });
        }
    };
}),
"[project]/path/path-web/node_modules/@smithy/node-config-provider/dist-es/fromStatic.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromStatic",
    ()=>fromStatic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$fromStatic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/fromStatic.js [app-route] (ecmascript)");
;
const isFunction = (func)=>typeof func === "function";
const fromStatic = (defaultValue)=>isFunction(defaultValue) ? async ()=>await defaultValue() : (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$fromStatic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromStatic"])(defaultValue);
}),
"[project]/path/path-web/node_modules/@smithy/node-config-provider/dist-es/configLoader.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "loadConfig",
    ()=>loadConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$chain$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/chain.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$memoize$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/memoize.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$config$2d$provider$2f$dist$2d$es$2f$fromEnv$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/node-config-provider/dist-es/fromEnv.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$config$2d$provider$2f$dist$2d$es$2f$fromSharedConfigFiles$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/node-config-provider/dist-es/fromSharedConfigFiles.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$config$2d$provider$2f$dist$2d$es$2f$fromStatic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/node-config-provider/dist-es/fromStatic.js [app-route] (ecmascript)");
;
;
;
;
const loadConfig = ({ environmentVariableSelector, configFileSelector, default: defaultValue }, configuration = {})=>{
    const { signingName, logger } = configuration;
    const envOptions = {
        signingName,
        logger
    };
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$memoize$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["memoize"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$chain$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chain"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$config$2d$provider$2f$dist$2d$es$2f$fromEnv$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromEnv"])(environmentVariableSelector, envOptions), (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$config$2d$provider$2f$dist$2d$es$2f$fromSharedConfigFiles$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromSharedConfigFiles"])(configFileSelector, configuration), (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$config$2d$provider$2f$dist$2d$es$2f$fromStatic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromStatic"])(defaultValue)));
};
}),
"[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getProfileName.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_PROFILE",
    ()=>DEFAULT_PROFILE,
    "ENV_PROFILE",
    ()=>ENV_PROFILE,
    "getProfileName",
    ()=>getProfileName
]);
const ENV_PROFILE = "AWS_PROFILE";
const DEFAULT_PROFILE = "default";
const getProfileName = (init)=>init.profile || process.env[ENV_PROFILE] || DEFAULT_PROFILE;
}),
"[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/constants.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CONFIG_PREFIX_SEPARATOR",
    ()=>CONFIG_PREFIX_SEPARATOR
]);
const CONFIG_PREFIX_SEPARATOR = ".";
}),
"[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getConfigData.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getConfigData",
    ()=>getConfigData
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$profile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/types/dist-es/profile.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/constants.js [app-route] (ecmascript)");
;
;
const getConfigData = (data)=>Object.entries(data).filter(([key])=>{
        const indexOfSeparator = key.indexOf(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CONFIG_PREFIX_SEPARATOR"]);
        if (indexOfSeparator === -1) {
            return false;
        }
        return Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$profile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["IniSectionType"]).includes(key.substring(0, indexOfSeparator));
    }).reduce((acc, [key, value])=>{
        const indexOfSeparator = key.indexOf(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CONFIG_PREFIX_SEPARATOR"]);
        const updatedKey = key.substring(0, indexOfSeparator) === __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$profile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["IniSectionType"].PROFILE ? key.substring(indexOfSeparator + 1) : key;
        acc[updatedKey] = value;
        return acc;
    }, {
        ...data.default && {
            default: data.default
        }
    });
}),
"[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getHomeDir.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getHomeDir",
    ()=>getHomeDir
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$os__$5b$external$5d$__$28$os$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/os [external] (os, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
const homeDirCache = {};
const getHomeDirCacheKey = ()=>{
    if (process && process.geteuid) {
        return `${process.geteuid()}`;
    }
    return "DEFAULT";
};
const getHomeDir = ()=>{
    const { HOME, USERPROFILE, HOMEPATH, HOMEDRIVE = `C:${__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["sep"]}` } = process.env;
    if (HOME) return HOME;
    if (USERPROFILE) return USERPROFILE;
    if (HOMEPATH) return `${HOMEDRIVE}${HOMEPATH}`;
    const homeDirCacheKey = getHomeDirCacheKey();
    if (!homeDirCache[homeDirCacheKey]) homeDirCache[homeDirCacheKey] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$os__$5b$external$5d$__$28$os$2c$__cjs$29$__["homedir"])();
    return homeDirCache[homeDirCacheKey];
};
}),
"[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getConfigFilepath.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ENV_CONFIG_PATH",
    ()=>ENV_CONFIG_PATH,
    "getConfigFilepath",
    ()=>getConfigFilepath
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getHomeDir$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getHomeDir.js [app-route] (ecmascript)");
;
;
const ENV_CONFIG_PATH = "AWS_CONFIG_FILE";
const getConfigFilepath = ()=>process.env[ENV_CONFIG_PATH] || (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getHomeDir$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getHomeDir"])(), ".aws", "config");
}),
"[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getCredentialsFilepath.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ENV_CREDENTIALS_PATH",
    ()=>ENV_CREDENTIALS_PATH,
    "getCredentialsFilepath",
    ()=>getCredentialsFilepath
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getHomeDir$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getHomeDir.js [app-route] (ecmascript)");
;
;
const ENV_CREDENTIALS_PATH = "AWS_SHARED_CREDENTIALS_FILE";
const getCredentialsFilepath = ()=>process.env[ENV_CREDENTIALS_PATH] || (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getHomeDir$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getHomeDir"])(), ".aws", "credentials");
}),
"[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/parseIni.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseIni",
    ()=>parseIni
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$profile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/types/dist-es/profile.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/constants.js [app-route] (ecmascript)");
;
;
const prefixKeyRegex = /^([\w-]+)\s(["'])?([\w-@\+\.%:/]+)\2$/;
const profileNameBlockList = [
    "__proto__",
    "profile __proto__"
];
const parseIni = (iniData)=>{
    const map = {};
    let currentSection;
    let currentSubSection;
    for (const iniLine of iniData.split(/\r?\n/)){
        const trimmedLine = iniLine.split(/(^|\s)[;#]/)[0].trim();
        const isSection = trimmedLine[0] === "[" && trimmedLine[trimmedLine.length - 1] === "]";
        if (isSection) {
            currentSection = undefined;
            currentSubSection = undefined;
            const sectionName = trimmedLine.substring(1, trimmedLine.length - 1);
            const matches = prefixKeyRegex.exec(sectionName);
            if (matches) {
                const [, prefix, , name] = matches;
                if (Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$profile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["IniSectionType"]).includes(prefix)) {
                    currentSection = [
                        prefix,
                        name
                    ].join(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CONFIG_PREFIX_SEPARATOR"]);
                }
            } else {
                currentSection = sectionName;
            }
            if (profileNameBlockList.includes(sectionName)) {
                throw new Error(`Found invalid profile name "${sectionName}"`);
            }
        } else if (currentSection) {
            const indexOfEqualsSign = trimmedLine.indexOf("=");
            if (![
                0,
                -1
            ].includes(indexOfEqualsSign)) {
                const [name, value] = [
                    trimmedLine.substring(0, indexOfEqualsSign).trim(),
                    trimmedLine.substring(indexOfEqualsSign + 1).trim()
                ];
                if (value === "") {
                    currentSubSection = name;
                } else {
                    if (currentSubSection && iniLine.trimStart() === iniLine) {
                        currentSubSection = undefined;
                    }
                    map[currentSection] = map[currentSection] || {};
                    const key = currentSubSection ? [
                        currentSubSection,
                        name
                    ].join(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CONFIG_PREFIX_SEPARATOR"]) : name;
                    map[currentSection][key] = value;
                }
            }
        }
    }
    return map;
};
}),
"[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/readFile.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fileIntercept",
    ()=>fileIntercept,
    "filePromises",
    ()=>filePromises,
    "readFile",
    ()=>readFile
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs/promises [external] (node:fs/promises, cjs)");
;
const filePromises = {};
const fileIntercept = {};
const readFile = (path, options)=>{
    if (fileIntercept[path] !== undefined) {
        return fileIntercept[path];
    }
    if (!filePromises[path] || options?.ignoreCache) {
        filePromises[path] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["readFile"])(path, "utf8");
    }
    return filePromises[path];
};
}),
"[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/loadSharedConfigFiles.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "loadSharedConfigFiles",
    ()=>loadSharedConfigFiles
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getConfigData$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getConfigData.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getConfigFilepath$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getConfigFilepath.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getCredentialsFilepath$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getCredentialsFilepath.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getHomeDir$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getHomeDir.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$parseIni$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/parseIni.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$readFile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/readFile.js [app-route] (ecmascript)");
;
;
;
;
;
;
;
const swallowError = ()=>({});
;
const loadSharedConfigFiles = async (init = {})=>{
    const { filepath = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getCredentialsFilepath$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCredentialsFilepath"])(), configFilepath = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getConfigFilepath$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getConfigFilepath"])() } = init;
    const homeDir = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getHomeDir$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getHomeDir"])();
    const relativeHomeDirPrefix = "~/";
    let resolvedFilepath = filepath;
    if (filepath.startsWith(relativeHomeDirPrefix)) {
        resolvedFilepath = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])(homeDir, filepath.slice(2));
    }
    let resolvedConfigFilepath = configFilepath;
    if (configFilepath.startsWith(relativeHomeDirPrefix)) {
        resolvedConfigFilepath = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])(homeDir, configFilepath.slice(2));
    }
    const parsedFiles = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$readFile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["readFile"])(resolvedConfigFilepath, {
            ignoreCache: init.ignoreCache
        }).then(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$parseIni$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseIni"]).then(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getConfigData$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getConfigData"]).catch(swallowError),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$readFile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["readFile"])(resolvedFilepath, {
            ignoreCache: init.ignoreCache
        }).then(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$parseIni$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseIni"]).catch(swallowError)
    ]);
    return {
        configFile: parsedFiles[0],
        credentialsFile: parsedFiles[1]
    };
};
}),
"[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getSSOTokenFilepath.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSSOTokenFilepath",
    ()=>getSSOTokenFilepath
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getHomeDir$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getHomeDir.js [app-route] (ecmascript)");
;
;
;
const getSSOTokenFilepath = (id)=>{
    const hasher = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHash"])("sha1");
    const cacheName = hasher.update(id).digest("hex");
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getHomeDir$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getHomeDir"])(), ".aws", "sso", "cache", `${cacheName}.json`);
};
}),
"[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getSSOTokenFromFile.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSSOTokenFromFile",
    ()=>getSSOTokenFromFile,
    "tokenIntercept",
    ()=>tokenIntercept
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs/promises [external] (fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getSSOTokenFilepath$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getSSOTokenFilepath.js [app-route] (ecmascript)");
;
;
const tokenIntercept = {};
const getSSOTokenFromFile = async (id)=>{
    if (tokenIntercept[id]) {
        return tokenIntercept[id];
    }
    const ssoTokenFilepath = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getSSOTokenFilepath$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSSOTokenFilepath"])(id);
    const ssoTokenText = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$fs$2f$promises__$5b$external$5d$__$28$fs$2f$promises$2c$__cjs$29$__["readFile"])(ssoTokenFilepath, "utf8");
    return JSON.parse(ssoTokenText);
};
}),
"[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getSsoSessionData.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSsoSessionData",
    ()=>getSsoSessionData
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$profile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/types/dist-es/profile.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/constants.js [app-route] (ecmascript)");
;
;
const getSsoSessionData = (data)=>Object.entries(data).filter(([key])=>key.startsWith(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$profile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["IniSectionType"].SSO_SESSION + __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CONFIG_PREFIX_SEPARATOR"])).reduce((acc, [key, value])=>({
            ...acc,
            [key.substring(key.indexOf(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CONFIG_PREFIX_SEPARATOR"]) + 1)]: value
        }), {});
}),
"[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/loadSsoSessionData.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "loadSsoSessionData",
    ()=>loadSsoSessionData
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getConfigFilepath$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getConfigFilepath.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getSsoSessionData$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getSsoSessionData.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$parseIni$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/parseIni.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$readFile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/readFile.js [app-route] (ecmascript)");
;
;
;
;
const swallowError = ()=>({});
const loadSsoSessionData = async (init = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$readFile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["readFile"])(init.configFilepath ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getConfigFilepath$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getConfigFilepath"])()).then(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$parseIni$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseIni"]).then(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getSsoSessionData$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSsoSessionData"]).catch(swallowError);
}),
"[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/mergeConfigFiles.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mergeConfigFiles",
    ()=>mergeConfigFiles
]);
const mergeConfigFiles = (...files)=>{
    const merged = {};
    for (const file of files){
        for (const [key, values] of Object.entries(file)){
            if (merged[key] !== undefined) {
                Object.assign(merged[key], values);
            } else {
                merged[key] = values;
            }
        }
    }
    return merged;
};
}),
"[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/parseKnownFiles.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseKnownFiles",
    ()=>parseKnownFiles
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$loadSharedConfigFiles$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/loadSharedConfigFiles.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$mergeConfigFiles$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/mergeConfigFiles.js [app-route] (ecmascript)");
;
;
const parseKnownFiles = async (init)=>{
    const parsedFiles = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$loadSharedConfigFiles$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["loadSharedConfigFiles"])(init);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$mergeConfigFiles$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mergeConfigFiles"])(parsedFiles.configFile, parsedFiles.credentialsFile);
};
}),
"[project]/path/path-web/node_modules/@smithy/middleware-endpoint/dist-es/adaptors/getEndpointUrlConfig.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getEndpointUrlConfig",
    ()=>getEndpointUrlConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/constants.js [app-route] (ecmascript)");
;
const ENV_ENDPOINT_URL = "AWS_ENDPOINT_URL";
const CONFIG_ENDPOINT_URL = "endpoint_url";
const getEndpointUrlConfig = (serviceId)=>({
        environmentVariableSelector: (env)=>{
            const serviceSuffixParts = serviceId.split(" ").map((w)=>w.toUpperCase());
            const serviceEndpointUrl = env[[
                ENV_ENDPOINT_URL,
                ...serviceSuffixParts
            ].join("_")];
            if (serviceEndpointUrl) return serviceEndpointUrl;
            const endpointUrl = env[ENV_ENDPOINT_URL];
            if (endpointUrl) return endpointUrl;
            return undefined;
        },
        configFileSelector: (profile, config)=>{
            if (config && profile.services) {
                const servicesSection = config[[
                    "services",
                    profile.services
                ].join(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CONFIG_PREFIX_SEPARATOR"])];
                if (servicesSection) {
                    const servicePrefixParts = serviceId.split(" ").map((w)=>w.toLowerCase());
                    const endpointUrl = servicesSection[[
                        servicePrefixParts.join("_"),
                        CONFIG_ENDPOINT_URL
                    ].join(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CONFIG_PREFIX_SEPARATOR"])];
                    if (endpointUrl) return endpointUrl;
                }
            }
            const endpointUrl = profile[CONFIG_ENDPOINT_URL];
            if (endpointUrl) return endpointUrl;
            return undefined;
        },
        default: undefined
    });
}),
"[project]/path/path-web/node_modules/@smithy/middleware-endpoint/dist-es/adaptors/getEndpointFromConfig.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getEndpointFromConfig",
    ()=>getEndpointFromConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$config$2d$provider$2f$dist$2d$es$2f$configLoader$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/node-config-provider/dist-es/configLoader.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$endpoint$2f$dist$2d$es$2f$adaptors$2f$getEndpointUrlConfig$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/middleware-endpoint/dist-es/adaptors/getEndpointUrlConfig.js [app-route] (ecmascript)");
;
;
const getEndpointFromConfig = async (serviceId)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$config$2d$provider$2f$dist$2d$es$2f$configLoader$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["loadConfig"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$endpoint$2f$dist$2d$es$2f$adaptors$2f$getEndpointUrlConfig$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getEndpointUrlConfig"])(serviceId ?? ""))();
}),
"[project]/path/path-web/node_modules/@smithy/middleware-endpoint/dist-es/adaptors/toEndpointV1.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toEndpointV1",
    ()=>toEndpointV1
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$url$2d$parser$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/url-parser/dist-es/index.js [app-route] (ecmascript)");
;
const toEndpointV1 = (endpoint)=>{
    if (typeof endpoint === "object") {
        if ("url" in endpoint) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$url$2d$parser$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseUrl"])(endpoint.url);
        }
        return endpoint;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$url$2d$parser$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseUrl"])(endpoint);
};
}),
"[project]/path/path-web/node_modules/@smithy/middleware-endpoint/dist-es/resolveEndpointConfig.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveEndpointConfig",
    ()=>resolveEndpointConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$middleware$2f$dist$2d$es$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-middleware/dist-es/normalizeProvider.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$endpoint$2f$dist$2d$es$2f$adaptors$2f$getEndpointFromConfig$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/middleware-endpoint/dist-es/adaptors/getEndpointFromConfig.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$endpoint$2f$dist$2d$es$2f$adaptors$2f$toEndpointV1$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/middleware-endpoint/dist-es/adaptors/toEndpointV1.js [app-route] (ecmascript)");
;
;
;
const resolveEndpointConfig = (input)=>{
    const tls = input.tls ?? true;
    const { endpoint, useDualstackEndpoint, useFipsEndpoint } = input;
    const customEndpointProvider = endpoint != null ? async ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$endpoint$2f$dist$2d$es$2f$adaptors$2f$toEndpointV1$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toEndpointV1"])(await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$middleware$2f$dist$2d$es$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeProvider"])(endpoint)()) : undefined;
    const isCustomEndpoint = !!endpoint;
    const resolvedConfig = Object.assign(input, {
        endpoint: customEndpointProvider,
        tls,
        isCustomEndpoint,
        useDualstackEndpoint: (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$middleware$2f$dist$2d$es$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeProvider"])(useDualstackEndpoint ?? false),
        useFipsEndpoint: (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$middleware$2f$dist$2d$es$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeProvider"])(useFipsEndpoint ?? false)
    });
    let configuredEndpointPromise = undefined;
    resolvedConfig.serviceConfiguredEndpoint = async ()=>{
        if (input.serviceId && !configuredEndpointPromise) {
            configuredEndpointPromise = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$endpoint$2f$dist$2d$es$2f$adaptors$2f$getEndpointFromConfig$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getEndpointFromConfig"])(input.serviceId);
        }
        return configuredEndpointPromise;
    };
    return resolvedConfig;
};
}),
"[project]/path/path-web/node_modules/@smithy/middleware-endpoint/dist-es/service-customizations/s3.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DOT_PATTERN",
    ()=>DOT_PATTERN,
    "S3_HOSTNAME_PATTERN",
    ()=>S3_HOSTNAME_PATTERN,
    "isArnBucketName",
    ()=>isArnBucketName,
    "isDnsCompatibleBucketName",
    ()=>isDnsCompatibleBucketName,
    "resolveParamsForS3",
    ()=>resolveParamsForS3
]);
const resolveParamsForS3 = async (endpointParams)=>{
    const bucket = endpointParams?.Bucket || "";
    if (typeof endpointParams.Bucket === "string") {
        endpointParams.Bucket = bucket.replace(/#/g, encodeURIComponent("#")).replace(/\?/g, encodeURIComponent("?"));
    }
    if (isArnBucketName(bucket)) {
        if (endpointParams.ForcePathStyle === true) {
            throw new Error("Path-style addressing cannot be used with ARN buckets");
        }
    } else if (!isDnsCompatibleBucketName(bucket) || bucket.indexOf(".") !== -1 && !String(endpointParams.Endpoint).startsWith("http:") || bucket.toLowerCase() !== bucket || bucket.length < 3) {
        endpointParams.ForcePathStyle = true;
    }
    if (endpointParams.DisableMultiRegionAccessPoints) {
        endpointParams.disableMultiRegionAccessPoints = true;
        endpointParams.DisableMRAP = true;
    }
    return endpointParams;
};
const DOMAIN_PATTERN = /^[a-z0-9][a-z0-9\.\-]{1,61}[a-z0-9]$/;
const IP_ADDRESS_PATTERN = /(\d+\.){3}\d+/;
const DOTS_PATTERN = /\.\./;
const DOT_PATTERN = /\./;
const S3_HOSTNAME_PATTERN = /^(.+\.)?s3(-fips)?(\.dualstack)?[.-]([a-z0-9-]+)\./;
const isDnsCompatibleBucketName = (bucketName)=>DOMAIN_PATTERN.test(bucketName) && !IP_ADDRESS_PATTERN.test(bucketName) && !DOTS_PATTERN.test(bucketName);
const isArnBucketName = (bucketName)=>{
    const [arn, partition, service, , , bucket] = bucketName.split(":");
    const isArn = arn === "arn" && bucketName.split(":").length >= 6;
    const isValidArn = Boolean(isArn && partition && service && bucket);
    if (isArn && !isValidArn) {
        throw new Error(`Invalid ARN: ${bucketName} was an invalid ARN.`);
    }
    return isValidArn;
};
}),
"[project]/path/path-web/node_modules/@smithy/middleware-endpoint/dist-es/adaptors/createConfigValueProvider.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createConfigValueProvider",
    ()=>createConfigValueProvider
]);
const createConfigValueProvider = (configKey, canonicalEndpointParamKey, config, isClientContextParam = false)=>{
    const configProvider = async ()=>{
        let configValue;
        if (isClientContextParam) {
            const clientContextParams = config.clientContextParams;
            const nestedValue = clientContextParams?.[configKey];
            configValue = nestedValue ?? config[configKey] ?? config[canonicalEndpointParamKey];
        } else {
            configValue = config[configKey] ?? config[canonicalEndpointParamKey];
        }
        if (typeof configValue === "function") {
            return configValue();
        }
        return configValue;
    };
    if (configKey === "credentialScope" || canonicalEndpointParamKey === "CredentialScope") {
        return async ()=>{
            const credentials = typeof config.credentials === "function" ? await config.credentials() : config.credentials;
            const configValue = credentials?.credentialScope ?? credentials?.CredentialScope;
            return configValue;
        };
    }
    if (configKey === "accountId" || canonicalEndpointParamKey === "AccountId") {
        return async ()=>{
            const credentials = typeof config.credentials === "function" ? await config.credentials() : config.credentials;
            const configValue = credentials?.accountId ?? credentials?.AccountId;
            return configValue;
        };
    }
    if (configKey === "endpoint" || canonicalEndpointParamKey === "endpoint") {
        return async ()=>{
            if (config.isCustomEndpoint === false) {
                return undefined;
            }
            const endpoint = await configProvider();
            if (endpoint && typeof endpoint === "object") {
                if ("url" in endpoint) {
                    return endpoint.url.href;
                }
                if ("hostname" in endpoint) {
                    const { protocol, hostname, port, path } = endpoint;
                    return `${protocol}//${hostname}${port ? ":" + port : ""}${path}`;
                }
            }
            return endpoint;
        };
    }
    return configProvider;
};
}),
"[project]/path/path-web/node_modules/@smithy/middleware-endpoint/dist-es/adaptors/getEndpointFromInstructions.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getEndpointFromInstructions",
    ()=>getEndpointFromInstructions,
    "resolveParams",
    ()=>resolveParams
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$endpoint$2f$dist$2d$es$2f$service$2d$customizations$2f$s3$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/middleware-endpoint/dist-es/service-customizations/s3.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$endpoint$2f$dist$2d$es$2f$adaptors$2f$createConfigValueProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/middleware-endpoint/dist-es/adaptors/createConfigValueProvider.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$endpoint$2f$dist$2d$es$2f$adaptors$2f$getEndpointFromConfig$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/middleware-endpoint/dist-es/adaptors/getEndpointFromConfig.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$endpoint$2f$dist$2d$es$2f$adaptors$2f$toEndpointV1$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/middleware-endpoint/dist-es/adaptors/toEndpointV1.js [app-route] (ecmascript)");
;
;
;
;
const getEndpointFromInstructions = async (commandInput, instructionsSupplier, clientConfig, context)=>{
    if (!clientConfig.isCustomEndpoint) {
        let endpointFromConfig;
        if (clientConfig.serviceConfiguredEndpoint) {
            endpointFromConfig = await clientConfig.serviceConfiguredEndpoint();
        } else {
            endpointFromConfig = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$endpoint$2f$dist$2d$es$2f$adaptors$2f$getEndpointFromConfig$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getEndpointFromConfig"])(clientConfig.serviceId);
        }
        if (endpointFromConfig) {
            clientConfig.endpoint = ()=>Promise.resolve((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$endpoint$2f$dist$2d$es$2f$adaptors$2f$toEndpointV1$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toEndpointV1"])(endpointFromConfig));
            clientConfig.isCustomEndpoint = true;
        }
    }
    const endpointParams = await resolveParams(commandInput, instructionsSupplier, clientConfig);
    if (typeof clientConfig.endpointProvider !== "function") {
        throw new Error("config.endpointProvider is not set.");
    }
    const endpoint = clientConfig.endpointProvider(endpointParams, context);
    return endpoint;
};
const resolveParams = async (commandInput, instructionsSupplier, clientConfig)=>{
    const endpointParams = {};
    const instructions = instructionsSupplier?.getEndpointParameterInstructions?.() || {};
    for (const [name, instruction] of Object.entries(instructions)){
        switch(instruction.type){
            case "staticContextParams":
                endpointParams[name] = instruction.value;
                break;
            case "contextParams":
                endpointParams[name] = commandInput[instruction.name];
                break;
            case "clientContextParams":
            case "builtInParams":
                endpointParams[name] = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$endpoint$2f$dist$2d$es$2f$adaptors$2f$createConfigValueProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createConfigValueProvider"])(instruction.name, name, clientConfig, instruction.type !== "builtInParams")();
                break;
            case "operationContextParams":
                endpointParams[name] = instruction.get(commandInput);
                break;
            default:
                throw new Error("Unrecognized endpoint parameter instruction: " + JSON.stringify(instruction));
        }
    }
    if (Object.keys(instructions).length === 0) {
        Object.assign(endpointParams, clientConfig);
    }
    if (String(clientConfig.serviceId).toLowerCase() === "s3") {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$endpoint$2f$dist$2d$es$2f$service$2d$customizations$2f$s3$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveParamsForS3"])(endpointParams);
    }
    return endpointParams;
};
}),
"[project]/path/path-web/node_modules/@smithy/middleware-endpoint/dist-es/endpointMiddleware.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "endpointMiddleware",
    ()=>endpointMiddleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$setFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/setFeature.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$middleware$2f$dist$2d$es$2f$getSmithyContext$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-middleware/dist-es/getSmithyContext.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$endpoint$2f$dist$2d$es$2f$adaptors$2f$getEndpointFromInstructions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/middleware-endpoint/dist-es/adaptors/getEndpointFromInstructions.js [app-route] (ecmascript)");
;
;
;
const endpointMiddleware = ({ config, instructions })=>{
    return (next, context)=>async (args)=>{
            if (config.isCustomEndpoint) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$setFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setFeature"])(context, "ENDPOINT_OVERRIDE", "N");
            }
            const endpoint = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$endpoint$2f$dist$2d$es$2f$adaptors$2f$getEndpointFromInstructions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getEndpointFromInstructions"])(args.input, {
                getEndpointParameterInstructions () {
                    return instructions;
                }
            }, {
                ...config
            }, context);
            context.endpointV2 = endpoint;
            context.authSchemes = endpoint.properties?.authSchemes;
            const authScheme = context.authSchemes?.[0];
            if (authScheme) {
                context["signing_region"] = authScheme.signingRegion;
                context["signing_service"] = authScheme.signingName;
                const smithyContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$middleware$2f$dist$2d$es$2f$getSmithyContext$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSmithyContext"])(context);
                const httpAuthOption = smithyContext?.selectedHttpAuthScheme?.httpAuthOption;
                if (httpAuthOption) {
                    httpAuthOption.signingProperties = Object.assign(httpAuthOption.signingProperties || {}, {
                        signing_region: authScheme.signingRegion,
                        signingRegion: authScheme.signingRegion,
                        signing_service: authScheme.signingName,
                        signingName: authScheme.signingName,
                        signingRegionSet: authScheme.signingRegionSet
                    }, authScheme.properties);
                }
            }
            return next({
                ...args
            });
        };
};
}),
"[project]/path/path-web/node_modules/@smithy/middleware-endpoint/dist-es/getEndpointPlugin.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "endpointMiddlewareOptions",
    ()=>endpointMiddlewareOptions,
    "getEndpointPlugin",
    ()=>getEndpointPlugin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$serde$2f$dist$2d$es$2f$serdePlugin$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/middleware-serde/dist-es/serdePlugin.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$endpoint$2f$dist$2d$es$2f$endpointMiddleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/middleware-endpoint/dist-es/endpointMiddleware.js [app-route] (ecmascript)");
;
;
const endpointMiddlewareOptions = {
    step: "serialize",
    tags: [
        "ENDPOINT_PARAMETERS",
        "ENDPOINT_V2",
        "ENDPOINT"
    ],
    name: "endpointV2Middleware",
    override: true,
    relation: "before",
    toMiddleware: __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$serde$2f$dist$2d$es$2f$serdePlugin$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["serializerMiddlewareOption"].name
};
const getEndpointPlugin = (config, instructions)=>({
        applyToStack: (clientStack)=>{
            clientStack.addRelativeTo((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$endpoint$2f$dist$2d$es$2f$endpointMiddleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["endpointMiddleware"])({
                config,
                instructions
            }), endpointMiddlewareOptions);
        }
    });
}),
"[project]/path/path-web/node_modules/@smithy/service-error-classification/dist-es/constants.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CLOCK_SKEW_ERROR_CODES",
    ()=>CLOCK_SKEW_ERROR_CODES,
    "NODEJS_NETWORK_ERROR_CODES",
    ()=>NODEJS_NETWORK_ERROR_CODES,
    "NODEJS_TIMEOUT_ERROR_CODES",
    ()=>NODEJS_TIMEOUT_ERROR_CODES,
    "THROTTLING_ERROR_CODES",
    ()=>THROTTLING_ERROR_CODES,
    "TRANSIENT_ERROR_CODES",
    ()=>TRANSIENT_ERROR_CODES,
    "TRANSIENT_ERROR_STATUS_CODES",
    ()=>TRANSIENT_ERROR_STATUS_CODES
]);
const CLOCK_SKEW_ERROR_CODES = [
    "AuthFailure",
    "InvalidSignatureException",
    "RequestExpired",
    "RequestInTheFuture",
    "RequestTimeTooSkewed",
    "SignatureDoesNotMatch"
];
const THROTTLING_ERROR_CODES = [
    "BandwidthLimitExceeded",
    "EC2ThrottledException",
    "LimitExceededException",
    "PriorRequestNotComplete",
    "ProvisionedThroughputExceededException",
    "RequestLimitExceeded",
    "RequestThrottled",
    "RequestThrottledException",
    "SlowDown",
    "ThrottledException",
    "Throttling",
    "ThrottlingException",
    "TooManyRequestsException",
    "TransactionInProgressException"
];
const TRANSIENT_ERROR_CODES = [
    "TimeoutError",
    "RequestTimeout",
    "RequestTimeoutException"
];
const TRANSIENT_ERROR_STATUS_CODES = [
    500,
    502,
    503,
    504
];
const NODEJS_TIMEOUT_ERROR_CODES = [
    "ECONNRESET",
    "ECONNREFUSED",
    "EPIPE",
    "ETIMEDOUT"
];
const NODEJS_NETWORK_ERROR_CODES = [
    "EHOSTUNREACH",
    "ENETUNREACH",
    "ENOTFOUND"
];
}),
"[project]/path/path-web/node_modules/@smithy/service-error-classification/dist-es/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isBrowserNetworkError",
    ()=>isBrowserNetworkError,
    "isClockSkewCorrectedError",
    ()=>isClockSkewCorrectedError,
    "isClockSkewError",
    ()=>isClockSkewError,
    "isRetryableByTrait",
    ()=>isRetryableByTrait,
    "isServerError",
    ()=>isServerError,
    "isThrottlingError",
    ()=>isThrottlingError,
    "isTransientError",
    ()=>isTransientError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$service$2d$error$2d$classification$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/service-error-classification/dist-es/constants.js [app-route] (ecmascript)");
;
const isRetryableByTrait = (error)=>error?.$retryable !== undefined;
const isClockSkewError = (error)=>__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$service$2d$error$2d$classification$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CLOCK_SKEW_ERROR_CODES"].includes(error.name);
const isClockSkewCorrectedError = (error)=>error.$metadata?.clockSkewCorrected;
const isBrowserNetworkError = (error)=>{
    const errorMessages = new Set([
        "Failed to fetch",
        "NetworkError when attempting to fetch resource",
        "The Internet connection appears to be offline",
        "Load failed",
        "Network request failed"
    ]);
    const isValid = error && error instanceof TypeError;
    if (!isValid) {
        return false;
    }
    return errorMessages.has(error.message);
};
const isThrottlingError = (error)=>error.$metadata?.httpStatusCode === 429 || __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$service$2d$error$2d$classification$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["THROTTLING_ERROR_CODES"].includes(error.name) || error.$retryable?.throttling == true;
const isTransientError = (error, depth = 0)=>isRetryableByTrait(error) || isClockSkewCorrectedError(error) || __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$service$2d$error$2d$classification$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRANSIENT_ERROR_CODES"].includes(error.name) || __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$service$2d$error$2d$classification$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NODEJS_TIMEOUT_ERROR_CODES"].includes(error?.code || "") || __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$service$2d$error$2d$classification$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NODEJS_NETWORK_ERROR_CODES"].includes(error?.code || "") || __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$service$2d$error$2d$classification$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TRANSIENT_ERROR_STATUS_CODES"].includes(error.$metadata?.httpStatusCode || 0) || isBrowserNetworkError(error) || error.cause !== undefined && depth <= 10 && isTransientError(error.cause, depth + 1);
const isServerError = (error)=>{
    if (error.$metadata?.httpStatusCode !== undefined) {
        const statusCode = error.$metadata.httpStatusCode;
        if (500 <= statusCode && statusCode <= 599 && !isTransientError(error)) {
            return true;
        }
        return false;
    }
    return false;
};
}),
"[project]/path/path-web/node_modules/@smithy/smithy-client/dist-es/NoOpLogger.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NoOpLogger",
    ()=>NoOpLogger
]);
class NoOpLogger {
    trace() {}
    debug() {}
    info() {}
    warn() {}
    error() {}
}
}),
"[project]/path/path-web/node_modules/@smithy/smithy-client/dist-es/client.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Client",
    ()=>Client
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$stack$2f$dist$2d$es$2f$MiddlewareStack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/middleware-stack/dist-es/MiddlewareStack.js [app-route] (ecmascript)");
;
class Client {
    config;
    middlewareStack = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$stack$2f$dist$2d$es$2f$MiddlewareStack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["constructStack"])();
    initConfig;
    handlers;
    constructor(config){
        this.config = config;
        const { protocol, protocolSettings } = config;
        if (protocolSettings) {
            if (typeof protocol === "function") {
                config.protocol = new protocol(protocolSettings);
            }
        }
    }
    send(command, optionsOrCb, cb) {
        const options = typeof optionsOrCb !== "function" ? optionsOrCb : undefined;
        const callback = typeof optionsOrCb === "function" ? optionsOrCb : cb;
        const useHandlerCache = options === undefined && this.config.cacheMiddleware === true;
        let handler;
        if (useHandlerCache) {
            if (!this.handlers) {
                this.handlers = new WeakMap();
            }
            const handlers = this.handlers;
            if (handlers.has(command.constructor)) {
                handler = handlers.get(command.constructor);
            } else {
                handler = command.resolveMiddleware(this.middlewareStack, this.config, options);
                handlers.set(command.constructor, handler);
            }
        } else {
            delete this.handlers;
            handler = command.resolveMiddleware(this.middlewareStack, this.config, options);
        }
        if (callback) {
            handler(command).then((result)=>callback(null, result.output), (err)=>callback(err)).catch(()=>{});
        } else {
            return handler(command).then((result)=>result.output);
        }
    }
    destroy() {
        this.config?.requestHandler?.destroy?.();
        delete this.handlers;
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/smithy-client/dist-es/emitWarningIfUnsupportedVersion.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "emitWarningIfUnsupportedVersion",
    ()=>emitWarningIfUnsupportedVersion
]);
let warningEmitted = false;
const emitWarningIfUnsupportedVersion = (version)=>{
    if (version && !warningEmitted && parseInt(version.substring(1, version.indexOf("."))) < 16) {
        warningEmitted = true;
    }
};
}),
"[project]/path/path-web/node_modules/@smithy/smithy-client/dist-es/defaults-mode.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "loadConfigsForDefaultMode",
    ()=>loadConfigsForDefaultMode
]);
const loadConfigsForDefaultMode = (mode)=>{
    switch(mode){
        case "standard":
            return {
                retryMode: "standard",
                connectionTimeout: 3100
            };
        case "in-region":
            return {
                retryMode: "standard",
                connectionTimeout: 1100
            };
        case "cross-region":
            return {
                retryMode: "standard",
                connectionTimeout: 3100
            };
        case "mobile":
            return {
                retryMode: "standard",
                connectionTimeout: 30000
            };
        default:
            return {};
    }
};
}),
"[project]/path/path-web/node_modules/@smithy/smithy-client/dist-es/exceptions.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ServiceException",
    ()=>ServiceException,
    "decorateServiceException",
    ()=>decorateServiceException
]);
class ServiceException extends Error {
    $fault;
    $response;
    $retryable;
    $metadata;
    constructor(options){
        super(options.message);
        Object.setPrototypeOf(this, Object.getPrototypeOf(this).constructor.prototype);
        this.name = options.name;
        this.$fault = options.$fault;
        this.$metadata = options.$metadata;
    }
    static isInstance(value) {
        if (!value) return false;
        const candidate = value;
        return ServiceException.prototype.isPrototypeOf(candidate) || Boolean(candidate.$fault) && Boolean(candidate.$metadata) && (candidate.$fault === "client" || candidate.$fault === "server");
    }
    static [Symbol.hasInstance](instance) {
        if (!instance) return false;
        const candidate = instance;
        if (this === ServiceException) {
            return ServiceException.isInstance(instance);
        }
        if (ServiceException.isInstance(instance)) {
            if (candidate.name && this.name) {
                return this.prototype.isPrototypeOf(instance) || candidate.name === this.name;
            }
            return this.prototype.isPrototypeOf(instance);
        }
        return false;
    }
}
const decorateServiceException = (exception, additions = {})=>{
    Object.entries(additions).filter(([, v])=>v !== undefined).forEach(([k, v])=>{
        if (exception[k] == undefined || exception[k] === "") {
            exception[k] = v;
        }
    });
    const message = exception.message || exception.Message || "UnknownError";
    exception.message = message;
    delete exception.Message;
    return exception;
};
}),
"[project]/path/path-web/node_modules/@smithy/smithy-client/dist-es/extensions/checksum.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getChecksumConfiguration",
    ()=>getChecksumConfiguration,
    "resolveChecksumRuntimeConfig",
    ()=>resolveChecksumRuntimeConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$extensions$2f$checksum$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/types/dist-es/extensions/checksum.js [app-route] (ecmascript)");
;
;
const getChecksumConfiguration = (runtimeConfig)=>{
    const checksumAlgorithms = [];
    for(const id in __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$extensions$2f$checksum$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlgorithmId"]){
        const algorithmId = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$extensions$2f$checksum$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AlgorithmId"][id];
        if (runtimeConfig[algorithmId] === undefined) {
            continue;
        }
        checksumAlgorithms.push({
            algorithmId: ()=>algorithmId,
            checksumConstructor: ()=>runtimeConfig[algorithmId]
        });
    }
    return {
        addChecksumAlgorithm (algo) {
            checksumAlgorithms.push(algo);
        },
        checksumAlgorithms () {
            return checksumAlgorithms;
        }
    };
};
const resolveChecksumRuntimeConfig = (clientConfig)=>{
    const runtimeConfig = {};
    clientConfig.checksumAlgorithms().forEach((checksumAlgorithm)=>{
        runtimeConfig[checksumAlgorithm.algorithmId()] = checksumAlgorithm.checksumConstructor();
    });
    return runtimeConfig;
};
}),
"[project]/path/path-web/node_modules/@smithy/smithy-client/dist-es/extensions/retry.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getRetryConfiguration",
    ()=>getRetryConfiguration,
    "resolveRetryRuntimeConfig",
    ()=>resolveRetryRuntimeConfig
]);
const getRetryConfiguration = (runtimeConfig)=>{
    return {
        setRetryStrategy (retryStrategy) {
            runtimeConfig.retryStrategy = retryStrategy;
        },
        retryStrategy () {
            return runtimeConfig.retryStrategy;
        }
    };
};
const resolveRetryRuntimeConfig = (retryStrategyConfiguration)=>{
    const runtimeConfig = {};
    runtimeConfig.retryStrategy = retryStrategyConfiguration.retryStrategy();
    return runtimeConfig;
};
}),
"[project]/path/path-web/node_modules/@smithy/smithy-client/dist-es/extensions/defaultExtensionConfiguration.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getDefaultClientConfiguration",
    ()=>getDefaultClientConfiguration,
    "getDefaultExtensionConfiguration",
    ()=>getDefaultExtensionConfiguration,
    "resolveDefaultRuntimeConfig",
    ()=>resolveDefaultRuntimeConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$smithy$2d$client$2f$dist$2d$es$2f$extensions$2f$checksum$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/smithy-client/dist-es/extensions/checksum.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$smithy$2d$client$2f$dist$2d$es$2f$extensions$2f$retry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/smithy-client/dist-es/extensions/retry.js [app-route] (ecmascript)");
;
;
const getDefaultExtensionConfiguration = (runtimeConfig)=>{
    return Object.assign((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$smithy$2d$client$2f$dist$2d$es$2f$extensions$2f$checksum$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getChecksumConfiguration"])(runtimeConfig), (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$smithy$2d$client$2f$dist$2d$es$2f$extensions$2f$retry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getRetryConfiguration"])(runtimeConfig));
};
const getDefaultClientConfiguration = getDefaultExtensionConfiguration;
const resolveDefaultRuntimeConfig = (config)=>{
    return Object.assign((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$smithy$2d$client$2f$dist$2d$es$2f$extensions$2f$checksum$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["resolveChecksumRuntimeConfig"])(config), (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$smithy$2d$client$2f$dist$2d$es$2f$extensions$2f$retry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveRetryRuntimeConfig"])(config));
};
}),
"[project]/path/path-web/node_modules/@smithy/smithy-client/dist-es/schemaLogFilter.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "schemaLogFilter",
    ()=>schemaLogFilter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$schemas$2f$NormalizedSchema$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/core/dist-es/submodules/schema/schemas/NormalizedSchema.js [app-route] (ecmascript)");
;
const SENSITIVE_STRING = "***SensitiveInformation***";
function schemaLogFilter(schema, data) {
    if (data == null) {
        return data;
    }
    const ns = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$schema$2f$schemas$2f$NormalizedSchema$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NormalizedSchema"].of(schema);
    if (ns.getMergedTraits().sensitive) {
        return SENSITIVE_STRING;
    }
    if (ns.isListSchema()) {
        const isSensitive = !!ns.getValueSchema().getMergedTraits().sensitive;
        if (isSensitive) {
            return SENSITIVE_STRING;
        }
    } else if (ns.isMapSchema()) {
        const isSensitive = !!ns.getKeySchema().getMergedTraits().sensitive || !!ns.getValueSchema().getMergedTraits().sensitive;
        if (isSensitive) {
            return SENSITIVE_STRING;
        }
    } else if (ns.isStructSchema() && typeof data === "object") {
        const object = data;
        const newObject = {};
        for (const [member, memberNs] of ns.structIterator()){
            if (object[member] != null) {
                newObject[member] = schemaLogFilter(memberNs, object[member]);
            }
        }
        return newObject;
    }
    return data;
}
}),
"[project]/path/path-web/node_modules/@smithy/smithy-client/dist-es/command.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Command",
    ()=>Command
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$stack$2f$dist$2d$es$2f$MiddlewareStack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/middleware-stack/dist-es/MiddlewareStack.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$middleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/types/dist-es/middleware.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$smithy$2d$client$2f$dist$2d$es$2f$schemaLogFilter$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/smithy-client/dist-es/schemaLogFilter.js [app-route] (ecmascript)");
;
;
;
class Command {
    middlewareStack = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$stack$2f$dist$2d$es$2f$MiddlewareStack$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["constructStack"])();
    schema;
    static classBuilder() {
        return new ClassBuilder();
    }
    resolveMiddlewareWithContext(clientStack, configuration, options, { middlewareFn, clientName, commandName, inputFilterSensitiveLog, outputFilterSensitiveLog, smithyContext, additionalContext, CommandCtor }) {
        for (const mw of middlewareFn.bind(this)(CommandCtor, clientStack, configuration, options)){
            this.middlewareStack.use(mw);
        }
        const stack = clientStack.concat(this.middlewareStack);
        const { logger } = configuration;
        const handlerExecutionContext = {
            logger,
            clientName,
            commandName,
            inputFilterSensitiveLog,
            outputFilterSensitiveLog,
            [__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$middleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SMITHY_CONTEXT_KEY"]]: {
                commandInstance: this,
                ...smithyContext
            },
            ...additionalContext
        };
        const { requestHandler } = configuration;
        return stack.resolve((request)=>requestHandler.handle(request.request, options || {}), handlerExecutionContext);
    }
}
class ClassBuilder {
    _init = ()=>{};
    _ep = {};
    _middlewareFn = ()=>[];
    _commandName = "";
    _clientName = "";
    _additionalContext = {};
    _smithyContext = {};
    _inputFilterSensitiveLog = undefined;
    _outputFilterSensitiveLog = undefined;
    _serializer = null;
    _deserializer = null;
    _operationSchema;
    init(cb) {
        this._init = cb;
    }
    ep(endpointParameterInstructions) {
        this._ep = endpointParameterInstructions;
        return this;
    }
    m(middlewareSupplier) {
        this._middlewareFn = middlewareSupplier;
        return this;
    }
    s(service, operation, smithyContext = {}) {
        this._smithyContext = {
            service,
            operation,
            ...smithyContext
        };
        return this;
    }
    c(additionalContext = {}) {
        this._additionalContext = additionalContext;
        return this;
    }
    n(clientName, commandName) {
        this._clientName = clientName;
        this._commandName = commandName;
        return this;
    }
    f(inputFilter = (_)=>_, outputFilter = (_)=>_) {
        this._inputFilterSensitiveLog = inputFilter;
        this._outputFilterSensitiveLog = outputFilter;
        return this;
    }
    ser(serializer) {
        this._serializer = serializer;
        return this;
    }
    de(deserializer) {
        this._deserializer = deserializer;
        return this;
    }
    sc(operation) {
        this._operationSchema = operation;
        this._smithyContext.operationSchema = operation;
        return this;
    }
    build() {
        const closure = this;
        let CommandRef;
        return CommandRef = class extends Command {
            input;
            static getEndpointParameterInstructions() {
                return closure._ep;
            }
            constructor(...[input]){
                super();
                this.input = input ?? {};
                closure._init(this);
                this.schema = closure._operationSchema;
            }
            resolveMiddleware(stack, configuration, options) {
                const op = closure._operationSchema;
                const input = op?.[4] ?? op?.input;
                const output = op?.[5] ?? op?.output;
                return this.resolveMiddlewareWithContext(stack, configuration, options, {
                    CommandCtor: CommandRef,
                    middlewareFn: closure._middlewareFn,
                    clientName: closure._clientName,
                    commandName: closure._commandName,
                    inputFilterSensitiveLog: closure._inputFilterSensitiveLog ?? (op ? __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$smithy$2d$client$2f$dist$2d$es$2f$schemaLogFilter$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["schemaLogFilter"].bind(null, input) : (_)=>_),
                    outputFilterSensitiveLog: closure._outputFilterSensitiveLog ?? (op ? __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$smithy$2d$client$2f$dist$2d$es$2f$schemaLogFilter$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["schemaLogFilter"].bind(null, output) : (_)=>_),
                    smithyContext: closure._smithyContext,
                    additionalContext: closure._additionalContext
                });
            }
            serialize = closure._serializer;
            deserialize = closure._deserializer;
        };
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/constants.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_RETRY_DELAY_BASE",
    ()=>DEFAULT_RETRY_DELAY_BASE,
    "INITIAL_RETRY_TOKENS",
    ()=>INITIAL_RETRY_TOKENS,
    "INVOCATION_ID_HEADER",
    ()=>INVOCATION_ID_HEADER,
    "MAXIMUM_RETRY_DELAY",
    ()=>MAXIMUM_RETRY_DELAY,
    "NO_RETRY_INCREMENT",
    ()=>NO_RETRY_INCREMENT,
    "REQUEST_HEADER",
    ()=>REQUEST_HEADER,
    "RETRY_COST",
    ()=>RETRY_COST,
    "THROTTLING_RETRY_DELAY_BASE",
    ()=>THROTTLING_RETRY_DELAY_BASE,
    "TIMEOUT_RETRY_COST",
    ()=>TIMEOUT_RETRY_COST
]);
const DEFAULT_RETRY_DELAY_BASE = 100;
const MAXIMUM_RETRY_DELAY = 20 * 1000;
const THROTTLING_RETRY_DELAY_BASE = 500;
const INITIAL_RETRY_TOKENS = 500;
const RETRY_COST = 5;
const TIMEOUT_RETRY_COST = 10;
const NO_RETRY_INCREMENT = 1;
const INVOCATION_ID_HEADER = "amz-sdk-invocation-id";
const REQUEST_HEADER = "amz-sdk-request";
}),
"[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/config.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_MAX_ATTEMPTS",
    ()=>DEFAULT_MAX_ATTEMPTS,
    "DEFAULT_RETRY_MODE",
    ()=>DEFAULT_RETRY_MODE,
    "RETRY_MODES",
    ()=>RETRY_MODES
]);
var RETRY_MODES;
(function(RETRY_MODES) {
    RETRY_MODES["STANDARD"] = "standard";
    RETRY_MODES["ADAPTIVE"] = "adaptive";
})(RETRY_MODES || (RETRY_MODES = {}));
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_MODE = RETRY_MODES.STANDARD;
}),
"[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/DefaultRateLimiter.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DefaultRateLimiter",
    ()=>DefaultRateLimiter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$service$2d$error$2d$classification$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/service-error-classification/dist-es/index.js [app-route] (ecmascript)");
;
class DefaultRateLimiter {
    static setTimeoutFn = setTimeout;
    beta;
    minCapacity;
    minFillRate;
    scaleConstant;
    smooth;
    currentCapacity = 0;
    enabled = false;
    lastMaxRate = 0;
    measuredTxRate = 0;
    requestCount = 0;
    fillRate;
    lastThrottleTime;
    lastTimestamp = 0;
    lastTxRateBucket;
    maxCapacity;
    timeWindow = 0;
    constructor(options){
        this.beta = options?.beta ?? 0.7;
        this.minCapacity = options?.minCapacity ?? 1;
        this.minFillRate = options?.minFillRate ?? 0.5;
        this.scaleConstant = options?.scaleConstant ?? 0.4;
        this.smooth = options?.smooth ?? 0.8;
        const currentTimeInSeconds = this.getCurrentTimeInSeconds();
        this.lastThrottleTime = currentTimeInSeconds;
        this.lastTxRateBucket = Math.floor(this.getCurrentTimeInSeconds());
        this.fillRate = this.minFillRate;
        this.maxCapacity = this.minCapacity;
    }
    getCurrentTimeInSeconds() {
        return Date.now() / 1000;
    }
    async getSendToken() {
        return this.acquireTokenBucket(1);
    }
    async acquireTokenBucket(amount) {
        if (!this.enabled) {
            return;
        }
        this.refillTokenBucket();
        if (amount > this.currentCapacity) {
            const delay = (amount - this.currentCapacity) / this.fillRate * 1000;
            await new Promise((resolve)=>DefaultRateLimiter.setTimeoutFn(resolve, delay));
        }
        this.currentCapacity = this.currentCapacity - amount;
    }
    refillTokenBucket() {
        const timestamp = this.getCurrentTimeInSeconds();
        if (!this.lastTimestamp) {
            this.lastTimestamp = timestamp;
            return;
        }
        const fillAmount = (timestamp - this.lastTimestamp) * this.fillRate;
        this.currentCapacity = Math.min(this.maxCapacity, this.currentCapacity + fillAmount);
        this.lastTimestamp = timestamp;
    }
    updateClientSendingRate(response) {
        let calculatedRate;
        this.updateMeasuredRate();
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$service$2d$error$2d$classification$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isThrottlingError"])(response)) {
            const rateToUse = !this.enabled ? this.measuredTxRate : Math.min(this.measuredTxRate, this.fillRate);
            this.lastMaxRate = rateToUse;
            this.calculateTimeWindow();
            this.lastThrottleTime = this.getCurrentTimeInSeconds();
            calculatedRate = this.cubicThrottle(rateToUse);
            this.enableTokenBucket();
        } else {
            this.calculateTimeWindow();
            calculatedRate = this.cubicSuccess(this.getCurrentTimeInSeconds());
        }
        const newRate = Math.min(calculatedRate, 2 * this.measuredTxRate);
        this.updateTokenBucketRate(newRate);
    }
    calculateTimeWindow() {
        this.timeWindow = this.getPrecise(Math.pow(this.lastMaxRate * (1 - this.beta) / this.scaleConstant, 1 / 3));
    }
    cubicThrottle(rateToUse) {
        return this.getPrecise(rateToUse * this.beta);
    }
    cubicSuccess(timestamp) {
        return this.getPrecise(this.scaleConstant * Math.pow(timestamp - this.lastThrottleTime - this.timeWindow, 3) + this.lastMaxRate);
    }
    enableTokenBucket() {
        this.enabled = true;
    }
    updateTokenBucketRate(newRate) {
        this.refillTokenBucket();
        this.fillRate = Math.max(newRate, this.minFillRate);
        this.maxCapacity = Math.max(newRate, this.minCapacity);
        this.currentCapacity = Math.min(this.currentCapacity, this.maxCapacity);
    }
    updateMeasuredRate() {
        const t = this.getCurrentTimeInSeconds();
        const timeBucket = Math.floor(t * 2) / 2;
        this.requestCount++;
        if (timeBucket > this.lastTxRateBucket) {
            const currentRate = this.requestCount / (timeBucket - this.lastTxRateBucket);
            this.measuredTxRate = this.getPrecise(currentRate * this.smooth + this.measuredTxRate * (1 - this.smooth));
            this.requestCount = 0;
            this.lastTxRateBucket = timeBucket;
        }
    }
    getPrecise(num) {
        return parseFloat(num.toFixed(8));
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/defaultRetryBackoffStrategy.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getDefaultRetryBackoffStrategy",
    ()=>getDefaultRetryBackoffStrategy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/constants.js [app-route] (ecmascript)");
;
const getDefaultRetryBackoffStrategy = ()=>{
    let delayBase = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DEFAULT_RETRY_DELAY_BASE"];
    const computeNextBackoffDelay = (attempts)=>{
        return Math.floor(Math.min(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MAXIMUM_RETRY_DELAY"], Math.random() * 2 ** attempts * delayBase));
    };
    const setDelayBase = (delay)=>{
        delayBase = delay;
    };
    return {
        computeNextBackoffDelay,
        setDelayBase
    };
};
}),
"[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/defaultRetryToken.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createDefaultRetryToken",
    ()=>createDefaultRetryToken
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/constants.js [app-route] (ecmascript)");
;
const createDefaultRetryToken = ({ retryDelay, retryCount, retryCost })=>{
    const getRetryCount = ()=>retryCount;
    const getRetryDelay = ()=>Math.min(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MAXIMUM_RETRY_DELAY"], retryDelay);
    const getRetryCost = ()=>retryCost;
    return {
        getRetryCount,
        getRetryDelay,
        getRetryCost
    };
};
}),
"[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/StandardRetryStrategy.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StandardRetryStrategy",
    ()=>StandardRetryStrategy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$config$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/config.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/constants.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$defaultRetryBackoffStrategy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/defaultRetryBackoffStrategy.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$defaultRetryToken$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/defaultRetryToken.js [app-route] (ecmascript)");
;
;
;
;
class StandardRetryStrategy {
    maxAttempts;
    mode = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$config$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RETRY_MODES"].STANDARD;
    capacity = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["INITIAL_RETRY_TOKENS"];
    retryBackoffStrategy = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$defaultRetryBackoffStrategy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getDefaultRetryBackoffStrategy"])();
    maxAttemptsProvider;
    constructor(maxAttempts){
        this.maxAttempts = maxAttempts;
        this.maxAttemptsProvider = typeof maxAttempts === "function" ? maxAttempts : async ()=>maxAttempts;
    }
    async acquireInitialRetryToken(retryTokenScope) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$defaultRetryToken$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createDefaultRetryToken"])({
            retryDelay: __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DEFAULT_RETRY_DELAY_BASE"],
            retryCount: 0
        });
    }
    async refreshRetryTokenForRetry(token, errorInfo) {
        const maxAttempts = await this.getMaxAttempts();
        if (this.shouldRetry(token, errorInfo, maxAttempts)) {
            const errorType = errorInfo.errorType;
            this.retryBackoffStrategy.setDelayBase(errorType === "THROTTLING" ? __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["THROTTLING_RETRY_DELAY_BASE"] : __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DEFAULT_RETRY_DELAY_BASE"]);
            const delayFromErrorType = this.retryBackoffStrategy.computeNextBackoffDelay(token.getRetryCount());
            const retryDelay = errorInfo.retryAfterHint ? Math.max(errorInfo.retryAfterHint.getTime() - Date.now() || 0, delayFromErrorType) : delayFromErrorType;
            const capacityCost = this.getCapacityCost(errorType);
            this.capacity -= capacityCost;
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$defaultRetryToken$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createDefaultRetryToken"])({
                retryDelay,
                retryCount: token.getRetryCount() + 1,
                retryCost: capacityCost
            });
        }
        throw new Error("No retry token available");
    }
    recordSuccess(token) {
        this.capacity = Math.max(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["INITIAL_RETRY_TOKENS"], this.capacity + (token.getRetryCost() ?? __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NO_RETRY_INCREMENT"]));
    }
    getCapacity() {
        return this.capacity;
    }
    async getMaxAttempts() {
        try {
            return await this.maxAttemptsProvider();
        } catch (error) {
            console.warn(`Max attempts provider could not resolve. Using default of ${__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$config$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DEFAULT_MAX_ATTEMPTS"]}`);
            return __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$config$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DEFAULT_MAX_ATTEMPTS"];
        }
    }
    shouldRetry(tokenToRenew, errorInfo, maxAttempts) {
        const attempts = tokenToRenew.getRetryCount() + 1;
        return attempts < maxAttempts && this.capacity >= this.getCapacityCost(errorInfo.errorType) && this.isRetryableError(errorInfo.errorType);
    }
    getCapacityCost(errorType) {
        return errorType === "TRANSIENT" ? __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TIMEOUT_RETRY_COST"] : __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RETRY_COST"];
    }
    isRetryableError(errorType) {
        return errorType === "THROTTLING" || errorType === "TRANSIENT";
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/AdaptiveRetryStrategy.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AdaptiveRetryStrategy",
    ()=>AdaptiveRetryStrategy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$config$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/config.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$DefaultRateLimiter$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/DefaultRateLimiter.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$StandardRetryStrategy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/StandardRetryStrategy.js [app-route] (ecmascript)");
;
;
;
class AdaptiveRetryStrategy {
    maxAttemptsProvider;
    rateLimiter;
    standardRetryStrategy;
    mode = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$config$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RETRY_MODES"].ADAPTIVE;
    constructor(maxAttemptsProvider, options){
        this.maxAttemptsProvider = maxAttemptsProvider;
        const { rateLimiter } = options ?? {};
        this.rateLimiter = rateLimiter ?? new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$DefaultRateLimiter$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DefaultRateLimiter"]();
        this.standardRetryStrategy = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$StandardRetryStrategy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["StandardRetryStrategy"](maxAttemptsProvider);
    }
    async acquireInitialRetryToken(retryTokenScope) {
        await this.rateLimiter.getSendToken();
        return this.standardRetryStrategy.acquireInitialRetryToken(retryTokenScope);
    }
    async refreshRetryTokenForRetry(tokenToRenew, errorInfo) {
        this.rateLimiter.updateClientSendingRate(errorInfo);
        return this.standardRetryStrategy.refreshRetryTokenForRetry(tokenToRenew, errorInfo);
    }
    recordSuccess(token) {
        this.rateLimiter.updateClientSendingRate({});
        this.standardRetryStrategy.recordSuccess(token);
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/uuid/dist-es/randomUUID.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "randomUUID",
    ()=>randomUUID
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
const randomUUID = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomUUID.bind(__TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"]);
}),
"[project]/path/path-web/node_modules/@smithy/uuid/dist-es/v4.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "v4",
    ()=>v4
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$uuid$2f$dist$2d$es$2f$randomUUID$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/uuid/dist-es/randomUUID.js [app-route] (ecmascript)");
;
const decimalToHex = Array.from({
    length: 256
}, (_, i)=>i.toString(16).padStart(2, "0"));
const v4 = ()=>{
    if (__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$uuid$2f$dist$2d$es$2f$randomUUID$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["randomUUID"]) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$uuid$2f$dist$2d$es$2f$randomUUID$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["randomUUID"])();
    }
    const rnds = new Uint8Array(16);
    crypto.getRandomValues(rnds);
    rnds[6] = rnds[6] & 0x0f | 0x40;
    rnds[8] = rnds[8] & 0x3f | 0x80;
    return decimalToHex[rnds[0]] + decimalToHex[rnds[1]] + decimalToHex[rnds[2]] + decimalToHex[rnds[3]] + "-" + decimalToHex[rnds[4]] + decimalToHex[rnds[5]] + "-" + decimalToHex[rnds[6]] + decimalToHex[rnds[7]] + "-" + decimalToHex[rnds[8]] + decimalToHex[rnds[9]] + "-" + decimalToHex[rnds[10]] + decimalToHex[rnds[11]] + decimalToHex[rnds[12]] + decimalToHex[rnds[13]] + decimalToHex[rnds[14]] + decimalToHex[rnds[15]];
};
}),
"[project]/path/path-web/node_modules/@smithy/uuid/dist-es/v4.js [app-route] (ecmascript) <export v4 as generateIdempotencyToken>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateIdempotencyToken",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$uuid$2f$dist$2d$es$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["v4"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$uuid$2f$dist$2d$es$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/uuid/dist-es/v4.js [app-route] (ecmascript)");
}),
"[project]/path/path-web/node_modules/@smithy/middleware-retry/dist-es/isStreamingPayload/isStreamingPayload.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isStreamingPayload",
    ()=>isStreamingPayload
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/stream [external] (stream, cjs)");
;
const isStreamingPayload = (request)=>request?.body instanceof __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__["Readable"] || typeof ReadableStream !== "undefined" && request?.body instanceof ReadableStream;
}),
"[project]/path/path-web/node_modules/@smithy/middleware-retry/dist-es/util.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "asSdkError",
    ()=>asSdkError
]);
const asSdkError = (error)=>{
    if (error instanceof Error) return error;
    if (error instanceof Object) return Object.assign(new Error(), error);
    if (typeof error === "string") return new Error(error);
    return new Error(`AWS SDK error wrapper for ${error}`);
};
}),
"[project]/path/path-web/node_modules/@smithy/middleware-retry/dist-es/retryMiddleware.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getRetryAfterHint",
    ()=>getRetryAfterHint,
    "getRetryPlugin",
    ()=>getRetryPlugin,
    "retryMiddleware",
    ()=>retryMiddleware,
    "retryMiddlewareOptions",
    ()=>retryMiddlewareOptions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/protocol-http/dist-es/httpRequest.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpResponse$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/protocol-http/dist-es/httpResponse.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$service$2d$error$2d$classification$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/service-error-classification/dist-es/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$smithy$2d$client$2f$dist$2d$es$2f$NoOpLogger$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/smithy-client/dist-es/NoOpLogger.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/constants.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$uuid$2f$dist$2d$es$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/uuid/dist-es/v4.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$retry$2f$dist$2d$es$2f$isStreamingPayload$2f$isStreamingPayload$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/middleware-retry/dist-es/isStreamingPayload/isStreamingPayload.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$retry$2f$dist$2d$es$2f$util$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/middleware-retry/dist-es/util.js [app-route] (ecmascript)");
;
;
;
;
;
;
;
const retryMiddleware = (options)=>(next, context)=>async (args)=>{
            let retryStrategy = await options.retryStrategy();
            const maxAttempts = await options.maxAttempts();
            if (isRetryStrategyV2(retryStrategy)) {
                retryStrategy = retryStrategy;
                let retryToken = await retryStrategy.acquireInitialRetryToken(context["partition_id"]);
                let lastError = new Error();
                let attempts = 0;
                let totalRetryDelay = 0;
                const { request } = args;
                const isRequest = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpRequest"].isInstance(request);
                if (isRequest) {
                    request.headers[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["INVOCATION_ID_HEADER"]] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$uuid$2f$dist$2d$es$2f$v4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["v4"])();
                }
                while(true){
                    try {
                        if (isRequest) {
                            request.headers[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REQUEST_HEADER"]] = `attempt=${attempts + 1}; max=${maxAttempts}`;
                        }
                        const { response, output } = await next(args);
                        retryStrategy.recordSuccess(retryToken);
                        output.$metadata.attempts = attempts + 1;
                        output.$metadata.totalRetryDelay = totalRetryDelay;
                        return {
                            response,
                            output
                        };
                    } catch (e) {
                        const retryErrorInfo = getRetryErrorInfo(e);
                        lastError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$retry$2f$dist$2d$es$2f$util$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["asSdkError"])(e);
                        if (isRequest && (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$retry$2f$dist$2d$es$2f$isStreamingPayload$2f$isStreamingPayload$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isStreamingPayload"])(request)) {
                            (context.logger instanceof __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$smithy$2d$client$2f$dist$2d$es$2f$NoOpLogger$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NoOpLogger"] ? console : context.logger)?.warn("An error was encountered in a non-retryable streaming request.");
                            throw lastError;
                        }
                        try {
                            retryToken = await retryStrategy.refreshRetryTokenForRetry(retryToken, retryErrorInfo);
                        } catch (refreshError) {
                            if (!lastError.$metadata) {
                                lastError.$metadata = {};
                            }
                            lastError.$metadata.attempts = attempts + 1;
                            lastError.$metadata.totalRetryDelay = totalRetryDelay;
                            throw lastError;
                        }
                        attempts = retryToken.getRetryCount();
                        const delay = retryToken.getRetryDelay();
                        totalRetryDelay += delay;
                        await new Promise((resolve)=>setTimeout(resolve, delay));
                    }
                }
            } else {
                retryStrategy = retryStrategy;
                if (retryStrategy?.mode) context.userAgent = [
                    ...context.userAgent || [],
                    [
                        "cfg/retry-mode",
                        retryStrategy.mode
                    ]
                ];
                return retryStrategy.retry(next, args);
            }
        };
const isRetryStrategyV2 = (retryStrategy)=>typeof retryStrategy.acquireInitialRetryToken !== "undefined" && typeof retryStrategy.refreshRetryTokenForRetry !== "undefined" && typeof retryStrategy.recordSuccess !== "undefined";
const getRetryErrorInfo = (error)=>{
    const errorInfo = {
        error,
        errorType: getRetryErrorType(error)
    };
    const retryAfterHint = getRetryAfterHint(error.$response);
    if (retryAfterHint) {
        errorInfo.retryAfterHint = retryAfterHint;
    }
    return errorInfo;
};
const getRetryErrorType = (error)=>{
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$service$2d$error$2d$classification$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isThrottlingError"])(error)) return "THROTTLING";
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$service$2d$error$2d$classification$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isTransientError"])(error)) return "TRANSIENT";
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$service$2d$error$2d$classification$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isServerError"])(error)) return "SERVER_ERROR";
    return "CLIENT_ERROR";
};
const retryMiddlewareOptions = {
    name: "retryMiddleware",
    tags: [
        "RETRY"
    ],
    step: "finalizeRequest",
    priority: "high",
    override: true
};
const getRetryPlugin = (options)=>({
        applyToStack: (clientStack)=>{
            clientStack.add(retryMiddleware(options), retryMiddlewareOptions);
        }
    });
const getRetryAfterHint = (response)=>{
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpResponse$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpResponse"].isInstance(response)) return;
    const retryAfterHeaderName = Object.keys(response.headers).find((key)=>key.toLowerCase() === "retry-after");
    if (!retryAfterHeaderName) return;
    const retryAfter = response.headers[retryAfterHeaderName];
    const retryAfterSeconds = Number(retryAfter);
    if (!Number.isNaN(retryAfterSeconds)) return new Date(retryAfterSeconds * 1000);
    const retryAfterDate = new Date(retryAfter);
    return retryAfterDate;
};
}),
"[project]/path/path-web/node_modules/@smithy/middleware-retry/dist-es/configurations.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CONFIG_MAX_ATTEMPTS",
    ()=>CONFIG_MAX_ATTEMPTS,
    "CONFIG_RETRY_MODE",
    ()=>CONFIG_RETRY_MODE,
    "ENV_MAX_ATTEMPTS",
    ()=>ENV_MAX_ATTEMPTS,
    "ENV_RETRY_MODE",
    ()=>ENV_RETRY_MODE,
    "NODE_MAX_ATTEMPT_CONFIG_OPTIONS",
    ()=>NODE_MAX_ATTEMPT_CONFIG_OPTIONS,
    "NODE_RETRY_MODE_CONFIG_OPTIONS",
    ()=>NODE_RETRY_MODE_CONFIG_OPTIONS,
    "resolveRetryConfig",
    ()=>resolveRetryConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$middleware$2f$dist$2d$es$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-middleware/dist-es/normalizeProvider.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$AdaptiveRetryStrategy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/AdaptiveRetryStrategy.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$config$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/config.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$StandardRetryStrategy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-retry/dist-es/StandardRetryStrategy.js [app-route] (ecmascript)");
;
;
const ENV_MAX_ATTEMPTS = "AWS_MAX_ATTEMPTS";
const CONFIG_MAX_ATTEMPTS = "max_attempts";
const NODE_MAX_ATTEMPT_CONFIG_OPTIONS = {
    environmentVariableSelector: (env)=>{
        const value = env[ENV_MAX_ATTEMPTS];
        if (!value) return undefined;
        const maxAttempt = parseInt(value);
        if (Number.isNaN(maxAttempt)) {
            throw new Error(`Environment variable ${ENV_MAX_ATTEMPTS} mast be a number, got "${value}"`);
        }
        return maxAttempt;
    },
    configFileSelector: (profile)=>{
        const value = profile[CONFIG_MAX_ATTEMPTS];
        if (!value) return undefined;
        const maxAttempt = parseInt(value);
        if (Number.isNaN(maxAttempt)) {
            throw new Error(`Shared config file entry ${CONFIG_MAX_ATTEMPTS} mast be a number, got "${value}"`);
        }
        return maxAttempt;
    },
    default: __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$config$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DEFAULT_MAX_ATTEMPTS"]
};
const resolveRetryConfig = (input)=>{
    const { retryStrategy, retryMode: _retryMode, maxAttempts: _maxAttempts } = input;
    const maxAttempts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$middleware$2f$dist$2d$es$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeProvider"])(_maxAttempts ?? __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$config$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DEFAULT_MAX_ATTEMPTS"]);
    return Object.assign(input, {
        maxAttempts,
        retryStrategy: async ()=>{
            if (retryStrategy) {
                return retryStrategy;
            }
            const retryMode = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$middleware$2f$dist$2d$es$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeProvider"])(_retryMode)();
            if (retryMode === __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$config$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RETRY_MODES"].ADAPTIVE) {
                return new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$AdaptiveRetryStrategy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AdaptiveRetryStrategy"](maxAttempts);
            }
            return new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$StandardRetryStrategy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["StandardRetryStrategy"](maxAttempts);
        }
    });
};
const ENV_RETRY_MODE = "AWS_RETRY_MODE";
const CONFIG_RETRY_MODE = "retry_mode";
const NODE_RETRY_MODE_CONFIG_OPTIONS = {
    environmentVariableSelector: (env)=>env[ENV_RETRY_MODE],
    configFileSelector: (profile)=>profile[CONFIG_RETRY_MODE],
    default: __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$retry$2f$dist$2d$es$2f$config$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DEFAULT_RETRY_MODE"]
};
}),
"[project]/path/path-web/node_modules/@smithy/middleware-stack/dist-es/MiddlewareStack.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "constructStack",
    ()=>constructStack
]);
const getAllAliases = (name, aliases)=>{
    const _aliases = [];
    if (name) {
        _aliases.push(name);
    }
    if (aliases) {
        for (const alias of aliases){
            _aliases.push(alias);
        }
    }
    return _aliases;
};
const getMiddlewareNameWithAliases = (name, aliases)=>{
    return `${name || "anonymous"}${aliases && aliases.length > 0 ? ` (a.k.a. ${aliases.join(",")})` : ""}`;
};
const constructStack = ()=>{
    let absoluteEntries = [];
    let relativeEntries = [];
    let identifyOnResolve = false;
    const entriesNameSet = new Set();
    const sort = (entries)=>entries.sort((a, b)=>stepWeights[b.step] - stepWeights[a.step] || priorityWeights[b.priority || "normal"] - priorityWeights[a.priority || "normal"]);
    const removeByName = (toRemove)=>{
        let isRemoved = false;
        const filterCb = (entry)=>{
            const aliases = getAllAliases(entry.name, entry.aliases);
            if (aliases.includes(toRemove)) {
                isRemoved = true;
                for (const alias of aliases){
                    entriesNameSet.delete(alias);
                }
                return false;
            }
            return true;
        };
        absoluteEntries = absoluteEntries.filter(filterCb);
        relativeEntries = relativeEntries.filter(filterCb);
        return isRemoved;
    };
    const removeByReference = (toRemove)=>{
        let isRemoved = false;
        const filterCb = (entry)=>{
            if (entry.middleware === toRemove) {
                isRemoved = true;
                for (const alias of getAllAliases(entry.name, entry.aliases)){
                    entriesNameSet.delete(alias);
                }
                return false;
            }
            return true;
        };
        absoluteEntries = absoluteEntries.filter(filterCb);
        relativeEntries = relativeEntries.filter(filterCb);
        return isRemoved;
    };
    const cloneTo = (toStack)=>{
        absoluteEntries.forEach((entry)=>{
            toStack.add(entry.middleware, {
                ...entry
            });
        });
        relativeEntries.forEach((entry)=>{
            toStack.addRelativeTo(entry.middleware, {
                ...entry
            });
        });
        toStack.identifyOnResolve?.(stack.identifyOnResolve());
        return toStack;
    };
    const expandRelativeMiddlewareList = (from)=>{
        const expandedMiddlewareList = [];
        from.before.forEach((entry)=>{
            if (entry.before.length === 0 && entry.after.length === 0) {
                expandedMiddlewareList.push(entry);
            } else {
                expandedMiddlewareList.push(...expandRelativeMiddlewareList(entry));
            }
        });
        expandedMiddlewareList.push(from);
        from.after.reverse().forEach((entry)=>{
            if (entry.before.length === 0 && entry.after.length === 0) {
                expandedMiddlewareList.push(entry);
            } else {
                expandedMiddlewareList.push(...expandRelativeMiddlewareList(entry));
            }
        });
        return expandedMiddlewareList;
    };
    const getMiddlewareList = (debug = false)=>{
        const normalizedAbsoluteEntries = [];
        const normalizedRelativeEntries = [];
        const normalizedEntriesNameMap = {};
        absoluteEntries.forEach((entry)=>{
            const normalizedEntry = {
                ...entry,
                before: [],
                after: []
            };
            for (const alias of getAllAliases(normalizedEntry.name, normalizedEntry.aliases)){
                normalizedEntriesNameMap[alias] = normalizedEntry;
            }
            normalizedAbsoluteEntries.push(normalizedEntry);
        });
        relativeEntries.forEach((entry)=>{
            const normalizedEntry = {
                ...entry,
                before: [],
                after: []
            };
            for (const alias of getAllAliases(normalizedEntry.name, normalizedEntry.aliases)){
                normalizedEntriesNameMap[alias] = normalizedEntry;
            }
            normalizedRelativeEntries.push(normalizedEntry);
        });
        normalizedRelativeEntries.forEach((entry)=>{
            if (entry.toMiddleware) {
                const toMiddleware = normalizedEntriesNameMap[entry.toMiddleware];
                if (toMiddleware === undefined) {
                    if (debug) {
                        return;
                    }
                    throw new Error(`${entry.toMiddleware} is not found when adding ` + `${getMiddlewareNameWithAliases(entry.name, entry.aliases)} ` + `middleware ${entry.relation} ${entry.toMiddleware}`);
                }
                if (entry.relation === "after") {
                    toMiddleware.after.push(entry);
                }
                if (entry.relation === "before") {
                    toMiddleware.before.push(entry);
                }
            }
        });
        const mainChain = sort(normalizedAbsoluteEntries).map(expandRelativeMiddlewareList).reduce((wholeList, expandedMiddlewareList)=>{
            wholeList.push(...expandedMiddlewareList);
            return wholeList;
        }, []);
        return mainChain;
    };
    const stack = {
        add: (middleware, options = {})=>{
            const { name, override, aliases: _aliases } = options;
            const entry = {
                step: "initialize",
                priority: "normal",
                middleware,
                ...options
            };
            const aliases = getAllAliases(name, _aliases);
            if (aliases.length > 0) {
                if (aliases.some((alias)=>entriesNameSet.has(alias))) {
                    if (!override) throw new Error(`Duplicate middleware name '${getMiddlewareNameWithAliases(name, _aliases)}'`);
                    for (const alias of aliases){
                        const toOverrideIndex = absoluteEntries.findIndex((entry)=>entry.name === alias || entry.aliases?.some((a)=>a === alias));
                        if (toOverrideIndex === -1) {
                            continue;
                        }
                        const toOverride = absoluteEntries[toOverrideIndex];
                        if (toOverride.step !== entry.step || entry.priority !== toOverride.priority) {
                            throw new Error(`"${getMiddlewareNameWithAliases(toOverride.name, toOverride.aliases)}" middleware with ` + `${toOverride.priority} priority in ${toOverride.step} step cannot ` + `be overridden by "${getMiddlewareNameWithAliases(name, _aliases)}" middleware with ` + `${entry.priority} priority in ${entry.step} step.`);
                        }
                        absoluteEntries.splice(toOverrideIndex, 1);
                    }
                }
                for (const alias of aliases){
                    entriesNameSet.add(alias);
                }
            }
            absoluteEntries.push(entry);
        },
        addRelativeTo: (middleware, options)=>{
            const { name, override, aliases: _aliases } = options;
            const entry = {
                middleware,
                ...options
            };
            const aliases = getAllAliases(name, _aliases);
            if (aliases.length > 0) {
                if (aliases.some((alias)=>entriesNameSet.has(alias))) {
                    if (!override) throw new Error(`Duplicate middleware name '${getMiddlewareNameWithAliases(name, _aliases)}'`);
                    for (const alias of aliases){
                        const toOverrideIndex = relativeEntries.findIndex((entry)=>entry.name === alias || entry.aliases?.some((a)=>a === alias));
                        if (toOverrideIndex === -1) {
                            continue;
                        }
                        const toOverride = relativeEntries[toOverrideIndex];
                        if (toOverride.toMiddleware !== entry.toMiddleware || toOverride.relation !== entry.relation) {
                            throw new Error(`"${getMiddlewareNameWithAliases(toOverride.name, toOverride.aliases)}" middleware ` + `${toOverride.relation} "${toOverride.toMiddleware}" middleware cannot be overridden ` + `by "${getMiddlewareNameWithAliases(name, _aliases)}" middleware ${entry.relation} ` + `"${entry.toMiddleware}" middleware.`);
                        }
                        relativeEntries.splice(toOverrideIndex, 1);
                    }
                }
                for (const alias of aliases){
                    entriesNameSet.add(alias);
                }
            }
            relativeEntries.push(entry);
        },
        clone: ()=>cloneTo(constructStack()),
        use: (plugin)=>{
            plugin.applyToStack(stack);
        },
        remove: (toRemove)=>{
            if (typeof toRemove === "string") return removeByName(toRemove);
            else return removeByReference(toRemove);
        },
        removeByTag: (toRemove)=>{
            let isRemoved = false;
            const filterCb = (entry)=>{
                const { tags, name, aliases: _aliases } = entry;
                if (tags && tags.includes(toRemove)) {
                    const aliases = getAllAliases(name, _aliases);
                    for (const alias of aliases){
                        entriesNameSet.delete(alias);
                    }
                    isRemoved = true;
                    return false;
                }
                return true;
            };
            absoluteEntries = absoluteEntries.filter(filterCb);
            relativeEntries = relativeEntries.filter(filterCb);
            return isRemoved;
        },
        concat: (from)=>{
            const cloned = cloneTo(constructStack());
            cloned.use(from);
            cloned.identifyOnResolve(identifyOnResolve || cloned.identifyOnResolve() || (from.identifyOnResolve?.() ?? false));
            return cloned;
        },
        applyToStack: cloneTo,
        identify: ()=>{
            return getMiddlewareList(true).map((mw)=>{
                const step = mw.step ?? mw.relation + " " + mw.toMiddleware;
                return getMiddlewareNameWithAliases(mw.name, mw.aliases) + " - " + step;
            });
        },
        identifyOnResolve (toggle) {
            if (typeof toggle === "boolean") identifyOnResolve = toggle;
            return identifyOnResolve;
        },
        resolve: (handler, context)=>{
            for (const middleware of getMiddlewareList().map((entry)=>entry.middleware).reverse()){
                handler = middleware(handler, context);
            }
            if (identifyOnResolve) {
                console.log(stack.identify());
            }
            return handler;
        }
    };
    return stack;
};
const stepWeights = {
    initialize: 5,
    serialize: 4,
    build: 3,
    finalizeRequest: 2,
    deserialize: 1
};
const priorityWeights = {
    high: 3,
    normal: 2,
    low: 1
};
}),
"[project]/path/path-web/node_modules/@smithy/util-hex-encoding/dist-es/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromHex",
    ()=>fromHex,
    "toHex",
    ()=>toHex
]);
const SHORT_TO_HEX = {};
const HEX_TO_SHORT = {};
for(let i = 0; i < 256; i++){
    let encodedByte = i.toString(16).toLowerCase();
    if (encodedByte.length === 1) {
        encodedByte = `0${encodedByte}`;
    }
    SHORT_TO_HEX[i] = encodedByte;
    HEX_TO_SHORT[encodedByte] = i;
}
function fromHex(encoded) {
    if (encoded.length % 2 !== 0) {
        throw new Error("Hex encoded strings must have an even number length");
    }
    const out = new Uint8Array(encoded.length / 2);
    for(let i = 0; i < encoded.length; i += 2){
        const encodedByte = encoded.slice(i, i + 2).toLowerCase();
        if (encodedByte in HEX_TO_SHORT) {
            out[i / 2] = HEX_TO_SHORT[encodedByte];
        } else {
            throw new Error(`Cannot decode unrecognized sequence ${encodedByte} as hexadecimal`);
        }
    }
    return out;
}
function toHex(bytes) {
    let out = "";
    for(let i = 0; i < bytes.byteLength; i++){
        out += SHORT_TO_HEX[bytes[i]];
    }
    return out;
}
}),
"[project]/path/path-web/node_modules/@smithy/is-array-buffer/dist-es/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isArrayBuffer",
    ()=>isArrayBuffer
]);
const isArrayBuffer = (arg)=>typeof ArrayBuffer === "function" && arg instanceof ArrayBuffer || Object.prototype.toString.call(arg) === "[object ArrayBuffer]";
}),
"[project]/path/path-web/node_modules/@aws-crypto/util/node_modules/@smithy/is-array-buffer/dist-es/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isArrayBuffer",
    ()=>isArrayBuffer
]);
const isArrayBuffer = (arg)=>typeof ArrayBuffer === "function" && arg instanceof ArrayBuffer || Object.prototype.toString.call(arg) === "[object ArrayBuffer]";
}),
"[project]/path/path-web/node_modules/@smithy/util-buffer-from/dist-es/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromArrayBuffer",
    ()=>fromArrayBuffer,
    "fromString",
    ()=>fromString
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$is$2d$array$2d$buffer$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/is-array-buffer/dist-es/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$buffer__$5b$external$5d$__$28$buffer$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/buffer [external] (buffer, cjs)");
;
;
const fromArrayBuffer = (input, offset = 0, length = input.byteLength - offset)=>{
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$is$2d$array$2d$buffer$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isArrayBuffer"])(input)) {
        throw new TypeError(`The "input" argument must be ArrayBuffer. Received type ${typeof input} (${input})`);
    }
    return __TURBOPACK__imported__module__$5b$externals$5d2f$buffer__$5b$external$5d$__$28$buffer$2c$__cjs$29$__["Buffer"].from(input, offset, length);
};
const fromString = (input, encoding)=>{
    if (typeof input !== "string") {
        throw new TypeError(`The "input" argument must be of type string. Received type ${typeof input} (${input})`);
    }
    return encoding ? __TURBOPACK__imported__module__$5b$externals$5d2f$buffer__$5b$external$5d$__$28$buffer$2c$__cjs$29$__["Buffer"].from(input, encoding) : __TURBOPACK__imported__module__$5b$externals$5d2f$buffer__$5b$external$5d$__$28$buffer$2c$__cjs$29$__["Buffer"].from(input);
};
}),
"[project]/path/path-web/node_modules/@aws-crypto/util/node_modules/@smithy/util-buffer-from/dist-es/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromArrayBuffer",
    ()=>fromArrayBuffer,
    "fromString",
    ()=>fromString
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$node_modules$2f40$smithy$2f$is$2d$array$2d$buffer$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/node_modules/@smithy/is-array-buffer/dist-es/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$buffer__$5b$external$5d$__$28$buffer$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/buffer [external] (buffer, cjs)");
;
;
const fromArrayBuffer = (input, offset = 0, length = input.byteLength - offset)=>{
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$node_modules$2f40$smithy$2f$is$2d$array$2d$buffer$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isArrayBuffer"])(input)) {
        throw new TypeError(`The "input" argument must be ArrayBuffer. Received type ${typeof input} (${input})`);
    }
    return __TURBOPACK__imported__module__$5b$externals$5d2f$buffer__$5b$external$5d$__$28$buffer$2c$__cjs$29$__["Buffer"].from(input, offset, length);
};
const fromString = (input, encoding)=>{
    if (typeof input !== "string") {
        throw new TypeError(`The "input" argument must be of type string. Received type ${typeof input} (${input})`);
    }
    return encoding ? __TURBOPACK__imported__module__$5b$externals$5d2f$buffer__$5b$external$5d$__$28$buffer$2c$__cjs$29$__["Buffer"].from(input, encoding) : __TURBOPACK__imported__module__$5b$externals$5d2f$buffer__$5b$external$5d$__$28$buffer$2c$__cjs$29$__["Buffer"].from(input);
};
}),
"[project]/path/path-web/node_modules/@smithy/util-utf8/dist-es/fromUtf8.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromUtf8",
    ()=>fromUtf8
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$buffer$2d$from$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-buffer-from/dist-es/index.js [app-route] (ecmascript)");
;
const fromUtf8 = (input)=>{
    const buf = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$buffer$2d$from$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromString"])(input, "utf8");
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength / Uint8Array.BYTES_PER_ELEMENT);
};
}),
"[project]/path/path-web/node_modules/@smithy/util-utf8/dist-es/toUint8Array.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toUint8Array",
    ()=>toUint8Array
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-utf8/dist-es/fromUtf8.js [app-route] (ecmascript)");
;
const toUint8Array = (data)=>{
    if (typeof data === "string") {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromUtf8"])(data);
    }
    if (ArrayBuffer.isView(data)) {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
    }
    return new Uint8Array(data);
};
}),
"[project]/path/path-web/node_modules/@aws-crypto/util/node_modules/@smithy/util-utf8/dist-es/fromUtf8.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromUtf8",
    ()=>fromUtf8
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$node_modules$2f40$smithy$2f$util$2d$buffer$2d$from$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/node_modules/@smithy/util-buffer-from/dist-es/index.js [app-route] (ecmascript)");
;
const fromUtf8 = (input)=>{
    const buf = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$node_modules$2f40$smithy$2f$util$2d$buffer$2d$from$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromString"])(input, "utf8");
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength / Uint8Array.BYTES_PER_ELEMENT);
};
}),
"[project]/path/path-web/node_modules/@aws-crypto/util/node_modules/@smithy/util-utf8/dist-es/toUint8Array.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toUint8Array",
    ()=>toUint8Array
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/node_modules/@smithy/util-utf8/dist-es/fromUtf8.js [app-route] (ecmascript)");
;
const toUint8Array = (data)=>{
    if (typeof data === "string") {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromUtf8"])(data);
    }
    if (ArrayBuffer.isView(data)) {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
    }
    return new Uint8Array(data);
};
}),
"[project]/path/path-web/node_modules/@aws-crypto/util/node_modules/@smithy/util-utf8/dist-es/toUtf8.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toUtf8",
    ()=>toUtf8
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$node_modules$2f40$smithy$2f$util$2d$buffer$2d$from$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/node_modules/@smithy/util-buffer-from/dist-es/index.js [app-route] (ecmascript)");
;
const toUtf8 = (input)=>{
    if (typeof input === "string") {
        return input;
    }
    if (typeof input !== "object" || typeof input.byteOffset !== "number" || typeof input.byteLength !== "number") {
        throw new Error("@smithy/util-utf8: toUtf8 encoder function only accepts string | Uint8Array.");
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$node_modules$2f40$smithy$2f$util$2d$buffer$2d$from$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromArrayBuffer"])(input.buffer, input.byteOffset, input.byteLength).toString("utf8");
};
}),
"[project]/path/path-web/node_modules/@aws-crypto/util/node_modules/@smithy/util-utf8/dist-es/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/node_modules/@smithy/util-utf8/dist-es/fromUtf8.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/node_modules/@smithy/util-utf8/dist-es/toUint8Array.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/node_modules/@smithy/util-utf8/dist-es/toUtf8.js [app-route] (ecmascript)");
;
;
;
}),
"[project]/path/path-web/node_modules/@smithy/util-utf8/dist-es/toUtf8.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toUtf8",
    ()=>toUtf8
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$buffer$2d$from$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-buffer-from/dist-es/index.js [app-route] (ecmascript)");
;
const toUtf8 = (input)=>{
    if (typeof input === "string") {
        return input;
    }
    if (typeof input !== "object" || typeof input.byteOffset !== "number" || typeof input.byteLength !== "number") {
        throw new Error("@smithy/util-utf8: toUtf8 encoder function only accepts string | Uint8Array.");
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$buffer$2d$from$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromArrayBuffer"])(input.buffer, input.byteOffset, input.byteLength).toString("utf8");
};
}),
"[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/constants.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ALGORITHM_IDENTIFIER",
    ()=>ALGORITHM_IDENTIFIER,
    "ALGORITHM_IDENTIFIER_V4A",
    ()=>ALGORITHM_IDENTIFIER_V4A,
    "ALGORITHM_QUERY_PARAM",
    ()=>ALGORITHM_QUERY_PARAM,
    "ALWAYS_UNSIGNABLE_HEADERS",
    ()=>ALWAYS_UNSIGNABLE_HEADERS,
    "AMZ_DATE_HEADER",
    ()=>AMZ_DATE_HEADER,
    "AMZ_DATE_QUERY_PARAM",
    ()=>AMZ_DATE_QUERY_PARAM,
    "AUTH_HEADER",
    ()=>AUTH_HEADER,
    "CREDENTIAL_QUERY_PARAM",
    ()=>CREDENTIAL_QUERY_PARAM,
    "DATE_HEADER",
    ()=>DATE_HEADER,
    "EVENT_ALGORITHM_IDENTIFIER",
    ()=>EVENT_ALGORITHM_IDENTIFIER,
    "EXPIRES_QUERY_PARAM",
    ()=>EXPIRES_QUERY_PARAM,
    "GENERATED_HEADERS",
    ()=>GENERATED_HEADERS,
    "HOST_HEADER",
    ()=>HOST_HEADER,
    "KEY_TYPE_IDENTIFIER",
    ()=>KEY_TYPE_IDENTIFIER,
    "MAX_CACHE_SIZE",
    ()=>MAX_CACHE_SIZE,
    "MAX_PRESIGNED_TTL",
    ()=>MAX_PRESIGNED_TTL,
    "PROXY_HEADER_PATTERN",
    ()=>PROXY_HEADER_PATTERN,
    "REGION_SET_PARAM",
    ()=>REGION_SET_PARAM,
    "SEC_HEADER_PATTERN",
    ()=>SEC_HEADER_PATTERN,
    "SHA256_HEADER",
    ()=>SHA256_HEADER,
    "SIGNATURE_HEADER",
    ()=>SIGNATURE_HEADER,
    "SIGNATURE_QUERY_PARAM",
    ()=>SIGNATURE_QUERY_PARAM,
    "SIGNED_HEADERS_QUERY_PARAM",
    ()=>SIGNED_HEADERS_QUERY_PARAM,
    "TOKEN_HEADER",
    ()=>TOKEN_HEADER,
    "TOKEN_QUERY_PARAM",
    ()=>TOKEN_QUERY_PARAM,
    "UNSIGNABLE_PATTERNS",
    ()=>UNSIGNABLE_PATTERNS,
    "UNSIGNED_PAYLOAD",
    ()=>UNSIGNED_PAYLOAD
]);
const ALGORITHM_QUERY_PARAM = "X-Amz-Algorithm";
const CREDENTIAL_QUERY_PARAM = "X-Amz-Credential";
const AMZ_DATE_QUERY_PARAM = "X-Amz-Date";
const SIGNED_HEADERS_QUERY_PARAM = "X-Amz-SignedHeaders";
const EXPIRES_QUERY_PARAM = "X-Amz-Expires";
const SIGNATURE_QUERY_PARAM = "X-Amz-Signature";
const TOKEN_QUERY_PARAM = "X-Amz-Security-Token";
const REGION_SET_PARAM = "X-Amz-Region-Set";
const AUTH_HEADER = "authorization";
const AMZ_DATE_HEADER = AMZ_DATE_QUERY_PARAM.toLowerCase();
const DATE_HEADER = "date";
const GENERATED_HEADERS = [
    AUTH_HEADER,
    AMZ_DATE_HEADER,
    DATE_HEADER
];
const SIGNATURE_HEADER = SIGNATURE_QUERY_PARAM.toLowerCase();
const SHA256_HEADER = "x-amz-content-sha256";
const TOKEN_HEADER = TOKEN_QUERY_PARAM.toLowerCase();
const HOST_HEADER = "host";
const ALWAYS_UNSIGNABLE_HEADERS = {
    authorization: true,
    "cache-control": true,
    connection: true,
    expect: true,
    from: true,
    "keep-alive": true,
    "max-forwards": true,
    pragma: true,
    referer: true,
    te: true,
    trailer: true,
    "transfer-encoding": true,
    upgrade: true,
    "user-agent": true,
    "x-amzn-trace-id": true
};
const PROXY_HEADER_PATTERN = /^proxy-/;
const SEC_HEADER_PATTERN = /^sec-/;
const UNSIGNABLE_PATTERNS = [
    /^proxy-/i,
    /^sec-/i
];
const ALGORITHM_IDENTIFIER = "AWS4-HMAC-SHA256";
const ALGORITHM_IDENTIFIER_V4A = "AWS4-ECDSA-P256-SHA256";
const EVENT_ALGORITHM_IDENTIFIER = "AWS4-HMAC-SHA256-PAYLOAD";
const UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";
const MAX_CACHE_SIZE = 50;
const KEY_TYPE_IDENTIFIER = "aws4_request";
const MAX_PRESIGNED_TTL = 60 * 60 * 24 * 7;
}),
"[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/credentialDerivation.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearCredentialCache",
    ()=>clearCredentialCache,
    "createScope",
    ()=>createScope,
    "getSigningKey",
    ()=>getSigningKey
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-hex-encoding/dist-es/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-utf8/dist-es/toUint8Array.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/constants.js [app-route] (ecmascript)");
;
;
;
const signingKeyCache = {};
const cacheQueue = [];
const createScope = (shortDate, region, service)=>`${shortDate}/${region}/${service}/${__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["KEY_TYPE_IDENTIFIER"]}`;
const getSigningKey = async (sha256Constructor, credentials, shortDate, region, service)=>{
    const credsHash = await hmac(sha256Constructor, credentials.secretAccessKey, credentials.accessKeyId);
    const cacheKey = `${shortDate}:${region}:${service}:${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(credsHash)}:${credentials.sessionToken}`;
    if (cacheKey in signingKeyCache) {
        return signingKeyCache[cacheKey];
    }
    cacheQueue.push(cacheKey);
    while(cacheQueue.length > __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MAX_CACHE_SIZE"]){
        delete signingKeyCache[cacheQueue.shift()];
    }
    let key = `AWS4${credentials.secretAccessKey}`;
    for (const signable of [
        shortDate,
        region,
        service,
        __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["KEY_TYPE_IDENTIFIER"]
    ]){
        key = await hmac(sha256Constructor, key, signable);
    }
    return signingKeyCache[cacheKey] = key;
};
const clearCredentialCache = ()=>{
    cacheQueue.length = 0;
    Object.keys(signingKeyCache).forEach((cacheKey)=>{
        delete signingKeyCache[cacheKey];
    });
};
const hmac = (ctor, secret, data)=>{
    const hash = new ctor(secret);
    hash.update((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toUint8Array"])(data));
    return hash.digest();
};
}),
"[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/getCanonicalHeaders.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getCanonicalHeaders",
    ()=>getCanonicalHeaders
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/constants.js [app-route] (ecmascript)");
;
const getCanonicalHeaders = ({ headers }, unsignableHeaders, signableHeaders)=>{
    const canonical = {};
    for (const headerName of Object.keys(headers).sort()){
        if (headers[headerName] == undefined) {
            continue;
        }
        const canonicalHeaderName = headerName.toLowerCase();
        if (canonicalHeaderName in __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALWAYS_UNSIGNABLE_HEADERS"] || unsignableHeaders?.has(canonicalHeaderName) || __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PROXY_HEADER_PATTERN"].test(canonicalHeaderName) || __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SEC_HEADER_PATTERN"].test(canonicalHeaderName)) {
            if (!signableHeaders || signableHeaders && !signableHeaders.has(canonicalHeaderName)) {
                continue;
            }
        }
        canonical[canonicalHeaderName] = headers[headerName].trim().replace(/\s+/g, " ");
    }
    return canonical;
};
}),
"[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/getPayloadHash.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getPayloadHash",
    ()=>getPayloadHash
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$is$2d$array$2d$buffer$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/is-array-buffer/dist-es/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-hex-encoding/dist-es/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-utf8/dist-es/toUint8Array.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/constants.js [app-route] (ecmascript)");
;
;
;
;
const getPayloadHash = async ({ headers, body }, hashConstructor)=>{
    for (const headerName of Object.keys(headers)){
        if (headerName.toLowerCase() === __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SHA256_HEADER"]) {
            return headers[headerName];
        }
    }
    if (body == undefined) {
        return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    } else if (typeof body === "string" || ArrayBuffer.isView(body) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$is$2d$array$2d$buffer$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isArrayBuffer"])(body)) {
        const hashCtor = new hashConstructor();
        hashCtor.update((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toUint8Array"])(body));
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(await hashCtor.digest());
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UNSIGNED_PAYLOAD"];
};
}),
"[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/HeaderFormatter.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HeaderFormatter",
    ()=>HeaderFormatter,
    "Int64",
    ()=>Int64
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-hex-encoding/dist-es/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-utf8/dist-es/fromUtf8.js [app-route] (ecmascript)");
;
;
class HeaderFormatter {
    format(headers) {
        const chunks = [];
        for (const headerName of Object.keys(headers)){
            const bytes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromUtf8"])(headerName);
            chunks.push(Uint8Array.from([
                bytes.byteLength
            ]), bytes, this.formatHeaderValue(headers[headerName]));
        }
        const out = new Uint8Array(chunks.reduce((carry, bytes)=>carry + bytes.byteLength, 0));
        let position = 0;
        for (const chunk of chunks){
            out.set(chunk, position);
            position += chunk.byteLength;
        }
        return out;
    }
    formatHeaderValue(header) {
        switch(header.type){
            case "boolean":
                return Uint8Array.from([
                    header.value ? 0 : 1
                ]);
            case "byte":
                return Uint8Array.from([
                    2,
                    header.value
                ]);
            case "short":
                const shortView = new DataView(new ArrayBuffer(3));
                shortView.setUint8(0, 3);
                shortView.setInt16(1, header.value, false);
                return new Uint8Array(shortView.buffer);
            case "integer":
                const intView = new DataView(new ArrayBuffer(5));
                intView.setUint8(0, 4);
                intView.setInt32(1, header.value, false);
                return new Uint8Array(intView.buffer);
            case "long":
                const longBytes = new Uint8Array(9);
                longBytes[0] = 5;
                longBytes.set(header.value.bytes, 1);
                return longBytes;
            case "binary":
                const binView = new DataView(new ArrayBuffer(3 + header.value.byteLength));
                binView.setUint8(0, 6);
                binView.setUint16(1, header.value.byteLength, false);
                const binBytes = new Uint8Array(binView.buffer);
                binBytes.set(header.value, 3);
                return binBytes;
            case "string":
                const utf8Bytes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromUtf8"])(header.value);
                const strView = new DataView(new ArrayBuffer(3 + utf8Bytes.byteLength));
                strView.setUint8(0, 7);
                strView.setUint16(1, utf8Bytes.byteLength, false);
                const strBytes = new Uint8Array(strView.buffer);
                strBytes.set(utf8Bytes, 3);
                return strBytes;
            case "timestamp":
                const tsBytes = new Uint8Array(9);
                tsBytes[0] = 8;
                tsBytes.set(Int64.fromNumber(header.value.valueOf()).bytes, 1);
                return tsBytes;
            case "uuid":
                if (!UUID_PATTERN.test(header.value)) {
                    throw new Error(`Invalid UUID received: ${header.value}`);
                }
                const uuidBytes = new Uint8Array(17);
                uuidBytes[0] = 9;
                uuidBytes.set((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromHex"])(header.value.replace(/\-/g, "")), 1);
                return uuidBytes;
        }
    }
}
var HEADER_VALUE_TYPE;
(function(HEADER_VALUE_TYPE) {
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["boolTrue"] = 0] = "boolTrue";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["boolFalse"] = 1] = "boolFalse";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["byte"] = 2] = "byte";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["short"] = 3] = "short";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["integer"] = 4] = "integer";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["long"] = 5] = "long";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["byteArray"] = 6] = "byteArray";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["string"] = 7] = "string";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["timestamp"] = 8] = "timestamp";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["uuid"] = 9] = "uuid";
})(HEADER_VALUE_TYPE || (HEADER_VALUE_TYPE = {}));
const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
class Int64 {
    bytes;
    constructor(bytes){
        this.bytes = bytes;
        if (bytes.byteLength !== 8) {
            throw new Error("Int64 buffers must be exactly 8 bytes");
        }
    }
    static fromNumber(number) {
        if (number > 9_223_372_036_854_775_807 || number < -9_223_372_036_854_775_808) {
            throw new Error(`${number} is too large (or, if negative, too small) to represent as an Int64`);
        }
        const bytes = new Uint8Array(8);
        for(let i = 7, remaining = Math.abs(Math.round(number)); i > -1 && remaining > 0; i--, remaining /= 256){
            bytes[i] = remaining;
        }
        if (number < 0) {
            negate(bytes);
        }
        return new Int64(bytes);
    }
    valueOf() {
        const bytes = this.bytes.slice(0);
        const negative = bytes[0] & 0b10000000;
        if (negative) {
            negate(bytes);
        }
        return parseInt((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(bytes), 16) * (negative ? -1 : 1);
    }
    toString() {
        return String(this.valueOf());
    }
}
function negate(bytes) {
    for(let i = 0; i < 8; i++){
        bytes[i] ^= 0xff;
    }
    for(let i = 7; i > -1; i--){
        bytes[i]++;
        if (bytes[i] !== 0) break;
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/headerUtil.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deleteHeader",
    ()=>deleteHeader,
    "getHeaderValue",
    ()=>getHeaderValue,
    "hasHeader",
    ()=>hasHeader
]);
const hasHeader = (soughtHeader, headers)=>{
    soughtHeader = soughtHeader.toLowerCase();
    for (const headerName of Object.keys(headers)){
        if (soughtHeader === headerName.toLowerCase()) {
            return true;
        }
    }
    return false;
};
const getHeaderValue = (soughtHeader, headers)=>{
    soughtHeader = soughtHeader.toLowerCase();
    for (const headerName of Object.keys(headers)){
        if (soughtHeader === headerName.toLowerCase()) {
            return headers[headerName];
        }
    }
    return undefined;
};
const deleteHeader = (soughtHeader, headers)=>{
    soughtHeader = soughtHeader.toLowerCase();
    for (const headerName of Object.keys(headers)){
        if (soughtHeader === headerName.toLowerCase()) {
            delete headers[headerName];
        }
    }
};
}),
"[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/moveHeadersToQuery.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "moveHeadersToQuery",
    ()=>moveHeadersToQuery
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/protocol-http/dist-es/httpRequest.js [app-route] (ecmascript)");
;
const moveHeadersToQuery = (request, options = {})=>{
    const { headers, query = {} } = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpRequest"].clone(request);
    for (const name of Object.keys(headers)){
        const lname = name.toLowerCase();
        if (lname.slice(0, 6) === "x-amz-" && !options.unhoistableHeaders?.has(lname) || options.hoistableHeaders?.has(lname)) {
            query[name] = headers[name];
            delete headers[name];
        }
    }
    return {
        ...request,
        headers,
        query
    };
};
}),
"[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/prepareRequest.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prepareRequest",
    ()=>prepareRequest
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/protocol-http/dist-es/httpRequest.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/constants.js [app-route] (ecmascript)");
;
;
const prepareRequest = (request)=>{
    request = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpRequest"].clone(request);
    for (const headerName of Object.keys(request.headers)){
        if (__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GENERATED_HEADERS"].indexOf(headerName.toLowerCase()) > -1) {
            delete request.headers[headerName];
        }
    }
    return request;
};
}),
"[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/getCanonicalQuery.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getCanonicalQuery",
    ()=>getCanonicalQuery
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$uri$2d$escape$2f$dist$2d$es$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-uri-escape/dist-es/escape-uri.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/constants.js [app-route] (ecmascript)");
;
;
const getCanonicalQuery = ({ query = {} })=>{
    const keys = [];
    const serialized = {};
    for (const key of Object.keys(query)){
        if (key.toLowerCase() === __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SIGNATURE_HEADER"]) {
            continue;
        }
        const encodedKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$uri$2d$escape$2f$dist$2d$es$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeUri"])(key);
        keys.push(encodedKey);
        const value = query[key];
        if (typeof value === "string") {
            serialized[encodedKey] = `${encodedKey}=${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$uri$2d$escape$2f$dist$2d$es$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeUri"])(value)}`;
        } else if (Array.isArray(value)) {
            serialized[encodedKey] = value.slice(0).reduce((encoded, value)=>encoded.concat([
                    `${encodedKey}=${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$uri$2d$escape$2f$dist$2d$es$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeUri"])(value)}`
                ]), []).sort().join("&");
        }
    }
    return keys.sort().map((key)=>serialized[key]).filter((serialized)=>serialized).join("&");
};
}),
"[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/utilDate.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "iso8601",
    ()=>iso8601,
    "toDate",
    ()=>toDate
]);
const iso8601 = (time)=>toDate(time).toISOString().replace(/\.\d{3}Z$/, "Z");
const toDate = (time)=>{
    if (typeof time === "number") {
        return new Date(time * 1000);
    }
    if (typeof time === "string") {
        if (Number(time)) {
            return new Date(Number(time) * 1000);
        }
        return new Date(time);
    }
    return time;
};
}),
"[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/SignatureV4Base.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SignatureV4Base",
    ()=>SignatureV4Base
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-hex-encoding/dist-es/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$middleware$2f$dist$2d$es$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-middleware/dist-es/normalizeProvider.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$uri$2d$escape$2f$dist$2d$es$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-uri-escape/dist-es/escape-uri.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-utf8/dist-es/toUint8Array.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$getCanonicalQuery$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/getCanonicalQuery.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$utilDate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/utilDate.js [app-route] (ecmascript)");
;
;
;
;
;
;
class SignatureV4Base {
    service;
    regionProvider;
    credentialProvider;
    sha256;
    uriEscapePath;
    applyChecksum;
    constructor({ applyChecksum, credentials, region, service, sha256, uriEscapePath = true }){
        this.service = service;
        this.sha256 = sha256;
        this.uriEscapePath = uriEscapePath;
        this.applyChecksum = typeof applyChecksum === "boolean" ? applyChecksum : true;
        this.regionProvider = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$middleware$2f$dist$2d$es$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeProvider"])(region);
        this.credentialProvider = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$middleware$2f$dist$2d$es$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeProvider"])(credentials);
    }
    createCanonicalRequest(request, canonicalHeaders, payloadHash) {
        const sortedHeaders = Object.keys(canonicalHeaders).sort();
        return `${request.method}
${this.getCanonicalPath(request)}
${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$getCanonicalQuery$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCanonicalQuery"])(request)}
${sortedHeaders.map((name)=>`${name}:${canonicalHeaders[name]}`).join("\n")}

${sortedHeaders.join(";")}
${payloadHash}`;
    }
    async createStringToSign(longDate, credentialScope, canonicalRequest, algorithmIdentifier) {
        const hash = new this.sha256();
        hash.update((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toUint8Array"])(canonicalRequest));
        const hashedRequest = await hash.digest();
        return `${algorithmIdentifier}
${longDate}
${credentialScope}
${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(hashedRequest)}`;
    }
    getCanonicalPath({ path }) {
        if (this.uriEscapePath) {
            const normalizedPathSegments = [];
            for (const pathSegment of path.split("/")){
                if (pathSegment?.length === 0) continue;
                if (pathSegment === ".") continue;
                if (pathSegment === "..") {
                    normalizedPathSegments.pop();
                } else {
                    normalizedPathSegments.push(pathSegment);
                }
            }
            const normalizedPath = `${path?.startsWith("/") ? "/" : ""}${normalizedPathSegments.join("/")}${normalizedPathSegments.length > 0 && path?.endsWith("/") ? "/" : ""}`;
            const doubleEncoded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$uri$2d$escape$2f$dist$2d$es$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeUri"])(normalizedPath);
            return doubleEncoded.replace(/%2F/g, "/");
        }
        return path;
    }
    validateResolvedCredentials(credentials) {
        if (typeof credentials !== "object" || typeof credentials.accessKeyId !== "string" || typeof credentials.secretAccessKey !== "string") {
            throw new Error("Resolved credential object is not valid");
        }
    }
    formatDate(now) {
        const longDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$utilDate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["iso8601"])(now).replace(/[\-:]/g, "");
        return {
            longDate,
            shortDate: longDate.slice(0, 8)
        };
    }
    getCanonicalHeaderList(headers) {
        return Object.keys(headers).sort().join(";");
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/SignatureV4.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SignatureV4",
    ()=>SignatureV4
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-hex-encoding/dist-es/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-utf8/dist-es/toUint8Array.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/constants.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$credentialDerivation$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/credentialDerivation.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$getCanonicalHeaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/getCanonicalHeaders.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$getPayloadHash$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/getPayloadHash.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$HeaderFormatter$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/HeaderFormatter.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$headerUtil$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/headerUtil.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$moveHeadersToQuery$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/moveHeadersToQuery.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$prepareRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/prepareRequest.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$SignatureV4Base$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/signature-v4/dist-es/SignatureV4Base.js [app-route] (ecmascript)");
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
;
class SignatureV4 extends __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$SignatureV4Base$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SignatureV4Base"] {
    headerFormatter = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$HeaderFormatter$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HeaderFormatter"]();
    constructor({ applyChecksum, credentials, region, service, sha256, uriEscapePath = true }){
        super({
            applyChecksum,
            credentials,
            region,
            service,
            sha256,
            uriEscapePath
        });
    }
    async presign(originalRequest, options = {}) {
        const { signingDate = new Date(), expiresIn = 3600, unsignableHeaders, unhoistableHeaders, signableHeaders, hoistableHeaders, signingRegion, signingService } = options;
        const credentials = await this.credentialProvider();
        this.validateResolvedCredentials(credentials);
        const region = signingRegion ?? await this.regionProvider();
        const { longDate, shortDate } = this.formatDate(signingDate);
        if (expiresIn > __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MAX_PRESIGNED_TTL"]) {
            return Promise.reject("Signature version 4 presigned URLs" + " must have an expiration date less than one week in" + " the future");
        }
        const scope = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$credentialDerivation$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createScope"])(shortDate, region, signingService ?? this.service);
        const request = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$moveHeadersToQuery$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["moveHeadersToQuery"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$prepareRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prepareRequest"])(originalRequest), {
            unhoistableHeaders,
            hoistableHeaders
        });
        if (credentials.sessionToken) {
            request.query[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TOKEN_QUERY_PARAM"]] = credentials.sessionToken;
        }
        request.query[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALGORITHM_QUERY_PARAM"]] = __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALGORITHM_IDENTIFIER"];
        request.query[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CREDENTIAL_QUERY_PARAM"]] = `${credentials.accessKeyId}/${scope}`;
        request.query[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AMZ_DATE_QUERY_PARAM"]] = longDate;
        request.query[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EXPIRES_QUERY_PARAM"]] = expiresIn.toString(10);
        const canonicalHeaders = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$getCanonicalHeaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCanonicalHeaders"])(request, unsignableHeaders, signableHeaders);
        request.query[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SIGNED_HEADERS_QUERY_PARAM"]] = this.getCanonicalHeaderList(canonicalHeaders);
        request.query[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SIGNATURE_QUERY_PARAM"]] = await this.getSignature(longDate, scope, this.getSigningKey(credentials, region, shortDate, signingService), this.createCanonicalRequest(request, canonicalHeaders, await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$getPayloadHash$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getPayloadHash"])(originalRequest, this.sha256)));
        return request;
    }
    async sign(toSign, options) {
        if (typeof toSign === "string") {
            return this.signString(toSign, options);
        } else if (toSign.headers && toSign.payload) {
            return this.signEvent(toSign, options);
        } else if (toSign.message) {
            return this.signMessage(toSign, options);
        } else {
            return this.signRequest(toSign, options);
        }
    }
    async signEvent({ headers, payload }, { signingDate = new Date(), priorSignature, signingRegion, signingService }) {
        const region = signingRegion ?? await this.regionProvider();
        const { shortDate, longDate } = this.formatDate(signingDate);
        const scope = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$credentialDerivation$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createScope"])(shortDate, region, signingService ?? this.service);
        const hashedPayload = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$getPayloadHash$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getPayloadHash"])({
            headers: {},
            body: payload
        }, this.sha256);
        const hash = new this.sha256();
        hash.update(headers);
        const hashedHeaders = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(await hash.digest());
        const stringToSign = [
            __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EVENT_ALGORITHM_IDENTIFIER"],
            longDate,
            scope,
            priorSignature,
            hashedHeaders,
            hashedPayload
        ].join("\n");
        return this.signString(stringToSign, {
            signingDate,
            signingRegion: region,
            signingService
        });
    }
    async signMessage(signableMessage, { signingDate = new Date(), signingRegion, signingService }) {
        const promise = this.signEvent({
            headers: this.headerFormatter.format(signableMessage.message.headers),
            payload: signableMessage.message.body
        }, {
            signingDate,
            signingRegion,
            signingService,
            priorSignature: signableMessage.priorSignature
        });
        return promise.then((signature)=>{
            return {
                message: signableMessage.message,
                signature
            };
        });
    }
    async signString(stringToSign, { signingDate = new Date(), signingRegion, signingService } = {}) {
        const credentials = await this.credentialProvider();
        this.validateResolvedCredentials(credentials);
        const region = signingRegion ?? await this.regionProvider();
        const { shortDate } = this.formatDate(signingDate);
        const hash = new this.sha256(await this.getSigningKey(credentials, region, shortDate, signingService));
        hash.update((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toUint8Array"])(stringToSign));
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(await hash.digest());
    }
    async signRequest(requestToSign, { signingDate = new Date(), signableHeaders, unsignableHeaders, signingRegion, signingService } = {}) {
        const credentials = await this.credentialProvider();
        this.validateResolvedCredentials(credentials);
        const region = signingRegion ?? await this.regionProvider();
        const request = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$prepareRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prepareRequest"])(requestToSign);
        const { longDate, shortDate } = this.formatDate(signingDate);
        const scope = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$credentialDerivation$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createScope"])(shortDate, region, signingService ?? this.service);
        request.headers[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AMZ_DATE_HEADER"]] = longDate;
        if (credentials.sessionToken) {
            request.headers[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TOKEN_HEADER"]] = credentials.sessionToken;
        }
        const payloadHash = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$getPayloadHash$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getPayloadHash"])(request, this.sha256);
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$headerUtil$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasHeader"])(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SHA256_HEADER"], request.headers) && this.applyChecksum) {
            request.headers[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SHA256_HEADER"]] = payloadHash;
        }
        const canonicalHeaders = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$getCanonicalHeaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCanonicalHeaders"])(request, unsignableHeaders, signableHeaders);
        const signature = await this.getSignature(longDate, scope, this.getSigningKey(credentials, region, shortDate, signingService), this.createCanonicalRequest(request, canonicalHeaders, payloadHash));
        request.headers[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AUTH_HEADER"]] = `${__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALGORITHM_IDENTIFIER"]} ` + `Credential=${credentials.accessKeyId}/${scope}, ` + `SignedHeaders=${this.getCanonicalHeaderList(canonicalHeaders)}, ` + `Signature=${signature}`;
        return request;
    }
    async getSignature(longDate, credentialScope, keyPromise, canonicalRequest) {
        const stringToSign = await this.createStringToSign(longDate, credentialScope, canonicalRequest, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALGORITHM_IDENTIFIER"]);
        const hash = new this.sha256(await keyPromise);
        hash.update((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toUint8Array"])(stringToSign));
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(await hash.digest());
    }
    getSigningKey(credentials, region, shortDate, service) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$credentialDerivation$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSigningKey"])(this.sha256, credentials, shortDate, region, service || this.service);
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/util-uri-escape/dist-es/escape-uri.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "escapeUri",
    ()=>escapeUri
]);
const escapeUri = (uri)=>encodeURIComponent(uri).replace(/[!'()*]/g, hexEncode);
const hexEncode = (c)=>`%${c.charCodeAt(0).toString(16).toUpperCase()}`;
}),
"[project]/path/path-web/node_modules/@aws-sdk/credential-provider-env/dist-es/fromEnv.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ENV_ACCOUNT_ID",
    ()=>ENV_ACCOUNT_ID,
    "ENV_CREDENTIAL_SCOPE",
    ()=>ENV_CREDENTIAL_SCOPE,
    "ENV_EXPIRATION",
    ()=>ENV_EXPIRATION,
    "ENV_KEY",
    ()=>ENV_KEY,
    "ENV_SECRET",
    ()=>ENV_SECRET,
    "ENV_SESSION",
    ()=>ENV_SESSION,
    "fromEnv",
    ()=>fromEnv
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$client$2f$setCredentialFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/client/setCredentialFeature.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$CredentialsProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/CredentialsProviderError.js [app-route] (ecmascript)");
;
;
const ENV_KEY = "AWS_ACCESS_KEY_ID";
const ENV_SECRET = "AWS_SECRET_ACCESS_KEY";
const ENV_SESSION = "AWS_SESSION_TOKEN";
const ENV_EXPIRATION = "AWS_CREDENTIAL_EXPIRATION";
const ENV_CREDENTIAL_SCOPE = "AWS_CREDENTIAL_SCOPE";
const ENV_ACCOUNT_ID = "AWS_ACCOUNT_ID";
const fromEnv = (init)=>async ()=>{
        init?.logger?.debug("@aws-sdk/credential-provider-env - fromEnv");
        const accessKeyId = process.env[ENV_KEY];
        const secretAccessKey = process.env[ENV_SECRET];
        const sessionToken = process.env[ENV_SESSION];
        const expiry = process.env[ENV_EXPIRATION];
        const credentialScope = process.env[ENV_CREDENTIAL_SCOPE];
        const accountId = process.env[ENV_ACCOUNT_ID];
        if (accessKeyId && secretAccessKey) {
            const credentials = {
                accessKeyId,
                secretAccessKey,
                ...sessionToken && {
                    sessionToken
                },
                ...expiry && {
                    expiration: new Date(expiry)
                },
                ...credentialScope && {
                    credentialScope
                },
                ...accountId && {
                    accountId
                }
            };
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$client$2f$setCredentialFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setCredentialFeature"])(credentials, "CREDENTIALS_ENV_VARS", "g");
            return credentials;
        }
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$CredentialsProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CredentialsProviderError"]("Unable to find environment variable credentials.", {
            logger: init?.logger
        });
    };
}),
"[project]/path/path-web/node_modules/@aws-sdk/credential-provider-node/dist-es/remoteProvider.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ENV_IMDS_DISABLED",
    ()=>ENV_IMDS_DISABLED,
    "remoteProvider",
    ()=>remoteProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$chain$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/chain.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$CredentialsProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/CredentialsProviderError.js [app-route] (ecmascript)");
;
const ENV_IMDS_DISABLED = "AWS_EC2_METADATA_DISABLED";
const remoteProvider = async (init)=>{
    const { ENV_CMDS_FULL_URI, ENV_CMDS_RELATIVE_URI, fromContainerMetadata, fromInstanceMetadata } = await __turbopack_context__.A("[project]/path/path-web/node_modules/@smithy/credential-provider-imds/dist-es/index.js [app-route] (ecmascript, async loader)");
    if (process.env[ENV_CMDS_RELATIVE_URI] || process.env[ENV_CMDS_FULL_URI]) {
        init.logger?.debug("@aws-sdk/credential-provider-node - remoteProvider::fromHttp/fromContainerMetadata");
        const { fromHttp } = await __turbopack_context__.A("[project]/path/path-web/node_modules/@aws-sdk/credential-provider-http/dist-es/index.js [app-route] (ecmascript, async loader)");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$chain$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chain"])(fromHttp(init), fromContainerMetadata(init));
    }
    if (process.env[ENV_IMDS_DISABLED] && process.env[ENV_IMDS_DISABLED] !== "false") {
        return async ()=>{
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$CredentialsProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CredentialsProviderError"]("EC2 Instance Metadata Service access disabled", {
                logger: init.logger
            });
        };
    }
    init.logger?.debug("@aws-sdk/credential-provider-node - remoteProvider::fromInstanceMetadata");
    return fromInstanceMetadata(init);
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/credential-provider-node/dist-es/runtime/memoize-chain.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "internalCreateChain",
    ()=>internalCreateChain,
    "memoizeChain",
    ()=>memoizeChain
]);
function memoizeChain(providers, treatAsExpired) {
    const chain = internalCreateChain(providers);
    let activeLock;
    let passiveLock;
    let credentials;
    const provider = async (options)=>{
        if (options?.forceRefresh) {
            return await chain(options);
        }
        if (credentials?.expiration) {
            if (credentials?.expiration?.getTime() < Date.now()) {
                credentials = undefined;
            }
        }
        if (activeLock) {
            await activeLock;
        } else if (!credentials || treatAsExpired?.(credentials)) {
            if (credentials) {
                if (!passiveLock) {
                    passiveLock = chain(options).then((c)=>{
                        credentials = c;
                        passiveLock = undefined;
                    });
                }
            } else {
                activeLock = chain(options).then((c)=>{
                    credentials = c;
                    activeLock = undefined;
                });
                return provider(options);
            }
        }
        return credentials;
    };
    return provider;
}
const internalCreateChain = (providers)=>async (awsIdentityProperties)=>{
        let lastProviderError;
        for (const provider of providers){
            try {
                return await provider(awsIdentityProperties);
            } catch (err) {
                lastProviderError = err;
                if (err?.tryNextLink) {
                    continue;
                }
                throw err;
            }
        }
        throw lastProviderError;
    };
}),
"[project]/path/path-web/node_modules/@aws-sdk/credential-provider-node/dist-es/defaultProvider.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "credentialsTreatedAsExpired",
    ()=>credentialsTreatedAsExpired,
    "credentialsWillNeedRefresh",
    ()=>credentialsWillNeedRefresh,
    "defaultProvider",
    ()=>defaultProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$credential$2d$provider$2d$env$2f$dist$2d$es$2f$fromEnv$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/credential-provider-env/dist-es/fromEnv.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$CredentialsProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/CredentialsProviderError.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getProfileName$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getProfileName.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$credential$2d$provider$2d$node$2f$dist$2d$es$2f$remoteProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/credential-provider-node/dist-es/remoteProvider.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$credential$2d$provider$2d$node$2f$dist$2d$es$2f$runtime$2f$memoize$2d$chain$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/credential-provider-node/dist-es/runtime/memoize-chain.js [app-route] (ecmascript)");
;
;
;
;
;
let multipleCredentialSourceWarningEmitted = false;
const defaultProvider = (init = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$credential$2d$provider$2d$node$2f$dist$2d$es$2f$runtime$2f$memoize$2d$chain$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["memoizeChain"])([
        async ()=>{
            const profile = init.profile ?? process.env[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getProfileName$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ENV_PROFILE"]];
            if (profile) {
                const envStaticCredentialsAreSet = process.env[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$credential$2d$provider$2d$env$2f$dist$2d$es$2f$fromEnv$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ENV_KEY"]] && process.env[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$credential$2d$provider$2d$env$2f$dist$2d$es$2f$fromEnv$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ENV_SECRET"]];
                if (envStaticCredentialsAreSet) {
                    if (!multipleCredentialSourceWarningEmitted) {
                        const warnFn = init.logger?.warn && init.logger?.constructor?.name !== "NoOpLogger" ? init.logger.warn.bind(init.logger) : console.warn;
                        warnFn(`@aws-sdk/credential-provider-node - defaultProvider::fromEnv WARNING:
    Multiple credential sources detected: 
    Both AWS_PROFILE and the pair AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY static credentials are set.
    This SDK will proceed with the AWS_PROFILE value.
    
    However, a future version may change this behavior to prefer the ENV static credentials.
    Please ensure that your environment only sets either the AWS_PROFILE or the
    AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY pair.
`);
                        multipleCredentialSourceWarningEmitted = true;
                    }
                }
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$CredentialsProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CredentialsProviderError"]("AWS_PROFILE is set, skipping fromEnv provider.", {
                    logger: init.logger,
                    tryNextLink: true
                });
            }
            init.logger?.debug("@aws-sdk/credential-provider-node - defaultProvider::fromEnv");
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$credential$2d$provider$2d$env$2f$dist$2d$es$2f$fromEnv$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromEnv"])(init)();
        },
        async (awsIdentityProperties)=>{
            init.logger?.debug("@aws-sdk/credential-provider-node - defaultProvider::fromSSO");
            const { ssoStartUrl, ssoAccountId, ssoRegion, ssoRoleName, ssoSession } = init;
            if (!ssoStartUrl && !ssoAccountId && !ssoRegion && !ssoRoleName && !ssoSession) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$CredentialsProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CredentialsProviderError"]("Skipping SSO provider in default chain (inputs do not include SSO fields).", {
                    logger: init.logger
                });
            }
            const { fromSSO } = await __turbopack_context__.A("[project]/path/path-web/node_modules/@aws-sdk/credential-provider-sso/dist-es/index.js [app-route] (ecmascript, async loader)");
            return fromSSO(init)(awsIdentityProperties);
        },
        async (awsIdentityProperties)=>{
            init.logger?.debug("@aws-sdk/credential-provider-node - defaultProvider::fromIni");
            const { fromIni } = await __turbopack_context__.A("[project]/path/path-web/node_modules/@aws-sdk/credential-provider-ini/dist-es/index.js [app-route] (ecmascript, async loader)");
            return fromIni(init)(awsIdentityProperties);
        },
        async (awsIdentityProperties)=>{
            init.logger?.debug("@aws-sdk/credential-provider-node - defaultProvider::fromProcess");
            const { fromProcess } = await __turbopack_context__.A("[project]/path/path-web/node_modules/@aws-sdk/credential-provider-process/dist-es/index.js [app-route] (ecmascript, async loader)");
            return fromProcess(init)(awsIdentityProperties);
        },
        async (awsIdentityProperties)=>{
            init.logger?.debug("@aws-sdk/credential-provider-node - defaultProvider::fromTokenFile");
            const { fromTokenFile } = await __turbopack_context__.A("[project]/path/path-web/node_modules/@aws-sdk/credential-provider-web-identity/dist-es/index.js [app-route] (ecmascript, async loader)");
            return fromTokenFile(init)(awsIdentityProperties);
        },
        async ()=>{
            init.logger?.debug("@aws-sdk/credential-provider-node - defaultProvider::remoteProvider");
            return (await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$credential$2d$provider$2d$node$2f$dist$2d$es$2f$remoteProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["remoteProvider"])(init))();
        },
        async ()=>{
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$CredentialsProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CredentialsProviderError"]("Could not load credentials from any providers", {
                tryNextLink: false,
                logger: init.logger
            });
        }
    ], credentialsTreatedAsExpired);
const credentialsWillNeedRefresh = (credentials)=>credentials?.expiration !== undefined;
const credentialsTreatedAsExpired = (credentials)=>credentials?.expiration !== undefined && credentials.expiration.getTime() - Date.now() < 300000;
}),
"[project]/path/path-web/node_modules/tslib/tslib.es6.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__addDisposableResource",
    ()=>__addDisposableResource,
    "__assign",
    ()=>__assign,
    "__asyncDelegator",
    ()=>__asyncDelegator,
    "__asyncGenerator",
    ()=>__asyncGenerator,
    "__asyncValues",
    ()=>__asyncValues,
    "__await",
    ()=>__await,
    "__awaiter",
    ()=>__awaiter,
    "__classPrivateFieldGet",
    ()=>__classPrivateFieldGet,
    "__classPrivateFieldIn",
    ()=>__classPrivateFieldIn,
    "__classPrivateFieldSet",
    ()=>__classPrivateFieldSet,
    "__createBinding",
    ()=>__createBinding,
    "__decorate",
    ()=>__decorate,
    "__disposeResources",
    ()=>__disposeResources,
    "__esDecorate",
    ()=>__esDecorate,
    "__exportStar",
    ()=>__exportStar,
    "__extends",
    ()=>__extends,
    "__generator",
    ()=>__generator,
    "__importDefault",
    ()=>__importDefault,
    "__importStar",
    ()=>__importStar,
    "__makeTemplateObject",
    ()=>__makeTemplateObject,
    "__metadata",
    ()=>__metadata,
    "__param",
    ()=>__param,
    "__propKey",
    ()=>__propKey,
    "__read",
    ()=>__read,
    "__rest",
    ()=>__rest,
    "__rewriteRelativeImportExtension",
    ()=>__rewriteRelativeImportExtension,
    "__runInitializers",
    ()=>__runInitializers,
    "__setFunctionName",
    ()=>__setFunctionName,
    "__spread",
    ()=>__spread,
    "__spreadArray",
    ()=>__spreadArray,
    "__spreadArrays",
    ()=>__spreadArrays,
    "__values",
    ()=>__values,
    "default",
    ()=>__TURBOPACK__default__export__
]);
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */ /* global Reflect, Promise, SuppressedError, Symbol, Iterator */ var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || ({
        __proto__: []
    }) instanceof Array && function(d, b) {
        d.__proto__ = b;
    } || function(d, b) {
        for(var p in b)if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
    };
    return extendStatics(d, b);
};
function __extends(d, b) {
    if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
        this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for(var s, i = 1, n = arguments.length; i < n; i++){
            s = arguments[i];
            for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
function __rest(s, e) {
    var t = {};
    for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function") for(var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++){
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
    }
    return t;
}
function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function __param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
function __esDecorate(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) {
        if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
        return f;
    }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for(var i = decorators.length - 1; i >= 0; i--){
        var context = {};
        for(var p in contextIn)context[p] = p === "access" ? {} : contextIn[p];
        for(var p in contextIn.access)context.access[p] = contextIn.access[p];
        context.addInitializer = function(f) {
            if (done) throw new TypeError("Cannot add initializers after decoration has completed");
            extraInitializers.push(accept(f || null));
        };
        var result = (0, decorators[i])(kind === "accessor" ? {
            get: descriptor.get,
            set: descriptor.set
        } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        } else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
}
;
function __runInitializers(thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for(var i = 0; i < initializers.length; i++){
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
}
;
function __propKey(x) {
    return typeof x === "symbol" ? x : "".concat(x);
}
;
function __setFunctionName(f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", {
        configurable: true,
        value: prefix ? "".concat(prefix, " ", name) : name
    });
}
;
function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}
function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}
function __generator(thisArg, body) {
    var _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    //TURBOPACK unreachable
    ;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(g && (g = 0, op[0] && (_ = 0)), _)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
var __createBinding = Object.create ? function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = {
            enumerable: true,
            get: function() {
                return m[k];
            }
        };
    }
    Object.defineProperty(o, k2, desc);
} : function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
};
function __exportStar(m, o) {
    for(var p in m)if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
}
function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function() {
            if (o && i >= o.length) o = void 0;
            return {
                value: o && o[i++],
                done: !o
            };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while((n === void 0 || n-- > 0) && !(r = i.next()).done)ar.push(r.value);
    } catch (error) {
        e = {
            error: error
        };
    } finally{
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        } finally{
            if (e) throw e.error;
        }
    }
    return ar;
}
function __spread() {
    for(var ar = [], i = 0; i < arguments.length; i++)ar = ar.concat(__read(arguments[i]));
    return ar;
}
function __spreadArrays() {
    for(var s = 0, i = 0, il = arguments.length; i < il; i++)s += arguments[i].length;
    for(var r = Array(s), k = 0, i = 0; i < il; i++)for(var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)r[k] = a[j];
    return r;
}
function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for(var i = 0, l = from.length, ar; i < l; i++){
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}
function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}
function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function() {
        return this;
    }, i;
    //TURBOPACK unreachable
    ;
    function awaitReturn(f) {
        return function(v) {
            return Promise.resolve(v).then(f, reject);
        };
    }
    function verb(n, f) {
        if (g[n]) {
            i[n] = function(v) {
                return new Promise(function(a, b) {
                    q.push([
                        n,
                        v,
                        a,
                        b
                    ]) > 1 || resume(n, v);
                });
            };
            if (f) i[n] = f(i[n]);
        }
    }
    function resume(n, v) {
        try {
            step(g[n](v));
        } catch (e) {
            settle(q[0][3], e);
        }
    }
    function step(r) {
        r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
    }
    function fulfill(value) {
        resume("next", value);
    }
    function reject(value) {
        resume("throw", value);
    }
    function settle(f, v) {
        if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
    }
}
function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function(e) {
        throw e;
    }), verb("return"), i[Symbol.iterator] = function() {
        return this;
    }, i;
    //TURBOPACK unreachable
    ;
    function verb(n, f) {
        i[n] = o[n] ? function(v) {
            return (p = !p) ? {
                value: __await(o[n](v)),
                done: false
            } : f ? f(v) : v;
        } : f;
    }
}
function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
    }, i);
    //TURBOPACK unreachable
    ;
    function verb(n) {
        i[n] = o[n] && function(v) {
            return new Promise(function(resolve, reject) {
                v = o[n](v), settle(resolve, reject, v.done, v.value);
            });
        };
    }
    function settle(resolve, reject, d, v) {
        Promise.resolve(v).then(function(v) {
            resolve({
                value: v,
                done: d
            });
        }, reject);
    }
}
function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) {
        Object.defineProperty(cooked, "raw", {
            value: raw
        });
    } else {
        cooked.raw = raw;
    }
    return cooked;
}
;
var __setModuleDefault = Object.create ? function(o, v) {
    Object.defineProperty(o, "default", {
        enumerable: true,
        value: v
    });
} : function(o, v) {
    o["default"] = v;
};
var ownKeys = function(o) {
    ownKeys = Object.getOwnPropertyNames || function(o) {
        var ar = [];
        for(var k in o)if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
        return ar;
    };
    return ownKeys(o);
};
function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) {
        for(var k = ownKeys(mod), i = 0; i < k.length; i++)if (k[i] !== "default") __createBinding(result, mod, k[i]);
    }
    __setModuleDefault(result, mod);
    return result;
}
function __importDefault(mod) {
    return mod && mod.__esModule ? mod : {
        default: mod
    };
}
function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
function __classPrivateFieldIn(state, receiver) {
    if (receiver === null || typeof receiver !== "object" && typeof receiver !== "function") throw new TypeError("Cannot use 'in' operator on non-object");
    return typeof state === "function" ? receiver === state : state.has(receiver);
}
function __addDisposableResource(env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose, inner;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
            if (async) inner = dispose;
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        if (inner) dispose = function() {
            try {
                inner.call(this);
            } catch (e) {
                return Promise.reject(e);
            }
        };
        env.stack.push({
            value: value,
            dispose: dispose,
            async: async
        });
    } else if (async) {
        env.stack.push({
            async: true
        });
    }
    return value;
}
var _SuppressedError = typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};
function __disposeResources(env) {
    function fail(e) {
        env.error = env.hasError ? new _SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
        env.hasError = true;
    }
    var r, s = 0;
    function next() {
        while(r = env.stack.pop()){
            try {
                if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
                if (r.dispose) {
                    var result = r.dispose.call(r.value);
                    if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
                        fail(e);
                        return next();
                    });
                } else s |= 1;
            } catch (e) {
                fail(e);
            }
        }
        if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
        if (env.hasError) throw env.error;
    }
    return next();
}
function __rewriteRelativeImportExtension(path, preserveJsx) {
    if (typeof path === "string" && /^\.\.?\//.test(path)) {
        return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function(m, tsx, d, ext, cm) {
            return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
        });
    }
    return path;
}
const __TURBOPACK__default__export__ = {
    __extends,
    __assign,
    __rest,
    __decorate,
    __param,
    __esDecorate,
    __runInitializers,
    __propKey,
    __setFunctionName,
    __metadata,
    __awaiter,
    __generator,
    __createBinding,
    __exportStar,
    __values,
    __read,
    __spread,
    __spreadArrays,
    __spreadArray,
    __await,
    __asyncGenerator,
    __asyncDelegator,
    __asyncValues,
    __makeTemplateObject,
    __importStar,
    __importDefault,
    __classPrivateFieldGet,
    __classPrivateFieldSet,
    __classPrivateFieldIn,
    __addDisposableResource,
    __disposeResources,
    __rewriteRelativeImportExtension
};
}),
"[project]/path/path-web/node_modules/@aws-crypto/util/build/module/convertToBuffer.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "convertToBuffer",
    ()=>convertToBuffer
]);
// Copyright Amazon.com Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/node_modules/@smithy/util-utf8/dist-es/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/node_modules/@smithy/util-utf8/dist-es/fromUtf8.js [app-route] (ecmascript)");
;
// Quick polyfill
var fromUtf8 = typeof Buffer !== "undefined" && Buffer.from ? function(input) {
    return Buffer.from(input, "utf8");
} : __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromUtf8"];
function convertToBuffer(data) {
    // Already a Uint8, do nothing
    if (data instanceof Uint8Array) return data;
    if (typeof data === "string") {
        return fromUtf8(data);
    }
    if (ArrayBuffer.isView(data)) {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
    }
    return new Uint8Array(data);
} //# sourceMappingURL=convertToBuffer.js.map
}),
"[project]/path/path-web/node_modules/@aws-crypto/util/build/module/isEmptyData.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Copyright Amazon.com Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
__turbopack_context__.s([
    "isEmptyData",
    ()=>isEmptyData
]);
function isEmptyData(data) {
    if (typeof data === "string") {
        return data.length === 0;
    }
    return data.byteLength === 0;
} //# sourceMappingURL=isEmptyData.js.map
}),
"[project]/path/path-web/node_modules/@aws-crypto/util/build/module/numToUint8.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Copyright Amazon.com Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
__turbopack_context__.s([
    "numToUint8",
    ()=>numToUint8
]);
function numToUint8(num) {
    return new Uint8Array([
        (num & 0xff000000) >> 24,
        (num & 0x00ff0000) >> 16,
        (num & 0x0000ff00) >> 8,
        num & 0x000000ff
    ]);
} //# sourceMappingURL=numToUint8.js.map
}),
"[project]/path/path-web/node_modules/@aws-crypto/util/build/module/uint32ArrayFrom.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Copyright Amazon.com Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
// IE 11 does not support Array.from, so we do it manually
__turbopack_context__.s([
    "uint32ArrayFrom",
    ()=>uint32ArrayFrom
]);
function uint32ArrayFrom(a_lookUpTable) {
    if (!Uint32Array.from) {
        var return_array = new Uint32Array(a_lookUpTable.length);
        var a_index = 0;
        while(a_index < a_lookUpTable.length){
            return_array[a_index] = a_lookUpTable[a_index];
            a_index += 1;
        }
        return return_array;
    }
    return Uint32Array.from(a_lookUpTable);
} //# sourceMappingURL=uint32ArrayFrom.js.map
}),
"[project]/path/path-web/node_modules/@aws-crypto/util/build/module/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
// Copyright Amazon.com Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$build$2f$module$2f$convertToBuffer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/build/module/convertToBuffer.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$build$2f$module$2f$isEmptyData$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/build/module/isEmptyData.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$build$2f$module$2f$numToUint8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/build/module/numToUint8.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$build$2f$module$2f$uint32ArrayFrom$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/build/module/uint32ArrayFrom.js [app-route] (ecmascript)"); //# sourceMappingURL=index.js.map
;
;
;
;
}),
"[project]/path/path-web/node_modules/@aws-crypto/crc32/build/module/aws_crc32.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AwsCrc32",
    ()=>AwsCrc32
]);
// Copyright Amazon.com Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/tslib/tslib.es6.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$build$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/build/module/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$build$2f$module$2f$convertToBuffer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/build/module/convertToBuffer.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$build$2f$module$2f$isEmptyData$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/build/module/isEmptyData.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$build$2f$module$2f$numToUint8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/build/module/numToUint8.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$crc32$2f$build$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/crc32/build/module/index.js [app-route] (ecmascript) <locals>");
;
;
;
var AwsCrc32 = function() {
    function AwsCrc32() {
        this.crc32 = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$crc32$2f$build$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Crc32"]();
    }
    AwsCrc32.prototype.update = function(toHash) {
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$build$2f$module$2f$isEmptyData$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isEmptyData"])(toHash)) return;
        this.crc32.update((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$build$2f$module$2f$convertToBuffer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["convertToBuffer"])(toHash));
    };
    AwsCrc32.prototype.digest = function() {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["__awaiter"])(this, void 0, void 0, function() {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["__generator"])(this, function(_a) {
                return [
                    2 /*return*/ ,
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$build$2f$module$2f$numToUint8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["numToUint8"])(this.crc32.digest())
                ];
            });
        });
    };
    AwsCrc32.prototype.reset = function() {
        this.crc32 = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$crc32$2f$build$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Crc32"]();
    };
    return AwsCrc32;
}();
;
 //# sourceMappingURL=aws_crc32.js.map
}),
"[project]/path/path-web/node_modules/@aws-crypto/crc32/build/module/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Crc32",
    ()=>Crc32,
    "crc32",
    ()=>crc32
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/tslib/tslib.es6.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$build$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/build/module/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$build$2f$module$2f$uint32ArrayFrom$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/util/build/module/uint32ArrayFrom.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$crc32$2f$build$2f$module$2f$aws_crc32$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/crc32/build/module/aws_crc32.js [app-route] (ecmascript)"); //# sourceMappingURL=index.js.map
;
;
function crc32(data) {
    return new Crc32().update(data).digest();
}
var Crc32 = function() {
    function Crc32() {
        this.checksum = 0xffffffff;
    }
    Crc32.prototype.update = function(data) {
        var e_1, _a;
        try {
            for(var data_1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["__values"])(data), data_1_1 = data_1.next(); !data_1_1.done; data_1_1 = data_1.next()){
                var byte = data_1_1.value;
                this.checksum = this.checksum >>> 8 ^ lookupTable[(this.checksum ^ byte) & 0xff];
            }
        } catch (e_1_1) {
            e_1 = {
                error: e_1_1
            };
        } finally{
            try {
                if (data_1_1 && !data_1_1.done && (_a = data_1.return)) _a.call(data_1);
            } finally{
                if (e_1) throw e_1.error;
            }
        }
        return this;
    };
    Crc32.prototype.digest = function() {
        return (this.checksum ^ 0xffffffff) >>> 0;
    };
    return Crc32;
}();
;
// prettier-ignore
var a_lookUpTable = [
    0x00000000,
    0x77073096,
    0xEE0E612C,
    0x990951BA,
    0x076DC419,
    0x706AF48F,
    0xE963A535,
    0x9E6495A3,
    0x0EDB8832,
    0x79DCB8A4,
    0xE0D5E91E,
    0x97D2D988,
    0x09B64C2B,
    0x7EB17CBD,
    0xE7B82D07,
    0x90BF1D91,
    0x1DB71064,
    0x6AB020F2,
    0xF3B97148,
    0x84BE41DE,
    0x1ADAD47D,
    0x6DDDE4EB,
    0xF4D4B551,
    0x83D385C7,
    0x136C9856,
    0x646BA8C0,
    0xFD62F97A,
    0x8A65C9EC,
    0x14015C4F,
    0x63066CD9,
    0xFA0F3D63,
    0x8D080DF5,
    0x3B6E20C8,
    0x4C69105E,
    0xD56041E4,
    0xA2677172,
    0x3C03E4D1,
    0x4B04D447,
    0xD20D85FD,
    0xA50AB56B,
    0x35B5A8FA,
    0x42B2986C,
    0xDBBBC9D6,
    0xACBCF940,
    0x32D86CE3,
    0x45DF5C75,
    0xDCD60DCF,
    0xABD13D59,
    0x26D930AC,
    0x51DE003A,
    0xC8D75180,
    0xBFD06116,
    0x21B4F4B5,
    0x56B3C423,
    0xCFBA9599,
    0xB8BDA50F,
    0x2802B89E,
    0x5F058808,
    0xC60CD9B2,
    0xB10BE924,
    0x2F6F7C87,
    0x58684C11,
    0xC1611DAB,
    0xB6662D3D,
    0x76DC4190,
    0x01DB7106,
    0x98D220BC,
    0xEFD5102A,
    0x71B18589,
    0x06B6B51F,
    0x9FBFE4A5,
    0xE8B8D433,
    0x7807C9A2,
    0x0F00F934,
    0x9609A88E,
    0xE10E9818,
    0x7F6A0DBB,
    0x086D3D2D,
    0x91646C97,
    0xE6635C01,
    0x6B6B51F4,
    0x1C6C6162,
    0x856530D8,
    0xF262004E,
    0x6C0695ED,
    0x1B01A57B,
    0x8208F4C1,
    0xF50FC457,
    0x65B0D9C6,
    0x12B7E950,
    0x8BBEB8EA,
    0xFCB9887C,
    0x62DD1DDF,
    0x15DA2D49,
    0x8CD37CF3,
    0xFBD44C65,
    0x4DB26158,
    0x3AB551CE,
    0xA3BC0074,
    0xD4BB30E2,
    0x4ADFA541,
    0x3DD895D7,
    0xA4D1C46D,
    0xD3D6F4FB,
    0x4369E96A,
    0x346ED9FC,
    0xAD678846,
    0xDA60B8D0,
    0x44042D73,
    0x33031DE5,
    0xAA0A4C5F,
    0xDD0D7CC9,
    0x5005713C,
    0x270241AA,
    0xBE0B1010,
    0xC90C2086,
    0x5768B525,
    0x206F85B3,
    0xB966D409,
    0xCE61E49F,
    0x5EDEF90E,
    0x29D9C998,
    0xB0D09822,
    0xC7D7A8B4,
    0x59B33D17,
    0x2EB40D81,
    0xB7BD5C3B,
    0xC0BA6CAD,
    0xEDB88320,
    0x9ABFB3B6,
    0x03B6E20C,
    0x74B1D29A,
    0xEAD54739,
    0x9DD277AF,
    0x04DB2615,
    0x73DC1683,
    0xE3630B12,
    0x94643B84,
    0x0D6D6A3E,
    0x7A6A5AA8,
    0xE40ECF0B,
    0x9309FF9D,
    0x0A00AE27,
    0x7D079EB1,
    0xF00F9344,
    0x8708A3D2,
    0x1E01F268,
    0x6906C2FE,
    0xF762575D,
    0x806567CB,
    0x196C3671,
    0x6E6B06E7,
    0xFED41B76,
    0x89D32BE0,
    0x10DA7A5A,
    0x67DD4ACC,
    0xF9B9DF6F,
    0x8EBEEFF9,
    0x17B7BE43,
    0x60B08ED5,
    0xD6D6A3E8,
    0xA1D1937E,
    0x38D8C2C4,
    0x4FDFF252,
    0xD1BB67F1,
    0xA6BC5767,
    0x3FB506DD,
    0x48B2364B,
    0xD80D2BDA,
    0xAF0A1B4C,
    0x36034AF6,
    0x41047A60,
    0xDF60EFC3,
    0xA867DF55,
    0x316E8EEF,
    0x4669BE79,
    0xCB61B38C,
    0xBC66831A,
    0x256FD2A0,
    0x5268E236,
    0xCC0C7795,
    0xBB0B4703,
    0x220216B9,
    0x5505262F,
    0xC5BA3BBE,
    0xB2BD0B28,
    0x2BB45A92,
    0x5CB36A04,
    0xC2D7FFA7,
    0xB5D0CF31,
    0x2CD99E8B,
    0x5BDEAE1D,
    0x9B64C2B0,
    0xEC63F226,
    0x756AA39C,
    0x026D930A,
    0x9C0906A9,
    0xEB0E363F,
    0x72076785,
    0x05005713,
    0x95BF4A82,
    0xE2B87A14,
    0x7BB12BAE,
    0x0CB61B38,
    0x92D28E9B,
    0xE5D5BE0D,
    0x7CDCEFB7,
    0x0BDBDF21,
    0x86D3D2D4,
    0xF1D4E242,
    0x68DDB3F8,
    0x1FDA836E,
    0x81BE16CD,
    0xF6B9265B,
    0x6FB077E1,
    0x18B74777,
    0x88085AE6,
    0xFF0F6A70,
    0x66063BCA,
    0x11010B5C,
    0x8F659EFF,
    0xF862AE69,
    0x616BFFD3,
    0x166CCF45,
    0xA00AE278,
    0xD70DD2EE,
    0x4E048354,
    0x3903B3C2,
    0xA7672661,
    0xD06016F7,
    0x4969474D,
    0x3E6E77DB,
    0xAED16A4A,
    0xD9D65ADC,
    0x40DF0B66,
    0x37D83BF0,
    0xA9BCAE53,
    0xDEBB9EC5,
    0x47B2CF7F,
    0x30B5FFE9,
    0xBDBDF21C,
    0xCABAC28A,
    0x53B39330,
    0x24B4A3A6,
    0xBAD03605,
    0xCDD70693,
    0x54DE5729,
    0x23D967BF,
    0xB3667A2E,
    0xC4614AB8,
    0x5D681B02,
    0x2A6F2B94,
    0xB40BBE37,
    0xC30C8EA1,
    0x5A05DF1B,
    0x2D02EF8D
];
var lookupTable = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$util$2f$build$2f$module$2f$uint32ArrayFrom$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["uint32ArrayFrom"])(a_lookUpTable);
;
}),
"[project]/path/path-web/node_modules/@smithy/eventstream-codec/dist-es/Int64.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Int64",
    ()=>Int64
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-hex-encoding/dist-es/index.js [app-route] (ecmascript)");
;
class Int64 {
    bytes;
    constructor(bytes){
        this.bytes = bytes;
        if (bytes.byteLength !== 8) {
            throw new Error("Int64 buffers must be exactly 8 bytes");
        }
    }
    static fromNumber(number) {
        if (number > 9_223_372_036_854_775_807 || number < -9_223_372_036_854_775_808) {
            throw new Error(`${number} is too large (or, if negative, too small) to represent as an Int64`);
        }
        const bytes = new Uint8Array(8);
        for(let i = 7, remaining = Math.abs(Math.round(number)); i > -1 && remaining > 0; i--, remaining /= 256){
            bytes[i] = remaining;
        }
        if (number < 0) {
            negate(bytes);
        }
        return new Int64(bytes);
    }
    valueOf() {
        const bytes = this.bytes.slice(0);
        const negative = bytes[0] & 0b10000000;
        if (negative) {
            negate(bytes);
        }
        return parseInt((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(bytes), 16) * (negative ? -1 : 1);
    }
    toString() {
        return String(this.valueOf());
    }
}
function negate(bytes) {
    for(let i = 0; i < 8; i++){
        bytes[i] ^= 0xff;
    }
    for(let i = 7; i > -1; i--){
        bytes[i]++;
        if (bytes[i] !== 0) break;
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/eventstream-codec/dist-es/HeaderMarshaller.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HeaderMarshaller",
    ()=>HeaderMarshaller
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-hex-encoding/dist-es/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$Int64$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/eventstream-codec/dist-es/Int64.js [app-route] (ecmascript)");
;
;
class HeaderMarshaller {
    toUtf8;
    fromUtf8;
    constructor(toUtf8, fromUtf8){
        this.toUtf8 = toUtf8;
        this.fromUtf8 = fromUtf8;
    }
    format(headers) {
        const chunks = [];
        for (const headerName of Object.keys(headers)){
            const bytes = this.fromUtf8(headerName);
            chunks.push(Uint8Array.from([
                bytes.byteLength
            ]), bytes, this.formatHeaderValue(headers[headerName]));
        }
        const out = new Uint8Array(chunks.reduce((carry, bytes)=>carry + bytes.byteLength, 0));
        let position = 0;
        for (const chunk of chunks){
            out.set(chunk, position);
            position += chunk.byteLength;
        }
        return out;
    }
    formatHeaderValue(header) {
        switch(header.type){
            case "boolean":
                return Uint8Array.from([
                    header.value ? 0 : 1
                ]);
            case "byte":
                return Uint8Array.from([
                    2,
                    header.value
                ]);
            case "short":
                const shortView = new DataView(new ArrayBuffer(3));
                shortView.setUint8(0, 3);
                shortView.setInt16(1, header.value, false);
                return new Uint8Array(shortView.buffer);
            case "integer":
                const intView = new DataView(new ArrayBuffer(5));
                intView.setUint8(0, 4);
                intView.setInt32(1, header.value, false);
                return new Uint8Array(intView.buffer);
            case "long":
                const longBytes = new Uint8Array(9);
                longBytes[0] = 5;
                longBytes.set(header.value.bytes, 1);
                return longBytes;
            case "binary":
                const binView = new DataView(new ArrayBuffer(3 + header.value.byteLength));
                binView.setUint8(0, 6);
                binView.setUint16(1, header.value.byteLength, false);
                const binBytes = new Uint8Array(binView.buffer);
                binBytes.set(header.value, 3);
                return binBytes;
            case "string":
                const utf8Bytes = this.fromUtf8(header.value);
                const strView = new DataView(new ArrayBuffer(3 + utf8Bytes.byteLength));
                strView.setUint8(0, 7);
                strView.setUint16(1, utf8Bytes.byteLength, false);
                const strBytes = new Uint8Array(strView.buffer);
                strBytes.set(utf8Bytes, 3);
                return strBytes;
            case "timestamp":
                const tsBytes = new Uint8Array(9);
                tsBytes[0] = 8;
                tsBytes.set(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$Int64$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Int64"].fromNumber(header.value.valueOf()).bytes, 1);
                return tsBytes;
            case "uuid":
                if (!UUID_PATTERN.test(header.value)) {
                    throw new Error(`Invalid UUID received: ${header.value}`);
                }
                const uuidBytes = new Uint8Array(17);
                uuidBytes[0] = 9;
                uuidBytes.set((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromHex"])(header.value.replace(/\-/g, "")), 1);
                return uuidBytes;
        }
    }
    parse(headers) {
        const out = {};
        let position = 0;
        while(position < headers.byteLength){
            const nameLength = headers.getUint8(position++);
            const name = this.toUtf8(new Uint8Array(headers.buffer, headers.byteOffset + position, nameLength));
            position += nameLength;
            switch(headers.getUint8(position++)){
                case 0:
                    out[name] = {
                        type: BOOLEAN_TAG,
                        value: true
                    };
                    break;
                case 1:
                    out[name] = {
                        type: BOOLEAN_TAG,
                        value: false
                    };
                    break;
                case 2:
                    out[name] = {
                        type: BYTE_TAG,
                        value: headers.getInt8(position++)
                    };
                    break;
                case 3:
                    out[name] = {
                        type: SHORT_TAG,
                        value: headers.getInt16(position, false)
                    };
                    position += 2;
                    break;
                case 4:
                    out[name] = {
                        type: INT_TAG,
                        value: headers.getInt32(position, false)
                    };
                    position += 4;
                    break;
                case 5:
                    out[name] = {
                        type: LONG_TAG,
                        value: new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$Int64$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Int64"](new Uint8Array(headers.buffer, headers.byteOffset + position, 8))
                    };
                    position += 8;
                    break;
                case 6:
                    const binaryLength = headers.getUint16(position, false);
                    position += 2;
                    out[name] = {
                        type: BINARY_TAG,
                        value: new Uint8Array(headers.buffer, headers.byteOffset + position, binaryLength)
                    };
                    position += binaryLength;
                    break;
                case 7:
                    const stringLength = headers.getUint16(position, false);
                    position += 2;
                    out[name] = {
                        type: STRING_TAG,
                        value: this.toUtf8(new Uint8Array(headers.buffer, headers.byteOffset + position, stringLength))
                    };
                    position += stringLength;
                    break;
                case 8:
                    out[name] = {
                        type: TIMESTAMP_TAG,
                        value: new Date(new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$Int64$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Int64"](new Uint8Array(headers.buffer, headers.byteOffset + position, 8)).valueOf())
                    };
                    position += 8;
                    break;
                case 9:
                    const uuidBytes = new Uint8Array(headers.buffer, headers.byteOffset + position, 16);
                    position += 16;
                    out[name] = {
                        type: UUID_TAG,
                        value: `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(uuidBytes.subarray(0, 4))}-${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(uuidBytes.subarray(4, 6))}-${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(uuidBytes.subarray(6, 8))}-${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(uuidBytes.subarray(8, 10))}-${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(uuidBytes.subarray(10))}`
                    };
                    break;
                default:
                    throw new Error(`Unrecognized header type tag`);
            }
        }
        return out;
    }
}
var HEADER_VALUE_TYPE;
(function(HEADER_VALUE_TYPE) {
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["boolTrue"] = 0] = "boolTrue";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["boolFalse"] = 1] = "boolFalse";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["byte"] = 2] = "byte";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["short"] = 3] = "short";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["integer"] = 4] = "integer";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["long"] = 5] = "long";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["byteArray"] = 6] = "byteArray";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["string"] = 7] = "string";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["timestamp"] = 8] = "timestamp";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["uuid"] = 9] = "uuid";
})(HEADER_VALUE_TYPE || (HEADER_VALUE_TYPE = {}));
const BOOLEAN_TAG = "boolean";
const BYTE_TAG = "byte";
const SHORT_TAG = "short";
const INT_TAG = "integer";
const LONG_TAG = "long";
const BINARY_TAG = "binary";
const STRING_TAG = "string";
const TIMESTAMP_TAG = "timestamp";
const UUID_TAG = "uuid";
const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
}),
"[project]/path/path-web/node_modules/@smithy/eventstream-codec/dist-es/splitMessage.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "splitMessage",
    ()=>splitMessage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$crc32$2f$build$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/crc32/build/module/index.js [app-route] (ecmascript) <locals>");
;
const PRELUDE_MEMBER_LENGTH = 4;
const PRELUDE_LENGTH = PRELUDE_MEMBER_LENGTH * 2;
const CHECKSUM_LENGTH = 4;
const MINIMUM_MESSAGE_LENGTH = PRELUDE_LENGTH + CHECKSUM_LENGTH * 2;
function splitMessage({ byteLength, byteOffset, buffer }) {
    if (byteLength < MINIMUM_MESSAGE_LENGTH) {
        throw new Error("Provided message too short to accommodate event stream message overhead");
    }
    const view = new DataView(buffer, byteOffset, byteLength);
    const messageLength = view.getUint32(0, false);
    if (byteLength !== messageLength) {
        throw new Error("Reported message length does not match received message length");
    }
    const headerLength = view.getUint32(PRELUDE_MEMBER_LENGTH, false);
    const expectedPreludeChecksum = view.getUint32(PRELUDE_LENGTH, false);
    const expectedMessageChecksum = view.getUint32(byteLength - CHECKSUM_LENGTH, false);
    const checksummer = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$crc32$2f$build$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Crc32"]().update(new Uint8Array(buffer, byteOffset, PRELUDE_LENGTH));
    if (expectedPreludeChecksum !== checksummer.digest()) {
        throw new Error(`The prelude checksum specified in the message (${expectedPreludeChecksum}) does not match the calculated CRC32 checksum (${checksummer.digest()})`);
    }
    checksummer.update(new Uint8Array(buffer, byteOffset + PRELUDE_LENGTH, byteLength - (PRELUDE_LENGTH + CHECKSUM_LENGTH)));
    if (expectedMessageChecksum !== checksummer.digest()) {
        throw new Error(`The message checksum (${checksummer.digest()}) did not match the expected value of ${expectedMessageChecksum}`);
    }
    return {
        headers: new DataView(buffer, byteOffset + PRELUDE_LENGTH + CHECKSUM_LENGTH, headerLength),
        body: new Uint8Array(buffer, byteOffset + PRELUDE_LENGTH + CHECKSUM_LENGTH + headerLength, messageLength - headerLength - (PRELUDE_LENGTH + CHECKSUM_LENGTH + CHECKSUM_LENGTH))
    };
}
}),
"[project]/path/path-web/node_modules/@smithy/eventstream-codec/dist-es/EventStreamCodec.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EventStreamCodec",
    ()=>EventStreamCodec
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$crc32$2f$build$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-crypto/crc32/build/module/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$HeaderMarshaller$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/eventstream-codec/dist-es/HeaderMarshaller.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$splitMessage$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/eventstream-codec/dist-es/splitMessage.js [app-route] (ecmascript)");
;
;
;
class EventStreamCodec {
    headerMarshaller;
    messageBuffer;
    isEndOfStream;
    constructor(toUtf8, fromUtf8){
        this.headerMarshaller = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$HeaderMarshaller$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HeaderMarshaller"](toUtf8, fromUtf8);
        this.messageBuffer = [];
        this.isEndOfStream = false;
    }
    feed(message) {
        this.messageBuffer.push(this.decode(message));
    }
    endOfStream() {
        this.isEndOfStream = true;
    }
    getMessage() {
        const message = this.messageBuffer.pop();
        const isEndOfStream = this.isEndOfStream;
        return {
            getMessage () {
                return message;
            },
            isEndOfStream () {
                return isEndOfStream;
            }
        };
    }
    getAvailableMessages() {
        const messages = this.messageBuffer;
        this.messageBuffer = [];
        const isEndOfStream = this.isEndOfStream;
        return {
            getMessages () {
                return messages;
            },
            isEndOfStream () {
                return isEndOfStream;
            }
        };
    }
    encode({ headers: rawHeaders, body }) {
        const headers = this.headerMarshaller.format(rawHeaders);
        const length = headers.byteLength + body.byteLength + 16;
        const out = new Uint8Array(length);
        const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
        const checksum = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$crypto$2f$crc32$2f$build$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Crc32"]();
        view.setUint32(0, length, false);
        view.setUint32(4, headers.byteLength, false);
        view.setUint32(8, checksum.update(out.subarray(0, 8)).digest(), false);
        out.set(headers, 12);
        out.set(body, headers.byteLength + 12);
        view.setUint32(length - 4, checksum.update(out.subarray(8, length - 4)).digest(), false);
        return out;
    }
    decode(message) {
        const { headers, body } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$splitMessage$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["splitMessage"])(message);
        return {
            headers: this.headerMarshaller.parse(headers),
            body
        };
    }
    formatHeaders(rawHeaders) {
        return this.headerMarshaller.format(rawHeaders);
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/eventstream-codec/dist-es/MessageDecoderStream.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MessageDecoderStream",
    ()=>MessageDecoderStream
]);
class MessageDecoderStream {
    options;
    constructor(options){
        this.options = options;
    }
    [Symbol.asyncIterator]() {
        return this.asyncIterator();
    }
    async *asyncIterator() {
        for await (const bytes of this.options.inputStream){
            const decoded = this.options.decoder.decode(bytes);
            yield decoded;
        }
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/eventstream-codec/dist-es/MessageEncoderStream.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MessageEncoderStream",
    ()=>MessageEncoderStream
]);
class MessageEncoderStream {
    options;
    constructor(options){
        this.options = options;
    }
    [Symbol.asyncIterator]() {
        return this.asyncIterator();
    }
    async *asyncIterator() {
        for await (const msg of this.options.messageStream){
            const encoded = this.options.encoder.encode(msg);
            yield encoded;
        }
        if (this.options.includeEndFrame) {
            yield new Uint8Array(0);
        }
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/eventstream-codec/dist-es/SmithyMessageDecoderStream.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SmithyMessageDecoderStream",
    ()=>SmithyMessageDecoderStream
]);
class SmithyMessageDecoderStream {
    options;
    constructor(options){
        this.options = options;
    }
    [Symbol.asyncIterator]() {
        return this.asyncIterator();
    }
    async *asyncIterator() {
        for await (const message of this.options.messageStream){
            const deserialized = await this.options.deserializer(message);
            if (deserialized === undefined) continue;
            yield deserialized;
        }
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/eventstream-codec/dist-es/SmithyMessageEncoderStream.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SmithyMessageEncoderStream",
    ()=>SmithyMessageEncoderStream
]);
class SmithyMessageEncoderStream {
    options;
    constructor(options){
        this.options = options;
    }
    [Symbol.asyncIterator]() {
        return this.asyncIterator();
    }
    async *asyncIterator() {
        for await (const chunk of this.options.inputStream){
            const payloadBuf = this.options.serializer(chunk);
            yield payloadBuf;
        }
    }
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/eventstream-handler-node/dist-es/EventSigningStream.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EventSigningStream",
    ()=>EventSigningStream
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/stream [external] (stream, cjs)");
;
class EventSigningStream extends __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__["Transform"] {
    priorSignature;
    messageSigner;
    eventStreamCodec;
    systemClockOffsetProvider;
    constructor(options){
        super({
            autoDestroy: true,
            readableObjectMode: true,
            writableObjectMode: true,
            ...options
        });
        this.priorSignature = options.priorSignature;
        this.eventStreamCodec = options.eventStreamCodec;
        this.messageSigner = options.messageSigner;
        this.systemClockOffsetProvider = options.systemClockOffsetProvider;
    }
    async _transform(chunk, encoding, callback) {
        try {
            const now = new Date(Date.now() + await this.systemClockOffsetProvider());
            const dateHeader = {
                ":date": {
                    type: "timestamp",
                    value: now
                }
            };
            const signedMessage = await this.messageSigner.sign({
                message: {
                    body: chunk,
                    headers: dateHeader
                },
                priorSignature: this.priorSignature
            }, {
                signingDate: now
            });
            this.priorSignature = signedMessage.signature;
            const serializedSigned = this.eventStreamCodec.encode({
                headers: {
                    ...dateHeader,
                    ":chunk-signature": {
                        type: "binary",
                        value: getSignatureBinary(signedMessage.signature)
                    }
                },
                body: chunk
            });
            this.push(serializedSigned);
            return callback();
        } catch (err) {
            callback(err);
        }
    }
}
function getSignatureBinary(signature) {
    const buf = Buffer.from(signature, "hex");
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength / Uint8Array.BYTES_PER_ELEMENT);
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/eventstream-handler-node/dist-es/EventStreamPayloadHandler.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EventStreamPayloadHandler",
    ()=>EventStreamPayloadHandler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$EventStreamCodec$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/eventstream-codec/dist-es/EventStreamCodec.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/stream [external] (stream, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$eventstream$2d$handler$2d$node$2f$dist$2d$es$2f$EventSigningStream$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/eventstream-handler-node/dist-es/EventSigningStream.js [app-route] (ecmascript)");
;
;
;
class EventStreamPayloadHandler {
    messageSigner;
    eventStreamCodec;
    systemClockOffsetProvider;
    constructor(options){
        this.messageSigner = options.messageSigner;
        this.eventStreamCodec = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$EventStreamCodec$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EventStreamCodec"](options.utf8Encoder, options.utf8Decoder);
        this.systemClockOffsetProvider = async ()=>options.systemClockOffset ?? 0;
    }
    async handle(next, args, context = {}) {
        const request = args.request;
        const { body: payload, query } = request;
        if (!(payload instanceof __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__["Readable"])) {
            throw new Error("Eventstream payload must be a Readable stream.");
        }
        const payloadStream = payload;
        request.body = new __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__["PassThrough"]({
            objectMode: true
        });
        const match = request.headers?.authorization?.match(/Signature=([\w]+)$/);
        const priorSignature = match?.[1] ?? query?.["X-Amz-Signature"] ?? "";
        const signingStream = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$eventstream$2d$handler$2d$node$2f$dist$2d$es$2f$EventSigningStream$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EventSigningStream"]({
            priorSignature,
            eventStreamCodec: this.eventStreamCodec,
            messageSigner: await this.messageSigner(),
            systemClockOffsetProvider: this.systemClockOffsetProvider
        });
        (0, __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__["pipeline"])(payloadStream, signingStream, request.body, (err)=>{
            if (err) {
                throw err;
            }
        });
        let result;
        try {
            result = await next(args);
        } catch (e) {
            request.body.end();
            throw e;
        }
        return result;
    }
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/eventstream-handler-node/dist-es/provider.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "eventStreamPayloadHandlerProvider",
    ()=>eventStreamPayloadHandlerProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$eventstream$2d$handler$2d$node$2f$dist$2d$es$2f$EventStreamPayloadHandler$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/eventstream-handler-node/dist-es/EventStreamPayloadHandler.js [app-route] (ecmascript)");
;
const eventStreamPayloadHandlerProvider = (options)=>new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$eventstream$2d$handler$2d$node$2f$dist$2d$es$2f$EventStreamPayloadHandler$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EventStreamPayloadHandler"](options);
}),
"[project]/path/path-web/node_modules/@aws-sdk/token-providers/dist-es/fromEnvSigningName.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromEnvSigningName",
    ()=>fromEnvSigningName
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$client$2f$setTokenFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/client/setTokenFeature.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$getBearerTokenEnvKey$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/core/dist-es/submodules/httpAuthSchemes/utils/getBearerTokenEnvKey.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$TokenProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/TokenProviderError.js [app-route] (ecmascript)");
;
;
;
const fromEnvSigningName = ({ logger, signingName } = {})=>async ()=>{
        logger?.debug?.("@aws-sdk/token-providers - fromEnvSigningName");
        if (!signingName) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$TokenProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TokenProviderError"]("Please pass 'signingName' to compute environment variable key", {
                logger
            });
        }
        const bearerTokenKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$httpAuthSchemes$2f$utils$2f$getBearerTokenEnvKey$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getBearerTokenEnvKey"])(signingName);
        if (!(bearerTokenKey in process.env)) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$TokenProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TokenProviderError"](`Token not present in '${bearerTokenKey}' environment variable`, {
                logger
            });
        }
        const token = {
            token: process.env[bearerTokenKey]
        };
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$client$2f$setTokenFeature$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setTokenFeature"])(token, "BEARER_SERVICE_ENV_VARS", "3");
        return token;
    };
}),
"[project]/path/path-web/node_modules/@aws-sdk/token-providers/dist-es/constants.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EXPIRE_WINDOW_MS",
    ()=>EXPIRE_WINDOW_MS,
    "REFRESH_MESSAGE",
    ()=>REFRESH_MESSAGE
]);
const EXPIRE_WINDOW_MS = 5 * 60 * 1000;
const REFRESH_MESSAGE = `To refresh this SSO session run 'aws sso login' with the corresponding profile.`;
}),
"[project]/path/path-web/node_modules/@aws-sdk/token-providers/dist-es/getSsoOidcClient.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSsoOidcClient",
    ()=>getSsoOidcClient
]);
const getSsoOidcClient = async (ssoRegion, init = {}, callerClientConfig)=>{
    const { SSOOIDCClient } = await __turbopack_context__.A("[project]/path/path-web/node_modules/@aws-sdk/nested-clients/dist-es/submodules/sso-oidc/index.js [app-route] (ecmascript, async loader)");
    const coalesce = (prop)=>init.clientConfig?.[prop] ?? init.parentClientConfig?.[prop] ?? callerClientConfig?.[prop];
    const ssoOidcClient = new SSOOIDCClient(Object.assign({}, init.clientConfig ?? {}, {
        region: ssoRegion ?? init.clientConfig?.region,
        logger: coalesce("logger"),
        userAgentAppId: coalesce("userAgentAppId")
    }));
    return ssoOidcClient;
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/token-providers/dist-es/getNewSsoOidcToken.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getNewSsoOidcToken",
    ()=>getNewSsoOidcToken
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$getSsoOidcClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/token-providers/dist-es/getSsoOidcClient.js [app-route] (ecmascript)");
;
const getNewSsoOidcToken = async (ssoToken, ssoRegion, init = {}, callerClientConfig)=>{
    const { CreateTokenCommand } = await __turbopack_context__.A("[project]/path/path-web/node_modules/@aws-sdk/nested-clients/dist-es/submodules/sso-oidc/index.js [app-route] (ecmascript, async loader)");
    const ssoOidcClient = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$getSsoOidcClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSsoOidcClient"])(ssoRegion, init, callerClientConfig);
    return ssoOidcClient.send(new CreateTokenCommand({
        clientId: ssoToken.clientId,
        clientSecret: ssoToken.clientSecret,
        refreshToken: ssoToken.refreshToken,
        grantType: "refresh_token"
    }));
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/token-providers/dist-es/validateTokenExpiry.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "validateTokenExpiry",
    ()=>validateTokenExpiry
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$TokenProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/TokenProviderError.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/token-providers/dist-es/constants.js [app-route] (ecmascript)");
;
;
const validateTokenExpiry = (token)=>{
    if (token.expiration && token.expiration.getTime() < Date.now()) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$TokenProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TokenProviderError"](`Token is expired. ${__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REFRESH_MESSAGE"]}`, false);
    }
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/token-providers/dist-es/validateTokenKey.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "validateTokenKey",
    ()=>validateTokenKey
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$TokenProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/TokenProviderError.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/token-providers/dist-es/constants.js [app-route] (ecmascript)");
;
;
const validateTokenKey = (key, value, forRefresh = false)=>{
    if (typeof value === "undefined") {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$TokenProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TokenProviderError"](`Value not present for '${key}' in SSO Token${forRefresh ? ". Cannot refresh" : ""}. ${__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REFRESH_MESSAGE"]}`, false);
    }
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/token-providers/dist-es/writeSSOTokenToFile.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "writeSSOTokenToFile",
    ()=>writeSSOTokenToFile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getSSOTokenFilepath$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getSSOTokenFilepath.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
;
;
const { writeFile } = __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"];
const writeSSOTokenToFile = (id, ssoToken)=>{
    const tokenFilepath = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getSSOTokenFilepath$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSSOTokenFilepath"])(id);
    const tokenString = JSON.stringify(ssoToken, null, 2);
    return writeFile(tokenFilepath, tokenString);
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/token-providers/dist-es/fromSso.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromSso",
    ()=>fromSso
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$TokenProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/TokenProviderError.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getProfileName$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getProfileName.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getSSOTokenFromFile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/getSSOTokenFromFile.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$loadSsoSessionData$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/loadSsoSessionData.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$parseKnownFiles$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/shared-ini-file-loader/dist-es/parseKnownFiles.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/token-providers/dist-es/constants.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$getNewSsoOidcToken$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/token-providers/dist-es/getNewSsoOidcToken.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$validateTokenExpiry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/token-providers/dist-es/validateTokenExpiry.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$validateTokenKey$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/token-providers/dist-es/validateTokenKey.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$writeSSOTokenToFile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/token-providers/dist-es/writeSSOTokenToFile.js [app-route] (ecmascript)");
;
;
;
;
;
;
;
const lastRefreshAttemptTime = new Date(0);
const fromSso = (init = {})=>async ({ callerClientConfig } = {})=>{
        init.logger?.debug("@aws-sdk/token-providers - fromSso");
        const profiles = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$parseKnownFiles$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseKnownFiles"])(init);
        const profileName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getProfileName$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getProfileName"])({
            profile: init.profile ?? callerClientConfig?.profile
        });
        const profile = profiles[profileName];
        if (!profile) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$TokenProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TokenProviderError"](`Profile '${profileName}' could not be found in shared credentials file.`, false);
        } else if (!profile["sso_session"]) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$TokenProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TokenProviderError"](`Profile '${profileName}' is missing required property 'sso_session'.`);
        }
        const ssoSessionName = profile["sso_session"];
        const ssoSessions = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$loadSsoSessionData$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["loadSsoSessionData"])(init);
        const ssoSession = ssoSessions[ssoSessionName];
        if (!ssoSession) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$TokenProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TokenProviderError"](`Sso session '${ssoSessionName}' could not be found in shared credentials file.`, false);
        }
        for (const ssoSessionRequiredKey of [
            "sso_start_url",
            "sso_region"
        ]){
            if (!ssoSession[ssoSessionRequiredKey]) {
                throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$TokenProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TokenProviderError"](`Sso session '${ssoSessionName}' is missing required property '${ssoSessionRequiredKey}'.`, false);
            }
        }
        const ssoStartUrl = ssoSession["sso_start_url"];
        const ssoRegion = ssoSession["sso_region"];
        let ssoToken;
        try {
            ssoToken = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$shared$2d$ini$2d$file$2d$loader$2f$dist$2d$es$2f$getSSOTokenFromFile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSSOTokenFromFile"])(ssoSessionName);
        } catch (e) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$TokenProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TokenProviderError"](`The SSO session token associated with profile=${profileName} was not found or is invalid. ${__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REFRESH_MESSAGE"]}`, false);
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$validateTokenKey$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateTokenKey"])("accessToken", ssoToken.accessToken);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$validateTokenKey$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateTokenKey"])("expiresAt", ssoToken.expiresAt);
        const { accessToken, expiresAt } = ssoToken;
        const existingToken = {
            token: accessToken,
            expiration: new Date(expiresAt)
        };
        if (existingToken.expiration.getTime() - Date.now() > __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EXPIRE_WINDOW_MS"]) {
            return existingToken;
        }
        if (Date.now() - lastRefreshAttemptTime.getTime() < 30 * 1000) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$validateTokenExpiry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateTokenExpiry"])(existingToken);
            return existingToken;
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$validateTokenKey$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateTokenKey"])("clientId", ssoToken.clientId, true);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$validateTokenKey$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateTokenKey"])("clientSecret", ssoToken.clientSecret, true);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$validateTokenKey$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateTokenKey"])("refreshToken", ssoToken.refreshToken, true);
        try {
            lastRefreshAttemptTime.setTime(Date.now());
            const newSsoOidcToken = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$getNewSsoOidcToken$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getNewSsoOidcToken"])(ssoToken, ssoRegion, init, callerClientConfig);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$validateTokenKey$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateTokenKey"])("accessToken", newSsoOidcToken.accessToken);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$validateTokenKey$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateTokenKey"])("expiresIn", newSsoOidcToken.expiresIn);
            const newTokenExpiration = new Date(Date.now() + newSsoOidcToken.expiresIn * 1000);
            try {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$writeSSOTokenToFile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["writeSSOTokenToFile"])(ssoSessionName, {
                    ...ssoToken,
                    accessToken: newSsoOidcToken.accessToken,
                    expiresAt: newTokenExpiration.toISOString(),
                    refreshToken: newSsoOidcToken.refreshToken
                });
            } catch (error) {}
            return {
                token: newSsoOidcToken.accessToken,
                expiration: newTokenExpiration
            };
        } catch (error) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$validateTokenExpiry$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateTokenExpiry"])(existingToken);
            return existingToken;
        }
    };
}),
"[project]/path/path-web/node_modules/@aws-sdk/token-providers/dist-es/nodeProvider.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "nodeProvider",
    ()=>nodeProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$chain$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/chain.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$memoize$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/memoize.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$TokenProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/TokenProviderError.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$fromSso$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/token-providers/dist-es/fromSso.js [app-route] (ecmascript)");
;
;
const nodeProvider = (init = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$memoize$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["memoize"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$chain$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chain"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$token$2d$providers$2f$dist$2d$es$2f$fromSso$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromSso"])(init), async ()=>{
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$TokenProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TokenProviderError"]("Could not load token from any providers", false);
    }), (token)=>token.expiration !== undefined && token.expiration.getTime() - Date.now() < 300000, (token)=>token.expiration !== undefined);
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-user-agent-node/dist-es/nodeAppIdConfigOptions.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NODE_APP_ID_CONFIG_OPTIONS",
    ()=>NODE_APP_ID_CONFIG_OPTIONS,
    "UA_APP_ID_ENV_NAME",
    ()=>UA_APP_ID_ENV_NAME,
    "UA_APP_ID_INI_NAME",
    ()=>UA_APP_ID_INI_NAME
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$configurations$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/middleware-user-agent/dist-es/configurations.js [app-route] (ecmascript)");
;
const UA_APP_ID_ENV_NAME = "AWS_SDK_UA_APP_ID";
const UA_APP_ID_INI_NAME = "sdk_ua_app_id";
const UA_APP_ID_INI_NAME_DEPRECATED = "sdk-ua-app-id";
const NODE_APP_ID_CONFIG_OPTIONS = {
    environmentVariableSelector: (env)=>env[UA_APP_ID_ENV_NAME],
    configFileSelector: (profile)=>profile[UA_APP_ID_INI_NAME] ?? profile[UA_APP_ID_INI_NAME_DEPRECATED],
    default: __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$middleware$2d$user$2d$agent$2f$dist$2d$es$2f$configurations$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DEFAULT_UA_APP_ID"]
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-user-agent-node/dist-es/crt-availability.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "crtAvailability",
    ()=>crtAvailability
]);
const crtAvailability = {
    isCrtAvailable: false
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-user-agent-node/dist-es/is-crt-available.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isCrtAvailable",
    ()=>isCrtAvailable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$user$2d$agent$2d$node$2f$dist$2d$es$2f$crt$2d$availability$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-user-agent-node/dist-es/crt-availability.js [app-route] (ecmascript)");
;
const isCrtAvailable = ()=>{
    if (__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$user$2d$agent$2d$node$2f$dist$2d$es$2f$crt$2d$availability$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["crtAvailability"].isCrtAvailable) {
        return [
            "md/crt-avail"
        ];
    }
    return null;
};
}),
"[project]/path/path-web/node_modules/@aws-sdk/util-user-agent-node/dist-es/defaultUserAgent.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createDefaultUserAgentProvider",
    ()=>createDefaultUserAgentProvider,
    "defaultUserAgent",
    ()=>defaultUserAgent
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$os__$5b$external$5d$__$28$os$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/os [external] (os, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$process__$5b$external$5d$__$28$process$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/process [external] (process, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$user$2d$agent$2d$node$2f$dist$2d$es$2f$is$2d$crt$2d$available$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@aws-sdk/util-user-agent-node/dist-es/is-crt-available.js [app-route] (ecmascript)");
;
;
;
;
const createDefaultUserAgentProvider = ({ serviceId, clientVersion })=>{
    return async (config)=>{
        const sections = [
            [
                "aws-sdk-js",
                clientVersion
            ],
            [
                "ua",
                "2.1"
            ],
            [
                `os/${(0, __TURBOPACK__imported__module__$5b$externals$5d2f$os__$5b$external$5d$__$28$os$2c$__cjs$29$__["platform"])()}`,
                (0, __TURBOPACK__imported__module__$5b$externals$5d2f$os__$5b$external$5d$__$28$os$2c$__cjs$29$__["release"])()
            ],
            [
                "lang/js"
            ],
            [
                "md/nodejs",
                `${__TURBOPACK__imported__module__$5b$externals$5d2f$process__$5b$external$5d$__$28$process$2c$__cjs$29$__["versions"].node}`
            ]
        ];
        const crtAvailable = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$aws$2d$sdk$2f$util$2d$user$2d$agent$2d$node$2f$dist$2d$es$2f$is$2d$crt$2d$available$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isCrtAvailable"])();
        if (crtAvailable) {
            sections.push(crtAvailable);
        }
        if (serviceId) {
            sections.push([
                `api/${serviceId}`,
                clientVersion
            ]);
        }
        if (__TURBOPACK__imported__module__$5b$externals$5d2f$process__$5b$external$5d$__$28$process$2c$__cjs$29$__["env"].AWS_EXECUTION_ENV) {
            sections.push([
                `exec-env/${__TURBOPACK__imported__module__$5b$externals$5d2f$process__$5b$external$5d$__$28$process$2c$__cjs$29$__["env"].AWS_EXECUTION_ENV}`
            ]);
        }
        const appId = await config?.userAgentAppId?.();
        const resolvedUserAgent = appId ? [
            ...sections,
            [
                `app/${appId}`
            ]
        ] : [
            ...sections
        ];
        return resolvedUserAgent;
    };
};
const defaultUserAgent = createDefaultUserAgentProvider;
}),
"[project]/path/path-web/node_modules/@smithy/util-config-provider/dist-es/booleanSelector.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "booleanSelector",
    ()=>booleanSelector
]);
const booleanSelector = (obj, key, type)=>{
    if (!(key in obj)) return undefined;
    if (obj[key] === "true") return true;
    if (obj[key] === "false") return false;
    throw new Error(`Cannot load ${type} "${key}". Expected "true" or "false", got ${obj[key]}.`);
};
}),
"[project]/path/path-web/node_modules/@smithy/util-config-provider/dist-es/types.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SelectorType",
    ()=>SelectorType
]);
var SelectorType;
(function(SelectorType) {
    SelectorType["ENV"] = "env";
    SelectorType["CONFIG"] = "shared config entry";
})(SelectorType || (SelectorType = {}));
}),
"[project]/path/path-web/node_modules/@smithy/eventstream-serde-universal/dist-es/getChunkedStream.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getChunkedStream",
    ()=>getChunkedStream
]);
function getChunkedStream(source) {
    let currentMessageTotalLength = 0;
    let currentMessagePendingLength = 0;
    let currentMessage = null;
    let messageLengthBuffer = null;
    const allocateMessage = (size)=>{
        if (typeof size !== "number") {
            throw new Error("Attempted to allocate an event message where size was not a number: " + size);
        }
        currentMessageTotalLength = size;
        currentMessagePendingLength = 4;
        currentMessage = new Uint8Array(size);
        const currentMessageView = new DataView(currentMessage.buffer);
        currentMessageView.setUint32(0, size, false);
    };
    const iterator = async function*() {
        const sourceIterator = source[Symbol.asyncIterator]();
        while(true){
            const { value, done } = await sourceIterator.next();
            if (done) {
                if (!currentMessageTotalLength) {
                    return;
                } else if (currentMessageTotalLength === currentMessagePendingLength) {
                    yield currentMessage;
                } else {
                    throw new Error("Truncated event message received.");
                }
                return;
            }
            const chunkLength = value.length;
            let currentOffset = 0;
            while(currentOffset < chunkLength){
                if (!currentMessage) {
                    const bytesRemaining = chunkLength - currentOffset;
                    if (!messageLengthBuffer) {
                        messageLengthBuffer = new Uint8Array(4);
                    }
                    const numBytesForTotal = Math.min(4 - currentMessagePendingLength, bytesRemaining);
                    messageLengthBuffer.set(value.slice(currentOffset, currentOffset + numBytesForTotal), currentMessagePendingLength);
                    currentMessagePendingLength += numBytesForTotal;
                    currentOffset += numBytesForTotal;
                    if (currentMessagePendingLength < 4) {
                        break;
                    }
                    allocateMessage(new DataView(messageLengthBuffer.buffer).getUint32(0, false));
                    messageLengthBuffer = null;
                }
                const numBytesToWrite = Math.min(currentMessageTotalLength - currentMessagePendingLength, chunkLength - currentOffset);
                currentMessage.set(value.slice(currentOffset, currentOffset + numBytesToWrite), currentMessagePendingLength);
                currentMessagePendingLength += numBytesToWrite;
                currentOffset += numBytesToWrite;
                if (currentMessageTotalLength && currentMessageTotalLength === currentMessagePendingLength) {
                    yield currentMessage;
                    currentMessage = null;
                    currentMessageTotalLength = 0;
                    currentMessagePendingLength = 0;
                }
            }
        }
    };
    return {
        [Symbol.asyncIterator]: iterator
    };
}
}),
"[project]/path/path-web/node_modules/@smithy/eventstream-serde-universal/dist-es/getUnmarshalledStream.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getMessageUnmarshaller",
    ()=>getMessageUnmarshaller,
    "getUnmarshalledStream",
    ()=>getUnmarshalledStream
]);
function getUnmarshalledStream(source, options) {
    const messageUnmarshaller = getMessageUnmarshaller(options.deserializer, options.toUtf8);
    return {
        [Symbol.asyncIterator]: async function*() {
            for await (const chunk of source){
                const message = options.eventStreamCodec.decode(chunk);
                const type = await messageUnmarshaller(message);
                if (type === undefined) continue;
                yield type;
            }
        }
    };
}
function getMessageUnmarshaller(deserializer, toUtf8) {
    return async function(message) {
        const { value: messageType } = message.headers[":message-type"];
        if (messageType === "error") {
            const unmodeledError = new Error(message.headers[":error-message"].value || "UnknownError");
            unmodeledError.name = message.headers[":error-code"].value;
            throw unmodeledError;
        } else if (messageType === "exception") {
            const code = message.headers[":exception-type"].value;
            const exception = {
                [code]: message
            };
            const deserializedException = await deserializer(exception);
            if (deserializedException.$unknown) {
                const error = new Error(toUtf8(message.body));
                error.name = code;
                throw error;
            }
            throw deserializedException[code];
        } else if (messageType === "event") {
            const event = {
                [message.headers[":event-type"].value]: message
            };
            const deserialized = await deserializer(event);
            if (deserialized.$unknown) return;
            return deserialized;
        } else {
            throw Error(`Unrecognizable event type: ${message.headers[":event-type"].value}`);
        }
    };
}
}),
"[project]/path/path-web/node_modules/@smithy/eventstream-serde-universal/dist-es/EventStreamMarshaller.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EventStreamMarshaller",
    ()=>EventStreamMarshaller
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$EventStreamCodec$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/eventstream-codec/dist-es/EventStreamCodec.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$MessageDecoderStream$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/eventstream-codec/dist-es/MessageDecoderStream.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$MessageEncoderStream$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/eventstream-codec/dist-es/MessageEncoderStream.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$SmithyMessageDecoderStream$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/eventstream-codec/dist-es/SmithyMessageDecoderStream.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$SmithyMessageEncoderStream$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/eventstream-codec/dist-es/SmithyMessageEncoderStream.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$serde$2d$universal$2f$dist$2d$es$2f$getChunkedStream$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/eventstream-serde-universal/dist-es/getChunkedStream.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$serde$2d$universal$2f$dist$2d$es$2f$getUnmarshalledStream$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/eventstream-serde-universal/dist-es/getUnmarshalledStream.js [app-route] (ecmascript)");
;
;
;
class EventStreamMarshaller {
    eventStreamCodec;
    utfEncoder;
    constructor({ utf8Encoder, utf8Decoder }){
        this.eventStreamCodec = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$EventStreamCodec$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EventStreamCodec"](utf8Encoder, utf8Decoder);
        this.utfEncoder = utf8Encoder;
    }
    deserialize(body, deserializer) {
        const inputStream = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$serde$2d$universal$2f$dist$2d$es$2f$getChunkedStream$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getChunkedStream"])(body);
        return new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$SmithyMessageDecoderStream$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SmithyMessageDecoderStream"]({
            messageStream: new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$MessageDecoderStream$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MessageDecoderStream"]({
                inputStream,
                decoder: this.eventStreamCodec
            }),
            deserializer: (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$serde$2d$universal$2f$dist$2d$es$2f$getUnmarshalledStream$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getMessageUnmarshaller"])(deserializer, this.utfEncoder)
        });
    }
    serialize(inputStream, serializer) {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$MessageEncoderStream$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MessageEncoderStream"]({
            messageStream: new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$codec$2f$dist$2d$es$2f$SmithyMessageEncoderStream$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SmithyMessageEncoderStream"]({
                inputStream,
                serializer
            }),
            encoder: this.eventStreamCodec,
            includeEndFrame: true
        });
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/eventstream-serde-node/dist-es/utils.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "readabletoIterable",
    ()=>readabletoIterable
]);
async function* readabletoIterable(readStream) {
    let streamEnded = false;
    let generationEnded = false;
    const records = new Array();
    readStream.on("error", (err)=>{
        if (!streamEnded) {
            streamEnded = true;
        }
        if (err) {
            throw err;
        }
    });
    readStream.on("data", (data)=>{
        records.push(data);
    });
    readStream.on("end", ()=>{
        streamEnded = true;
    });
    while(!generationEnded){
        const value = await new Promise((resolve)=>setTimeout(()=>resolve(records.shift()), 0));
        if (value) {
            yield value;
        }
        generationEnded = streamEnded && records.length === 0;
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/eventstream-serde-node/dist-es/EventStreamMarshaller.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EventStreamMarshaller",
    ()=>EventStreamMarshaller
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$serde$2d$universal$2f$dist$2d$es$2f$EventStreamMarshaller$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/eventstream-serde-universal/dist-es/EventStreamMarshaller.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/stream [external] (stream, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$serde$2d$node$2f$dist$2d$es$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/eventstream-serde-node/dist-es/utils.js [app-route] (ecmascript)");
;
;
;
class EventStreamMarshaller {
    universalMarshaller;
    constructor({ utf8Encoder, utf8Decoder }){
        this.universalMarshaller = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$serde$2d$universal$2f$dist$2d$es$2f$EventStreamMarshaller$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EventStreamMarshaller"]({
            utf8Decoder,
            utf8Encoder
        });
    }
    deserialize(body, deserializer) {
        const bodyIterable = typeof body[Symbol.asyncIterator] === "function" ? body : (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$serde$2d$node$2f$dist$2d$es$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["readabletoIterable"])(body);
        return this.universalMarshaller.deserialize(bodyIterable, deserializer);
    }
    serialize(input, serializer) {
        return __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__["Readable"].from(this.universalMarshaller.serialize(input, serializer));
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/eventstream-serde-node/dist-es/provider.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "eventStreamSerdeProvider",
    ()=>eventStreamSerdeProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$serde$2d$node$2f$dist$2d$es$2f$EventStreamMarshaller$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/eventstream-serde-node/dist-es/EventStreamMarshaller.js [app-route] (ecmascript)");
;
const eventStreamSerdeProvider = (options)=>new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$eventstream$2d$serde$2d$node$2f$dist$2d$es$2f$EventStreamMarshaller$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EventStreamMarshaller"](options);
}),
"[project]/path/path-web/node_modules/@smithy/hash-node/dist-es/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Hash",
    ()=>Hash
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$buffer$2d$from$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-buffer-from/dist-es/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-utf8/dist-es/toUint8Array.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$buffer__$5b$external$5d$__$28$buffer$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/buffer [external] (buffer, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
;
;
;
class Hash {
    algorithmIdentifier;
    secret;
    hash;
    constructor(algorithmIdentifier, secret){
        this.algorithmIdentifier = algorithmIdentifier;
        this.secret = secret;
        this.reset();
    }
    update(toHash, encoding) {
        this.hash.update((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toUint8Array"])(castSourceData(toHash, encoding)));
    }
    digest() {
        return Promise.resolve(this.hash.digest());
    }
    reset() {
        this.hash = this.secret ? (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHmac"])(this.algorithmIdentifier, castSourceData(this.secret)) : (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHash"])(this.algorithmIdentifier);
    }
}
function castSourceData(toCast, encoding) {
    if (__TURBOPACK__imported__module__$5b$externals$5d2f$buffer__$5b$external$5d$__$28$buffer$2c$__cjs$29$__["Buffer"].isBuffer(toCast)) {
        return toCast;
    }
    if (typeof toCast === "string") {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$buffer$2d$from$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromString"])(toCast, encoding);
    }
    if (ArrayBuffer.isView(toCast)) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$buffer$2d$from$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromArrayBuffer"])(toCast.buffer, toCast.byteOffset, toCast.byteLength);
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$buffer$2d$from$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromArrayBuffer"])(toCast);
}
}),
"[project]/path/path-web/node_modules/@smithy/querystring-builder/dist-es/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildQueryString",
    ()=>buildQueryString
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$uri$2d$escape$2f$dist$2d$es$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-uri-escape/dist-es/escape-uri.js [app-route] (ecmascript)");
;
function buildQueryString(query) {
    const parts = [];
    for (let key of Object.keys(query).sort()){
        const value = query[key];
        key = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$uri$2d$escape$2f$dist$2d$es$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeUri"])(key);
        if (Array.isArray(value)) {
            for(let i = 0, iLen = value.length; i < iLen; i++){
                parts.push(`${key}=${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$uri$2d$escape$2f$dist$2d$es$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeUri"])(value[i])}`);
            }
        } else {
            let qsEntry = key;
            if (value || typeof value === "string") {
                qsEntry += `=${(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$uri$2d$escape$2f$dist$2d$es$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeUri"])(value)}`;
            }
            parts.push(qsEntry);
        }
    }
    return parts.join("&");
}
}),
"[project]/path/path-web/node_modules/@smithy/node-http-handler/dist-es/get-transformed-headers.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getTransformedHeaders",
    ()=>getTransformedHeaders
]);
const getTransformedHeaders = (headers)=>{
    const transformedHeaders = {};
    for (const name of Object.keys(headers)){
        const headerValues = headers[name];
        transformedHeaders[name] = Array.isArray(headerValues) ? headerValues.join(",") : headerValues;
    }
    return transformedHeaders;
};
;
}),
"[project]/path/path-web/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-pool.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NodeHttp2ConnectionPool",
    ()=>NodeHttp2ConnectionPool
]);
class NodeHttp2ConnectionPool {
    sessions = [];
    constructor(sessions){
        this.sessions = sessions ?? [];
    }
    poll() {
        if (this.sessions.length > 0) {
            return this.sessions.shift();
        }
    }
    offerLast(session) {
        this.sessions.push(session);
    }
    contains(session) {
        return this.sessions.includes(session);
    }
    remove(session) {
        this.sessions = this.sessions.filter((s)=>s !== session);
    }
    [Symbol.iterator]() {
        return this.sessions[Symbol.iterator]();
    }
    destroy(connection) {
        for (const session of this.sessions){
            if (session === connection) {
                if (!session.destroyed) {
                    session.destroy();
                }
            }
        }
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-manager.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NodeHttp2ConnectionManager",
    ()=>NodeHttp2ConnectionManager
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$http2__$5b$external$5d$__$28$http2$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/http2 [external] (http2, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$http$2d$handler$2f$dist$2d$es$2f$node$2d$http2$2d$connection$2d$pool$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-pool.js [app-route] (ecmascript)");
;
;
class NodeHttp2ConnectionManager {
    constructor(config){
        this.config = config;
        if (this.config.maxConcurrency && this.config.maxConcurrency <= 0) {
            throw new RangeError("maxConcurrency must be greater than zero.");
        }
    }
    config;
    sessionCache = new Map();
    lease(requestContext, connectionConfiguration) {
        const url = this.getUrlString(requestContext);
        const existingPool = this.sessionCache.get(url);
        if (existingPool) {
            const existingSession = existingPool.poll();
            if (existingSession && !this.config.disableConcurrency) {
                return existingSession;
            }
        }
        const session = __TURBOPACK__imported__module__$5b$externals$5d2f$http2__$5b$external$5d$__$28$http2$2c$__cjs$29$__["default"].connect(url);
        if (this.config.maxConcurrency) {
            session.settings({
                maxConcurrentStreams: this.config.maxConcurrency
            }, (err)=>{
                if (err) {
                    throw new Error("Fail to set maxConcurrentStreams to " + this.config.maxConcurrency + "when creating new session for " + requestContext.destination.toString());
                }
            });
        }
        session.unref();
        const destroySessionCb = ()=>{
            session.destroy();
            this.deleteSession(url, session);
        };
        session.on("goaway", destroySessionCb);
        session.on("error", destroySessionCb);
        session.on("frameError", destroySessionCb);
        session.on("close", ()=>this.deleteSession(url, session));
        if (connectionConfiguration.requestTimeout) {
            session.setTimeout(connectionConfiguration.requestTimeout, destroySessionCb);
        }
        const connectionPool = this.sessionCache.get(url) || new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$http$2d$handler$2f$dist$2d$es$2f$node$2d$http2$2d$connection$2d$pool$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NodeHttp2ConnectionPool"]();
        connectionPool.offerLast(session);
        this.sessionCache.set(url, connectionPool);
        return session;
    }
    deleteSession(authority, session) {
        const existingConnectionPool = this.sessionCache.get(authority);
        if (!existingConnectionPool) {
            return;
        }
        if (!existingConnectionPool.contains(session)) {
            return;
        }
        existingConnectionPool.remove(session);
        this.sessionCache.set(authority, existingConnectionPool);
    }
    release(requestContext, session) {
        const cacheKey = this.getUrlString(requestContext);
        this.sessionCache.get(cacheKey)?.offerLast(session);
    }
    destroy() {
        for (const [key, connectionPool] of this.sessionCache){
            for (const session of connectionPool){
                if (!session.destroyed) {
                    session.destroy();
                }
                connectionPool.remove(session);
            }
            this.sessionCache.delete(key);
        }
    }
    setMaxConcurrentStreams(maxConcurrentStreams) {
        if (maxConcurrentStreams && maxConcurrentStreams <= 0) {
            throw new RangeError("maxConcurrentStreams must be greater than zero.");
        }
        this.config.maxConcurrency = maxConcurrentStreams;
    }
    setDisableConcurrentStreams(disableConcurrentStreams) {
        this.config.disableConcurrency = disableConcurrentStreams;
    }
    getUrlString(request) {
        return request.destination.toString();
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/node-http-handler/dist-es/timing.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "timing",
    ()=>timing
]);
const timing = {
    setTimeout: (cb, ms)=>setTimeout(cb, ms),
    clearTimeout: (timeoutId)=>clearTimeout(timeoutId)
};
}),
"[project]/path/path-web/node_modules/@smithy/node-http-handler/dist-es/write-request-body.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "writeRequestBody",
    ()=>writeRequestBody
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/stream [external] (stream, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$http$2d$handler$2f$dist$2d$es$2f$timing$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/node-http-handler/dist-es/timing.js [app-route] (ecmascript)");
;
;
const MIN_WAIT_TIME = 6_000;
async function writeRequestBody(httpRequest, request, maxContinueTimeoutMs = MIN_WAIT_TIME, externalAgent = false) {
    const headers = request.headers ?? {};
    const expect = headers.Expect || headers.expect;
    let timeoutId = -1;
    let sendBody = true;
    if (!externalAgent && expect === "100-continue") {
        sendBody = await Promise.race([
            new Promise((resolve)=>{
                timeoutId = Number(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$http$2d$handler$2f$dist$2d$es$2f$timing$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["timing"].setTimeout(()=>resolve(true), Math.max(MIN_WAIT_TIME, maxContinueTimeoutMs)));
            }),
            new Promise((resolve)=>{
                httpRequest.on("continue", ()=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$http$2d$handler$2f$dist$2d$es$2f$timing$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["timing"].clearTimeout(timeoutId);
                    resolve(true);
                });
                httpRequest.on("response", ()=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$http$2d$handler$2f$dist$2d$es$2f$timing$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["timing"].clearTimeout(timeoutId);
                    resolve(false);
                });
                httpRequest.on("error", ()=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$http$2d$handler$2f$dist$2d$es$2f$timing$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["timing"].clearTimeout(timeoutId);
                    resolve(false);
                });
            })
        ]);
    }
    if (sendBody) {
        writeBody(httpRequest, request.body);
    }
}
function writeBody(httpRequest, body) {
    if (body instanceof __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__["Readable"]) {
        body.pipe(httpRequest);
        return;
    }
    if (body) {
        if (Buffer.isBuffer(body) || typeof body === "string") {
            httpRequest.end(body);
            return;
        }
        const uint8 = body;
        if (typeof uint8 === "object" && uint8.buffer && typeof uint8.byteOffset === "number" && typeof uint8.byteLength === "number") {
            httpRequest.end(Buffer.from(uint8.buffer, uint8.byteOffset, uint8.byteLength));
            return;
        }
        httpRequest.end(Buffer.from(body));
        return;
    }
    httpRequest.end();
}
}),
"[project]/path/path-web/node_modules/@smithy/node-http-handler/dist-es/node-http2-handler.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NodeHttp2Handler",
    ()=>NodeHttp2Handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpResponse$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/protocol-http/dist-es/httpResponse.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$querystring$2d$builder$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/querystring-builder/dist-es/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$http2__$5b$external$5d$__$28$http2$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/http2 [external] (http2, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$http$2d$handler$2f$dist$2d$es$2f$get$2d$transformed$2d$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/node-http-handler/dist-es/get-transformed-headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$http$2d$handler$2f$dist$2d$es$2f$node$2d$http2$2d$connection$2d$manager$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/node-http-handler/dist-es/node-http2-connection-manager.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$http$2d$handler$2f$dist$2d$es$2f$write$2d$request$2d$body$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/node-http-handler/dist-es/write-request-body.js [app-route] (ecmascript)");
;
;
;
;
;
;
class NodeHttp2Handler {
    config;
    configProvider;
    metadata = {
        handlerProtocol: "h2"
    };
    connectionManager = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$http$2d$handler$2f$dist$2d$es$2f$node$2d$http2$2d$connection$2d$manager$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NodeHttp2ConnectionManager"]({});
    static create(instanceOrOptions) {
        if (typeof instanceOrOptions?.handle === "function") {
            return instanceOrOptions;
        }
        return new NodeHttp2Handler(instanceOrOptions);
    }
    constructor(options){
        this.configProvider = new Promise((resolve, reject)=>{
            if (typeof options === "function") {
                options().then((opts)=>{
                    resolve(opts || {});
                }).catch(reject);
            } else {
                resolve(options || {});
            }
        });
    }
    destroy() {
        this.connectionManager.destroy();
    }
    async handle(request, { abortSignal, requestTimeout } = {}) {
        if (!this.config) {
            this.config = await this.configProvider;
            this.connectionManager.setDisableConcurrentStreams(this.config.disableConcurrentStreams || false);
            if (this.config.maxConcurrentStreams) {
                this.connectionManager.setMaxConcurrentStreams(this.config.maxConcurrentStreams);
            }
        }
        const { requestTimeout: configRequestTimeout, disableConcurrentStreams } = this.config;
        const effectiveRequestTimeout = requestTimeout ?? configRequestTimeout;
        return new Promise((_resolve, _reject)=>{
            let fulfilled = false;
            let writeRequestBodyPromise = undefined;
            const resolve = async (arg)=>{
                await writeRequestBodyPromise;
                _resolve(arg);
            };
            const reject = async (arg)=>{
                await writeRequestBodyPromise;
                _reject(arg);
            };
            if (abortSignal?.aborted) {
                fulfilled = true;
                const abortError = new Error("Request aborted");
                abortError.name = "AbortError";
                reject(abortError);
                return;
            }
            const { hostname, method, port, protocol, query } = request;
            let auth = "";
            if (request.username != null || request.password != null) {
                const username = request.username ?? "";
                const password = request.password ?? "";
                auth = `${username}:${password}@`;
            }
            const authority = `${protocol}//${auth}${hostname}${port ? `:${port}` : ""}`;
            const requestContext = {
                destination: new URL(authority)
            };
            const session = this.connectionManager.lease(requestContext, {
                requestTimeout: this.config?.sessionTimeout,
                disableConcurrentStreams: disableConcurrentStreams || false
            });
            const rejectWithDestroy = (err)=>{
                if (disableConcurrentStreams) {
                    this.destroySession(session);
                }
                fulfilled = true;
                reject(err);
            };
            const queryString = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$querystring$2d$builder$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildQueryString"])(query || {});
            let path = request.path;
            if (queryString) {
                path += `?${queryString}`;
            }
            if (request.fragment) {
                path += `#${request.fragment}`;
            }
            const req = session.request({
                ...request.headers,
                [__TURBOPACK__imported__module__$5b$externals$5d2f$http2__$5b$external$5d$__$28$http2$2c$__cjs$29$__["constants"].HTTP2_HEADER_PATH]: path,
                [__TURBOPACK__imported__module__$5b$externals$5d2f$http2__$5b$external$5d$__$28$http2$2c$__cjs$29$__["constants"].HTTP2_HEADER_METHOD]: method
            });
            session.ref();
            req.on("response", (headers)=>{
                const httpResponse = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpResponse$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpResponse"]({
                    statusCode: headers[":status"] || -1,
                    headers: (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$http$2d$handler$2f$dist$2d$es$2f$get$2d$transformed$2d$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getTransformedHeaders"])(headers),
                    body: req
                });
                fulfilled = true;
                resolve({
                    response: httpResponse
                });
                if (disableConcurrentStreams) {
                    session.close();
                    this.connectionManager.deleteSession(authority, session);
                }
            });
            if (effectiveRequestTimeout) {
                req.setTimeout(effectiveRequestTimeout, ()=>{
                    req.close();
                    const timeoutError = new Error(`Stream timed out because of no activity for ${effectiveRequestTimeout} ms`);
                    timeoutError.name = "TimeoutError";
                    rejectWithDestroy(timeoutError);
                });
            }
            if (abortSignal) {
                const onAbort = ()=>{
                    req.close();
                    const abortError = new Error("Request aborted");
                    abortError.name = "AbortError";
                    rejectWithDestroy(abortError);
                };
                if (typeof abortSignal.addEventListener === "function") {
                    const signal = abortSignal;
                    signal.addEventListener("abort", onAbort, {
                        once: true
                    });
                    req.once("close", ()=>signal.removeEventListener("abort", onAbort));
                } else {
                    abortSignal.onabort = onAbort;
                }
            }
            req.on("frameError", (type, code, id)=>{
                rejectWithDestroy(new Error(`Frame type id ${type} in stream id ${id} has failed with code ${code}.`));
            });
            req.on("error", rejectWithDestroy);
            req.on("aborted", ()=>{
                rejectWithDestroy(new Error(`HTTP/2 stream is abnormally aborted in mid-communication with result code ${req.rstCode}.`));
            });
            req.on("close", ()=>{
                session.unref();
                if (disableConcurrentStreams) {
                    session.destroy();
                }
                if (!fulfilled) {
                    rejectWithDestroy(new Error("Unexpected error: http2 request did not get a response"));
                }
            });
            writeRequestBodyPromise = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$http$2d$handler$2f$dist$2d$es$2f$write$2d$request$2d$body$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["writeRequestBody"])(req, request, effectiveRequestTimeout);
        });
    }
    updateHttpClientConfig(key, value) {
        this.config = undefined;
        this.configProvider = this.configProvider.then((config)=>{
            return {
                ...config,
                [key]: value
            };
        });
    }
    httpHandlerConfigs() {
        return this.config ?? {};
    }
    destroySession(session) {
        if (!session.destroyed) {
            session.destroy();
        }
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/node-http-handler/dist-es/stream-collector/collector.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Collector",
    ()=>Collector
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/stream [external] (stream, cjs)");
;
class Collector extends __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__["Writable"] {
    bufferedBytes = [];
    _write(chunk, encoding, callback) {
        this.bufferedBytes.push(chunk);
        callback();
    }
}
}),
"[project]/path/path-web/node_modules/@smithy/node-http-handler/dist-es/stream-collector/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "streamCollector",
    ()=>streamCollector
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$http$2d$handler$2f$dist$2d$es$2f$stream$2d$collector$2f$collector$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/node-http-handler/dist-es/stream-collector/collector.js [app-route] (ecmascript)");
;
const streamCollector = (stream)=>{
    if (isReadableStreamInstance(stream)) {
        return collectReadableStream(stream);
    }
    return new Promise((resolve, reject)=>{
        const collector = new __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$http$2d$handler$2f$dist$2d$es$2f$stream$2d$collector$2f$collector$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Collector"]();
        stream.pipe(collector);
        stream.on("error", (err)=>{
            collector.end();
            reject(err);
        });
        collector.on("error", reject);
        collector.on("finish", function() {
            const bytes = new Uint8Array(Buffer.concat(this.bufferedBytes));
            resolve(bytes);
        });
    });
};
const isReadableStreamInstance = (stream)=>typeof ReadableStream === "function" && stream instanceof ReadableStream;
async function collectReadableStream(stream) {
    const chunks = [];
    const reader = stream.getReader();
    let isDone = false;
    let length = 0;
    while(!isDone){
        const { done, value } = await reader.read();
        if (value) {
            chunks.push(value);
            length += value.length;
        }
        isDone = done;
    }
    const collected = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks){
        collected.set(chunk, offset);
        offset += chunk.length;
    }
    return collected;
}
}),
"[project]/path/path-web/node_modules/@smithy/util-body-length-node/dist-es/calculateBodyLength.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateBodyLength",
    ()=>calculateBodyLength
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
;
const calculateBodyLength = (body)=>{
    if (!body) {
        return 0;
    }
    if (typeof body === "string") {
        return Buffer.byteLength(body);
    } else if (typeof body.byteLength === "number") {
        return body.byteLength;
    } else if (typeof body.size === "number") {
        return body.size;
    } else if (typeof body.start === "number" && typeof body.end === "number") {
        return body.end + 1 - body.start;
    } else if (body instanceof __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["ReadStream"]) {
        if (body.path != null) {
            return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["lstatSync"])(body.path).size;
        } else if (typeof body.fd === "number") {
            return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["fstatSync"])(body.fd).size;
        }
    }
    throw new Error(`Body Length computation failed for ${body}`);
};
}),
"[project]/path/path-web/node_modules/@smithy/util-defaults-mode-node/dist-es/constants.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AWS_DEFAULT_REGION_ENV",
    ()=>AWS_DEFAULT_REGION_ENV,
    "AWS_EXECUTION_ENV",
    ()=>AWS_EXECUTION_ENV,
    "AWS_REGION_ENV",
    ()=>AWS_REGION_ENV,
    "DEFAULTS_MODE_OPTIONS",
    ()=>DEFAULTS_MODE_OPTIONS,
    "ENV_IMDS_DISABLED",
    ()=>ENV_IMDS_DISABLED,
    "IMDS_REGION_PATH",
    ()=>IMDS_REGION_PATH
]);
const AWS_EXECUTION_ENV = "AWS_EXECUTION_ENV";
const AWS_REGION_ENV = "AWS_REGION";
const AWS_DEFAULT_REGION_ENV = "AWS_DEFAULT_REGION";
const ENV_IMDS_DISABLED = "AWS_EC2_METADATA_DISABLED";
const DEFAULTS_MODE_OPTIONS = [
    "in-region",
    "cross-region",
    "mobile",
    "standard",
    "legacy"
];
const IMDS_REGION_PATH = "/latest/meta-data/placement/region";
}),
"[project]/path/path-web/node_modules/@smithy/util-defaults-mode-node/dist-es/defaultsModeConfig.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NODE_DEFAULTS_MODE_CONFIG_OPTIONS",
    ()=>NODE_DEFAULTS_MODE_CONFIG_OPTIONS
]);
const AWS_DEFAULTS_MODE_ENV = "AWS_DEFAULTS_MODE";
const AWS_DEFAULTS_MODE_CONFIG = "defaults_mode";
const NODE_DEFAULTS_MODE_CONFIG_OPTIONS = {
    environmentVariableSelector: (env)=>{
        return env[AWS_DEFAULTS_MODE_ENV];
    },
    configFileSelector: (profile)=>{
        return profile[AWS_DEFAULTS_MODE_CONFIG];
    },
    default: "legacy"
};
}),
"[project]/path/path-web/node_modules/@smithy/util-defaults-mode-node/dist-es/resolveDefaultsModeConfig.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveDefaultsModeConfig",
    ()=>resolveDefaultsModeConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$config$2d$resolver$2f$dist$2d$es$2f$regionConfig$2f$config$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/config-resolver/dist-es/regionConfig/config.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$config$2d$provider$2f$dist$2d$es$2f$configLoader$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/node-config-provider/dist-es/configLoader.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$memoize$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/property-provider/dist-es/memoize.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$defaults$2d$mode$2d$node$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-defaults-mode-node/dist-es/constants.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$defaults$2d$mode$2d$node$2f$dist$2d$es$2f$defaultsModeConfig$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-defaults-mode-node/dist-es/defaultsModeConfig.js [app-route] (ecmascript)");
;
;
;
;
;
const resolveDefaultsModeConfig = ({ region = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$config$2d$provider$2f$dist$2d$es$2f$configLoader$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["loadConfig"])(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$config$2d$resolver$2f$dist$2d$es$2f$regionConfig$2f$config$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NODE_REGION_CONFIG_OPTIONS"]), defaultsMode = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$config$2d$provider$2f$dist$2d$es$2f$configLoader$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["loadConfig"])(__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$defaults$2d$mode$2d$node$2f$dist$2d$es$2f$defaultsModeConfig$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NODE_DEFAULTS_MODE_CONFIG_OPTIONS"]) } = {})=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$property$2d$provider$2f$dist$2d$es$2f$memoize$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["memoize"])(async ()=>{
        const mode = typeof defaultsMode === "function" ? await defaultsMode() : defaultsMode;
        switch(mode?.toLowerCase()){
            case "auto":
                return resolveNodeDefaultsModeAuto(region);
            case "in-region":
            case "cross-region":
            case "mobile":
            case "standard":
            case "legacy":
                return Promise.resolve(mode?.toLocaleLowerCase());
            case undefined:
                return Promise.resolve("legacy");
            default:
                throw new Error(`Invalid parameter for "defaultsMode", expect ${__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$defaults$2d$mode$2d$node$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DEFAULTS_MODE_OPTIONS"].join(", ")}, got ${mode}`);
        }
    });
const resolveNodeDefaultsModeAuto = async (clientRegion)=>{
    if (clientRegion) {
        const resolvedRegion = typeof clientRegion === "function" ? await clientRegion() : clientRegion;
        const inferredRegion = await inferPhysicalRegion();
        if (!inferredRegion) {
            return "standard";
        }
        if (resolvedRegion === inferredRegion) {
            return "in-region";
        } else {
            return "cross-region";
        }
    }
    return "standard";
};
const inferPhysicalRegion = async ()=>{
    if (process.env[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$defaults$2d$mode$2d$node$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AWS_EXECUTION_ENV"]] && (process.env[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$defaults$2d$mode$2d$node$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AWS_REGION_ENV"]] || process.env[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$defaults$2d$mode$2d$node$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AWS_DEFAULT_REGION_ENV"]])) {
        return process.env[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$defaults$2d$mode$2d$node$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AWS_REGION_ENV"]] ?? process.env[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$defaults$2d$mode$2d$node$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AWS_DEFAULT_REGION_ENV"]];
    }
    if (!process.env[__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$defaults$2d$mode$2d$node$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ENV_IMDS_DISABLED"]]) {
        try {
            const { getInstanceMetadataEndpoint, httpRequest } = await __turbopack_context__.A("[project]/path/path-web/node_modules/@smithy/credential-provider-imds/dist-es/index.js [app-route] (ecmascript, async loader)");
            const endpoint = await getInstanceMetadataEndpoint();
            return (await httpRequest({
                ...endpoint,
                path: __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$defaults$2d$mode$2d$node$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["IMDS_REGION_PATH"]
            })).toString();
        } catch (e) {}
    }
};
}),
"[project]/path/path-web/node_modules/@smithy/util-base64/dist-es/fromBase64.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromBase64",
    ()=>fromBase64
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$buffer$2d$from$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-buffer-from/dist-es/index.js [app-route] (ecmascript)");
;
const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;
const fromBase64 = (input)=>{
    if (input.length * 3 % 4 !== 0) {
        throw new TypeError(`Incorrect padding on base64 string.`);
    }
    if (!BASE64_REGEX.exec(input)) {
        throw new TypeError(`Invalid base64 string.`);
    }
    const buffer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$buffer$2d$from$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromString"])(input, "base64");
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
};
}),
"[project]/path/path-web/node_modules/@smithy/util-base64/dist-es/toBase64.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toBase64",
    ()=>toBase64
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$buffer$2d$from$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-buffer-from/dist-es/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-utf8/dist-es/fromUtf8.js [app-route] (ecmascript)");
;
;
const toBase64 = (_input)=>{
    let input;
    if (typeof _input === "string") {
        input = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromUtf8"])(_input);
    } else {
        input = _input;
    }
    if (typeof input !== "object" || typeof input.byteOffset !== "number" || typeof input.byteLength !== "number") {
        throw new Error("@smithy/util-base64: toBase64 encoder function only accepts string | Uint8Array.");
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$buffer$2d$from$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromArrayBuffer"])(input.buffer, input.byteOffset, input.byteLength).toString("base64");
};
}),
"[project]/path/path-web/node_modules/@smithy/fetch-http-handler/dist-es/stream-collector.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "streamCollector",
    ()=>streamCollector
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$base64$2f$dist$2d$es$2f$fromBase64$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-base64/dist-es/fromBase64.js [app-route] (ecmascript)");
;
const streamCollector = async (stream)=>{
    if (typeof Blob === "function" && stream instanceof Blob || stream.constructor?.name === "Blob") {
        if (Blob.prototype.arrayBuffer !== undefined) {
            return new Uint8Array(await stream.arrayBuffer());
        }
        return collectBlob(stream);
    }
    return collectStream(stream);
};
async function collectBlob(blob) {
    const base64 = await readToBase64(blob);
    const arrayBuffer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$base64$2f$dist$2d$es$2f$fromBase64$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromBase64"])(base64);
    return new Uint8Array(arrayBuffer);
}
async function collectStream(stream) {
    const chunks = [];
    const reader = stream.getReader();
    let isDone = false;
    let length = 0;
    while(!isDone){
        const { done, value } = await reader.read();
        if (value) {
            chunks.push(value);
            length += value.length;
        }
        isDone = done;
    }
    const collected = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks){
        collected.set(chunk, offset);
        offset += chunk.length;
    }
    return collected;
}
function readToBase64(blob) {
    return new Promise((resolve, reject)=>{
        const reader = new FileReader();
        reader.onloadend = ()=>{
            if (reader.readyState !== 2) {
                return reject(new Error("Reader aborted too early"));
            }
            const result = reader.result ?? "";
            const commaIndex = result.indexOf(",");
            const dataOffset = commaIndex > -1 ? commaIndex + 1 : result.length;
            resolve(result.substring(dataOffset));
        };
        reader.onabort = ()=>reject(new Error("Read aborted"));
        reader.onerror = ()=>reject(reader.error);
        reader.readAsDataURL(blob);
    });
}
}),
"[project]/path/path-web/node_modules/@smithy/util-stream/dist-es/stream-type-check.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isBlob",
    ()=>isBlob,
    "isReadableStream",
    ()=>isReadableStream
]);
const isReadableStream = (stream)=>typeof ReadableStream === "function" && (stream?.constructor?.name === ReadableStream.name || stream instanceof ReadableStream);
const isBlob = (blob)=>{
    return typeof Blob === "function" && (blob?.constructor?.name === Blob.name || blob instanceof Blob);
};
}),
"[project]/path/path-web/node_modules/@smithy/util-stream/dist-es/sdk-stream-mixin.browser.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sdkStreamMixin",
    ()=>sdkStreamMixin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$fetch$2d$http$2d$handler$2f$dist$2d$es$2f$stream$2d$collector$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/fetch-http-handler/dist-es/stream-collector.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$base64$2f$dist$2d$es$2f$toBase64$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-base64/dist-es/toBase64.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-hex-encoding/dist-es/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-utf8/dist-es/toUtf8.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$stream$2f$dist$2d$es$2f$stream$2d$type$2d$check$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-stream/dist-es/stream-type-check.js [app-route] (ecmascript)");
;
;
;
;
;
const ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED = "The stream has already been transformed.";
const sdkStreamMixin = (stream)=>{
    if (!isBlobInstance(stream) && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$stream$2f$dist$2d$es$2f$stream$2d$type$2d$check$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isReadableStream"])(stream)) {
        const name = stream?.__proto__?.constructor?.name || stream;
        throw new Error(`Unexpected stream implementation, expect Blob or ReadableStream, got ${name}`);
    }
    let transformed = false;
    const transformToByteArray = async ()=>{
        if (transformed) {
            throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED);
        }
        transformed = true;
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$fetch$2d$http$2d$handler$2f$dist$2d$es$2f$stream$2d$collector$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["streamCollector"])(stream);
    };
    const blobToWebStream = (blob)=>{
        if (typeof blob.stream !== "function") {
            throw new Error("Cannot transform payload Blob to web stream. Please make sure the Blob.stream() is polyfilled.\n" + "If you are using React Native, this API is not yet supported, see: https://react-native.canny.io/feature-requests/p/fetch-streaming-body");
        }
        return blob.stream();
    };
    return Object.assign(stream, {
        transformToByteArray: transformToByteArray,
        transformToString: async (encoding)=>{
            const buf = await transformToByteArray();
            if (encoding === "base64") {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$base64$2f$dist$2d$es$2f$toBase64$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toBase64"])(buf);
            } else if (encoding === "hex") {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$hex$2d$encoding$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(buf);
            } else if (encoding === undefined || encoding === "utf8" || encoding === "utf-8") {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toUtf8"])(buf);
            } else if (typeof TextDecoder === "function") {
                return new TextDecoder(encoding).decode(buf);
            } else {
                throw new Error("TextDecoder is not available, please make sure polyfill is provided.");
            }
        },
        transformToWebStream: ()=>{
            if (transformed) {
                throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED);
            }
            transformed = true;
            if (isBlobInstance(stream)) {
                return blobToWebStream(stream);
            } else if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$stream$2f$dist$2d$es$2f$stream$2d$type$2d$check$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isReadableStream"])(stream)) {
                return stream;
            } else {
                throw new Error(`Cannot transform payload to web stream, got ${stream}`);
            }
        }
    });
};
const isBlobInstance = (stream)=>typeof Blob === "function" && stream instanceof Blob;
}),
"[project]/path/path-web/node_modules/@smithy/util-stream/dist-es/sdk-stream-mixin.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sdkStreamMixin",
    ()=>sdkStreamMixin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$http$2d$handler$2f$dist$2d$es$2f$stream$2d$collector$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/node-http-handler/dist-es/stream-collector/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$buffer$2d$from$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-buffer-from/dist-es/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/stream [external] (stream, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$stream$2f$dist$2d$es$2f$sdk$2d$stream$2d$mixin$2e$browser$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-stream/dist-es/sdk-stream-mixin.browser.js [app-route] (ecmascript)");
;
;
;
;
const ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED = "The stream has already been transformed.";
const sdkStreamMixin = (stream)=>{
    if (!(stream instanceof __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__["Readable"])) {
        try {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$stream$2f$dist$2d$es$2f$sdk$2d$stream$2d$mixin$2e$browser$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sdkStreamMixin"])(stream);
        } catch (e) {
            const name = stream?.__proto__?.constructor?.name || stream;
            throw new Error(`Unexpected stream implementation, expect Stream.Readable instance, got ${name}`);
        }
    }
    let transformed = false;
    const transformToByteArray = async ()=>{
        if (transformed) {
            throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED);
        }
        transformed = true;
        return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$node$2d$http$2d$handler$2f$dist$2d$es$2f$stream$2d$collector$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["streamCollector"])(stream);
    };
    return Object.assign(stream, {
        transformToByteArray,
        transformToString: async (encoding)=>{
            const buf = await transformToByteArray();
            if (encoding === undefined || Buffer.isEncoding(encoding)) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$buffer$2d$from$2f$dist$2d$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromArrayBuffer"])(buf.buffer, buf.byteOffset, buf.byteLength).toString(encoding);
            } else {
                const decoder = new TextDecoder(encoding);
                return decoder.decode(buf);
            }
        },
        transformToWebStream: ()=>{
            if (transformed) {
                throw new Error(ERR_MSG_STREAM_HAS_BEEN_TRANSFORMED);
            }
            if (stream.readableFlowing !== null) {
                throw new Error("The stream has been consumed by other callbacks.");
            }
            if (typeof __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__["Readable"].toWeb !== "function") {
                throw new Error("Readable.toWeb() is not supported. Please ensure a polyfill is available.");
            }
            transformed = true;
            return __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__["Readable"].toWeb(stream);
        }
    });
};
}),
"[project]/path/path-web/node_modules/@smithy/util-stream/dist-es/blob/Uint8ArrayBlobAdapter.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Uint8ArrayBlobAdapter",
    ()=>Uint8ArrayBlobAdapter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$base64$2f$dist$2d$es$2f$fromBase64$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-base64/dist-es/fromBase64.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$base64$2f$dist$2d$es$2f$toBase64$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-base64/dist-es/toBase64.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-utf8/dist-es/fromUtf8.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/util-utf8/dist-es/toUtf8.js [app-route] (ecmascript)");
;
;
class Uint8ArrayBlobAdapter extends Uint8Array {
    static fromString(source, encoding = "utf-8") {
        if (typeof source === "string") {
            if (encoding === "base64") {
                return Uint8ArrayBlobAdapter.mutate((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$base64$2f$dist$2d$es$2f$fromBase64$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromBase64"])(source));
            }
            return Uint8ArrayBlobAdapter.mutate((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromUtf8"])(source));
        }
        throw new Error(`Unsupported conversion from ${typeof source} to Uint8ArrayBlobAdapter.`);
    }
    static mutate(source) {
        Object.setPrototypeOf(source, Uint8ArrayBlobAdapter.prototype);
        return source;
    }
    transformToString(encoding = "utf-8") {
        if (encoding === "base64") {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$base64$2f$dist$2d$es$2f$toBase64$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toBase64"])(this);
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$util$2d$utf8$2f$dist$2d$es$2f$toUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toUtf8"])(this);
    }
}
}),
"[project]/path/path-web/node_modules/@aws-sdk/region-config-resolver/dist-es/extensions/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAwsRegionExtensionConfiguration",
    ()=>getAwsRegionExtensionConfiguration,
    "resolveAwsRegionExtensionConfiguration",
    ()=>resolveAwsRegionExtensionConfiguration
]);
const getAwsRegionExtensionConfiguration = (runtimeConfig)=>{
    return {
        setRegion (region) {
            runtimeConfig.region = region;
        },
        region () {
            return runtimeConfig.region;
        }
    };
};
const resolveAwsRegionExtensionConfiguration = (awsRegionExtensionConfiguration)=>{
    return {
        region: awsRegionExtensionConfiguration.region()
    };
};
}),
"[project]/path/path-web/node_modules/@smithy/middleware-serde/dist-es/deserializerMiddleware.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deserializerMiddleware",
    ()=>deserializerMiddleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpResponse$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/protocol-http/dist-es/httpResponse.js [app-route] (ecmascript)");
;
const deserializerMiddleware = (options, deserializer)=>(next, context)=>async (args)=>{
            const { response } = await next(args);
            try {
                const parsed = await deserializer(response, options);
                return {
                    response,
                    output: parsed
                };
            } catch (error) {
                Object.defineProperty(error, "$response", {
                    value: response,
                    enumerable: false,
                    writable: false,
                    configurable: false
                });
                if (!("$metadata" in error)) {
                    const hint = `Deserialization error: to see the raw response, inspect the hidden field {error}.$response on this object.`;
                    try {
                        error.message += "\n  " + hint;
                    } catch (e) {
                        if (!context.logger || context.logger?.constructor?.name === "NoOpLogger") {
                            console.warn(hint);
                        } else {
                            context.logger?.warn?.(hint);
                        }
                    }
                    if (typeof error.$responseBodyText !== "undefined") {
                        if (error.$response) {
                            error.$response.body = error.$responseBodyText;
                        }
                    }
                    try {
                        if (__TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$protocol$2d$http$2f$dist$2d$es$2f$httpResponse$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpResponse"].isInstance(response)) {
                            const { headers = {} } = response;
                            const headerEntries = Object.entries(headers);
                            error.$metadata = {
                                httpStatusCode: response.statusCode,
                                requestId: findHeader(/^x-[\w-]+-request-?id$/, headerEntries),
                                extendedRequestId: findHeader(/^x-[\w-]+-id-2$/, headerEntries),
                                cfId: findHeader(/^x-[\w-]+-cf-id$/, headerEntries)
                            };
                        }
                    } catch (e) {}
                }
                throw error;
            }
        };
const findHeader = (pattern, headers)=>{
    return (headers.find(([k])=>{
        return k.match(pattern);
    }) || [
        void 0,
        void 1
    ])[1];
};
}),
"[project]/path/path-web/node_modules/@smithy/middleware-serde/dist-es/serializerMiddleware.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "serializerMiddleware",
    ()=>serializerMiddleware
]);
const serializerMiddleware = (options, serializer)=>(next, context)=>async (args)=>{
            const endpointConfig = options;
            const endpoint = context.endpointV2?.url && endpointConfig.urlParser ? async ()=>endpointConfig.urlParser(context.endpointV2.url) : endpointConfig.endpoint;
            if (!endpoint) {
                throw new Error("No valid endpoint provider available.");
            }
            const request = await serializer(args.input, {
                ...options,
                endpoint
            });
            return next({
                ...args,
                request
            });
        };
}),
"[project]/path/path-web/node_modules/@smithy/middleware-serde/dist-es/serdePlugin.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deserializerMiddlewareOption",
    ()=>deserializerMiddlewareOption,
    "getSerdePlugin",
    ()=>getSerdePlugin,
    "serializerMiddlewareOption",
    ()=>serializerMiddlewareOption
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$serde$2f$dist$2d$es$2f$deserializerMiddleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/middleware-serde/dist-es/deserializerMiddleware.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$serde$2f$dist$2d$es$2f$serializerMiddleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/path/path-web/node_modules/@smithy/middleware-serde/dist-es/serializerMiddleware.js [app-route] (ecmascript)");
;
;
const deserializerMiddlewareOption = {
    name: "deserializerMiddleware",
    step: "deserialize",
    tags: [
        "DESERIALIZER"
    ],
    override: true
};
const serializerMiddlewareOption = {
    name: "serializerMiddleware",
    step: "serialize",
    tags: [
        "SERIALIZER"
    ],
    override: true
};
function getSerdePlugin(config, serializer, deserializer) {
    return {
        applyToStack: (commandStack)=>{
            commandStack.add((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$serde$2f$dist$2d$es$2f$deserializerMiddleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["deserializerMiddleware"])(config, deserializer), deserializerMiddlewareOption);
            commandStack.add((0, __TURBOPACK__imported__module__$5b$project$5d2f$path$2f$path$2d$web$2f$node_modules$2f40$smithy$2f$middleware$2d$serde$2f$dist$2d$es$2f$serializerMiddleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["serializerMiddleware"])(config, serializer), serializerMiddlewareOption);
        }
    };
}
}),
];

//# sourceMappingURL=03239_86952c25._.js.map