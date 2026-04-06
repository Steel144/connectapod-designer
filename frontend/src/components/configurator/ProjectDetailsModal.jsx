import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, Download, Printer, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STORAGE_KEY = "connectapod_print_details";

const saveToLocalStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Save to localStorage failed:", err);
  }
};

const loadFromLocalStorage = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (err) {
    console.error("Load from localStorage failed:", err);
    return {};
  }
};

function AddressAutocomplete({ value, onChange }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const cacheRef = useRef(new Map());
  const lastRequestRef = useRef(0);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    clearTimeout(debounceRef.current);
    
    if (val.length < 3) { 
      setSuggestions([]); 
      setOpen(false); 
      return; 
    }

    // Check cache
    if (cacheRef.current.has(val)) {
      const cached = cacheRef.current.get(val);
      setSuggestions(cached);
      setOpen(cached.length > 0);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestRef.current;
        if (timeSinceLastRequest < 1000) {
          await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
        }
        lastRequestRef.current = Date.now();

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(val)}` +
          `&format=json` +
          `&addressdetails=1` +
          `&limit=8` +
          `&countrycodes=nz` +
          `&accept-language=en`,
          { 
            headers: { 
              "User-Agent": "Connectapod/1.0",
              "Accept-Language": "en"
            } 
          }
        );
        
        if (!response.ok) {
          throw new Error(`Nominatim error: ${response.status}`);
        }

        const data = await response.json();
        cacheRef.current.set(val, data);
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch (err) {
        console.error('Geocoding error:', err);
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  const handleSelect = (place) => {
    const display = place.display_name;
    setQuery(display);
    onChange(display);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <textarea
        value={query}
        onChange={handleInput}
        placeholder="e.g. 123 Queen St, Auckland, NZ"
        className="mt-1 rounded-none text-sm w-full px-3 py-2 border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none min-h-[60px]"
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-3 top-3 text-xs text-gray-400">
          Searching...
        </div>
      )}
      {open && (
        <ul className="absolute z-50 left-0 right-0 bg-white border border-gray-200 shadow-lg mt-0.5 max-h-48 overflow-y-auto text-sm">
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              className="px-3 py-2 cursor-pointer hover:bg-orange-50 hover:text-[#F15A22] border-b border-gray-100 last:border-0"
              onMouseDown={() => handleSelect(s)}
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProjectDetailsModal({ 
  open, 
  onClose, 
  mode, // 'estimate' or 'print' or null
  onConfirm,
  placedModules = [],
  walls = [],
  printMode = null, // 'plans' or 'elevations'
  designs = [],
  loadedDesignId = null,
  currentSiteAddress = "",
  onSiteAddressChange = null
}) {
  const [projectName, setProjectName] = useState("");
  const [clientFirstName, setClientFirstName] = useState("");
  const [clientFamilyName, setClientFamilyName] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saveAsMode, setSaveAsMode] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);
  const [siteType, setSiteType] = useState("flat"); // "flat", "sloping", "steep"

  useEffect(() => {
    if (open) {
      const saved = loadFromLocalStorage();
      setProjectName(saved.projectName || "");
      setClientFirstName(saved.clientFirstName || "");
      setClientFamilyName(saved.clientFamilyName || "");
      setHomeAddress(saved.homeAddress || "");
      setSiteAddress(currentSiteAddress || saved.siteAddress || "");
      setEmail(saved.email || "");
      setPhone(saved.phone || "");
      setSiteType(saved.siteType || "flat");
      setSaveAsMode(false);
      setSaveAsName("");
      setShowOverwriteWarning(false);
      // Fetch pricing config
      fetch("/api/admin/pricing").then(r => r.json()).then(d => setPricingConfig(d)).catch(() => {});
    }
  }, [open, currentSiteAddress]);

  // Fetch delivery estimate when site address changes
  useEffect(() => {
    if (!open || !siteAddress || siteAddress.length < 5 || mode !== "estimate") return;
    const timer = setTimeout(() => {
      fetch(`/api/pricing/delivery-estimate?site_address=${encodeURIComponent(siteAddress)}`)
        .then(r => r.json())
        .then(d => setDeliveryEstimate(d))
        .catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [siteAddress, open, mode]);

  const handleSaveDetails = () => {
    const details = {
      projectName,
      clientFirstName,
      clientFamilyName,
      homeAddress,
      siteAddress,
      email,
      phone,
      siteType
    };
    saveToLocalStorage(details);
    if (onSiteAddressChange) onSiteAddressChange(siteAddress);
    return details;
  };

  const handlePrint = () => {
    const details = handleSaveDetails();
    onConfirm(details);
  };

  const handleGenerateEstimate = async () => {
    handleSaveDetails();
    setGenerating(true);

    const totalSqm = placedModules.reduce((s, m) => s + (m.sqm || 0), 0);
    const cs = costSummary;

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    const col1 = margin;
    const col2 = pageW - margin;
    let y = margin;

    // Logo
    const logoUrl = "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/1a43e85d2_Connectapod-01.png";
    try {
      await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const logoH = 14;
          const logoW = (img.naturalWidth / img.naturalHeight) * logoH;
          doc.addImage(img, "PNG", margin, 8, logoW, logoH);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = logoUrl;
      });
    } catch {
      doc.setTextColor(241, 90, 34);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("connectapod", margin, 18);
    }

    doc.setDrawColor(241, 90, 34);
    doc.setLineWidth(0.5);
    doc.line(0, 30, pageW, 30);

    doc.setTextColor(120, 120, 120);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Design Studio — Building Estimate", pageW - margin, 22, { align: "right" });

    y = 36;

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("ESTIMATE", col1, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    const dateStr = new Date().toLocaleDateString("en-NZ", { day: "2-digit", month: "long", year: "numeric" });
    doc.text(`Date: ${dateStr}`, col1, y);
    doc.text(`Ref: QT-${Date.now().toString().slice(-6)}`, col2, y, { align: "right" });
    y += 10;

    // Client info
    const fullClientName = `${clientFirstName} ${clientFamilyName}`.trim();
    if (fullClientName || projectName || siteAddress || phone || email) {
      const infoLines = [];
      if (fullClientName) infoLines.push(`Client: ${fullClientName}`);
      if (phone) infoLines.push(`Phone: ${phone}`);
      if (email) infoLines.push(`Email: ${email}`);
      if (siteAddress) infoLines.push(`Site Address: ${siteAddress}`);
      
      const boxHeight = 8 + infoLines.length * 5;
      doc.setFillColor(248, 248, 248);
      doc.rect(col1, y, pageW - 2 * margin, boxHeight, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      
      let infoY = y + 5;
      infoLines.forEach(line => {
        doc.text(line, col1 + 4, infoY);
        infoY += 5;
      });
      
      if (projectName) {
        doc.setFont("helvetica", "bold");
        doc.text("Project:", col1 + 4, infoY);
        doc.setFont("helvetica", "normal");
        doc.text(projectName, col1 + 25, infoY);
      }
      
      y += boxHeight + 6;
    }

    y += 4;

    // Modules section
    doc.setFillColor(241, 90, 34);
    doc.rect(col1, y, pageW - 2 * margin, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("MODULES", col1 + 3, y + 5);
    doc.text("SQM", pageW - margin - 60, y + 5, { align: "right" });
    doc.text("UNIT PRICE", pageW - margin - 20, y + 5, { align: "right" });
    doc.text("TOTAL", col2, y + 5, { align: "right" });
    y += 10;

    const moduleGroups = {};
    placedModules.forEach(m => {
      const key = m.label || m.type;
      if (!moduleGroups[key]) moduleGroups[key] = { label: key, sqm: m.sqm || 0, price: m.price || 0, count: 0 };
      moduleGroups[key].count += 1;
    });

    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    let rowAlt = false;
    Object.values(moduleGroups).forEach(g => {
      if (rowAlt) {
        doc.setFillColor(252, 252, 252);
        doc.rect(col1, y - 2, pageW - 2 * margin, 8, "F");
      }
      rowAlt = !rowAlt;
      const label = g.count > 1 ? `${g.label} ×${g.count}` : g.label;
      doc.text(label, col1 + 2, y + 4);
      doc.text(`${(g.sqm * g.count).toFixed(1)} m²`, pageW - margin - 60, y + 4, { align: "right" });
      doc.text(`$${g.price.toLocaleString()}`, pageW - margin - 20, y + 4, { align: "right" });
      doc.text(`$${(g.price * g.count).toLocaleString()}`, col2, y + 4, { align: "right" });
      y += 8;
    });

    doc.setDrawColor(200, 200, 200);
    doc.line(col1, y, col2, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Modules Subtotal", col1 + 2, y + 3);
    doc.text(`$${cs.modulesTotal.toLocaleString()}`, col2, y + 3, { align: "right" });
    y += 10;

    // Walls section
    if (walls.length > 0) {
      doc.setFillColor(241, 90, 34);
      doc.rect(col1, y, pageW - 2 * margin, 7, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("WALL PANELS", col1 + 3, y + 5);
      doc.text("FACE", pageW - margin - 40, y + 5, { align: "right" });
      doc.text("TOTAL", col2, y + 5, { align: "right" });
      y += 10;

      const wallGroups = {};
      walls.forEach(w => {
        const key = w.label || w.type;
        if (!wallGroups[key]) wallGroups[key] = { label: key, face: w.face || "-", price: w.price || 0, count: 0 };
        wallGroups[key].count += 1;
      });

      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      rowAlt = false;
      Object.values(wallGroups).forEach(g => {
        if (rowAlt) {
          doc.setFillColor(252, 252, 252);
          doc.rect(col1, y - 2, pageW - 2 * margin, 8, "F");
        }
        rowAlt = !rowAlt;
        const label = g.count > 1 ? `${g.label} ×${g.count}` : g.label;
        doc.text(label, col1 + 2, y + 4);
        doc.text(g.face, pageW - margin - 40, y + 4, { align: "right" });
        doc.text(`$${(g.price * g.count).toLocaleString()}`, col2, y + 4, { align: "right" });
        y += 8;
      });

      doc.setDrawColor(200, 200, 200);
      doc.line(col1, y, col2, y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text("Wall Panels Subtotal", col1 + 2, y + 3);
      doc.text(`$${cs.wallsTotal.toLocaleString()}`, col2, y + 3, { align: "right" });
      y += 12;
    }

    // Grand total
    y += 4;

    // Additional charges section
    const additionalItems = [];
    if (cs.sitePrepVal > 0) {
      additionalItems.push({ label: `Site Prep & Foundations (${moduleCount} modules)`, amount: cs.sitePrepBase });
      if (cs.siteSurcharge > 0) additionalItems.push({ label: `  ${siteType === "sloping" ? "Sloping" : "Steep"} site surcharge`, amount: cs.siteSurcharge });
    }
    if (cs.deliveryVal > 0) {
      additionalItems.push({ label: `Delivery (${cs.deliveryHours}hrs x $${(pc.delivery_rate_per_hour || 0).toLocaleString()}/hr)`, amount: cs.deliveryVal - cs.ferryCost });
      if (cs.needsFerry) additionalItems.push({ label: "  Ferry crossing (North Island)", amount: cs.ferryCost });
    }
    if (cs.installVal > 0) {
      additionalItems.push({ label: `Labour (${moduleCount} modules x $${(pc.install_labour_per_module || 0).toLocaleString()})`, amount: cs.labourVal });
      additionalItems.push({ label: `Cranage (${moduleCount} modules x $${(pc.install_cranage_per_module || 0).toLocaleString()})`, amount: cs.cranageVal });
      if (cs.waterVal > 0) additionalItems.push({ label: "Water & drainage connection", amount: cs.waterVal });
      if (cs.electricalVal > 0) additionalItems.push({ label: "Electrical connection", amount: cs.electricalVal });
    }

    if (additionalItems.length > 0) {
      doc.setFillColor(241, 90, 34);
      doc.rect(col1, y, pageW - 2 * margin, 7, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("SITE, DELIVERY & INSTALLATION", col1 + 3, y + 5);
      doc.text("TOTAL", col2, y + 5, { align: "right" });
      y += 10;

      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      rowAlt = false;
      additionalItems.forEach(item => {
        if (rowAlt) {
          doc.setFillColor(252, 252, 252);
          doc.rect(col1, y - 2, pageW - 2 * margin, 8, "F");
        }
        rowAlt = !rowAlt;
        doc.text(item.label, col1 + 2, y + 4);
        doc.text(`$${item.amount.toLocaleString()}`, col2, y + 4, { align: "right" });
        y += 8;
      });
      y += 4;
    }

    // Subtotal
    doc.setDrawColor(200, 200, 200);
    doc.line(col1, y, col2, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text("Subtotal (excl. GST)", col1 + 2, y + 3);
    doc.text(`$${cs.subtotal.toLocaleString()}`, col2, y + 3, { align: "right" });
    y += 8;

    // GST
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`GST (${cs.gstRateVal}%)`, col1 + 2, y + 3);
    doc.text(`$${cs.gstAmount.toLocaleString()}`, col2, y + 3, { align: "right" });
    y += 10;

    // Grand total with GST
    doc.setFillColor(30, 30, 30);
    doc.rect(col1, y, pageW - 2 * margin, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL ESTIMATE (incl. GST)", col1 + 4, y + 9.5);
    doc.text(`$${cs.grandTotal.toLocaleString()}`, col2 - 2, y + 9.5, { align: "right" });
    y += 20;

    // Summary stats
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Floor Area: ${totalSqm.toFixed(1)} m²  |  Modules: ${placedModules.length}  |  Wall Panels: ${walls.length}`, col1, y);
    y += 12;

    // Footer
    doc.setDrawColor(241, 90, 34);
    doc.setLineWidth(0.5);
    doc.line(col1, y, col2, y);
    y += 5;
    doc.setTextColor(140, 140, 140);
    doc.setFontSize(7.5);
    doc.text("This quote is indicative only and subject to final confirmation. Site prep, delivery and installation charges are estimates only.", col1, y);
    y += 5;
    doc.text(`© ${new Date().getFullYear()} connectapod. All rights reserved.`, col1, y);
    doc.text("www.connectapod.com", col2, y, { align: "right" });

    const filename = `connectapod-estimate-${projectName ? projectName.replace(/\s+/g, "-").toLowerCase() + "-" : ""}${Date.now().toString().slice(-6)}.pdf`;
    doc.save(filename);
    setGenerating(false);
    onClose();
  };

  const isEstimate = mode === 'estimate';
  const isPrint = mode === 'print';
  const isSave = mode === 'save';
  const moduleCount = placedModules.length;
  const pc = pricingConfig || {};
  const costSummary = !isEstimate ? null : (() => {
    const modulesTotal = placedModules.reduce((s, m) => s + (m.price || 0), 0);
    const wallsTotal = walls.reduce((s, w) => s + (w.price || 0), 0);
    const sitePrepBase = (pc.site_prep_per_module || 0) * moduleCount;
    const siteSurcharge = siteType === "sloping" ? (pc.site_prep_sloping_surcharge || 0) :
                          siteType === "steep" ? (pc.site_prep_steep_surcharge || 0) : 0;
    const sitePrepVal = sitePrepBase + siteSurcharge;
    const deliveryVal = deliveryEstimate ? deliveryEstimate.total : 0;
    const deliveryHours = deliveryEstimate ? deliveryEstimate.estimated_hours : 0;
    const needsFerry = deliveryEstimate ? deliveryEstimate.needs_ferry : false;
    const ferryCost = deliveryEstimate ? deliveryEstimate.ferry_cost : 0;
    const labourVal = (pc.install_labour_per_module || 0) * moduleCount;
    const cranageVal = (pc.install_cranage_per_module || 0) * moduleCount;
    const waterVal = pc.install_water_drainage_per_house || 0;
    const electricalVal = pc.install_electrical_per_house || 0;
    const installVal = labourVal + cranageVal + waterVal + electricalVal;
    const subtotal = modulesTotal + wallsTotal + sitePrepVal + deliveryVal + installVal;
    const gstRateVal = pc.gst_rate || 15;
    const gstAmount = Math.round(subtotal * gstRateVal / 100);
    const grandTotal = subtotal + gstAmount;
    return { modulesTotal, wallsTotal, sitePrepBase, siteSurcharge, sitePrepVal, deliveryVal, deliveryHours, needsFerry, ferryCost, labourVal, cranageVal, waterVal, electricalVal, installVal, subtotal, gstRateVal, gstAmount, grandTotal };
  })();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${isEstimate ? 'max-w-3xl' : 'max-w-sm'} rounded-none max-h-[90vh] overflow-y-auto`} aria-describedby="dialog-description">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {isEstimate ? "Generate Estimate PDF" : isPrint ? `Print ${printMode === "plans" ? "Floor Plan" : "Elevations"}` : isSave ? "Save Design" : ""}
          </DialogTitle>
        </DialogHeader>

        <p id="dialog-description" className="text-xs text-gray-500 -mt-2">
          {isEstimate ? "These details will appear in the estimate." : isPrint ? "These details will appear in the title block." : isSave ? "Enter project and customer details." : ""}
        </p>

        {isEstimate ? (
          <div className="grid grid-cols-2 gap-6">
            {/* LEFT: Customer details */}
            <div className="space-y-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Customer Details</p>
              <div>
                <Label className="text-xs text-gray-600">Project / Design Name</Label>
                <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Beach House" className="mt-1 rounded-none text-sm h-9" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-600">Client First Name</Label>
                  <Input value={clientFirstName} onChange={e => setClientFirstName(e.target.value)} placeholder="e.g. Jane" className="mt-1 rounded-none text-sm h-9" />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Client Family Name</Label>
                  <Input value={clientFamilyName} onChange={e => setClientFamilyName(e.target.value)} placeholder="e.g. Smith" className="mt-1 rounded-none text-sm h-9" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Client Phone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 021 123 4567" className="mt-1 rounded-none text-sm h-9" />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Client Email</Label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. jane@example.com" className="mt-1 rounded-none text-sm h-9" />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Home Address</Label>
                <AddressAutocomplete value={homeAddress} onChange={setHomeAddress} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600">Site Address</Label>
                  <button
                    type="button"
                    data-testid="copy-home-address-btn"
                    onClick={() => { if (homeAddress) setSiteAddress(homeAddress); }}
                    className="text-xs text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                  >
                    Same as home address
                  </button>
                </div>
                <AddressAutocomplete value={siteAddress} onChange={setSiteAddress} />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Site Type</Label>
                <select
                  value={siteType}
                  onChange={e => setSiteType(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 text-sm bg-white"
                  data-testid="site-type-select"
                >
                  <option value="flat">Flat Site</option>
                  <option value="sloping">Sloping Site (surcharge applies)</option>
                  <option value="steep">Steep Site (surcharge applies)</option>
                </select>
              </div>
            </div>

            {/* RIGHT: Cost breakdown */}
            <div>
              {costSummary && (
                <div className="bg-gray-50 border border-gray-100 p-4 space-y-1.5 text-sm">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Building</p>
                  <div className="flex justify-between text-gray-600">
                    <span>Modules ({moduleCount})</span>
                    <span>${costSummary.modulesTotal.toLocaleString()}</span>
                  </div>
                  {walls.length > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Wall Panels ({walls.length})</span>
                      <span>${costSummary.wallsTotal.toLocaleString()}</span>
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-3 mb-1">Site Prep & Foundations</p>
                  <div className="flex justify-between text-gray-600">
                    <span>{moduleCount} mod x ${(pc.site_prep_per_module || 0).toLocaleString()}</span>
                    <span>${costSummary.sitePrepBase.toLocaleString()}</span>
                  </div>
                  {costSummary.siteSurcharge > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>{siteType === "sloping" ? "Sloping" : "Steep"} surcharge</span>
                      <span>${costSummary.siteSurcharge.toLocaleString()}</span>
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-3 mb-1">Delivery</p>
                  <div className="flex justify-between text-gray-600">
                    <span>{costSummary.deliveryHours}hrs x ${(pc.delivery_rate_per_hour || 0).toLocaleString()}/hr</span>
                    <span>${(costSummary.deliveryVal - costSummary.ferryCost).toLocaleString()}</span>
                  </div>
                  {costSummary.needsFerry && (
                    <div className="flex justify-between text-gray-600">
                      <span>Ferry crossing</span>
                      <span>${costSummary.ferryCost.toLocaleString()}</span>
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-3 mb-1">Installation</p>
                  <div className="flex justify-between text-gray-600">
                    <span>Labour ({moduleCount} x ${(pc.install_labour_per_module || 0).toLocaleString()})</span>
                    <span>${costSummary.labourVal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Cranage ({moduleCount} x ${(pc.install_cranage_per_module || 0).toLocaleString()})</span>
                    <span>${costSummary.cranageVal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Water & drainage</span>
                    <span>${costSummary.waterVal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Electrical</span>
                    <span>${costSummary.electricalVal.toLocaleString()}</span>
                  </div>

                  <div className="border-t border-gray-200 pt-2 mt-3 flex justify-between text-gray-600">
                    <span>Subtotal (excl. GST)</span>
                    <span>${costSummary.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST ({costSummary.gstRateVal}%)</span>
                    <span>${costSummary.gstAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
                    <span>Total (incl. GST)</span>
                    <span>${costSummary.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Non-estimate modes: single column form */
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">Project / Design Name</Label>
              <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Beach House" className="mt-1 rounded-none text-sm h-9" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-600">Client First Name</Label>
                <Input value={clientFirstName} onChange={e => setClientFirstName(e.target.value)} placeholder="e.g. Jane" className="mt-1 rounded-none text-sm h-9" />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Client Family Name</Label>
                <Input value={clientFamilyName} onChange={e => setClientFamilyName(e.target.value)} placeholder="e.g. Smith" className="mt-1 rounded-none text-sm h-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Client Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 021 123 4567" className="mt-1 rounded-none text-sm h-9" />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Client Email</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. jane@example.com" className="mt-1 rounded-none text-sm h-9" />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Home Address</Label>
              <AddressAutocomplete value={homeAddress} onChange={setHomeAddress} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-600">Site Address</Label>
                <button
                  type="button"
                  data-testid="copy-home-address-btn"
                  onClick={() => { if (homeAddress) setSiteAddress(homeAddress); }}
                  className="text-xs text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                >
                  Same as home address
                </button>
              </div>
              <AddressAutocomplete value={siteAddress} onChange={setSiteAddress} />
            </div>
          </div>
        )}

        {saveAsMode && (
          <div className="border border-[#F15A22]/30 bg-orange-50 p-3 space-y-1.5">
            <Label className="text-xs text-gray-700 font-semibold">New design name</Label>
            <Input
              autoFocus
              value={saveAsName}
              onChange={e => setSaveAsName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && saveAsName.trim()) {
                  const details = handleSaveDetails();
                  onConfirm({ ...details, projectName: saveAsName.trim() }, false);
                  setSaveAsMode(false);
                }
                if (e.key === "Escape") setSaveAsMode(false);
              }}
              placeholder="e.g. Beach House v2"
              className="rounded-none text-sm h-9"
            />
            <p className="text-[10px] text-gray-500">This will save as a new separate design.</p>
          </div>
        )}

        {showOverwriteWarning && (
          <div className="border border-amber-300 bg-amber-50 p-3 space-y-2">
            <p className="text-xs text-amber-800">
              A design named <span className="font-semibold">"{projectName.trim()}"</span> already exists. Do you want to overwrite it?
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowOverwriteWarning(false)} className="rounded-none text-xs h-8">
                Back
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                setShowOverwriteWarning(false);
                setSaveAsName(projectName.trim() + " (Copy)");
                setSaveAsMode(true);
              }} className="rounded-none text-xs h-8 text-gray-600">
                Save As New
              </Button>
              <Button size="sm" onClick={() => {
                const details = handleSaveDetails();
                setShowOverwriteWarning(false);
                onConfirm(details, true);
              }} className="rounded-none text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white">
                Overwrite
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-none border-gray-200 text-gray-500 h-9">
            <X size={14} className="mr-1.5" /> Cancel
          </Button>
          {isEstimate ? (
            <Button
              onClick={handleGenerateEstimate}
              disabled={generating || placedModules.length === 0}
              className="flex-1 bg-[#F15A22] hover:bg-[#d94e1a] text-white rounded-none h-9"
            >
              <Download size={14} className="mr-1.5" />
              {generating ? "Generating..." : "Download PDF"}
            </Button>
          ) : isSave ? (
            <>
              {saveAsMode ? (
                <Button
                  onClick={() => {
                    if (!saveAsName.trim()) return;
                    const details = handleSaveDetails();
                    onConfirm({ ...details, projectName: saveAsName.trim() }, false);
                    setSaveAsMode(false);
                  }}
                  disabled={!saveAsName.trim()}
                  className="flex-1 bg-[#F15A22] hover:bg-[#d94e1a] text-white rounded-none h-9"
                >
                  <FileText size={14} className="mr-1.5" /> Save Copy
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSaveAsName(projectName ? projectName + " (Copy)" : "");
                      setSaveAsMode(true);
                    }}
                    className="flex-1 rounded-none border-gray-300 text-gray-600 h-9 text-xs"
                  >
                    Save As
                  </Button>
                  <Button 
                    onClick={() => {
                      const details = handleSaveDetails();
                      const trimName = details.projectName?.trim()?.toLowerCase();
                      const matchingDesign = designs.find(d => d.name?.toLowerCase() === trimName);
                      
                      if (matchingDesign && matchingDesign.id !== loadedDesignId) {
                        // Name matches a DIFFERENT design — warn before overwriting
                        setShowOverwriteWarning(true);
                      } else if (matchingDesign && matchingDesign.id === loadedDesignId) {
                        // Updating the same design we loaded — overwrite directly
                        onConfirm(details, true);
                      } else {
                        // No match — save as new
                        onConfirm(details, false);
                      }
                    }} 
                    className="flex-1 bg-[#F15A22] hover:bg-[#d94e1a] text-white rounded-none h-9"
                  >
                    <FileText size={14} className="mr-1.5" /> {loadedDesignId ? "Save" : "Save"}
                  </Button>
                </>
              )}
            </>
          ) : (
            <Button onClick={handlePrint} className="flex-1 bg-[#F15A22] hover:bg-[#d94e1a] text-white rounded-none h-9">
              <Printer size={14} className="mr-1.5" /> Print
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}