"""
Base44 Data Migration Helper

This script helps migrate data from Base44 export to the new MongoDB backend.

Usage:
1. Export your data from Base44 (usually available in Base44 admin panel)
2. Save exported JSONfiles in /app/backend/migration_data/
3. Run: python migrate_base44_data.py
"""

import asyncio
import json
import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "connectapod")
MIGRATION_DIR = Path("/app/backend/migration_data")

# Create migration directory if it doesn't exist
MIGRATION_DIR.mkdir(exist_ok=True)

async def import_collection(db, collection_name, file_path):
    """Import JSON data into a MongoDB collection"""
    if not file_path.exists():
        print(f"  ⊘ No file found: {file_path}")
        return 0
    
    with open(file_path) as f:
        data = json.load(f)
    
    if not data:
        print(f"  ⊘ No data in file: {file_path}")
        return 0
    
    # Ensure each document has an 'id' field (Base44 uses 'id' not '_id')
    for item in data:
        if '_id' in item:
            item['id'] = item.get('id', item['_id'])
            del item['_id']
    
    # Bulk insert with error handling
    try:
        if isinstance(data, list):
            await db[collection_name].insert_many(data, ordered=False)
        else:
            await db[collection_name].insert_one(data)
        
        count = len(data) if isinstance(data, list) else 1
        print(f"  ✓ Imported {count} documents into {collection_name}")
        return count
    except Exception as e:
        print(f"  ⚠ Error importing {collection_name}: {str(e)}")
        return 0

async def migrate_all():
    """Main migration function"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🔄 Starting Base44 Data Migration...\n")
    
    # Define collection mappings: (collection_name, expected_filename)
    collections = [
        ("design_templates", "DesignTemplate.json"),
        ("home_designs", "HomeDesign.json"),
        ("module_entries", "ModuleEntry.json"),
        ("wall_entries", "WallEntry.json"),
        ("floor_plan_images", "FloorPlanImage.json"),
        ("wall_images", "WallImage.json"),
        ("deleted_modules", "DeletedModule.json"),
        ("deleted_walls", "DeletedWall.json"),
    ]
    
    total = 0
    for collection, filename in collections:
        print(f"\n📦 {collection}:")
        file_path = MIGRATION_DIR / filename
        count = await import_collection(db, collection, file_path)
        total += count
    
    print(f"\n✅ Migration complete! Imported {total} total documents.")
    print(f"\n💡 Tip: Place your Base44 export JSON files in:")
    print(f"   {MIGRATION_DIR}")
    print(f"\n   Expected filenames:")
    for _, filename in collections:
        print(f"     - {filename}")
    
    client.close()

async def export_sample():
    """Export sample data structure for reference"""
    sample_dir = MIGRATION_DIR / "sample_format"
    sample_dir.mkdir(exist_ok=True)
    
    samples = {
        "DesignTemplate.json": [
            {
                "id": "template-example",
                "name": "Example Template",
                "bedrooms": 2,
                "use_cases": ["family_home"],
                "budget_range": "100k_200k",
                "is_featured": True,
                "sort_order": 1,
                "template_payload": {
                    "layout": {
                        "grid": [],
                        "walls": [],
                        "furniture": []
                    }
                }
            }
        ],
        "HomeDesign.json": [
            {
                "id": "design-example",
                "name": "My Design",
                "grid": [],
                "walls": [],
                "furniture": [],
                "totalSqm": 50.0,
                "estimatedPrice": 125000,
                "moduleCount": 5
            }
        ],
        "ModuleEntry.json": [
            {
                "id": "module-example",
                "category": "Living",
                "code": "L-3.0-4.8",
                "name": "Living Module",
                "width": 3.0,
                "depth": 4.8,
                "sqm": 14.4,
                "price": 25000,
                "description": "Living",
                "variants": ["Standard"],
                "wallElevations_list": [],
                "categories": ["Living"]
            }
        ],
        "WallEntry.json": [
            {
                "id": "wall-example",
                "code": "WY-3000",
                "name": "Wall 3m",
                "width": 3000,
                "height": 2400,
                "price": 2500,
                "description": "Standard wall",
                "variants": ["Standard"]
            }
        ],
        "FloorPlanImage.json": [
            {
                "id": "img-example",
                "moduleType": "L-3.0-4.8",
                "imageUrl": "/api/files/example.png"
            }
        ],
        "WallImage.json": [
            {
                "id": "wallimg-example",
                "wallType": "WY-3000",
                "imageUrl": "/api/files/wall-example.png"
            }
        ]
    }
    
    for filename, data in samples.items():
        with open(sample_dir / filename, 'w') as f:
            json.dump(data, f, indent=2)
    
    print(f"📋 Sample JSON formats created in: {sample_dir}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--export-sample":
        asyncio.run(export_sample())
    else:
        asyncio.run(migrate_all())
