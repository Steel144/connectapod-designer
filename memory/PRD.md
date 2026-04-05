# Connectapod - Modular Building Design & Quoting Platform

## Original Problem Statement
Complete migration from the proprietary Base44 platform to a FastAPI + MongoDB + React stack for an interactive modular building design and quoting platform. Supports floor plan visual builder, wall catalogs, site map address integrations, quote generation, and a 3D Configurator Viewer.

## Tech Stack
- **Frontend**: React.js (Vite build, served via `serve -s dist` on port 3000), Tailwind CSS, Three.js
- **Backend**: FastAPI on port 8001, Motor (Async MongoDB), Resend (email)
- **State**: LocalStorage for persisting design state
- **Build**: Hot-reload DISABLED. Must run `bash /app/rebuild-frontend.sh` after React changes.

## What's Been Implemented

### Guided User Flow (Completed April 2026)
- **Step Indicator Bar**: 6-step progress bar below toolbar (Select Design → Customise → Elevations → Site Map → Save Details → Share & Print)
- Steps auto-complete based on user actions, clickable to navigate
- Persisted in localStorage across sessions
- **Guided Tooltips**: Context-specific hints on first visit to each section, dismissable with "Got it, don't show again"

### Admin Dashboard (Completed April 2026)
- Route: `/admin/dashboard` (password protected: admin123)
- **Client Leads tab**: All saved designs with client name, project, email, phone, addresses, design stats, expandable detail rows
- **Shared Designs tab**: All shared links with client info, module count, dates, clickable View links
- **Stats Bar**: Real-time lead count + "new" badge for unviewed leads
- **Accessible from**: Admin dropdown menu → "Client Dashboard"

### Email Notifications (Completed April 2026)
- Auto-sends email to support@steelframeman.co.nz when a design is saved/updated
- Includes client name, project, email, phone, site address, module count, estimated price
- **Requires**: `RESEND_API_KEY` in backend .env (gracefully skips if not configured)
- Non-blocking: failures don't affect save operation

### Save/Overwrite Flow (Completed April 2026)
- Tracks `loadedDesignId` for direct updates
- Overwrite warning when name matches a different existing design
- Save As option for new copies

### Share Design Feature (Completed April 2026)
- Share button creates design snapshot with unique URL
- Public viewer at `/shared/:shareId` with Floor Plan, Elevations, Summary tabs

### Pavilion Elevation Fixes (Completed April 2026)
- Z/X side-by-side layout, cumulative positioning, connection wall bleed prevention

### NZ Environmental Zones, Site Map, Design Catalogue, Address Sync
- All previously completed and stable

### Authentication
- Mocked via AuthContext.jsx with hardcoded admin password: `admin123`

## Key Files
- `/app/frontend/src/components/configurator/StepIndicator.jsx` - 6-step progress bar
- `/app/frontend/src/components/configurator/GuidedTooltip.jsx` - First-time hint tooltips
- `/app/frontend/src/pages/AdminDashboard.jsx` - Admin leads/shares tracking
- `/app/frontend/src/pages/SharedDesign.jsx` - Public shared design viewer
- `/app/frontend/src/pages/Configurator.jsx` - Main configurator
- `/app/frontend/src/components/configurator/ProjectDetailsModal.jsx` - Save/overwrite modal
- `/app/frontend/src/components/configurator/CombinedElevations.jsx` - Pavilion elevations
- `/app/backend/server.py` - Backend API (admin endpoints, email, share)
- `/app/rebuild-frontend.sh` - MANDATORY build script

## Key API Endpoints
- `GET /api/admin/stats` - Lead/share counts with new badge
- `GET /api/admin/leads` - All saved designs (marks as viewed)
- `GET /api/admin/shares` - All shared designs
- `POST /api/share` - Create shared design
- `GET /api/shared/{share_id}` - Fetch shared design (public)
- CRUD: `/api/entities/{DesignTemplate|HomeDesign|ModuleEntry|WallEntry|FloorPlanImage|WallImage}`

## Environment Variables (backend .env)
- `MONGO_URL`, `DB_NAME` - MongoDB
- `NOTIFICATION_EMAIL` - Email recipient for lead notifications (default: support@steelframeman.co.nz)
- `RESEND_API_KEY` - Required for email sending (not yet configured)
- `LINZ_API_KEY` - LINZ boundary tiles
- `EMERGENT_LLM_KEY` - OpenAI integration

## Upcoming Tasks (P1)
- Configure Resend API key for live email notifications
- Lead Capture Funnel enhancement: require client details before first export

## Future Tasks (P2)
- Enforce build rules and Smart Configuration Engine logic
- Real-Time Pricing Engine
- Re-enable/Fix 3D Viewer

## DB Schema
- `home_designs`: { id, name, grid, walls, furniture, totalSqm, estimatedPrice, moduleCount, clientFirstName, clientFamilyName, email, phone, homeAddress, siteAddress, viewed_by_admin, created_date }
- `shared_designs`: { share_id, name, grid, walls, furniture, totalSqm, estimatedPrice, moduleCount, clientFirstName, clientFamilyName, siteAddress, created_date }
- `design_templates`: { id, name, description, category, template_payload: { modules, layout } }
