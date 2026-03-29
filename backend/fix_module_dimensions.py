import requests
import json

# Get all modules
response = requests.get('http://localhost:3000/api/entities/ModuleEntry')
modules = response.json()

print(f"Fixing {len(modules)} modules...\n")

for m in modules:
    # Swap width and depth
    old_width = m.get('width', 4.8)
    old_depth = m.get('depth', 3.0)
    
    new_width = old_depth
    new_depth = old_width
    
    # Update the module
    update_data = {
        'width': new_width,
        'depth': new_depth,
        'sqm': round(new_width * new_depth, 1)
    }
    
    resp = requests.put(
        f"http://localhost:3000/api/entities/ModuleEntry/{m['id']}",
        json=update_data,
        headers={'Content-Type': 'application/json'}
    )
    
    if resp.status_code == 200:
        print(f"✓ {m['code']}: {old_width}×{old_depth}m → {new_width}×{new_depth}m")
    else:
        print(f"✗ {m['code']}: Failed - {resp.status_code}")

print("\n✅ All modules updated!")
