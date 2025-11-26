export default {
  async fetch(request, env) {
    // Handle different HTTP methods
    if (request.method === "GET") {
      return Response.json({
        message: "Security Analyzer API",
        usage: "POST with JSON body: { \"input\": \"code or URL\" }",
        example: {
          input: "https://example.com or your code here"
        }
      });
    }

    if (request.method !== "POST") {
      return Response.json(
        { error: "Method not allowed. Use POST." },
        { status: 405 }
      );
    }

    // Parse JSON only for POST requests
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

    // URL or code?
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
You are a security analyzer. Evaluate the following code or webpage HTML:

${content}

Return JSON with:
- threat_score (0-100)
- issues (list of strings)
- suggested_rule (string)
    `;

    let aiResponse;
    try {
      aiResponse = await env.AI.run(
        "@cf/meta/llama-3.3-70b-instruct",
        { prompt }
      );
    } catch (e) {
      return Response.json(
        { error: "AI request failed: " + e.message },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(aiResponse.response);
    } catch {
      parsed = {
        threat_score: 50,
        issues: ["LLM could not parse output"],
        suggested_rule: "None"
      };
    }

    // Save to durable object
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
        timestamp: new Date().toISOString(),
        input,
        ...parsed
      });

      await obj.fetch("http://fake-host/save", {
        method: "POST",
        body: JSON.stringify(history)
      });
    } catch (e) {
      console.error("Failed to save to durable object:", e);
      // Continue anyway - don't fail the request
    }

    return Response.json(parsed);
  }
};

export { MemoryObject } from "../durable/MemoryObject.js";