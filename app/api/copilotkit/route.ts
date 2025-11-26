import {
  CopilotRuntime,
  GoogleGenerativeAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { HttpAgent } from "@ag-ui/client";
import { NextRequest } from "next/server";

// Handle CopilotKit runtime requests
export const POST = async (req: NextRequest) => {
  // Extract threadId from the request to use for session isolation
  const body = await req.json();

  console.log("🔵 API Route - Request Body:", JSON.stringify(body, null, 2));

  // ThreadId is in body.variables.data.threadId for CopilotKit GraphQL requests
  // Or potentially in other locations depending on the request type
  const threadId = body.variables?.data?.threadId || body.threadId || "default_thread";

  console.log("🔵 API Route - Extracted threadId:", threadId);

  // Check for Google API Key
  if (!process.env.GOOGLE_API_KEY) {
    console.error("❌ GOOGLE_API_KEY is missing in environment variables!");
    return new Response(
      JSON.stringify({ error: "Server configuration error: Missing GOOGLE_API_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  console.log("✅ GOOGLE_API_KEY found:", process.env.GOOGLE_API_KEY.substring(0, 5) + "...");

  try {
    // Create runtime with threadId-specific agent URL (pass threadId as header)
    // Create runtime with threadId-specific agent URL (pass threadId as header)
    const runtime = new CopilotRuntime({
      agents: {
        "search_agent": new HttpAgent({
          url: "http://localhost:8000/",
          headers: {
            "x-thread-id": threadId,  // Pass threadId to ADK agent
          }
        }),
      }
    });

    // Initialize the Google Generative AI Adapter
    // This enables CopilotKit to use Gemini for suggestions and other LLM features
    const serviceAdapter = new GoogleGenerativeAIAdapter({
      model: "gemini-2.5-flash", // Revert to 2.0 Flash as it is the only one not crashing
    });

    // Create a new request with the body
    const newReq = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: JSON.stringify(body),
    });

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: "/api/copilotkit",
    });

    return await handleRequest(newReq as any);
  } catch (error) {
    console.error("❌ Error in CopilotKit API route:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
