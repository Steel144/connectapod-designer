"""
Import ACTUAL Connectapod Wall Catalogue from PDF Analysis

This imports the real Connectapod walls extracted from the wall catalog PDF.
Total: 64 unique wall panels with accurate specifications
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "connectapod")

# ACTUAL CONNECTAPOD WALLS from PDF catalog
# Height standard: 2400mm (2.4m) for all walls
WALLS = [
    # 0.6m MODULE
    {"id": "WY06-B-000", "code": "WY06-B-000", "name": "600mm Wall Blank", "width": 600, "height": 2400, "price": 1200, "description": "Blank wall panel 0.6m", "variants": ["Blank", "Left", "Right"]},
    
    # 1.2m MODULE
    {"id": "WY12-B-001", "code": "WY12-B-001", "name": "1200mm Wall Blank", "width": 1200, "height": 2400, "price": 1500, "description": "Blank wall panel 1.2m", "variants": ["Blank", "Left", "Right"]},
    {"id": "WY12-W-003", "code": "WY12-W-003", "name": "1200mm Wall, Window - Awning 620x620mm", "width": 1200, "height": 2400, "price": 2200, "description": "Wall with awning window 620x620mm", "variants": ["Standard", "Mirror"]},
    {"id": "WY12-W-004", "code": "WY12-W-004", "name": "1200mm Wall, Window - Awning 920x620mm", "width": 1200, "height": 2400, "price": 2400, "description": "Wall with awning window 920x620mm", "variants": ["Standard"]},
    {"id": "WY12-W-005", "code": "WY12-W-005", "name": "1200mm Wall, Window - Awning, Fixed 1220x620mm", "width": 1200, "height": 2400, "price": 2600, "description": "Wall with awning and fixed window 1220x620mm", "variants": ["Standard"]},
    {"id": "WY12-W-012", "code": "WY12-W-012", "name": "1200mm Wall, Window - Fixed, Awning 2140x620mm", "width": 1200, "height": 2400, "price": 2800, "description": "Wall with fixed and awning window 2140x620mm", "variants": ["Standard", "Mirror"]},
    
    # 1.8m MODULE
    {"id": "WY18-B-050", "code": "WY18-B-050", "name": "1800mm Wall Blank", "width": 1800, "height": 2400, "price": 1800, "description": "Blank wall panel 1.8m", "variants": ["Blank", "Left", "Right"]},
    {"id": "WY18-O-051", "code": "WY18-O-051", "name": "1800mm Wall", "width": 1800, "height": 2400, "price": 2000, "description": "Standard 1.8m wall with openings", "variants": ["Standard", "Variant"]},
    {"id": "WY18-S-052", "code": "WY18-S-052", "name": "1800mm Wall, Window - Fixed, Awning 2140x1220mm", "width": 1800, "height": 2400, "price": 3200, "description": "Wall with fixed and awning window 2140x1220mm", "variants": ["Standard"]},
    {"id": "WY18-W-053", "code": "WY18-W-053", "name": "1800mm Wall, Window - Awning, Fixed 2140x620mm", "width": 1800, "height": 2400, "price": 2900, "description": "Wall with awning and fixed window 2140x620mm", "variants": ["Standard", "Mirror"]},
    {"id": "ZX18-C-D", "code": "ZX18-C-D", "name": "1800mm Wall, Door - French 2140x900mm", "width": 1800, "height": 2400, "price": 3500, "description": "Connection wall with French door 2140x900mm", "variants": ["Standard"]},
    
    # 2.4m MODULE
    {"id": "WY24-B-200", "code": "WY24-B-200", "name": "2400mm Wall Blank", "width": 2400, "height": 2400, "price": 2200, "description": "Blank wall panel 2.4m", "variants": ["Blank", "Left", "Right"]},
    {"id": "WY24-O-201", "code": "WY24-O-201", "name": "2400mm Wall", "width": 2400, "height": 2400, "price": 2400, "description": "Standard 2.4m wall with openings", "variants": ["Standard", "Variant"]},
    {"id": "WY24-W-202", "code": "WY24-W-202", "name": "2400mm Wall, Window - Awning, Fixed", "width": 2400, "height": 2400, "price": 3400, "description": "Wall with awning and fixed window", "variants": ["Standard", "Mirror"]},
    {"id": "WY24-W-203", "code": "WY24-W-203", "name": "2400mm Wall, Window - Fixed, Awning 2140x1220mm", "width": 2400, "height": 2400, "price": 3400, "description": "Wall with fixed and awning window 2140x1220mm", "variants": ["Standard", "Mirror"]},
    {"id": "ZX24-C-D", "code": "ZX24-C-D", "name": "2400mm Wall, Door - French 2140x1800mm", "width": 2400, "height": 2400, "price": 4200, "description": "Connection wall with French door 2140x1800mm", "variants": ["Standard"]},
    
    # 3.0m MODULE
    {"id": "WY30-B-500", "code": "WY30-B-500", "name": "3000mm Wall Blank", "width": 3000, "height": 2400, "price": 2500, "description": "Blank wall panel 3.0m", "variants": ["Blank", "Left", "Right"]},
    {"id": "WY30-O-501", "code": "WY30-O-501", "name": "3000mm Wall", "width": 3000, "height": 2400, "price": 2800, "description": "Standard 3.0m wall with openings", "variants": ["Standard", "Variant 1", "Variant 2", "Variant 3", "Variant 4"]},
    {"id": "WY30-D-503", "code": "WY30-D-503", "name": "3000mm Wall, Door - Ranch Slider 2140x2200mm", "width": 3000, "height": 2400, "price": 4800, "description": "Wall with ranch slider door 2140x2200mm", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-D-507", "code": "WY30-D-507", "name": "3000mm Wall, Door - French 2140x2200mm", "width": 3000, "height": 2400, "price": 4600, "description": "Wall with French door 2140x2200mm", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-W-508", "code": "WY30-W-508", "name": "3000mm Wall, Window - Awning, Fixed 2140x620mm", "width": 3000, "height": 2400, "price": 3200, "description": "Wall with awning and fixed window 2140x620mm", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-W-509", "code": "WY30-W-509", "name": "3000mm Wall, Window - Awning 2140x1220mm", "width": 3000, "height": 2400, "price": 3600, "description": "Wall with awning window 2140x1220mm", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-W-510", "code": "WY30-W-510", "name": "3000mm Wall, Window - Awning 2140x1800mm", "width": 3000, "height": 2400, "price": 4000, "description": "Wall with awning window 2140x1800mm", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-W-511", "code": "WY30-W-511", "name": "3000mm Wall, Window - Awning 2140x2400mm", "width": 3000, "height": 2400, "price": 4400, "description": "Wall with awning window 2140x2400mm", "variants": ["Standard"]},
    {"id": "WY30-W-512", "code": "WY30-W-512", "name": "3000mm Wall, Window - Awning, Fixed 2140x1220mm", "width": 3000, "height": 2400, "price": 3600, "description": "Wall with awning and fixed window 2140x1220mm", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-W-513", "code": "WY30-W-513", "name": "3000mm Wall, Window - Awning, Fixed 2140x620mm", "width": 3000, "height": 2400, "price": 3200, "description": "Wall with awning and fixed window 2140x620mm", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-D-514", "code": "WY30-D-514", "name": "3000mm Wall, Door - Stacker Slider 2140x2400mm", "width": 3000, "height": 2400, "price": 5200, "description": "Wall with stacker slider door 2140x2400mm", "variants": ["Standard"]},
    {"id": "WY30-D-522", "code": "WY30-D-522", "name": "3000mm Wall, Door - Bi-Fold 2140x2400mm", "width": 3000, "height": 2400, "price": 5400, "description": "Wall with bi-fold door 2140x2400mm", "variants": ["Standard"]},
    {"id": "WY30-W-530", "code": "WY30-W-530", "name": "3000mm Wall, Window - Casement 920x2200mm", "width": 3000, "height": 2400, "price": 3800, "description": "Wall with casement window 920x2200mm", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-W-531", "code": "WY30-W-531", "name": "3000mm Wall, Window - Fixed 920x2200mm", "width": 3000, "height": 2400, "price": 3600, "description": "Wall with fixed window 920x2200mm", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-W-532", "code": "WY30-W-532", "name": "3000mm Wall, Window - Awning 920x2200mm", "width": 3000, "height": 2400, "price": 3800, "description": "Wall with awning window 920x2200mm", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-W-533", "code": "WY30-W-533", "name": "3000mm Wall, Window - Awning, Fixed 920x1220mm", "width": 3000, "height": 2400, "price": 3400, "description": "Wall with awning and fixed window 920x1220mm", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-W-534", "code": "WY30-W-534", "name": "3000mm Wall, Window - Fixed, Awning 920x1220mm", "width": 3000, "height": 2400, "price": 3400, "description": "Wall with fixed and awning window 920x1220mm", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-W-535", "code": "WY30-W-535", "name": "3000mm Wall, Window - Awning 920x620mm", "width": 3000, "height": 2400, "price": 3000, "description": "Wall with awning window 920x620mm", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-W-536", "code": "WY30-W-536", "name": "3000mm Wall, Window - Awning 920x620mm (Alt)", "width": 3000, "height": 2400, "price": 3000, "description": "Wall with awning window 920x620mm alternate", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-W-537", "code": "WY30-W-537", "name": "3000mm Wall, Window - Awning, Fixed 920x1820mm", "width": 3000, "height": 2400, "price": 3800, "description": "Wall with awning and fixed window 920x1820mm", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-W-540", "code": "WY30-W-540", "name": "3000mm Wall, Window - Awning 620x2200mm", "width": 3000, "height": 2400, "price": 3400, "description": "Wall with awning window 620x2200mm", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-WD-650", "code": "WY30-WD-650", "name": "3000mm Wall, Window - Fixed 2140x250mm, Door - French 2140x910mm", "width": 3000, "height": 2400, "price": 4800, "description": "Wall with fixed window and French door", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-WD-651", "code": "WY30-WD-651", "name": "3000mm Wall, Window - Fixed 2140x250mm, Door - French 2140x910mm (Alt)", "width": 3000, "height": 2400, "price": 4800, "description": "Wall with fixed window and French door alternate", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-D-652", "code": "WY30-D-652", "name": "3000mm Wall, Door - French 2140x910mm", "width": 3000, "height": 2400, "price": 4200, "description": "Wall with French door 2140x910mm", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-D-653", "code": "WY30-D-653", "name": "3000mm Wall, Door - French 2140x910mm (Alt)", "width": 3000, "height": 2400, "price": 4200, "description": "Wall with French door 2140x910mm alternate", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-WD-660", "code": "WY30-WD-660", "name": "3000mm Wall, Window - Fixed 2140x200mm, Door - French 2140x910mm", "width": 3000, "height": 2400, "price": 4700, "description": "Wall with fixed window and French door", "variants": ["Standard", "Mirror"]},
    {"id": "WW30-WD-661", "code": "WW30-WD-661", "name": "3000mm Wall, Window - Fixed 2140x250mm, Door - French 2140x910mm", "width": 3000, "height": 2400, "price": 4800, "description": "Wall with fixed window and French door", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-D-662", "code": "WY30-D-662", "name": "3000mm Wall, Door - French 2140x910mm (V2)", "width": 3000, "height": 2400, "price": 4200, "description": "Wall with French door 2140x910mm variant 2", "variants": ["Standard", "Mirror"]},
    {"id": "WY30-D-663", "code": "WY30-D-663", "name": "3000mm Wall, Door - French 2140x910mm (V3)", "width": 3000, "height": 2400, "price": 4200, "description": "Wall with French door 2140x910mm variant 3", "variants": ["Standard", "Mirror"]},
    {"id": "ZX30-C-D", "code": "ZX30-C-D", "name": "3000mm Wall, Door - French 2140x1800mm", "width": 3000, "height": 2400, "price": 4600, "description": "Connection wall with French door 2140x1800mm", "variants": ["Standard"]},
    
    # 4.8m MODULE (Listed as 5.2m in PDF but actually 4.8m based on codes)
    {"id": "ZX48-B-000", "code": "ZX48-B-000", "name": "4800mm Wall Blank", "width": 4800, "height": 2400, "price": 3800, "description": "Blank wall panel 4.8m", "variants": ["Standard"]},
    {"id": "ZX48-W-001", "code": "ZX48-W-001", "name": "4800mm Wall, Window - Awning, Fixed 2140x2420mm", "width": 4800, "height": 2400, "price": 5200, "description": "Wall with awning and fixed window 2140x2420mm", "variants": ["Standard"]},
    {"id": "ZX48-D-001", "code": "ZX48-D-001", "name": "4800mm Wall, Door - Ranch Slider 2140x4220mm", "width": 4800, "height": 2400, "price": 6800, "description": "Wall with ranch slider door 2140x4220mm", "variants": ["Standard"]},
    {"id": "ZX48-W-002", "code": "ZX48-W-002", "name": "4800mm Wall, Window - Awning, Fixed 2140x2420mm (Alt)", "width": 4800, "height": 2400, "price": 5200, "description": "Wall with awning and fixed window 2140x2420mm alternate", "variants": ["Standard"]},
    {"id": "ZX48-D-002", "code": "ZX48-D-002", "name": "4800mm Wall, Door - French 2140x2120mm", "width": 4800, "height": 2400, "price": 6200, "description": "Wall with French door 2140x2120mm", "variants": ["Standard"]},
    {"id": "ZX48-D-003", "code": "ZX48-D-003", "name": "4800mm Wall, Door - Bi-Fold 2140x4200mm", "width": 4800, "height": 2400, "price": 7200, "description": "Wall with bi-fold door 2140x4200mm", "variants": ["Standard"]},
    {"id": "ZX48-D-010", "code": "ZX48-D-010", "name": "4800mm Wall, Door - Ranch Slider 2140x4200mm", "width": 4800, "height": 2400, "price": 6800, "description": "Wall with ranch slider door 2140x4200mm", "variants": ["Standard"]},
    {"id": "ZX48-W-034", "code": "ZX48-W-034", "name": "4800mm Wall, Window - Awning 920x620mm", "width": 4800, "height": 2400, "price": 4400, "description": "Wall with awning window 920x620mm", "variants": ["Standard"]},
    {"id": "ZX48-W-035", "code": "ZX48-W-035", "name": "4800mm Wall, Window - Awning, Fixed 920x1220mm", "width": 4800, "height": 2400, "price": 4800, "description": "Wall with awning and fixed window 920x1220mm", "variants": ["Standard"]},
    {"id": "ZX48-W-036", "code": "ZX48-W-036", "name": "4800mm Wall, Window - Awning 620x2200mm", "width": 4800, "height": 2400, "price": 4800, "description": "Wall with awning window 620x2200mm", "variants": ["Standard"]},
    {"id": "ZX48-W-037", "code": "ZX48-W-037", "name": "4800mm Wall, Window - Awning 620x2200mm (V2)", "width": 4800, "height": 2400, "price": 4800, "description": "Wall with awning window 620x2200mm variant 2", "variants": ["Standard"]},
    {"id": "ZX48-W-038", "code": "ZX48-W-038", "name": "4800mm Wall, Window - Awning 620x2200mm (V3)", "width": 4800, "height": 2400, "price": 4800, "description": "Wall with awning window 620x2200mm variant 3", "variants": ["Standard"]},
    {"id": "ZX48-D-040", "code": "ZX48-D-040", "name": "4800mm Wall, Door - Ranch Slider 2140x2120mm", "width": 4800, "height": 2400, "price": 6000, "description": "Wall with ranch slider door 2140x2120mm", "variants": ["Standard"]},
    {"id": "Z100-F", "code": "Z100-F/X100-F", "name": "Gable - Single Door Narrow", "width": 4800, "height": 2400, "price": 4500, "description": "Gable wall with single narrow door", "variants": ["Standard"]},
    {"id": "ZX48-D-100", "code": "ZX48-D-100", "name": "4800mm Wall, Door - Ranch Slider 2140x2200mm", "width": 4800, "height": 2400, "price": 6000, "description": "Wall with ranch slider door 2140x2200mm", "variants": ["Standard"]},
    {"id": "Z101-F", "code": "Z101-F/X101-F", "name": "Gable - Single Door 4800", "width": 4800, "height": 2400, "price": 4800, "description": "Gable wall with single door 4800", "variants": ["Standard"]},
    {"id": "ZX48-W-300", "code": "ZX48-W-300", "name": "4800mm Wall, Window - Fixed, Awning 920x1220mm", "width": 4800, "height": 2400, "price": 4800, "description": "Wall with fixed and awning window 920x1220mm", "variants": ["Standard"]},
    {"id": "ZX48-W-301", "code": "ZX48-W-301", "name": "4800mm Wall, Window - Fixed, Awning 920x1220mm (Alt)", "width": 4800, "height": 2400, "price": 4800, "description": "Wall with fixed and awning window 920x1220mm alternate", "variants": ["Standard"]},
]

async def import_real_walls():
    """Import actual Connectapod wall catalogue from PDF"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🧱 Importing ACTUAL Connectapod Wall Catalogue from PDF...\n")
    
    # Clear old walls
    old_result = await db.wall_entries.delete_many({})
    print(f"🗑️  Cleared {old_result.deleted_count} old walls\n")
    
    # Import real walls
    print("📦 IMPORTING REAL WALLS:")
    by_size = {}
    
    for wall in WALLS:
        await db.wall_entries.insert_one(wall)
        width_m = wall["width"] / 1000
        size_key = f"{width_m}m"
        if size_key not in by_size:
            by_size[size_key] = []
        by_size[size_key].append(wall["name"])
        print(f"  ✓ {wall['code']}: {wall['name']}")
    
    print(f"\n✅ Import complete! Total walls: {len(WALLS)}")
    
    print(f"\n📊 Wall Summary by Module Size:")
    for size, walls in sorted(by_size.items()):
        print(f"   {size}: {len(walls)} walls")
    
    # Verify
    total = await db.wall_entries.count_documents({})
    print(f"\n✅ Database verification: {total} walls stored")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(import_real_walls())
