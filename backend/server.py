from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import uuid
import shutil
from pathlib import Path
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Connectapod API")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "connectapod")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# File upload directory
UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# ============ MODELS ============

class DesignTemplate(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    size_sqm: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    starting_price: Optional[float] = None
    heroImage: Optional[str] = None
    categories: Optional[List[str]] = []
    use_cases: Optional[List[str]] = []
    budget_range: Optional[str] = None
    is_featured: Optional[bool] = False
    sort_order: Optional[int] = 0
    template_payload: Optional[Dict[str, Any]] = {}
    created_date: Optional[datetime] = None

class HomeDesign(BaseModel):
    id: Optional[str] = None
    name: str
    grid: List[Dict[str, Any]] = []
    walls: List[Dict[str, Any]] = []
    furniture: List[Dict[str, Any]] = []
    totalSqm: Optional[float] = 0
    estimatedPrice: Optional[float] = 0
    moduleCount: Optional[int] = 0
    created_date: Optional[datetime] = None

class ModuleEntry(BaseModel):
    id: Optional[str] = None
    category: str
    code: str
    name: str
    width: float = 3.0
    depth: float = 4.8
    sqm: Optional[float] = None
    price: Optional[float] = 0
    description: Optional[str] = ""
    variants: List[str] = []
    wallElevations_list: List[str] = []
    categories: List[str] = []
    originalCode: Optional[str] = None

class WallEntry(BaseModel):
    id: Optional[str] = None
    code: str
    name: str
    width: Optional[int] = 3000
    height: Optional[int] = 2400
    price: Optional[float] = 0
    description: Optional[str] = ""
    variants: List[str] = []

class FloorPlanImage(BaseModel):
    id: Optional[str] = None
    moduleType: str
    imageUrl: str

class WallImage(BaseModel):
    id: Optional[str] = None
    wallType: str
    imageUrl: str

class DeletedModule(BaseModel):
    id: Optional[str] = None
    moduleCode: str

class DeletedWall(BaseModel):
    id: Optional[str] = None
    wallCode: str

# ============ HELPER FUNCTIONS ============

def generate_id():
    return str(uuid.uuid4())

async def create_document(collection_name: str, data: dict):
    doc_id = generate_id()
    doc = {**data, "id": doc_id, "created_date": datetime.utcnow()}
    doc.pop("_id", None)
    
    # Create a copy for insertion to avoid MongoDB modifying our return value
    doc_to_insert = doc.copy()
    await db[collection_name].insert_one(doc_to_insert)
    
    # Return clean document without MongoDB _id
    return doc

async def list_documents(collection_name: str, sort_field: str = "-created_date"):
    sort_dir = -1 if sort_field.startswith("-") else 1
    field = sort_field.lstrip("-")
    cursor = db[collection_name].find({}, {"_id": 0})
    if field:
        cursor = cursor.sort(field, sort_dir)
    return await cursor.to_list(length=1000)

async def get_document(collection_name: str, doc_id: str):
    doc = await db[collection_name].find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

async def update_document(collection_name: str, doc_id: str, data: dict):
    data.pop("id", None)
    data.pop("_id", None)
    result = await db[collection_name].update_one({"id": doc_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return await get_document(collection_name, doc_id)

async def delete_document(collection_name: str, doc_id: str):
    result = await db[collection_name].delete_one({"id": doc_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"success": True}

async def filter_documents(collection_name: str, filters: dict):
    docs = await db[collection_name].find(filters, {"_id": 0}).to_list(length=1000)
    return docs

# ============ FILE UPLOAD ============

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_id = generate_id()
        ext = Path(file.filename).suffix
        filename = f"{file_id}{ext}"
        file_path = UPLOAD_DIR / filename
        
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_url = f"/api/files/{filename}"
        return {"file_url": file_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import FileResponse

@app.get("/api/files/{filename}")
async def get_file(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

# ============ DESIGN TEMPLATES ============

@app.post("/api/entities/DesignTemplate")
async def create_design_template(template: DesignTemplate):
    return await create_document("design_templates", template.dict(exclude_none=True))

@app.get("/api/entities/DesignTemplate")
async def list_design_templates(sort: str = "sort_order"):
    return await list_documents("design_templates", sort)

@app.get("/api/entities/DesignTemplate/{id}")
async def get_design_template(id: str):
    return await get_document("design_templates", id)

@app.put("/api/entities/DesignTemplate/{id}")
async def update_design_template(id: str, data: Dict[str, Any] = Body(...)):
    return await update_document("design_templates", id, data)

@app.delete("/api/entities/DesignTemplate/{id}")
async def delete_design_template(id: str):
    return await delete_document("design_templates", id)

# ============ HOME DESIGNS ============

@app.post("/api/entities/HomeDesign")
async def create_home_design(design: HomeDesign):
    return await create_document("home_designs", design.dict(exclude_none=True))

@app.get("/api/entities/HomeDesign")
async def list_home_designs(sort: str = "-created_date"):
    return await list_documents("home_designs", sort)

@app.get("/api/entities/HomeDesign/{id}")
async def get_home_design(id: str):
    return await get_document("home_designs", id)

@app.put("/api/entities/HomeDesign/{id}")
async def update_home_design(id: str, data: Dict[str, Any] = Body(...)):
    return await update_document("home_designs", id, data)

@app.delete("/api/entities/HomeDesign/{id}")
async def delete_home_design(id: str):
    return await delete_document("home_designs", id)

# ============ MODULE ENTRIES ============

@app.post("/api/entities/ModuleEntry")
async def create_module_entry(module: ModuleEntry):
    return await create_document("module_entries", module.dict(exclude_none=True))

@app.get("/api/entities/ModuleEntry")
async def list_module_entries():
    return await list_documents("module_entries", "")

@app.get("/api/entities/ModuleEntry/{id}")
async def get_module_entry(id: str):
    return await get_document("module_entries", id)

@app.put("/api/entities/ModuleEntry/{id}")
async def update_module_entry(id: str, data: Dict[str, Any] = Body(...)):
    return await update_document("module_entries", id, data)

@app.delete("/api/entities/ModuleEntry/{id}")
async def delete_module_entry(id: str):
    return await delete_document("module_entries", id)

# ============ WALL ENTRIES ============

@app.post("/api/entities/WallEntry")
async def create_wall_entry(wall: WallEntry):
    return await create_document("wall_entries", wall.dict(exclude_none=True))

@app.get("/api/entities/WallEntry")
async def list_wall_entries():
    return await list_documents("wall_entries", "")

@app.get("/api/entities/WallEntry/{id}")
async def get_wall_entry(id: str):
    return await get_document("wall_entries", id)

@app.put("/api/entities/WallEntry/{id}")
async def update_wall_entry(id: str, data: Dict[str, Any] = Body(...)):
    return await update_document("wall_entries", id, data)

@app.delete("/api/entities/WallEntry/{id}")
async def delete_wall_entry(id: str):
    return await delete_document("wall_entries", id)

# ============ FLOOR PLAN IMAGES ============

@app.post("/api/entities/FloorPlanImage")
async def create_floor_plan_image(image: FloorPlanImage):
    return await create_document("floor_plan_images", image.dict(exclude_none=True))

@app.get("/api/entities/FloorPlanImage")
async def list_floor_plan_images():
    return await list_documents("floor_plan_images", "")

@app.post("/api/entities/FloorPlanImage/filter")
async def filter_floor_plan_images(filters: Dict[str, Any] = Body(...)):
    return await filter_documents("floor_plan_images", filters)

@app.get("/api/entities/FloorPlanImage/{id}")
async def get_floor_plan_image(id: str):
    return await get_document("floor_plan_images", id)

@app.put("/api/entities/FloorPlanImage/{id}")
async def update_floor_plan_image(id: str, data: Dict[str, Any] = Body(...)):
    return await update_document("floor_plan_images", id, data)

@app.delete("/api/entities/FloorPlanImage/{id}")
async def delete_floor_plan_image(id: str):
    return await delete_document("floor_plan_images", id)

# ============ WALL IMAGES ============

@app.post("/api/entities/WallImage")
async def create_wall_image(image: WallImage):
    return await create_document("wall_images", image.dict(exclude_none=True))

@app.get("/api/entities/WallImage")
async def list_wall_images():
    return await list_documents("wall_images", "")

@app.post("/api/entities/WallImage/filter")
async def filter_wall_images(filters: Dict[str, Any] = Body(...)):
    return await filter_documents("wall_images", filters)

@app.get("/api/entities/WallImage/{id}")
async def get_wall_image(id: str):
    return await get_document("wall_images", id)

@app.put("/api/entities/WallImage/{id}")
async def update_wall_image(id: str, data: Dict[str, Any] = Body(...)):
    return await update_document("wall_images", id, data)

@app.delete("/api/entities/WallImage/{id}")
async def delete_wall_image(id: str):
    return await delete_document("wall_images", id)

# ============ DELETED MODULES ============

@app.post("/api/entities/DeletedModule")
async def create_deleted_module(module: DeletedModule):
    return await create_document("deleted_modules", module.dict(exclude_none=True))

@app.get("/api/entities/DeletedModule")
async def list_deleted_modules():
    return await list_documents("deleted_modules", "")

@app.post("/api/entities/DeletedModule/filter")
async def filter_deleted_modules(filters: Dict[str, Any] = Body(...)):
    return await filter_documents("deleted_modules", filters)

@app.delete("/api/entities/DeletedModule/{id}")
async def delete_deleted_module(id: str):
    return await delete_document("deleted_modules", id)

# ============ DELETED WALLS ============

@app.post("/api/entities/DeletedWall")
async def create_deleted_wall(wall: DeletedWall):
    return await create_document("deleted_walls", wall.dict(exclude_none=True))

@app.get("/api/entities/DeletedWall")
async def list_deleted_walls():
    return await list_documents("deleted_walls", "")

@app.post("/api/entities/DeletedWall/filter")
async def filter_deleted_walls(filters: Dict[str, Any] = Body(...)):
    return await filter_documents("deleted_walls", filters)

@app.delete("/api/entities/DeletedWall/{id}")
async def delete_deleted_wall(id: str):
    return await delete_document("deleted_walls", id)

# ============ HEALTH CHECK ============

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "Connectapod API"}

# ========== AI Generation Endpoint ==========

class AIGenerateRequest(BaseModel):
    prompt: str

@app.post("/api/ai/generate-description")
async def generate_description(request: AIGenerateRequest):
    """Generate AI description using Emergent LLM"""
    try:
        emergent_key = os.getenv("EMERGENT_LLM_KEY", "sk-emergent-fCe0222Fd00BcB9B95")
        
        # Initialize LLM chat
        chat = LlmChat(
            api_key=emergent_key,
            session_id=f"description-gen-{uuid.uuid4()}",
            system_message="You are a professional real estate copywriter. Write compelling, concise descriptions for modular homes."
        ).with_model("openai", "gpt-4o-mini")
        
        # Create user message
        user_message = UserMessage(text=request.prompt)
        
        # Get response
        description = await chat.send_message(user_message)
        
        return {"description": description.strip()}
            
    except Exception as e:
        print(f"AI generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
