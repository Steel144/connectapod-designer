# Connectapod - Modular Building Design & Quoting Platform

## Original Problem Statement
Complete migration from the proprietary Base44 platform to a FastAPI + MongoDB + React stack for an interactive modular building design and quoting platform. Supports floor plan visual builder, wall catalogs, site map address integrations, quote generation, and a 3D Configurator Viewer.

## Tech Stack
- **Frontend**: React.js (Vite build, served via `serve -s dist` on port 3000), Tailwind CSS, Three.js
- **Backend**: FastAPI on port 8001, Motor (Async MongoDB)
- **State**: LocalStorage (`connectapod_print_details`, `connectapod_save_details`) and lifting state up to `Configurator.jsx`
- **Build**: Hot-reload DISABLED. Must run `bash /app/rebuild-frontend.sh` after React changes.

## Core Requirements
- 2D configurator with accurate module, wall, and furniture placement
- 3D Viewer reflecting accurate building textures
- Admin area to manage starter designs
- Summary calculations separating deck areas from internal floor areas
- LINZ Data Service integration for property boundaries
- Elevation views for building and pavilion modules

## What's Been Implemented

### Save/Overwrite Flow (Completed April 2026)
- Tracks `loadedDesignId` when loading from My Designs or after first save
- Save with same name as loaded design → updates directly (no duplicate)
- Save with name matching a DIFFERENT existing design → overwrite warning with 3 choices:
  - **Back**: dismiss warning
  - **Save As New**: opens input for new name
  - **Overwrite**: replaces the existing design
- `saveMutation.onSuccess` stores the new design ID to enable subsequent updates
- "Save As" button always creates a new copy with a user-specified name

### Share Design Feature (Completed April 2026)
- Share button in configurator toolbar creates a snapshot of current design
- Backend `POST /api/share` creates shared design with unique 8-char alphanumeric slug
- Backend `GET /api/shared/{share_id}` returns shared design data (public, no auth)
- Shared viewer page at `/shared/:shareId` with 3 tabs: Floor Plan, Elevations, Summary
- Copy-to-clipboard share URL modal
- 404 error page for invalid share links

### Pavilion Elevation Fixes (Completed April 2026)
- Z/X pavilion elevations displayed side-by-side (inline-block) matching building layout
- Cumulative positioning for Z/X pavilion modules (no more stacking at position 0)
- Strict depth boundary check prevents Connection walls bleeding into adjacent pavilion views
- Front/back pavilion background shading in horizontal (W/Y) elevations

### Elevation System (Completed)
- Z/X consistent sizing using cumulative positioning
- Connection modules at correct proportional width
- Orange divider lines at pavilion module boundaries
- Wall labels on pavilion elevations (name, code, window/door sizes)

### NZ Environmental Zones (Completed)
- Wind, Earthquake, Corrosion zone auto-detection on Site Map
- Granular city-level Z-factor lookup for Earthquake zones

### Site Map (Completed)
- LINZ WMTS tile proxy for property boundaries via backend
- Full map coverage with Nominatim geocoding

### Authentication
- Mocked via AuthContext.jsx with hardcoded admin password: `admin123`

### 3rd Party Integrations
- LINZ Data Service API (Mapping/Boundaries) — API key in backend .env
- Nominatim OpenStreetMap (Geocoding) — Public API
- OpenAI GPT-4o (Text Generation) — Emergent LLM Key

## Key Files
- `/app/frontend/src/pages/Configurator.jsx` - Main configurator (Save, Share, loadedDesignId tracking)
- `/app/frontend/src/pages/SharedDesign.jsx` - Shared design read-only viewer
- `/app/frontend/src/components/configurator/ProjectDetailsModal.jsx` - Save/overwrite modal
- `/app/frontend/src/components/configurator/CombinedElevations.jsx` - Pavilion elevation rendering
- `/app/frontend/src/components/configurator/VerticalElevation.jsx` - Building Z/X rendering
- `/app/frontend/src/components/configurator/HorizontalElevation.jsx` - Building W/Y rendering
- `/app/frontend/src/components/configurator/SiteMapView.jsx` - Site Map with LINZ WMTS
- `/app/frontend/src/hooks/useElevationGeometry.js` - Elevation slot geometry
- `/app/backend/server.py` - Backend API
- `/app/rebuild-frontend.sh` - MANDATORY build script

## Key API Endpoints
- `POST /api/share` - Create shared design snapshot, returns `{ share_id }`
- `GET /api/shared/{share_id}` - Fetch shared design (public)
- `GET /api/linz/boundary-tiles/{z}/{x}/{y}.png` - LINZ WMTS proxy
- `POST /api/upload` - Image upload
- CRUD: `/api/entities/{DesignTemplate|HomeDesign|ModuleEntry|WallEntry|FloorPlanImage|WallImage}`

## Upcoming Tasks (P1)
- Lead Capture Funnel: Before entering designer or before export, collect name, email, phone, project details. Push to CRM/Email.

## Future Tasks (P2)
- Enforce build rules and Smart Configuration Engine logic
- Real-Time Pricing Engine
- Re-enable/Fix 3D Viewer

## DB Schema
- `design_templates`: { id, name, description, category, template_payload: { modules, layout } }
- `home_designs`: { id, name, grid, walls, furniture, totalSqm, estimatedPrice, moduleCount }
- `shared_designs`: { share_id, name, grid, walls, furniture, totalSqm, estimatedPrice, moduleCount, clientFirstName, clientFamilyName, siteAddress, created_date }
