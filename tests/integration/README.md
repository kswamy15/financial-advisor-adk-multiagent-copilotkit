# ADK Agent Evaluation Tests

This directory contains evaluation tests for the Financial Advisor multi-agent system using the ADK (Agent Development Kit) evaluation framework.

## Overview

The evaluation suite uses **LLM-as-a-judge** with **rubric-based testing** to assess:
- Multi-agent workflow correctness
- Response quality and tone
- Tool usage and sequencing
- User preference integration

## Test Structure

```
tests/integration/
├── test_adk_evals.py              # Main pytest test suite
└── fixture/
    └── financial_coordinator/
        ├── multi_turn_workflow.test.json     # Full multi-turn financial workflow
        ├── multi_turn_config.json           # Comprehensive evaluation config
        ├── investment_strategy.test.json    # Simple investment query
        ├── google_search.test.json          # Google Search tool test
        ├── risk_scenarios.test.json         # Risk profile handling
        └── test_config.json                 # Basic evaluation config
```

## Evaluation Criteria

### Rubric-Based Response Quality (`rubric_based_final_response_quality_v1`)

Evaluates the agent's final responses against custom rubrics:

1. **Financial Structure** - Proper workflow: data → trading → execution → risk
2. **User Preferences Integration** - Incorporates risk attitude and investment period
3. **Actionable Guidance** - Provides clear next steps
4. **Professional Tone** - Advisory without guaranteed promises
5. **Comprehensive Advice** - Structured strategy with diversification
6. **Safe Financial Tone** - Appropriate disclaimers

### Tool Use Quality (`rubric_based_tool_use_quality_v1`)

Evaluates the agent's tool/sub-agent usage:

1. **Correct Tool Sequence** - data_analyst → trading_analyst → execution_analyst → risk_analyst
2. **Appropriate Tool Selection** - Financial sub-agents vs google_search

## Running the Tests

### Prerequisites

Make sure you have the required dependencies installed:

```bash
pip install pytest pytest-asyncio google-adk
```

### Run All Tests

```bash
# From project root
pytest tests/integration/test_adk_evals.py -v
```

### Run Specific Tests

```bash
# Multi-turn workflow test
pytest tests/integration/test_adk_evals.py::test_multi_turn_workflow -v

# Investment strategy test
pytest tests/integration/test_adk_evals.py::test_investment_strategy_rubric -v

# Google Search test
pytest tests/integration/test_adk_evals.py::test_google_search_functionality -v

# Risk scenarios test
pytest tests/integration/test_adk_evals.py::test_risk_scenarios -v

# All scenarios at once
pytest tests/integration/test_adk_evals.py::test_all_scenarios -v
```

### Run with Detailed Output

```bash
pytest tests/integration/test_adk_evals.py -v -s
```

The `-s` flag shows print statements and detailed evaluation output.

## Test Scenarios

### 1. Multi-Turn Workflow (`multi_turn_workflow.test.json`)

Tests the complete financial advisory process with 4 conversation turns:
1. User requests AAPL analysis → data_analyst called
2. User provides risk/period preferences → trading_analyst called
3. User requests execution plan → execution_analyst called
4. User requests risk evaluation → risk_analyst called

**Evaluation Config:** `multi_turn_config.json` (comprehensive rubrics)

### 2. Investment Strategy (`investment_strategy.test.json`)

Tests single-turn investment advice quality.

**Evaluation Config:** `test_config.json` (basic rubrics)

### 3. Google Search (`google_search.test.json`)

Tests the agent's ability to handle non-financial queries using google_search tool.

**Evaluation Config:** `test_config.json`

### 4. Risk Scenarios (`risk_scenarios.test.json`)

Tests handling of aggressive risk profiles and short-term trading.

**Evaluation Config:** `test_config.json`

## Evaluation Configuration

### Judge Model

All tests use `gemini-2.5-flash` as the LLM judge.

### Threshold

- **Multi-turn config:** 0.7-0.8 (stricter, for comprehensive workflow)
- **Basic config:** 0.5 (more lenient, for simple queries)

### Sampling

- **Multi-turn config:** 3 samples per rubric (majority vote)
- **Basic config:** 1 sample (faster evaluation)

## Customizing Tests

### Adding New Test Cases

1. Create a new `.test.json` file in `fixture/financial_coordinator/`
2. Follow the ADK eval format:

```json
[
  {
    "User Content": "Your user query",
    "Expected Intermediate Agent Responses": ["Expected sub-agent calls"],
    "Expected Intermediate Tool Use Trajectory": [
      {"tool_name": "tool_or_agent_name"}
    ],
    "Final Response": "Expected final response"
  }
]
```

3. Add a new test function in `test_adk_evals.py`

### Adding New Rubrics

Edit the config files (`test_config.json` or `multi_turn_config.json`):

```json
{
  "rubric_id": "your_rubric_id",
  "rubric_content": {
    "text_property": "Description of what you're evaluating"
  }
}
```

## Interpreting Results

### Success Criteria

Tests pass when:
- Overall score ≥ threshold (0.5 or 0.7 depending on config)
- Agent follows expected tool trajectory
- Response quality meets rubric standards

### Scores

- **1.0** = Perfect match (all rubrics satisfied)
- **0.0** = Complete failure (no rubrics satisfied)
- **0.5-0.9** = Partial success (some rubrics met)

### Debugging Failures

If tests fail:

1. Check the detailed output for which rubrics failed
2. Review the agent's actual vs expected responses
3. Use `adk web` to visually inspect the trace:

```bash
adk web
```

Then navigate to the Evaluation tab in the web UI.

## References

- [ADK Evaluation Documentation](https://google.github.io/adk-docs/evaluate/)
- [Evaluation Criteria Reference](https://google.github.io/adk-docs/evaluate/criteria/)
- [ADK Python Repository](https://github.com/google/adk-python)

## Notes

- These tests require API access to Google's Gemini models
- Ensure your `.env` file has the necessary API keys
- LLM-based evaluation can have some variability; consider running multiple times for consistency
- The `test_all_scenarios` function runs all `.test.json` files in the fixture directory
