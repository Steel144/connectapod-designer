"""
Import ACTUAL Connectapod Module Catalogue from PDF Analysis

This imports the real Connectapod modules extracted from the PDF catalog.
Total: 37+ unique module floor plans
"""

import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "connectapod")

# ACTUAL CONNECTAPOD MODULES from PDF catalog
MODULES = [
    # LIVING MODULES - Standard open modules for living, dining, sleeping
    {
        "id": "CP48-30E-W01-B17-LV17",
        "code": "CP48-30E-W01-B17-LV17",
        "name": "Bathroom + Bedroom + Living (End) 3.0m",
        "category": "Living",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 42000,
        "description": "End module with bathroom, bedroom and living area",
        "variants": ["End"],
        "categories": ["Living", "Bathroom", "Bedroom"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-30E-B05-LV05",
        "code": "CP48-30E-B05-LV05",
        "name": "Bedroom + Living (End) 3.0m",
        "category": "Living",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 32000,
        "description": "End module with bedroom and living space",
        "variants": ["End"],
        "categories": ["Living", "Bedroom"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-24E-B04-LV04",
        "code": "CP48-24E-B04-LV04",
        "name": "Bedroom + Living (End) 2.4m",
        "category": "Living",
        "width": 4.8,
        "depth": 2.4,
        "sqm": 11.5,
        "price": 28000,
        "description": "Compact end module with bedroom and living",
        "variants": ["End"],
        "categories": ["Living", "Bedroom"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-18E-B03-LV03",
        "code": "CP48-18E-B03-LV03",
        "name": "Bedroom + Living (End) 1.8m",
        "category": "Living",
        "width": 4.8,
        "depth": 1.8,
        "sqm": 8.6,
        "price": 22000,
        "description": "Small end module with bedroom and living",
        "variants": ["End"],
        "categories": ["Living", "Bedroom"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-12E-B02-LV02",
        "code": "CP48-12E-B02-LV02",
        "name": "Living + Bedroom (End) 1.2m",
        "category": "Living",
        "width": 4.8,
        "depth": 1.2,
        "sqm": 5.8,
        "price": 18000,
        "description": "Minimal end module with living and bedroom",
        "variants": ["End"],
        "categories": ["Living", "Bedroom"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-06E-B01-LV01",
        "code": "CP48-06E-B01-LV01",
        "name": "Living + Bedroom (End) 0.6m",
        "category": "Living",
        "width": 4.8,
        "depth": 0.6,
        "sqm": 2.9,
        "price": 12000,
        "description": "Very small end module",
        "variants": ["End"],
        "categories": ["Living", "Bedroom"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-30S-W31-B19",
        "code": "CP48-30S-W31-B19",
        "name": "Module 3m",
        "category": "Living",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 25000,
        "description": "Standard 3m module",
        "variants": ["Standard"],
        "categories": ["Living"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-30S-K31",
        "code": "CP48-30S-K31",
        "name": "Kitchen + Living (Standard) 3m",
        "category": "Living",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 38000,
        "description": "Standard module with kitchen and living",
        "variants": ["Standard"],
        "categories": ["Living", "Kitchen"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-30S-W30-L02-B13-LV13",
        "code": "CP48-30S-W30-L02-B13-LV13",
        "name": "Bathroom + Laundry + Bedroom + Living (Standard) 3.0m",
        "category": "Living",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 45000,
        "description": "All-in-one module with bathroom, laundry, bedroom and living",
        "variants": ["Standard"],
        "categories": ["Living", "Bathroom", "Laundry", "Bedroom"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-30S-W10-B14-LV14",
        "code": "CP48-30S-W10-B14-LV14",
        "name": "Bathroom + Bedroom + Living (Standard) 3.0m",
        "category": "Living",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 40000,
        "description": "Standard module with bathroom, bedroom and living",
        "variants": ["Standard"],
        "categories": ["Living", "Bathroom", "Bedroom"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-30S-W03-B16-LV16",
        "code": "CP48-30S-W03-B16-LV16",
        "name": "Bathroom + Bedroom + Living (Standard) 3.0m",
        "category": "Living",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 40000,
        "description": "Standard module with bathroom, bedroom and living",
        "variants": ["Standard"],
        "categories": ["Living", "Bathroom", "Bedroom"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-30S-B10-LV10",
        "code": "CP48-30S-B10-LV10",
        "name": "Bedroom + Living (Standard) 3.0m",
        "category": "Living",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 30000,
        "description": "Standard module with bedroom and living",
        "variants": ["Standard"],
        "categories": ["Living", "Bedroom"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-30S-B12-LV12",
        "code": "CP48-30S-B12-LV12",
        "name": "Living + Bedroom (Standard) 3m",
        "category": "Living",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 30000,
        "description": "Standard module with living and bedroom",
        "variants": ["Standard"],
        "categories": ["Living", "Bedroom"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-30S-B11-LV11",
        "code": "CP48-30S-B11-LV11",
        "name": "Living + Bedroom (Standard) 3m",
        "category": "Living",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 30000,
        "description": "Standard module with living and bedroom",
        "variants": ["Standard"],
        "categories": ["Living", "Bedroom"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-24S-B09-LV09",
        "code": "CP48-24S-B09-LV09",
        "name": "Bedroom + Living (Standard) 2.4m",
        "category": "Living",
        "width": 4.8,
        "depth": 2.4,
        "sqm": 11.5,
        "price": 26000,
        "description": "Compact standard module with bedroom and living",
        "variants": ["Standard"],
        "categories": ["Living", "Bedroom"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-18S-B08-LV08",
        "code": "CP48-18S-B08-LV08",
        "name": "Bedroom + Living (Standard) 1.8m",
        "category": "Living",
        "width": 4.8,
        "depth": 1.8,
        "sqm": 8.6,
        "price": 20000,
        "description": "Small standard module with bedroom and living",
        "variants": ["Standard"],
        "categories": ["Living", "Bedroom"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-12S-B07-LV07",
        "code": "CP48-12S-B07-LV07",
        "name": "Living + Bedroom (Standard) 1.2m",
        "category": "Living",
        "width": 4.8,
        "depth": 1.2,
        "sqm": 5.8,
        "price": 16000,
        "description": "Minimal standard module with living and bedroom",
        "variants": ["Standard"],
        "categories": ["Living", "Bedroom"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-06S-B06-LV06",
        "code": "CP48-06S-B06-LV06",
        "name": "Bedroom + Living (Standard) 0.6m",
        "category": "Living",
        "width": 4.8,
        "depth": 0.6,
        "sqm": 2.9,
        "price": 10000,
        "description": "Very small standard module",
        "variants": ["Standard"],
        "categories": ["Living", "Bedroom"],
        "wallElevations_list": []
    },
    
    # BEDROOM MODULES
    {
        "id": "CP48-30E-W30-B18",
        "code": "CP48-30E-W30-B18",
        "name": "Bathroom + Bedroom (End) 3.0m",
        "category": "Bedroom",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 38000,
        "description": "End module with bathroom and bedroom",
        "variants": ["End"],
        "categories": ["Bedroom", "Bathroom"],
        "wallElevations_list": []
    },
    
    # BATHROOM MODULES (Many are combined - already listed above)
    
    # LAUNDRY MODULES
    {
        "id": "CP48-30S-W02-L01",
        "code": "CP48-30S-W02-L01",
        "name": "Bathroom + Laundry (Standard) 3.0m",
        "category": "Laundry",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 32000,
        "description": "Standard module with bathroom and laundry",
        "variants": ["Standard"],
        "categories": ["Laundry", "Bathroom"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-30S-W30-K31-L02",
        "code": "CP48-30S-W30-K31-L02",
        "name": "Bathroom + Kitchen + Laundry (Standard) 3m",
        "category": "Laundry",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 42000,
        "description": "Multi-function module with bathroom, kitchen and laundry",
        "variants": ["Standard"],
        "categories": ["Laundry", "Bathroom", "Kitchen"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-30S-W20-L01",
        "code": "CP48-30S-W20-L01",
        "name": "Laundry + Bathroom (Standard) 3m",
        "category": "Laundry",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 32000,
        "description": "Standard module with laundry and bathroom",
        "variants": ["Standard"],
        "categories": ["Laundry", "Bathroom"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-30S-W10-K11",
        "code": "CP48-30S-W10-K11",
        "name": "Laundry + Bathroom (Standard) 3m",
        "category": "Laundry",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 32000,
        "description": "Standard module with laundry and bathroom",
        "variants": ["Standard"],
        "categories": ["Laundry", "Bathroom"],
        "wallElevations_list": []
    },
    
    # KITCHEN MODULES
    {
        "id": "CP48-30E-K31",
        "code": "CP48-30E-K31",
        "name": "Kitchen (End) 3.0m",
        "category": "Kitchen",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 42000,
        "description": "End module with full kitchen layout",
        "variants": ["End"],
        "categories": ["Kitchen"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-30E-K30",
        "code": "CP48-30E-K30",
        "name": "Kitchen (End) 3.0m",
        "category": "Kitchen",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 42000,
        "description": "End module with full kitchen layout",
        "variants": ["End"],
        "categories": ["Kitchen"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-30S-K01",
        "code": "CP48-30S-K01",
        "name": "Kitchen (Standard) 3.0m",
        "category": "Kitchen",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 38000,
        "description": "Standard kitchen module with full cabinetry",
        "variants": ["Standard"],
        "categories": ["Kitchen"],
        "wallElevations_list": []
    },
    
    # CONNECTION MODULES
    {
        "id": "CP30-30C",
        "code": "CP30-30C",
        "name": "Connection Modules (Connection) 3m",
        "category": "Connection",
        "width": 3.0,
        "depth": 3.0,
        "sqm": 9.0,
        "price": 15000,
        "description": "Connection module to link separate pavilions",
        "variants": ["Standard"],
        "categories": ["Connection"],
        "wallElevations_list": []
    },
    
    # SOFFIT MODULE
    {
        "id": "CP48-06D-SOFFIT",
        "code": "CP48-06D",
        "name": "Soffit Only 0.6m",
        "category": "Deck",
        "width": 4.8,
        "depth": 0.6,
        "sqm": 2.9,
        "price": 5000,
        "description": "Soffit-only module",
        "variants": ["Soffit"],
        "categories": ["Deck"],
        "wallElevations_list": []
    },
    
    # DECK MODULES
    {
        "id": "CP48-30D-05",
        "code": "CP48-30D-05",
        "name": "Deck 3.0m",
        "category": "Deck",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 12000,
        "description": "Outdoor deck module 3m",
        "variants": ["Standard"],
        "categories": ["Deck"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-30D",
        "code": "CP48-30D",
        "name": "Deck 3.0m",
        "category": "Deck",
        "width": 4.8,
        "depth": 3.0,
        "sqm": 14.4,
        "price": 12000,
        "description": "Outdoor deck module 3m",
        "variants": ["Standard"],
        "categories": ["Deck"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-24D-04",
        "code": "CP48-24D-04",
        "name": "Deck 2.4m",
        "category": "Deck",
        "width": 4.8,
        "depth": 2.4,
        "sqm": 11.5,
        "price": 10000,
        "description": "Outdoor deck module 2.4m",
        "variants": ["Standard"],
        "categories": ["Deck"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-24D",
        "code": "CP48-24D",
        "name": "Deck 2.4m",
        "category": "Deck",
        "width": 4.8,
        "depth": 2.4,
        "sqm": 11.5,
        "price": 10000,
        "description": "Outdoor deck module 2.4m",
        "variants": ["Standard"],
        "categories": ["Deck"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-18D-03",
        "code": "CP48-18D-03",
        "name": "Deck 1.8m",
        "category": "Deck",
        "width": 4.8,
        "depth": 1.8,
        "sqm": 8.6,
        "price": 8000,
        "description": "Outdoor deck module 1.8m",
        "variants": ["Standard"],
        "categories": ["Deck"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-18D",
        "code": "CP48-18D",
        "name": "Deck 1.8m",
        "category": "Deck",
        "width": 4.8,
        "depth": 1.8,
        "sqm": 8.6,
        "price": 8000,
        "description": "Outdoor deck module 1.8m",
        "variants": ["Standard"],
        "categories": ["Deck"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-12D-02",
        "code": "CP48-12D-02",
        "name": "Deck 1.2m",
        "category": "Deck",
        "width": 4.8,
        "depth": 1.2,
        "sqm": 5.8,
        "price": 6000,
        "description": "Outdoor deck module 1.2m",
        "variants": ["Standard"],
        "categories": ["Deck"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-12D",
        "code": "CP48-12D",
        "name": "Deck 1.2m",
        "category": "Deck",
        "width": 4.8,
        "depth": 1.2,
        "sqm": 5.8,
        "price": 6000,
        "description": "Outdoor deck module 1.2m",
        "variants": ["Standard"],
        "categories": ["Deck"],
        "wallElevations_list": []
    },
    {
        "id": "CP48-06D-01",
        "code": "CP48-06D-01",
        "name": "Deck 0.6m",
        "category": "Deck",
        "width": 4.8,
        "depth": 0.6,
        "sqm": 2.9,
        "price": 4000,
        "description": "Small outdoor deck module",
        "variants": ["Standard"],
        "categories": ["Deck"],
        "wallElevations_list": []
    }
]

async def import_real_catalogue():
    """Import actual Connectapod module catalogue from PDF"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🏗️  Importing ACTUAL Connectapod Module Catalogue from PDF...\n")
    
    # Clear old test modules first
    old_result = await db.module_entries.delete_many({})
    print(f"🗑️  Cleared {old_result.deleted_count} old modules\n")
    
    # Import real modules
    print("📦 IMPORTING REAL MODULES:")
    by_category = {}
    
    for module in MODULES:
        await db.module_entries.insert_one(module)
        cat = module["category"]
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(module["name"])
        print(f"  ✓ {module['code']}: {module['name']}")
    
    print(f"\n✅ Import complete! Total modules: {len(MODULES)}")
    
    print(f"\n📊 Module Summary by Category:")
    for category, modules in sorted(by_category.items()):
        print(f"   {category}: {len(modules)} modules")
    
    # Verify
    total = await db.module_entries.count_documents({})
    print(f"\n✅ Database verification: {total} modules stored")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(import_real_catalogue())
