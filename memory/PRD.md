# Connectapod - Modular Building Design & Quoting Platform

## Original Problem Statement
Complete migration from the proprietary Base44 platform to a FastAPI + MongoDB + React stack for an interactive modular building design and quoting platform. Supports floor plan visual builder, wall catalogs, site map address integrations, quote generation, and a 3D Configurator Viewer.

## Tech Stack
- **Frontend**: React.js (Vite build, served via `serve -s dist` on port 3000), Tailwind CSS, Three.js
- **Backend**: FastAPI on port 8001, Motor (Async MongoDB), Resend (email)
- **State**: LocalStorage for persisting design state
- **Build**: Hot-reload DISABLED. Must run `bash /app/rebuild-frontend.sh` after React changes.

## What's Been Implemented

### Admin Pricing & Estimate System
- **Estimate PDF**: Quick pricing-only document (modules, walls, site/delivery/install, totals)
- **Full Proposal PDF** (April 2026): 9-page branded lookbook incorporating all marketing pillars:
  - Page 1: Cover with hero image, project name, client name
  - Page 2: Founder's story (condensed)
  - Page 3: Design specs + module breakdown + floor plan placeholder
  - Pages 4-5: Full itemised estimate with markup baked into line items
  - Page 6: "The No Surprises Guarantee" (Budget, Timeline, Trust, Quality, Communication)
  - Page 7: 8-step process workflow
  - Page 8: Team, preferred partners, company values
  - Page 9: CTA — book a discovery session
  - Every page: branded footer with disclaimer, copyright, www.connectapod.co.nz, page numbers
- **Markup hidden from customers**: Markup % applied multiplicatively to costs, never shown separately
- **Admin vs Customer view**: Admin sees full breakdown; non-admin sees only summary + total
- **Pricing Config DB** (`pricing_config` collection): Stores admin-editable rates
- **Admin UI tab**: "Pricing Config" full-page at `/admin/pricing` with grouped sections:
  - Site Prep & Foundations: per-module flat rate, sloping surcharge (per mod + per house), steep surcharge (per mod + per house), water & drainage per house
  - Delivery: rate per hour, ferry crossing cost per module (auto-detects North Island)
  - Installation: labour per module, cranage per module, water & drainage per wet module, electrical per house
  - Tax: GST rate (default 15%), Markup %, auto-calculated Margin %
- **Markup baked into line items** (April 2026): Markup % is applied multiplicatively to all site prep, delivery, and installation line items before display. Never shown as a separate line to the customer.
- **Admin vs Customer view** (April 2026): Admin sees full cost breakdown (site prep, delivery, installation line items + markup note). Non-admin customers see only modules, walls, subtotal, GST, and total — no calculation details.
- **Auto-calculation API**: `GET /api/pricing/delivery-estimate?site_address=...` calculates driving hours from 29 Studholme St, Waimate to site address, detects North Island for ferry crossing
- **Estimate modal auto-populates** all charges from admin-set rates, no manual entry needed
- **Site type selector**: Flat / Sloping / Steep dropdown affects site prep costs
- **PDF generation** includes full breakdown with markup baked in: modules, walls, site prep, delivery (with ferry), installation line items, subtotal, GST, grand total

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
