var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// durable/MemoryObject.js
var MemoryObject = class {
  static {
    __name(this, "MemoryObject");
  }
  constructor(state, env) {
    this.state = state;
  }
  async fetch(request) {
    const { pathname } = new URL(request.url);
    if (pathname === "/save") {
      const body = await request.json();
      await this.state.storage.put("history", body);
      return Response.json({ ok: true });
    }
    if (pathname === "/history") {
      const history = await this.state.storage.get("history") || [];
      return Response.json(history);
    }
    return new Response("Not found", { status: 404 });
  }
};

// functions/analyze.js
var analyze_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET") {
      const inputParam = url.searchParams.get("input");
      if (!inputParam) {
        return Response.json({
          message: "Security Analyzer API",
          usage: "Visit /?input=YOUR_CODE or POST with JSON body",
          examples: [
            "/?input=eval(userInput)",
            "/?input=https://example.com"
          ]
        });
      }
      const input2 = inputParam;
      let content2 = "";
      if (input2.startsWith("http://") || input2.startsWith("https://")) {
        try {
          const res = await fetch(input2);
          content2 = await res.text();
        } catch (e) {
          return Response.json(
            { error: "Could not fetch URL: " + e.message },
            { status: 400 }
          );
        }
      } else {
        content2 = input2;
      }
      const prompt2 = `
You are a security analyzer. Evaluate the following code or webpage HTML:

${content2}

Return JSON with:
- threat_score (0-100)
- issues (list of strings)
- suggested_rule (string)
      `;
      let aiResponse;
      try {
        aiResponse = await env.AI.run(
          "@cf/meta/llama-3.3",
          { prompt: prompt2 }
        );
      } catch (e) {
        return Response.json(
          { error: "AI request failed: " + e.message },
          { status: 500 }
        );
      }
      let parsed2;
      try {
        parsed2 = JSON.parse(aiResponse.response);
      } catch {
        parsed2 = {
          threat_score: 50,
          issues: ["LLM could not parse output"],
          suggested_rule: "None"
        };
      }
      try {
        const id = env.SECURITY_STATE.idFromName("global");
        const obj = env.SECURITY_STATE.get(id);
        let history = [];
        try {
          const historyResponse = await obj.fetch("http://fake-host/history");
          history = await historyResponse.json() || [];
        } catch (e) {
          console.log("No existing history, starting fresh");
        }
        history.push({
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          input: input2,
          ...parsed2
        });
        await obj.fetch("http://fake-host/save", {
          method: "POST",
          body: JSON.stringify(history)
        });
      } catch (e) {
        console.error("Failed to save to durable object:", e);
      }
      return Response.json(parsed2);
    }
    if (request.method !== "POST") {
      return Response.json(
        { error: "Method not allowed. Use GET with ?input= or POST." },
        { status: 405 }
      );
    }
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    const { input } = body;
    if (!input) {
      return Response.json(
        { error: "Missing 'input' field in request body" },
        { status: 400 }
      );
    }
    let content = "";
    if (input.startsWith("http://") || input.startsWith("https://")) {
      try {
        const res = await fetch(input);
        content = await res.text();
      } catch (e) {
        return Response.json(
          { error: "Could not fetch URL: " + e.message },
          { status: 400 }
        );
      }
    } else {
      content = input;
    }
    const prompt = `
You are a security analyzer. Analyze the following code or HTML.

Respond ONLY with raw JSON using this structure:

{
  "threat_score": <number 0-100>,
  "issues": ["issue1", "issue2"],
  "suggested_rule": "rule description"
}

DO NOT include any markdown, explanations, or extra text.

Code to analyze:
${content}
`;
    try {
      const id = env.SECURITY_STATE.idFromName("global");
      const obj = env.SECURITY_STATE.get(id);
      let history = [];
      try {
        const historyResponse = await obj.fetch("http://fake-host/history");
        history = await historyResponse.json() || [];
      } catch (e) {
        console.log("No existing history, starting fresh");
      }
      history.push({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        input,
        ...parsed
      });
      await obj.fetch("http://fake-host/save", {
        method: "POST",
        body: JSON.stringify(history)
      });
    } catch (e) {
      console.error("Failed to save to durable object:", e);
    }
    return Response.json(parsed);
  }
};

// ../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-PPb2uj/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = analyze_default;

// ../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-PPb2uj/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  MemoryObject,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=analyze.js.map
