import inspect
from ag_ui_adk import add_adk_fastapi_endpoint

print(f"Signature: {inspect.signature(add_adk_fastapi_endpoint)}")
print(f"Source:\n{inspect.getsource(add_adk_fastapi_endpoint)}")
