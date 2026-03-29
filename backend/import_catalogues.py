"""
Import Complete Module and Wall Catalogues

This script imports comprehensive module and wall catalogues for the Connectapod configurator.
"""

import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "connectapod")

# Complete Module Catalogue - Based on NZ modular building standards
MODULES = [
    # LIVING MODULES
    {
        "id": "L-3.0-4.8",
        "category": "Living",
        "code": "L-3.0-4.8",
        "name": "Living 3.0m x 4.8m",
        "width": 3.0,
        "depth": 4.8,
        "sqm": 14.4,
        "price": 25000,
        "description": "Standard living module with open plan layout",
        "variants": ["Standard", "End"],
        "wallElevations_list": ["WY-4800", "ZX-3000"],
        "categories": ["Living"],
        "originalCode": "L-3.0-4.8"
    },
    {
        "id": "L-3.6-4.8",
        "category": "Living",
        "code": "L-3.6-4.8",
        "name": "Living 3.6m x 4.8m",
        "width": 3.6,
        "depth": 4.8,
        "sqm": 17.3,
        "price": 28000,
        "description": "Larger living module for spacious layouts",
        "variants": ["Standard", "End"],
        "wallElevations_list": ["WY-4800", "ZX-3600"],
        "categories": ["Living"]
    },
    
    # BEDROOM MODULES
    {
        "id": "BR-3.0-4.8",
        "category": "Bedroom",
        "code": "BR-3.0-4.8",
        "name": "Bedroom 3.0m x 4.8m",
        "width": 3.0,
        "depth": 4.8,
        "sqm": 14.4,
        "price": 28000,
        "description": "Standard bedroom module fits queen bed + wardrobe",
        "variants": ["Standard", "End", "Corner"],
        "wallElevations_list": ["WY-4800", "ZX-3000"],
        "categories": ["Bedroom"]
    },
    {
        "id": "BR-3.0-3.6",
        "category": "Bedroom",
        "code": "BR-3.0-3.6",
        "name": "Bedroom 3.0m x 3.6m",
        "width": 3.0,
        "depth": 3.6,
        "sqm": 10.8,
        "price": 24000,
        "description": "Compact bedroom for single or small double",
        "variants": ["Standard", "End"],
        "wallElevations_list": ["WY-3600", "ZX-3000"],
        "categories": ["Bedroom"]
    },
    {
        "id": "BR-3.6-4.8",
        "category": "Bedroom",
        "code": "BR-3.6-4.8",
        "name": "Master Bedroom 3.6m x 4.8m",
        "width": 3.6,
        "depth": 4.8,
        "sqm": 17.3,
        "price": 32000,
        "description": "Master bedroom with walk-in wardrobe space",
        "variants": ["Standard", "End", "Ensuite"],
        "wallElevations_list": ["WY-4800", "ZX-3600"],
        "categories": ["Bedroom"]
    },
    
    # BATHROOM MODULES
    {
        "id": "BA-2.4-2.4",
        "category": "Bathroom",
        "code": "BA-2.4-2.4",
        "name": "Bathroom 2.4m x 2.4m",
        "width": 2.4,
        "depth": 2.4,
        "sqm": 5.76,
        "price": 22000,
        "description": "Compact bathroom with shower, toilet, vanity",
        "variants": ["Standard", "Corner"],
        "wallElevations_list": ["WY-2400", "ZX-2400"],
        "categories": ["Bathroom"]
    },
    {
        "id": "BA-2.4-3.0",
        "category": "Bathroom",
        "code": "BA-2.4-3.0",
        "name": "Bathroom 2.4m x 3.0m",
        "width": 2.4,
        "depth": 3.0,
        "sqm": 7.2,
        "price": 25000,
        "description": "Full bathroom with bath, shower, toilet, vanity",
        "variants": ["Standard", "End"],
        "wallElevations_list": ["WY-3000", "ZX-2400"],
        "categories": ["Bathroom"]
    },
    {
        "id": "BA-1.8-2.4",
        "category": "Bathroom",
        "code": "BA-1.8-2.4",
        "name": "Ensuite 1.8m x 2.4m",
        "width": 1.8,
        "depth": 2.4,
        "sqm": 4.32,
        "price": 19000,
        "description": "Compact ensuite bathroom",
        "variants": ["Standard"],
        "wallElevations_list": ["WY-2400", "ZX-1800"],
        "categories": ["Bathroom"]
    },
    
    # KITCHEN MODULES
    {
        "id": "KT-3.0-3.6",
        "category": "Kitchen",
        "code": "KT-3.0-3.6",
        "name": "Kitchen 3.0m x 3.6m",
        "width": 3.0,
        "depth": 3.6,
        "sqm": 10.8,
        "price": 35000,
        "description": "Standard kitchen with benchtop, cabinets, appliances",
        "variants": ["Standard", "End", "Island"],
        "wallElevations_list": ["WY-3600", "ZX-3000"],
        "categories": ["Kitchen"]
    },
    {
        "id": "KT-3.6-3.6",
        "category": "Kitchen",
        "code": "KT-3.6-3.6",
        "name": "Kitchen 3.6m x 3.6m",
        "width": 3.6,
        "depth": 3.6,
        "sqm": 12.96,
        "price": 42000,
        "description": "Large kitchen with island bench",
        "variants": ["Standard", "Island"],
        "wallElevations_list": ["WY-3600", "ZX-3600"],
        "categories": ["Kitchen"]
    },
    
    # LAUNDRY MODULES
    {
        "id": "LA-1.8-2.4",
        "category": "Laundry",
        "code": "LA-1.8-2.4",
        "name": "Laundry 1.8m x 2.4m",
        "width": 1.8,
        "depth": 2.4,
        "sqm": 4.32,
        "price": 12000,
        "description": "Compact laundry with washer/dryer space",
        "variants": ["Standard"],
        "wallElevations_list": ["WY-2400", "ZX-1800"],
        "categories": ["Laundry"]
    },
    {
        "id": "LA-2.4-2.4",
        "category": "Laundry",
        "code": "LA-2.4-2.4",
        "name": "Laundry 2.4m x 2.4m",
        "width": 2.4,
        "depth": 2.4,
        "sqm": 5.76,
        "price": 15000,
        "description": "Full laundry with storage and sink",
        "variants": ["Standard", "Combined"],
        "wallElevations_list": ["WY-2400", "ZX-2400"],
        "categories": ["Laundry"]
    },
    
    # CONNECTION MODULES
    {
        "id": "CN-1.2-4.8",
        "category": "Connection",
        "code": "CN-1.2-4.8",
        "name": "Hallway 1.2m x 4.8m",
        "width": 1.2,
        "depth": 4.8,
        "sqm": 5.76,
        "price": 8000,
        "description": "Connecting hallway module",
        "variants": ["Standard"],
        "wallElevations_list": ["WY-4800", "ZX-1200"],
        "categories": ["Connection"]
    },
    {
        "id": "CN-2.4-2.4",
        "category": "Connection",
        "code": "CN-2.4-2.4",
        "name": "Entry 2.4m x 2.4m",
        "width": 2.4,
        "depth": 2.4,
        "sqm": 5.76,
        "price": 10000,
        "description": "Entry foyer module",
        "variants": ["Standard", "Corner"],
        "wallElevations_list": ["WY-2400", "ZX-2400"],
        "categories": ["Connection"]
    },
    
    # DECK MODULES
    {
        "id": "DK-3.0-2.4",
        "category": "Deck",
        "code": "DK-3.0-2.4",
        "name": "Deck 3.0m x 2.4m",
        "width": 3.0,
        "depth": 2.4,
        "sqm": 7.2,
        "price": 6000,
        "description": "Covered deck extension",
        "variants": ["Standard", "End"],
        "wallElevations_list": [],
        "categories": ["Deck"]
    },
    {
        "id": "DK-4.8-2.4",
        "category": "Deck",
        "code": "DK-4.8-2.4",
        "name": "Deck 4.8m x 2.4m",
        "width": 4.8,
        "depth": 2.4,
        "sqm": 11.52,
        "price": 9000,
        "description": "Large covered deck",
        "variants": ["Standard", "Wraparound"],
        "wallElevations_list": [],
        "categories": ["Deck"]
    }
]

# Complete Wall Catalogue
WALLS = [
    # HORIZONTAL WALLS (WY series)
    {
        "id": "WY-2400",
        "code": "WY-2400",
        "name": "Horizontal Wall 2.4m",
        "width": 2400,
        "height": 2400,
        "price": 2200,
        "description": "Standard 2.4m horizontal wall panel",
        "variants": ["Standard", "Window", "Door", "Blank"]
    },
    {
        "id": "WY-3000",
        "code": "WY-3000",
        "name": "Horizontal Wall 3.0m",
        "width": 3000,
        "height": 2400,
        "price": 2500,
        "description": "Standard 3.0m horizontal wall panel",
        "variants": ["Standard", "Window", "Door", "Blank"]
    },
    {
        "id": "WY-3600",
        "code": "WY-3600",
        "name": "Horizontal Wall 3.6m",
        "width": 3600,
        "height": 2400,
        "price": 3000,
        "description": "3.6m horizontal wall panel",
        "variants": ["Standard", "Window", "Sliding Door", "Blank"]
    },
    {
        "id": "WY-4800",
        "code": "WY-4800",
        "name": "Horizontal Wall 4.8m",
        "width": 4800,
        "height": 2400,
        "price": 3800,
        "description": "Long 4.8m horizontal wall panel",
        "variants": ["Standard", "Window", "Sliding Door", "Blank"]
    },
    
    # VERTICAL WALLS (ZX series)
    {
        "id": "ZX-1200",
        "code": "ZX-1200",
        "name": "Vertical Wall 1.2m",
        "width": 1200,
        "height": 2400,
        "price": 1500,
        "description": "Short 1.2m vertical wall panel",
        "variants": ["Standard", "Door", "Blank"]
    },
    {
        "id": "ZX-1800",
        "code": "ZX-1800",
        "name": "Vertical Wall 1.8m",
        "width": 1800,
        "height": 2400,
        "price": 1800,
        "description": "1.8m vertical wall panel",
        "variants": ["Standard", "Door", "Blank"]
    },
    {
        "id": "ZX-2400",
        "code": "ZX-2400",
        "name": "Vertical Wall 2.4m",
        "width": 2400,
        "height": 2400,
        "price": 2200,
        "description": "Standard 2.4m vertical wall panel",
        "variants": ["Standard", "Window", "Door", "Blank"]
    },
    {
        "id": "ZX-3000",
        "code": "ZX-3000",
        "name": "Vertical Wall 3.0m",
        "width": 3000,
        "height": 2400,
        "price": 2500,
        "description": "3.0m vertical wall panel",
        "variants": ["Standard", "Window", "Door", "Blank"]
    },
    {
        "id": "ZX-3600",
        "code": "ZX-3600",
        "name": "Vertical Wall 3.6m",
        "width": 3600,
        "height": 2400,
        "price": 3000,
        "description": "3.6m vertical wall panel",
        "variants": ["Standard", "Window", "Sliding Door", "Blank"]
    },
    {
        "id": "ZX-4800",
        "code": "ZX-4800",
        "name": "Vertical Wall 4.8m",
        "width": 4800,
        "height": 2400,
        "price": 3800,
        "description": "Long 4.8m vertical wall panel",
        "variants": ["Standard", "Window", "Sliding Door", "Blank"]
    }
]

async def import_catalogues():
    """Import module and wall catalogues"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🏗️  Importing Connectapod Catalogues...\n")
    
    # Import Modules
    print("📦 MODULES:")
    module_count = 0
    for module in MODULES:
        existing = await db.module_entries.find_one({"id": module["id"]})
        if existing:
            await db.module_entries.update_one({"id": module["id"]}, {"$set": module})
            print(f"  ✓ Updated: {module['name']}")
        else:
            await db.module_entries.insert_one(module)
            print(f"  ✓ Added: {module['name']}")
        module_count += 1
    
    # Import Walls
    print(f"\n🧱 WALLS:")
    wall_count = 0
    for wall in WALLS:
        existing = await db.wall_entries.find_one({"id": wall["id"]})
        if existing:
            await db.wall_entries.update_one({"id": wall["id"]}, {"$set": wall})
            print(f"  ✓ Updated: {wall['name']}")
        else:
            await db.wall_entries.insert_one(wall)
            print(f"  ✓ Added: {wall['name']}")
        wall_count += 1
    
    print(f"\n✅ Import complete!")
    print(f"   Modules: {module_count}")
    print(f"   Walls: {wall_count}")
    
    # Show summary by category
    print(f"\n📊 Module Summary:")
    for category in ["Living", "Bedroom", "Bathroom", "Kitchen", "Laundry", "Connection", "Deck"]:
        count = len([m for m in MODULES if m["category"] == category])
        print(f"   {category}: {count} modules")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(import_catalogues())
