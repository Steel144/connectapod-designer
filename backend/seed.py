"""
Seed script to populate initial data for Connectapod
Run this to add sample templates and module/wall catalogue data
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

async def seed_data():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.connectapod
    
    print("🌱 Seeding Connectapod database...")
    
    # Clear existing data (optional - comment out if you want to preserve data)
    # await db.design_templates.delete_many({})
    # await db.module_entries.delete_many({})
    # await db.wall_entries.delete_many({})
    
    # Seed Design Templates
    templates = [
        {
            "id": "template-1",
            "name": "Compact Studio",
            "bedrooms": 0,
            "use_cases": ["sleepout", "office"],
            "budget_range": "under_50k",
            "is_featured": True,
            "sort_order": 1,
            "template_payload": {
                "layout": {
                    "grid": [],
                    "walls": [],
                    "furniture": []
                }
            }
        },
        {
            "id": "template-2",
            "name": "1 Bedroom Granny Flat",
            "bedrooms": 1,
            "use_cases": ["granny_flat", "rental"],
            "budget_range": "50k_100k",
            "is_featured": True,
            "sort_order": 2,
            "template_payload": {
                "layout": {
                    "grid": [],
                    "walls": [],
                    "furniture": []
                }
            }
        },
        {
            "id": "template-3",
            "name": "2 Bedroom Home",
            "bedrooms": 2,
            "use_cases": ["family_home", "rental"],
            "budget_range": "100k_200k",
            "is_featured": True,
            "sort_order": 3,
            "template_payload": {
                "layout": {
                    "grid": [],
                    "walls": [],
                    "furniture": []
                }
            }
        },
    ]
    
    for template in templates:
        existing = await db.design_templates.find_one({"id": template["id"]})
        if not existing:
            await db.design_templates.insert_one(template)
            print(f"  ✓ Added template: {template['name']}")
        else:
            print(f"  ⊙ Template already exists: {template['name']}")
    
    # Seed Module Entries (sample catalogue)
    modules = [
        {
            "id": "mod-living-01",
            "category": "Living",
            "code": "L-3.0-4.8",
            "name": "Standard Living Module",
            "width": 3.0,
            "depth": 4.8,
            "sqm": 14.4,
            "price": 25000,
            "description": "Living",
            "variants": ["Standard"],
            "wallElevations_list": [],
            "categories": ["Living"]
        },
        {
            "id": "mod-bedroom-01",
            "category": "Bedroom",
            "code": "BR-3.0-4.8",
            "name": "Standard Bedroom Module",
            "width": 3.0,
            "depth": 4.8,
            "sqm": 14.4,
            "price": 28000,
            "description": "Bedroom",
            "variants": ["Standard"],
            "wallElevations_list": [],
            "categories": ["Bedroom"]
        },
        {
            "id": "mod-bathroom-01",
            "category": "Bathroom",
            "code": "BA-2.4-2.4",
            "name": "Compact Bathroom",
            "width": 2.4,
            "depth": 2.4,
            "sqm": 5.76,
            "price": 22000,
            "description": "Bathroom",
            "variants": ["Standard"],
            "wallElevations_list": [],
            "categories": ["Bathroom"]
        },
        {
            "id": "mod-kitchen-01",
            "category": "Kitchen",
            "code": "KT-3.0-3.6",
            "name": "Standard Kitchen",
            "width": 3.0,
            "depth": 3.6,
            "sqm": 10.8,
            "price": 35000,
            "description": "Kitchen",
            "variants": ["End"],
            "wallElevations_list": [],
            "categories": ["Kitchen"]
        },
    ]
    
    for module in modules:
        existing = await db.module_entries.find_one({"id": module["id"]})
        if not existing:
            await db.module_entries.insert_one(module)
            print(f"  ✓ Added module: {module['name']}")
        else:
            print(f"  ⊙ Module already exists: {module['name']}")
    
    # Seed Wall Entries (sample wall types)
    walls = [
        {
            "id": "wall-01",
            "code": "WY-3000",
            "name": "Standard Wall 3m",
            "width": 3000,
            "height": 2400,
            "price": 2500,
            "description": "Standard horizontal wall panel",
            "variants": ["Standard"]
        },
        {
            "id": "wall-02",
            "code": "ZX-2400",
            "name": "Standard Wall 2.4m",
            "width": 2400,
            "height": 2400,
            "price": 2200,
            "description": "Standard vertical wall panel",
            "variants": ["Standard"]
        },
        {
            "id": "wall-03",
            "code": "WY-4800",
            "name": "Long Wall 4.8m",
            "width": 4800,
            "height": 2400,
            "price": 3800,
            "description": "Extended horizontal wall panel",
            "variants": ["Extended"]
        },
    ]
    
    for wall in walls:
        existing = await db.wall_entries.find_one({"id": wall["id"]})
        if not existing:
            await db.wall_entries.insert_one(wall)
            print(f"  ✓ Added wall: {wall['name']}")
        else:
            print(f"  ⊙ Wall already exists: {wall['name']}")
    
    print("✅ Seeding complete!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
