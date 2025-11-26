import ag_ui
import inspect

# Try to find EventEncoder in ag_ui package
def find_class(module, class_name):
    for name, obj in inspect.getmembers(module):
        if name == class_name:
            return module.__name__
        if inspect.ismodule(obj) and obj.__name__.startswith("ag_ui"):
            try:
                res = find_class(obj, class_name)
                if res: return res
            except:
                pass
    return None

# Or just try common locations
try:
    from ag_ui.protocol.encoding import EventEncoder
    print("Found in ag_ui.protocol.encoding")
except ImportError:
    print("Not in ag_ui.protocol.encoding")

try:
    from ag_ui.core.types import RunAgentInput
    print("Found RunAgentInput in ag_ui.core.types")
except ImportError:
    print("Not in ag_ui.core.types")
