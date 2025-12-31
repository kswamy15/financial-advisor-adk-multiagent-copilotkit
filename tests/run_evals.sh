#!/bin/bash

# Quick Start Guide for Running ADK Evaluations
# This script helps you set up and run the evaluation tests

set -e

echo "🚀 ADK Agent Evaluation - Quick Start"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "agent/agent.py" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Step 1: Installing test dependencies..."
echo "----------------------------------------"
pip install -r tests/requirements.txt
echo "✅ Dependencies installed"
echo ""

echo "📋 Step 2: Available test commands"
echo "-----------------------------------"
echo ""
echo "Run all evaluation tests:"
echo "  pytest tests/integration/test_adk_evals.py -v --html=tests/results/report.html --self-contained-html"
echo ""
echo "Run specific test:"
echo "  pytest tests/integration/test_adk_evals.py::test_multi_turn_workflow -v"
echo ""
echo "Run with detailed output:"
echo "  pytest tests/integration/test_adk_evals.py -v -s"
echo ""
echo "Generate HTML report:"
echo "  pytest tests/integration/test_adk_evals.py --html=report.html --self-contained-html"
echo ""

echo "🔍 Step 3: Running a quick test..."
echo "-----------------------------------"
read -p "Would you like to run the investment strategy test now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    pytest tests/integration/test_adk_evals.py::test_investment_strategy_rubric -v -s
fi

echo ""
echo "✨ Setup complete! See tests/integration/README.md for full documentation."
