from ag_ui_adk import ADKAgent
from google.adk.agents import LlmAgent

print("Inspecting ADKAgent...")
print(f"ADKAgent methods: {dir(ADKAgent)}")

# Create a dummy instance to check instance methods
try:
    agent = LlmAgent(name="test", model="test", instruction="test")
    adk_agent = ADKAgent(adk_agent=agent, app_name="test", user_id="test")
    print(f"Instance methods: {dir(adk_agent)}")
except Exception as e:
    print(f"Error creating instance: {e}")
