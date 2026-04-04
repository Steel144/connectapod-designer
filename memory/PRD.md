# Connectapod - Modular Building Design & Quoting Platform

## Original Problem Statement
Complete migration from the proprietary Base44 platform to a FastAPI + MongoDB + React stack for an interactive modular building design and quoting platform. Supports floor plan visual builder, wall catalogs, site map address integrations, quote generation, and a 3D Configurator Viewer.

## Tech Stack
- **Frontend**: React.js (Vite build, served via `serve -s dist` on port 3000), Tailwind CSS, Three.js
- **Backend**: FastAPI on port 8001, Motor (Async MongoDB)
- **State**: LocalStorage for persisting in-progress design state
- **Build**: Hot-reload DISABLED. Must run `bash /app/rebuild-frontend.sh` after React changes.

## Core Requirements
- 2D configurator with accurate module, wall, and furniture placement
- 3D Viewer reflecting accurate building textures
- Admin area to manage starter designs
- Summary calculations separating deck areas from internal floor areas
- LINZ Data Service integration for property boundaries
- Elevation views for building and pavilion modules

## What's Been Implemented

### Elevation System (Completed April 2026)
- Z/X elevation consistent sizing using cumulative positioning
- Connection modules display at correct proportional width (1.0x, no wall thickness multiplier)
- Standard modules use 1.1x multiplier (accounts for ~5.2m actual width with walls)
- Connection modules centered between pavilions with 300mm closing offset
- Orange divider lines at pavilion module boundaries (W/Y elevations)
- Wall labels on pavilion elevations (name, code, window/door sizes)
- W (North) elevation labels properly ordered for flipped display
- Unified title styling across All Elevations / Building Elevations / Pavilion Elevations
- Removed all legacy manual offset hacks

### Site Map (Completed April 2026)
- LINZ WMTS tile proxy (`/api/linz/wmts-tile/{z}/{x}/{y}`) for full property boundary coverage
- Removed orange GeoJSON boundary overlay (replaced by WMTS tiles)
- Property boundaries now visible across entire map view

### Design Catalogue (Completed April 2026)
- Dynamic deck/internal area calculation from grid modules when stored values missing
- Shows: internal m², deck m², total m² (with Maximize2 icon for both)
- "Manage Starter Designs" links to DesignCatalogue page

### Project Details & Address Sync (Completed April 2026)
- "Same as home address" button on Save panel (right of Site Address label)
- Bidirectional site address sync between Site Map panel and Save/Print panels
- Image uploader in design catalogue editor fixed (response key mismatch)

### Authentication
- Mocked via AuthContext.jsx with hardcoded admin password: `admin123`

### 3rd Party Integrations
- LINZ Data Service API (Mapping/Boundaries) — API key in backend .env
- OpenAI GPT-4o (Text Generation) — Emergent LLM Key

## Key Files
- `/app/frontend/src/components/configurator/CombinedElevations.jsx` - Pavilion elevation rendering
- `/app/frontend/src/components/configurator/VerticalElevation.jsx` - Building Z/X elevation rendering
- `/app/frontend/src/components/configurator/ElevationSlot.jsx` - Core image rendering wrapper
- `/app/frontend/src/components/configurator/SiteMapView.jsx` - Site Map with LINZ WMTS
- `/app/frontend/src/components/configurator/ProjectDetailsModal.jsx` - Save/print details
- `/app/frontend/src/pages/DesignCatalogue.jsx` - Design catalogue with area calculations
- `/app/frontend/src/hooks/useElevationGeometry.js` - Elevation slot geometry
- `/app/backend/server.py` - Backend API
- `/app/rebuild-frontend.sh` - MANDATORY build script

## Upcoming Tasks (P1)
- Lead Capture Funnel: Before entering designer or before export, collect name, email, phone, project details. Push to CRM/Email.

## Future Tasks (P2)
- Enforce build rules and Smart Configuration Engine logic (cladding, roof types, interior layouts, structural options)
- Real-Time Pricing Engine (dynamic cost updates based on size, materials, complexity)

## DB Schema
- `design_templates`: { id, name, description, category, size_sqm, internal_sqm, deck_sqm, price, modules, walls, heroImage }
