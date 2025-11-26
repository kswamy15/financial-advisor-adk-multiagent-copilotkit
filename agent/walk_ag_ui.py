import pkgutil
import ag_ui
import importlib

def walk_package(package):
    for importer, modname, ispkg in pkgutil.walk_packages(package.__path__, package.__name__ + "."):
        try:
            module = importlib.import_module(modname)
            if hasattr(module, "EventEncoder"):
                print(f"Found EventEncoder in {modname}")
                return
        except Exception as e:
            pass

walk_package(ag_ui)
