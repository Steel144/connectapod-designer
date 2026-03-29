"""
Import Design Catalog from Base44 Export

This script helps you import your complete design catalog from Base44.

STEPS TO GET YOUR DATA:

1. Log in to your Base44 app dashboard
2. Go to the "Data" or "Database" section  
3. Export the DesignTemplate entity as JSON
4. Save the file as: /app/backend/design_catalog.json
5. Run this script: python import_designs.py

The JSON should be an array of design objects like:
[
  {
    "name": "1 Bedroom Granny Flat 60sqm",
    "slug": "1-bedroom-granny-flat-60sqm",
    "description": "Perfect for rental income or guest accommodation",
    "heroImage": "https://...",
    "gallery": ["https://...", "https://..."],
    "size_sqm": 60,
    "width_m": 6,
    "depth_m": 10,
    "bedrooms": 1,
    "bathrooms": 1,
    "starting_price": 125000,
    "use_cases": ["rental_income", "guest_accommodation"],
    "categories": ["granny_flat"],
    "tags": ["nz", "prefab"],
    "build_type": ["modular", "kitset"],
    "budget_range": "100k-200k",
    "is_featured": true,
    "sort_order": 1,
    "template_payload": {
      "modules": ["MOD-001", "MOD-002"],
      "layout": {...},
      "metadata": {...}
    }
  }
]
"""

import asyncio
import json
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from pathlib import Path

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "connectapod")

async def import_designs():
    """Import design catalog from JSON file"""
    
    # Check if file exists
    json_file = Path("/app/backend/design_catalog.json")
    if not json_file.exists():
        print("❌ File not found: /app/backend/design_catalog.json")
        print("\n📋 To export your designs from Base44:")
        print("   1. Log in to Base44 dashboard")
        print("   2. Go to Data/Database section")
        print("   3. Export 'DesignTemplate' entity as JSON")
        print("   4. Save to: /app/backend/design_catalog.json")
        print("   5. Run this script again\n")
        return
    
    # Load JSON data
    try:
        with open(json_file) as f:
            designs = json.load(f)
        
        if not isinstance(designs, list):
            designs = [designs]
        
        print(f"📂 Found {len(designs)} design(s) to import\n")
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON file: {e}")
        return
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Import designs
    imported = 0
    updated = 0
    errors = 0
    
    for design in designs:
        try:
            # Ensure it has an ID
            if 'id' not in design:
                design['id'] = design.get('slug', f"design-{imported}")
            
            # Add created_date if missing
            if 'created_date' not in design:
                design['created_date'] = datetime.utcnow()
            
            # Check if design already exists
            existing = await db.design_templates.find_one({"id": design['id']})
            
            if existing:
                # Update existing
                await db.design_templates.update_one(
                    {"id": design['id']},
                    {"$set": design}
                )
                print(f"  ✓ Updated: {design.get('name', design['id'])}")
                updated += 1
            else:
                # Insert new
                await db.design_templates.insert_one(design)
                print(f"  ✓ Imported: {design.get('name', design['id'])}")
                imported += 1
                
        except Exception as e:
            print(f"  ✗ Error with {design.get('name', 'unknown')}: {e}")
            errors += 1
    
    print(f"\n✅ Import complete!")
    print(f"   Imported: {imported}")
    print(f"   Updated: {updated}")
    print(f"   Errors: {errors}")
    
    client.close()

async def check_current_designs():
    """Show what's currently in the database"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    designs = await db.design_templates.find({}, {"_id": 0}).to_list(length=100)
    
    print(f"\n📊 Current Design Catalog ({len(designs)} designs):")
    print("-" * 60)
    
    for design in designs:
        name = design.get('name', 'Unnamed')
        bedrooms = design.get('bedrooms', '?')
        sqm = design.get('size_sqm', '?')
        price = design.get('starting_price', '?')
        featured = "⭐" if design.get('is_featured') else "  "
        
        print(f"{featured} {name}")
        print(f"   {bedrooms} bed | {sqm}sqm | ${price:,}" if isinstance(price, (int, float)) else f"   {bedrooms} bed | {sqm}sqm | ${price}")
    
    print("-" * 60)
    client.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--list":
        # Show current designs
        asyncio.run(check_current_designs())
    else:
        # Import designs
        asyncio.run(import_designs())
        # Show result
        asyncio.run(check_current_designs())
