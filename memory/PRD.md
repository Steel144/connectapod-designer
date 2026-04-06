# Connectapod - Modular Building Design & Quoting Platform

## Original Problem Statement
Complete migration from the proprietary Base44 platform to a FastAPI + MongoDB + React stack for an interactive modular building design and quoting platform. Supports floor plan visual builder, wall catalogs, site map address integrations, quote generation, and a 3D Configurator Viewer.

## Tech Stack
- **Frontend**: React.js (Vite build, served via `serve -s dist` on port 3000), Tailwind CSS, Three.js
- **Backend**: FastAPI on port 8001, Motor (Async MongoDB), Resend (email)
- **State**: LocalStorage for persisting design state
- **Build**: Hot-reload DISABLED. Must run `bash /app/rebuild-frontend.sh` after React changes.

## What's Been Implemented

### Admin Pricing Configuration (Completed April 2026)
- **Pricing Config DB** (`pricing_config` collection): Stores admin-editable rates
- **Admin UI tab**: "Pricing Config" in Admin Dashboard with grouped sections:
  - Site Prep & Foundations: per-module flat rate, sloping surcharge, steep surcharge
  - Delivery: rate per hour, ferry crossing cost (auto-detects North Island)
  - Installation: labour per module, cranage per module, water & drainage per house, electrical per house
  - GST rate (default 15%)
- **Auto-calculation API**: `GET /api/pricing/delivery-estimate?site_address=...` calculates driving hours from 29 Studholme St, Waimate to site address, detects North Island for ferry crossing
- **Estimate modal auto-populates** all charges from admin-set rates, no manual entry needed
- **Site type selector**: Flat / Sloping / Steep dropdown affects site prep costs
- **PDF generation** includes full breakdown: modules, walls, site prep, delivery (with ferry), installation line items, subtotal, GST, grand total

### Chevron Step Bar (Completed April 2026)
- 9-step chevron/arrow toolbar matching PROCESS.jpg mockup
- Orange segments, white-circled numbers, bold uppercase labels

### Design Chooser Flow (Completed April 2026)
- "Choose a Design" modal with two clear options: Starter Designs → DesignCatalogue page, My Saved Designs → /SavedDesigns page
- Both pages have identical card format (hero images/mini previews, specs, pricing)
- Back arrows return to chooser modal

### Admin Dashboard, Email, Share, Save/Overwrite
- All previously completed and stable

### Authentication
- Mocked via AuthContext.jsx with hardcoded admin password: `admin123`

## Key Files
- `/app/frontend/src/pages/Configurator.jsx` - Main configurator with chevron step bar
- `/app/frontend/src/pages/AdminDashboard.jsx` - Admin dashboard with Pricing Config tab
- `/app/frontend/src/pages/SavedDesigns.jsx` - Full-screen saved designs page
- `/app/frontend/src/components/configurator/ProjectDetailsModal.jsx` - Estimate modal with auto-pricing
- `/app/backend/server.py` - Backend API (pricing config, delivery estimate, admin, share, email)
- `/app/rebuild-frontend.sh` - MANDATORY build script

## Key API Endpoints
- `GET /api/admin/pricing` - Fetch pricing config
- `PUT /api/admin/pricing` - Update pricing config (admin)
- `GET /api/pricing/delivery-estimate?site_address=...` - Calculate delivery cost from Waimate
- `GET /api/admin/stats` - Lead/share counts
- `GET /api/admin/leads` - All saved designs
- `GET /api/admin/shares` - All shared designs
- `POST /api/share` - Create shared design
- `GET /api/shared/{share_id}` - Fetch shared design (public)
- CRUD: `/api/entities/{DesignTemplate|HomeDesign|ModuleEntry|WallEntry|FloorPlanImage|WallImage}`

## DB Collections
- `pricing_config`: { _type: "pricing", site_prep_per_module, site_prep_sloping_surcharge, site_prep_steep_surcharge, delivery_rate_per_hour, ferry_crossing_cost, install_labour_per_module, install_cranage_per_module, install_water_drainage_per_house, install_electrical_per_house, gst_rate, updated_at }
- `home_designs`: { id, name, grid, walls, furniture, totalSqm, estimatedPrice, moduleCount, clientFirstName, clientFamilyName, email, phone, homeAddress, siteAddress, viewed_by_admin, created_date }
- `shared_designs`: { share_id, name, grid, walls, furniture, totalSqm, estimatedPrice, moduleCount, clientFirstName, clientFamilyName, siteAddress, created_date }
- `design_templates`: { id, name, description, category, template_payload: { modules, layout } }

## Environment Variables (backend .env)
- `MONGO_URL`, `DB_NAME` - MongoDB
- `NOTIFICATION_EMAIL` - Email recipient (support@steelframeman.co.nz)
- `RESEND_API_KEY` - Configured for email sending
- `LINZ_API_KEY` - LINZ boundary tiles
- `EMERGENT_LLM_KEY` - OpenAI integration

## Upcoming Tasks (P1)
- Verify delivery hour estimates are reasonable for all NZ regions
- Add more granular distance calculation (currently uses city-name heuristic)

## Future Tasks (P2)
- Smart Configuration Engine (cladding, roof types, structural rules)
- Real-Time Pricing Engine (live cost updates as modules are placed)
- Re-enable/Fix 3D Viewer
