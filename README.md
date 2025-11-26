# CopilotKit + Google ADK Search Assistant

A full-stack AI-powered search assistant with **advanced data visualization** and **user authentication**. Built with **CopilotKit** for the frontend and **Google ADK** (Agent Development Kit) for the backend.

## ✨ Features

### Core Features
- 🤖 **AI Financial Advisor**: Powered by Google Gemini 2.5 with comprehensive financial analysis
- 💬 **Interactive Chat Interface**: Beautiful, responsive chat UI with CopilotKit
- 🔐 **User Authentication**: Google OAuth, Microsoft OAuth, and email/password login
- 📚 **Per-User Chat Sessions**: Each user has isolated chat history (no longer shared!)
- 🎨 **Responsive Layout**: Resizable sidebar, fit-to-window content, no horizontal overflow
- 💡 **Smart Autocomplete**: Stock ticker and question template suggestions as you type
- 🎯 **Context-Aware Suggestions**: Programmatic suggestion buttons based on AI responses

### Data Visualization
- 📊 **Interactive Charts**: Click chart elements to ask context-specific questions
- 📈 **Multiple Chart Types**: Pie, Bar, Line, and Area charts with live switching
- 📋 **Rich Data Tables**: Sortable, searchable tables with gradient headers
- 🔄 **Smart View Detection**: Auto-detects table format and defaults to table view
- 🎛️ **Column Selectors**: Choose which columns to visualize for multi-dimensional data
- ↔️ **Expand/Collapse**: Fit charts within window or expand for detailed viewing

### Advanced UI Features
- 🔗 **Clickable Source Links**: View source details in a popup modal
- 💾 **Persistent Selections**: Chart type and column choices saved per chart
- 📏 **Resizable Sidebar**: Drag-to-resize chat history pane (200px - 500px)
- 🐛 **Persistence Debugger**: Draggable modal for development/debugging
- 🎯 **Smart Defaults**: Auto-detects best columns for visualization

## Architecture

- **Frontend**: Next.js 15 + React 19 + TypeScript + TailwindCSS + CopilotKit + Recharts
- **Backend**: Python + FastAPI + Google ADK + AG-UI
- **Charts**: Recharts library with custom interactions
- **Auth**: React Context with localStorage persistence
- **Integration**: CopilotKit Runtime connecting frontend to ADK agent

## Prerequisites

- Node.js 20+
- Python 3.10+
- Google API Key for Gemini ([Get one here](https://makersuite.google.com/app/apikey))
- (Optional) Google Custom Search API credentials for real search results

## Installation

### 1. Clone and Install Frontend Dependencies

```bash
npm install
```

### 2. Install Python/Agent Dependencies

```bash
npm run install:agent
# or manually:
# cd agent && pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create `agent/.env` file:

```bash
cp agent/.env.example agent/.env
```

Edit `agent/.env` and add your Google API key:

```env
GOOGLE_API_KEY=your_google_api_key_here
```

**Optional**: For real Google Search results:

```env
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_custom_search_engine_id_here
```

## Running the Application

### Start Both Frontend and Backend Together

```bash
npm run dev
```

This starts:
- Frontend on `http://localhost:3000`
- Backend agent on `http://localhost:8000`

### Or Start Them Separately

**Terminal 1 - Backend Agent:**
```bash
npm run dev:agent
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

## Usage Guide

### Getting Started
1. Open `http://localhost:3000`
2. Click "Sign In" or create an account (mock authentication)
3. Start chatting with the AI assistant

### Understanding the Multi-Agent System

The financial advisor uses a **coordinated multi-agent architecture** to provide comprehensive financial analysis:

**🎯 Financial Coordinator** (Main Agent)
- Orchestrates the entire workflow and coordinates between specialized sub-agents
- Determines which agents to call based on your questions
- Synthesizes insights from all sub-agents into coherent advice
- **Accesses Google Search** to answer general questions and provide real-time information

**📊 Data Analyst Agent**
- Fetches real-time market data using yfinance
- Analyzes stock prices, volumes, and historical trends
- Provides fundamental data like P/E ratios, market cap, dividends
- **Creates interactive visualizations**: Charts (pie, bar, line, area) and data tables
- Formats data in structured JSON for automatic rendering in the UI

**💹 Trading Analyst Agent**
- Develops trading strategies based on data analysis
- Suggests entry/exit points and position sizing
- Considers technical indicators and market conditions

**⚙️ Execution Analyst Agent**
- Creates detailed execution plans for trading strategies
- Recommends order types (market, limit, stop-loss)
- Considers timing, liquidity, and transaction costs

**⚠️ Risk Analyst Agent**
- Evaluates risk factors for proposed strategies
- Assesses volatility, drawdown potential, and correlation
- Provides risk-adjusted performance metrics

**How it works:**
When you ask a question like "Analyze AAPL stock", the Financial Coordinator:
1. Calls the **Data Analyst** to fetch current AAPL data
2. Calls the **Trading Analyst** to suggest strategies based on the data
3. Calls the **Execution Analyst** to create an execution plan
4. Calls the **Risk Analyst** to evaluate the overall risk
5. Synthesizes all insights into a comprehensive response

### Creating Visualizations

**Request Charts:**
```
"Show me a pie chart of top programming languages"
"Create a bar chart comparing GDP of countries"
```

**Request Tables:**
```
"Can you provide the yearly GDP of USA, India, Japan, China from 2010 to 2020"
```

The agent will deliver structured data that renders as interactive charts or tables.

### Interacting with Data

**Charts:**
1. Click any chart element → Pre-fills question about that data
2. Click "Copy Question" → Paste into chat
3. Toggle chart types: 🥧 Pie, 📊 Bar, 📈 Line, 📉 Area
4. Click "Expand" for full-width view

**Tables:**
1. Click column headers to sort
2. Use search box to filter
3. Click rows to ask about specific data
4. Toggle to chart view with column selectors
5. Choose category and value columns to visualize

### Chat Management
- **New Chat**: Start fresh conversation
- **Rename**: Click pencil icon on chat session
- **Delete**: Remove old conversations
- **Per-User Isolation**: Each user's chats are private

## Project Structure

```
financial_advisor-llm-adapter/
├── agent/                          # Python backend
│   ├── agent.py                   # Google ADK agent with financial tools
│   ├── prompt.py                  # Agent instructions and prompts
│   ├── config.py                  # Configuration (Gemini 2.5 Flash)
│   ├── requirements.txt           # Python dependencies
│   └── .env                       # Environment variables (create this)
│  
├── app/                           # Next.js app directory
│   ├── api/
│   │   └── copilotkit/
│   │       └── route.ts          # CopilotKit runtime endpoint
│   ├── globals.css               # Global styles + custom scrollbar
│   ├── layout.tsx                # Root layout with providers
│   └── page.tsx                  # Main page with chat UI, auth, sessions
│  
├── components/                    # React components
│   ├── ChartInjector.tsx         # Detects & renders chart/table data
│   ├── ChartRenderer.tsx         # Interactive charts with auto table detection
│   ├── DataTable.tsx             # Rich table with sort/search/filter
│   ├── ChatAutocomplete.tsx      # Smart autocomplete for tickers & templates (NEW!)
│   ├── FinancialSuggestions.tsx  # Programmatic suggestion system (NEW!)
│   ├── ChatMessageEnhancer.tsx   # Enhances chat messages with features
│   ├── LoginModal.tsx            # Authentication modal
│   ├── UserAvatar.tsx            # User menu dropdown
│   └── SourceModal.tsx           # Source details popup
│  
├── contexts/                      # React contexts
│   ├── AuthContext.tsx           # User authentication state
│   └── ChartContext.tsx          # Chart selection & click-to-ask
│  
├── lib/                          # Utilities
│   ├── chartParser.ts            # Parse chart JSON from agent responses
│   └── autocompleteData.ts       # Stock tickers & question templates (NEW!)
│  
├── .agent/workflows/             # Custom workflows
│   └── run-backend-conda.md     # Workflow for conda environment
│  
├── package.json                  # Frontend dependencies
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── README.md                     # This file
```

## Key Features Explained

### ✅ Per-User Chat Sessions (NEW!)

**FIXED**: Chat sessions are now isolated per user!

- Each user has their own chat history stored in localStorage
- Creating "New Chat" creates a truly independent conversation
- No shared state between users or sessions
- Session management with create, rename, delete

### 📊 Interactive Charts (NEW!)

Charts are fully interactive with click-to-ask functionality:

1. **Click Elements**: Click any bar, slice, or data point
2. **Pre-filled Questions**: Chat input auto-populates with contextual question
3. **Visual Feedback**: Hover states, active states, selection indicators
4. **Copy Feature**: "Copy Question" button for easy use

### 📋 Data Tables (NEW!)

Rich, feature-complete data tables:

- **Sortable**: Click column headers to sort ascending/descending
- **Searchable**: Filter across all columns in real-time
- **Beautiful**: Blue-purple gradient headers, zebra striping
- **Clickable Rows**: Click to ask about specific data
- **Responsive**: Horizontal scroll for wide tables

### 🎛️ Column Selectors (NEW!)

For multi-year/multi-metric data:

- **Category Selector**: Choose column for labels (Country, Product, etc.)
- **Value Selector**: Choose column for data (Year, Sales, etc.)
- **Live Updates**: Chart refreshes on selection change
- **Smart Defaults**: Auto-selects first column and first numeric column

### 📏 Resizable Layout (NEW!)

Complete responsive layout control:

- **Drag Sidebar Edge**: 4px drag handle, 200px - 500px range
- **Persistent Width**: Saved across sessions
- **Fit/Expand Toggle**: Charts default to fit, expand when needed
- **No Overflow**: Content stays within window bounds

### 💡 Smart Autocomplete (NEW!)

Real-time autocomplete as you type in the chat:

- **30 Popular Stock Tickers**: AAPL, MSFT, GOOGL, AMZN, etc.
- **7 Question Templates**: "Analyze AAPL", "Compare AAPL and MSFT", etc.
- **Keyboard Navigation**: ↑↓ arrows, Enter to select, Esc to close
- **Smart Filtering**: Matches ticker symbols and company names
- **Type Detection**: Visual icons (📈 for tickers, 💭 for templates)
- **Session Persistence**: Works across new chat sessions automatically

**Usage:**
- Type "AA" → See Apple, American Airlines
- Type "analyze" → See analysis question templates
- Type "comp" → See comparison templates

### 🎯 Programmatic Suggestions (NEW!)

Context-aware suggestion buttons based on AI responses:

- **Pattern Detection**: Analyzes AI messages to suggest relevant replies
- **Risk & Investment**: "Conservative, Short-term", "Moderate, Medium-term"
- **Strategy Selection**: "Strategy 1", "Strategy 2", etc.
- **Yes/No Questions**: Simple yes/no/not sure options
- **Deep Dive**: "Risks", "Comparisons", "Show markdown"
- **Smart Visibility**: Only appears when AI asks for input
- **Instant Response**: No LLM overhead, 100% reliable

**How it works:**
- AI asks for risk preference → Shows risk/period combinations
- AI lists strategies → Shows strategy selection buttons
- AI provides analysis → Hides (doesn't show irrelevant suggestions)

### 🔄 Smart Table Detection (NEW!)

Automatic table view for table-formatted data:

- **Auto-Detection**: Checks `data.type === 'table'` or title contains "Table Format"
- **Default View**: Automatically shows table view instead of chart
- **User Override**: Can still toggle to chart view if preferred
- **Persistent Choice**: Remembers user's view preference per chart

## How the Agent Works

### Agent Instructions

The agent (`agent/agent.py`) knows how to:

1. **Search Google**: Uses google_search tool for real-time information
2. **Format Sources**: Returns markdown links with [Title](URL) format
3. **Deliver Charts**: Returns chart data in `chart-json` code blocks
4. **Deliver Tables**: Returns table data with proper column structure

### Chart Data Format

```json
{
  "type": "pie",
  "title": "Programming Languages",
  "data": [
    {"name": "JavaScript", "value": 45},
    {"name": "Python", "value": 30}
  ]
}
```

### Table Data Format

```json
{
  "type": "table",
  "title": "GDP by Country (2010-2020)",
  "data": [
    {"Country": "USA", "2010": 14964372, "2011": 15517926},
    {"Country": "China", "2010": 6087192, "2011": 7551500}
  ]
}
```

## Customization

### Modify Agent Behavior

Edit `agent/agent.py` to customize the financial coordinator:

```python
financial_coordinator = LlmAgent(
    name="financial_coordinator",
    model=MODEL,  # Gemini 2.5 Flash (see config.py)
    description=(
        "guide users through a structured process to receive financial "
        "advice by orchestrating a series of expert subagents. help them "
        "analyze a market ticker, develop trading strategies, define "
        "execution plans, and evaluate the overall risk."
    ),
    instruction=prompt.FINANCIAL_COORDINATOR_PROMPT,
    output_key="financial_coordinator_output",
    tools=[
        google_search,  # For general questions
        AgentTool(agent=data_analyst_agent),
        AgentTool(agent=trading_analyst_agent),
        AgentTool(agent=execution_analyst_agent),
        AgentTool(agent=risk_analyst_agent),
    ],
)
```

**Multi-Agent Architecture:**
- **Financial Coordinator**: Main agent that orchestrates the workflow
- **Data Analyst**: Analyzes market data and ticker information (uses yfinance)
- **Trading Analyst**: Develops trading strategies based on data analysis
- **Execution Analyst**: Creates execution plans for trading strategies
- **Risk Analyst**: Evaluates risk factors and provides risk assessment

Each sub-agent is located in `agent/sub_agents/` with its own specialized prompt and tools.

### Customize UI

- **Layout**: `app/page.tsx`
- **Charts**: `components/ChartRenderer.tsx`
- **Tables**: `components/DataTable.tsx`
- **Auth**: `contexts/AuthContext.tsx`
- **Styles**: `app/globals.css`

### Add New Chart Types

1. Update `chartParser.ts` types
2. Add render function in `ChartRenderer.tsx`
3. Add button to chart type selector

## Troubleshooting

### Agent Not Starting

- Install dependencies: `pip install -r agent/requirements.txt`
- Verify `GOOGLE_API_KEY` in `agent/.env`
- Check port 8000 availability

### Charts Not Rendering

- Check browser console for errors
- Verify JSON format in agent response
- Look for `chart-json` code blocks in response

### Authentication Issues

- Authentication is mock/local only (no real backend)
- Data stored in browser localStorage
- Clear localStorage to reset

### Sidebar Not Resizing

- Look for 4px gray bar on sidebar right edge
- Ensure mouse cursor changes to resize cursor
- Try clicking and dragging slowly

## Learn More

- [CopilotKit Documentation](https://docs.copilotkit.ai/)
- [Google ADK Documentation](https://ai.google.dev/adk)
- [Recharts Documentation](https://recharts.org/)
- [Next.js Documentation](https://nextjs.org/docs)

## Recent Updates

### Version 3.0 (Current - Financial Advisor Focus)
- ✅ **Financial Focus**: Rebranded from search assistant to financial advisor
- ✅ **Smart Autocomplete**: Stock tickers and question templates as you type
- ✅ **Programmatic Suggestions**: Context-aware suggestion buttons (no LLM calls)
- ✅ **Auto Table Detection**: Defaults to table view for table-formatted data
- ✅ **Enhanced Agent**: Multi-agent system with specialized financial analysts
- ✅ **Gemini 2.5 Flash**: Upgraded to latest Gemini model for better performance
- ✅ **Session Persistence**: Autocomplete works across new chat sessions
- ✅ **Improved UX**: Updated subtitle and messaging for financial use case

### Version 2.0 (Data Visualization)
- ✅ Added user authentication with multiple providers
- ✅ Per-user chat session isolation
- ✅ Interactive charts with click-to-ask
- ✅ Rich data tables with sort/search
- ✅ Chart/table toggle with column selectors
- ✅ Chart type selector (pie, bar, line, area)
- ✅ Resizable sidebar with drag handle
- ✅ Responsive layout with fit/expand
- ✅ Persistent chart selections per chart
- ✅ Draggable persistence debugger
- ✅ No horizontal overflow, proper word wrapping

### Version 1.0 (Initial)
- Basic chat interface with CopilotKit
- Google ADK backend with search
- Source links with modal popup
- Shared chat sessions (deprecated)

## License

MIT

## Contributing

Contributions welcome! Open issues or submit PRs.

---

**Note**: This application uses mock authentication for demonstration. Implement real authentication with secure backend for production use.
