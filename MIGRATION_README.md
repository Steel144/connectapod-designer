# Connectapod - Migrated to FastAPI + MongoDB

## Migration Complete! ✅

Successfully migrated from **Base44** to **FastAPI + MongoDB** backend.

## Architecture

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB
- **API**: RESTful endpoints at `/api/*`
- **File Uploads**: Local storage at `/app/backend/uploads`

### Frontend
- **Framework**: Vite + React 18
- **UI**: Tailwind CSS + Radix UI
- **3D Engine**: Three.js
- **State Management**: React Query

## API Endpoints

All endpoints follow the pattern: `/api/entities/{EntityType}`

### Entities:
- `DesignTemplate` - Pre-designed home templates
- `HomeDesign` - User saved designs
- `ModuleEntry` - Custom module catalogue
- `WallEntry` - Wall type catalogue
- `FloorPlanImage` - Module floor plan images
- `WallImage` - Wall elevation images
- `DeletedModule` - Soft-deleted modules
- `DeletedWall` - Soft-deleted walls

### Operations:
- `GET /api/entities/{EntityType}` - List all
- `POST /api/entities/{EntityType}` - Create new
- `GET /api/entities/{EntityType}/{id}` - Get by ID
- `PUT /api/entities/{EntityType}/{id}` - Update
- `DELETE /api/entities/{EntityType}/{id}` - Delete
- `POST /api/entities/{EntityType}/filter` - Filter (for images and deleted items)

### File Upload:
- `POST /api/upload` - Upload file, returns `{file_url}`
- `GET /api/files/{filename}` - Retrieve uploaded file

## Running the App

### Start Services
```bash
sudo supervisorctl restart all
```

### Check Status
```bash
sudo supervisorctl status
```

### View Logs
```bash
# Backend
tail -f /var/log/supervisor/backend.err.log

# Frontend
tail -f /var/log/supervisor/frontend.err.log
```

## Seeding Data

To populate initial sample data:
```bash
cd /app/backend
python seed.py
```

## Migrating Base44 Data

### Export from Base44
If you have existing Base44 data, you'll need to export it. The Base44 admin panel usually has export options.

### Import to MongoDB
1. Save your exported data as JSON files
2. Use the API endpoints to import:

```python
import requests
import json

# Example: Import designs
with open('designs.json') as f:
    designs = json.load(f)
    for design in designs:
        requests.post('http://localhost:8001/api/entities/HomeDesign', json=design)
```

## Environment Variables

### Backend (.env)
- `MONGO_URL` - MongoDB connection string (default: mongodb://localhost:27017)

### Frontend (.env)
- `REACT_APP_BACKEND_URL` - Backend API URL (auto-configured)

## Key Features

✅ Visual floor plan designer (drag-drop modules)
✅ Pre-designed templates catalogue
✅ Configuration engine (walls, furniture)
✅ Real-time pricing
✅ Quote generation
✅ 2D/Elevation/3D views
✅ Save/Load designs
✅ Site map integration
✅ Print/Export functionality
✅ Admin catalogue management

## What Changed in Migration

### Removed:
- Base44 SDK dependency
- Base44 authentication system
- Base44 Vite plugin

### Added:
- Custom FastAPI backend
- MongoDB database
- Custom API client (compatible with Base44 SDK interface)
- Local file upload handling

### Preserved:
- All frontend UI/UX
- All features and functionality
- Component structure
- Data models

## Development

### Backend
```bash
cd /app/backend
# Make changes to server.py
# Uvicorn auto-reloads on changes
```

### Frontend
```bash
cd /app/frontend
# Make changes to src/
# Vite HMR auto-updates
```

## Next Steps

1. **Data Migration**: Export your Base44 data and import to MongoDB
2. **Customization**: Modify pricing logic, add NZ/NASH rules
3. **Features**: Add CRM integration, email notifications
4. **Deployment**: Deploy to production (Railway, Render, AWS, etc.)

## Support

All features from the original Base44 app are fully functional with the new backend!
