import os
import json
import glob

def fix_json_file(file_path):
    """Detects and fixes double-encoded JSON files."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()
        
        if not content:
            return False
            
        data = json.loads(content)
        
        # If the loaded data is a string, it means it was double-encoded
        if isinstance(data, str):
            print(f"🔧 Fixing double-encoded JSON: {file_path}")
            # Parse the string content as JSON
            real_data = json.loads(data)
            # Write it back as a properly formatted JSON object
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(real_data, f, indent=4)
            return True
        else:
            # Check if it's already a valid object but not indented
            # We'll just re-indent it for better readability if requested, 
            # but primary goal is fixing the string issue.
            return False
            
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return False

def main():
    search_paths = [
        "agent/.adk/eval_history/*.json",
        "tests/results/*.json"
    ]
    
    fixed_count = 0
    total_scanned = 0
    
    for pattern in search_paths:
        files = glob.glob(pattern)
        for file_path in files:
            total_scanned += 1
            if fix_json_file(file_path):
                fixed_count += 1
                
    print(f"\n✅ Scan complete. Scanned {total_scanned} files, fixed {fixed_count} files.")

if __name__ == "__main__":
    main()
