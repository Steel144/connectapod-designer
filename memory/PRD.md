# Connectapod - Modular Building Design & Quoting Platform

## Original Problem Statement
Complete migration from the proprietary Base44 platform to a FastAPI + MongoDB + React stack for an interactive modular building design and quoting platform. Supports floor plan visual builder, wall catalogs, site map address integrations, quote generation, and a 3D Configurator Viewer.

## Tech Stack
- **Frontend**: React.js (Vite build, served via `serve -s dist` on port 3000), Tailwind CSS, Three.js
- **Backend**: FastAPI on port 8001, Motor (Async MongoDB), Resend (email)
- **State**: LocalStorage for persisting design state
- **Build**: Hot-reload DISABLED. Must run `bash /app/rebuild-frontend.sh` after React changes.

## What's Been Implemented

### Share Design (Updated April 2026)
- **Share modal z-index fix**: Modal elevated to z-[200] to render above all floating panels (z-[60])
- **Enhanced share payload**: Now includes email, phone, projectName in addition to existing fields
- **SharedDesign page** (`/shared/{id}`) completely rewritten with 4 tabs:
  - **Overview tab**: Branded title/cover page with Connectapod logo, project name, client name/email/phone, site address, area breakdown (internal/deck/total), building estimate, date, disclaimer
  - **Floor Plan tab**: SVG rendering of modules with floor plan images, walls, furniture items (with images or labeled placeholders), and dimension annotations (width/depth in metres)
  - **Elevations tab**: Full building elevations (W/Y/Z/X faces) with zoom controls
  - **Pricing & Summary tab**: Project info banner with site address/email/phone, area summary, module breakdown with per-item pricing, wall panels breakdown, and building total

### Admin Pricing & Estimate System
- **Estimate PDF**: Quick pricing-only document (modules, walls, site/delivery/install, totals)
- **Full Proposal PDF** (April 2026): 9-page branded lookbook (currently hidden, needs refinement)
- **Markup hidden from customers**: Markup % applied multiplicatively to costs, never shown separately
- **Admin vs Customer view**: Admin sees full breakdown; non-admin sees only summary + total
- **Pricing Config DB** (`pricing_config` collection): Stores admin-editable rates
- **Admin UI tab**: "Pricing Config" full-page at `/admin/pricing`

### Chevron Step Bar, Design Chooser, Admin Dashboard, Email, Share, Save/Overwrite
- All previously completed and stable

### Authentication
- Mocked via AuthContext.jsx with hardcoded admin password: `admin123`

## Key Files
- `/app/frontend/src/pages/Configurator.jsx` - Main configurator with chevron step bar
- `/app/frontend/src/pages/SharedDesign.jsx` - Shared design viewer (4-tab layout)
- `/app/frontend/src/pages/AdminDashboard.jsx` - Admin dashboard with Pricing Config tab
- `/app/frontend/src/components/configurator/ProjectDetailsModal.jsx` - Estimate modal with auto-pricing
- `/app/backend/server.py` - Backend API
- `/app/rebuild-frontend.sh` - MANDATORY build script

## Key API Endpoints
- `POST /api/share` - Create shared design (now includes email, phone, projectName)
- `GET /api/shared/{share_id}` - Fetch shared design (returns all fields)
- `GET /api/admin/pricing` & `PUT /api/admin/pricing` - Pricing config
- `GET /api/geocode` - Proxies address searches to Nominatim
- `GET /api/pricing/delivery-estimate?site_address=...` - Calculate delivery cost

## DB Collections
- `pricing_config`: Site prep, delivery, installation rates, GST, markup
- `home_designs`: Saved user designs with client info
- `shared_designs`: { share_id, name, grid, walls, furniture, totalSqm, estimatedPrice, moduleCount, clientFirstName, clientFamilyName, siteAddress, email, phone, projectName, created_date }
- `design_templates`: Starter design templates

## Environment Variables (backend .env)
- `MONGO_URL`, `DB_NAME` - MongoDB
- `NOTIFICATION_EMAIL` - Email recipient
- `RESEND_API_KEY` - Email sending
- `LINZ_API_KEY` - LINZ boundary tiles
- `EMERGENT_LLM_KEY` - OpenAI integration

## Upcoming Tasks (P1)
- Real-Time Pricing Engine: Dynamic cost updates as modules are placed on the 2D canvas
- Refine "Full Proposal" Lookbook PDF: Iterate on the 9-page marketing proposal and re-enable

## Future Tasks (P2)
- Smart Configuration Engine (cladding, roof types, structural rules)
- Re-enable/Fix 3D Viewer
