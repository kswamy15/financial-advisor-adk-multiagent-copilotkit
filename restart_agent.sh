#!/bin/bash

# Helper script to restart the backend agent
# This is useful after changing model configuration

echo "🔄 Restarting backend agent..."

# Find and kill the running agent
pkill -f "python agent.py" || pkill -f "uvicorn"

echo "✅ Stopped old agent process"
echo "⏳ Waiting 2 seconds..."
sleep 2

## specifically for a conda environment named adk-env
echo "🚀 Starting new agent process with conda environment 'adk-env'..."
cd agent && conda run -n adk-env python agent.py &

echo "✅ Backend agent restarted!"
echo ""
echo "Check logs to verify it's running correctly"
