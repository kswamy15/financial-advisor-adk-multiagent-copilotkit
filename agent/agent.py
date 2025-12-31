"""
Google ADK Agent with Google Search Tool
This agent can search Google for information and provide sources with links.
Uses the built-in google_search tool from google.adk.tools.
"""
import os
import logging
from typing import Dict
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from ag_ui_adk import ADKAgent
from ag_ui.core.types import RunAgentInput
from ag_ui.encoder import EventEncoder
from ag_ui.core import RunErrorEvent, EventType
from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from google.adk.tools.google_search_tool import GoogleSearchTool
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

"""Financial coordinator: provide reasonable investment strategies."""
import prompt
from config import MODEL
from sub_agents.data_analyst import data_analyst_agent
from sub_agents.execution_analyst import execution_analyst_agent
from sub_agents.risk_analyst import risk_analyst_agent
from sub_agents.trading_analyst import trading_analyst_agent
from tools.yfinance_tools import get_stock_price


def create_agent(thread_id: str) -> ADKAgent:
    """Create a new agent instance for a specific thread."""
    """Returns a configured ADKAgent instance for the given thread."""
    # Create ADK middleware agent instance
    return ADKAgent(
        adk_agent=financial_coordinator,
        app_name="finacial_advisor_app",
        user_id=thread_id,  # Dynamically set based on threadId
        session_timeout_seconds=3600,
        use_in_memory_services=True
    )

# Sub-agent tools with descriptions
# We set descriptions after initialization because AgentTool.__init__ doesn't accept them in this version.
data_analyst_tool = AgentTool(agent=data_analyst_agent)
data_analyst_tool.description = "Call this to perform comprehensive market data analysis for a stock ticker."

trading_analyst_tool = AgentTool(agent=trading_analyst_agent)
trading_analyst_tool.description = "Call this to develop personalized trading strategies based on market data and user preferences."

execution_analyst_tool = AgentTool(agent=execution_analyst_agent)
execution_analyst_tool.description = "Call this to define a detailed execution plan for a trading strategy."

risk_analyst_tool = AgentTool(agent=risk_analyst_agent)
risk_analyst_tool.description = "Call this to perform a comprehensive risk evaluation of an entire investment plan."

# Global agent instance for evaluation and direct library access
# This is explicitly named 'financial_coordinator' but also exported as 'agent' and 'root_agent'
# to satisfy various ADK evaluation lookups.
financial_coordinator = LlmAgent(
    name="financial_coordinator",
    model=MODEL,
    description=(
        "Specialized Financial Advisory Assistant that orchestrates expert subagents "
        "to provide market analysis, trading strategies, and risk assessments."
    ),
    instruction=prompt.FINANCIAL_COORDINATOR_PROMPT,
    output_key="financial_coordinator_output",
    tools=[
        GoogleSearchTool(bypass_multi_tools_limit=True),
        data_analyst_tool,
        trading_analyst_tool,
        execution_analyst_tool,
        risk_analyst_tool,
    ],
)

# Mandatory exports for AgentEvaluator
agent = financial_coordinator
root_agent = financial_coordinator

async def get_agent_async():
    """Returns the configured agent instance for evaluation."""
    return financial_coordinator, "financial_coordinator"

class SessionManager:
    """Manages agent sessions by thread ID."""
    def __init__(self):
        self.sessions: Dict[str, ADKAgent] = {}

    def get_agent(self, thread_id: str) -> ADKAgent:
        if thread_id not in self.sessions:
            print(f"✨ Creating new agent session for thread: {thread_id}")
            self.sessions[thread_id] = create_agent(thread_id)
        return self.sessions[thread_id]

# Initialize Session Manager
session_manager = SessionManager()

# Create FastAPI app
app = FastAPI(
    title="Google Search ADK Agent",
    description="An ADK agent with Google Search capabilities for CopilotKit integration",
    version="1.0.0"
)

@app.post("/")
async def handle_request(input_data: RunAgentInput, request: Request):
    """Handle incoming requests and route to the appropriate agent session."""
    # Extract thread_id from header
    thread_id = request.headers.get("x-thread-id", "default_thread")
    logger.info(f"🔵 Agent - Received request for thread_id: {thread_id}")
    
    # Get or create agent for this thread
    agent = session_manager.get_agent(thread_id)
    
    # Get the accept header from the request
    accept_header = request.headers.get("accept")
    
    # Create an event encoder to properly format SSE events
    encoder = EventEncoder(accept=accept_header)
    
    async def event_generator():
        """Generate events from ADK agent."""
        try:
            async for event in agent.run(input_data):
                try:
                    encoded = encoder.encode(event)
                    logger.debug(f"HTTP Response: {encoded}")
                    yield encoded
                except Exception as encoding_error:
                    # Handle encoding-specific errors
                    logger.error(f"❌ Event encoding error: {encoding_error}", exc_info=True)
                    # Create a RunErrorEvent for encoding failures
                    error_event = RunErrorEvent(
                        type=EventType.RUN_ERROR,
                        message=f"Event encoding failed: {str(encoding_error)}",
                        code="ENCODING_ERROR"
                    )
                    try:
                        error_encoded = encoder.encode(error_event)
                        yield error_encoded
                    except Exception:
                        # If we can't even encode the error event, yield a basic SSE error
                        logger.error("Failed to encode error event, yielding basic SSE error")
                        yield "event: error\ndata: {\"error\": \"Event encoding failed\"}\n\n"
                    break  # Stop the stream after an encoding error
        except Exception as agent_error:
            # Handle errors from ADKAgent.run() itself
            logger.error(f"❌ ADKAgent error: {agent_error}", exc_info=True)
            # ADKAgent should have yielded a RunErrorEvent, but if something went wrong
            # in the async generator itself, we need to handle it
            try:
                error_event = RunErrorEvent(
                    type=EventType.RUN_ERROR,
                    message=f"Agent execution failed: {str(agent_error)}",
                    code="AGENT_ERROR"
                )
                error_encoded = encoder.encode(error_event)
                yield error_encoded
            except Exception:
                # If we can't encode the error event, yield a basic SSE error
                logger.error("Failed to encode agent error event, yielding basic SSE error")
                yield "event: error\ndata: {\"error\": \"Agent execution failed\"}\n\n"
    
    return StreamingResponse(event_generator(), media_type=encoder.get_content_type())

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "agent": "financial_coordinator",
        "sub_agents": ["data_analyst", "trading_analyst", "execution_analyst", "risk_analyst"],
        "tools": ["google_search", "yfinance"],
        "active_sessions": len(session_manager.sessions)
    }

# Run the server
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AGENT_PORT", "8000"))
    print(f"🚀 Starting Financial Advisor ADK Agent on http://localhost:{port}")
    print(f"📝 Health check: http://localhost:{port}/health")
    print(f"🔍 Agent endpoint: http://localhost:{port}/")
    uvicorn.run(app, host="0.0.0.0", port=port)
