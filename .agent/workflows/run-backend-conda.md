---
description: Run the backend agent using conda environment adk-env
---

# Running Backend Agent with Conda

## Prerequisites
Ensure conda environment `adk-env` is created and has all dependencies installed.

## Steps

// turbo-all
1. Activate the conda environment
```bash
conda activate adk-env
```

2. Navigate to the agent directory and run the agent
```bash
cd agent && python agent.py
```

## Notes
- The agent will start on `http://localhost:8000`
- Health check available at `http://localhost:8000/health`
- Agent endpoint at `http://localhost:8000/`
