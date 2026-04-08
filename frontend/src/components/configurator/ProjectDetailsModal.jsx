import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, Download, Printer, X, BookOpen } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { generateProposal } from "@/utils/generateProposal";

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
  onSiteAddressChange = null,
  isAdmin = false
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

  const [generatingProposal, setGeneratingProposal] = useState(false);

  const handleGenerateProposal = async () => {
    handleSaveDetails();
    setGeneratingProposal(true);
    try {
      await generateProposal({
        clientFirstName, clientFamilyName, projectName, phone, email,
        siteAddress, siteType, placedModules, walls, costSummary, pricingConfig: pricingConfig || {}, moduleCount: placedModules.length,
      });
    } catch (err) {
      console.error("Proposal generation error:", err);
    }
    setGeneratingProposal(false);
    onClose();
  };

  const handleGenerateEstimate = async () => {
    handleSaveDetails();
    setGenerating(true);

    const totalSqm = placedModules.reduce((s, m) => s + (m.sqm || 0), 0);
    const cs = costSummary;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const mg = 20;
    const col1 = mg;
    const col2 = pageW - mg;
    const cw = col2 - col1;
    let y = 0;
    let pageNum = 1;
    const dateStr = new Date().toLocaleDateString("en-NZ", { day: "2-digit", month: "long", year: "numeric" });
    const refNum = `QT-${Date.now().toString().slice(-6)}`;
    const footerReserve = 30;

    const C = {
      brand: [241, 90, 34],
      dark: [40, 40, 40],
      text: [55, 55, 55],
      mid: [120, 120, 120],
      light: [170, 170, 170],
      rule: [215, 215, 215],
      headerBg: [45, 45, 45],
      rowAlt: [248, 247, 245],
      infoBg: [250, 249, 247],
    };
    const setC = (c) => doc.setTextColor(c[0], c[1], c[2]);
    const setF = (c) => doc.setFillColor(c[0], c[1], c[2]);
    const setD = (c) => doc.setDrawColor(c[0], c[1], c[2]);

    const drawFooter = () => {
      const fy = pageH - 20;
      setD(C.rule); doc.setLineWidth(0.2); doc.line(col1, fy, col2, fy);
      doc.setFontSize(6.5); doc.setFont("helvetica", "italic"); setC(C.light);
      doc.text("This estimate is indicative only and subject to final confirmation and site inspection to the satisfaction of connectapod.", col1, fy + 4);
      doc.setFont("helvetica", "normal");
      doc.text(`\u00A9 ${new Date().getFullYear()} connectapod`, col1, fy + 9);
      setC(C.brand); doc.text("www.connectapod.co.nz", col2, fy + 9, { align: "right" });
      setC(C.light); doc.text(`Page ${pageNum}`, pageW / 2, fy + 9, { align: "center" });
    };

    const checkPage = (needed) => {
      if (y + needed > pageH - footerReserve) {
        drawFooter();
        doc.addPage(); pageNum++; y = 25;
        doc.setFontSize(7); doc.setFont("helvetica", "normal"); setC(C.light);
        doc.text(`connectapod  |  Estimate ${refNum}`, col1, 15);
        doc.text(dateStr, col2, 15, { align: "right" });
        setD(C.rule); doc.setLineWidth(0.15); doc.line(col1, 18, col2, 18);
        y = 25;
      }
    };

    let altRow = false;
    const tableRow = (cells, opts = {}) => {
      const h = opts.height || 6.5;
      checkPage(h + 1);
      if (!opts.noBg && altRow) { setF(C.rowAlt); doc.rect(col1, y, cw, h, "F"); }
      altRow = !altRow;
      doc.setFontSize(opts.fontSize || 7.5);
      doc.setFont("helvetica", opts.bold ? "bold" : "normal");
      setC(opts.color || C.text);
      const ty = y + h * 0.65;
      cells.forEach(c => {
        if (c.color) setC(c.color);
        doc.text(c.text, c.x, ty, c.align === "right" ? { align: "right" } : undefined);
        if (c.color) setC(opts.color || C.text);
      });
      y += h;
    };

    const sectionBar = (label, rightLabel) => {
      checkPage(10); setF(C.headerBg);
      doc.rect(col1, y, cw, 7, "F");
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); setC([255, 255, 255]);
      doc.text(label, col1 + 4, y + 4.8);
      if (rightLabel) doc.text(rightLabel, col2 - 4, y + 4.8, { align: "right" });
      y += 9; altRow = false;
    };

    const subtotalLine = (label, value) => {
      checkPage(10); setD(C.rule); doc.setLineWidth(0.15); doc.line(col1, y, col2, y);
      y += 4; doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); setC(C.dark);
      doc.text(label, col1 + 3, y + 3);
      doc.text(value, col2 - 4, y + 3, { align: "right" });
      y += 8;
    };

    // ── TOP BRAND BAR ──
    setF(C.brand); doc.rect(0, 0, pageW, 2.5, "F");

    // ── LOGO ──
    const logoUrl = "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/1a43e85d2_Connectapod-01.png";
    try {
      await new Promise((resolve) => {
        const img = new Image(); img.crossOrigin = "anonymous";
        img.onload = () => { const lh = 10; doc.addImage(img, "PNG", col1, 6, (img.naturalWidth / img.naturalHeight) * lh, lh); resolve(); };
        img.onerror = () => resolve(); img.src = logoUrl;
      });
    } catch { setC(C.brand); doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("connectapod", col1, 14); }

    doc.setFontSize(7); doc.setFont("helvetica", "normal"); setC(C.mid);
    doc.text("BUILDING ESTIMATE", col2, 10, { align: "right" });
    doc.text(`${dateStr}  |  Ref: ${refNum}`, col2, 15, { align: "right" });
    setD(C.brand); doc.setLineWidth(0.4); doc.line(col1, 20, col2, 20);

    y = 27;
    doc.setFontSize(16); doc.setFont("helvetica", "bold"); setC(C.dark);
    doc.text("Estimate", col1, y); y += 9;

    // ── CLIENT INFO ──
    const fullClientName = `${clientFirstName} ${clientFamilyName}`.trim();
    const infoF = [];
    if (projectName) infoF.push(["Project", projectName]);
    if (fullClientName) infoF.push(["Client", fullClientName]);
    if (phone) infoF.push(["Phone", phone]);
    if (email) infoF.push(["Email", email]);
    if (siteAddress) infoF.push(["Site Address", siteAddress]);
    if (siteType !== "flat") infoF.push(["Site Type", siteType === "sloping" ? "Sloping" : "Steep"]);

    if (infoF.length > 0) {
      const lh = 5; const bh = 5 + infoF.length * lh + 3;
      checkPage(bh + 4); setF(C.infoBg); doc.rect(col1, y, cw, bh, "F");
      setD(C.rule); doc.setLineWidth(0.15); doc.rect(col1, y, cw, bh, "S");
      let iy = y + 5;
      infoF.forEach(([l, v]) => {
        doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); setC(C.mid); doc.text(l, col1 + 4, iy);
        doc.setFont("helvetica", "normal"); setC(C.dark); doc.setFontSize(7.5);
        doc.text(doc.splitTextToSize(v, cw - 38)[0], col1 + 30, iy); iy += lh;
      });
      y += bh + 5;
    }
    y += 2;

    // ── MODULES ──
    sectionBar("MODULES", "TOTAL");
    const moduleGroups = {};
    placedModules.forEach(mod => {
      const k = mod.label || mod.type;
      if (!moduleGroups[k]) moduleGroups[k] = { label: k, sqm: mod.sqm || 0, price: mod.price || 0, count: 0 };
      moduleGroups[k].count += 1;
    });
    Object.values(moduleGroups).forEach(g => {
      tableRow([
        { text: g.count > 1 ? `${g.label}  x${g.count}` : g.label, x: col1 + 3 },
        { text: `${(g.sqm * g.count).toFixed(1)} m\u00B2`, x: col1 + cw * 0.6, color: C.mid },
        { text: `$${(g.price * g.count).toLocaleString()}`, x: col2 - 4, align: "right" },
      ]);
    });
    subtotalLine("Modules Subtotal", `$${cs.modulesTotal.toLocaleString()}`);

    // ── WALL PANELS ──
    if (walls.length > 0) {
      sectionBar("WALL PANELS", "TOTAL");
      const wallGroups = {};
      walls.forEach(w => {
        const k = w.label || w.type;
        if (!wallGroups[k]) wallGroups[k] = { label: k, face: w.face || "-", price: w.price || 0, count: 0 };
        wallGroups[k].count += 1;
      });
      Object.values(wallGroups).forEach(g => {
        tableRow([
          { text: g.count > 1 ? `${g.label}  x${g.count}` : g.label, x: col1 + 3 },
          { text: g.face, x: col1 + cw * 0.6, color: C.mid },
          { text: `$${(g.price * g.count).toLocaleString()}`, x: col2 - 4, align: "right" },
        ]);
      });
      subtotalLine("Wall Panels Subtotal", `$${cs.wallsTotal.toLocaleString()}`);
    }

    // ── SITE, DELIVERY & INSTALLATION ──
    const addItems = [];
    if (cs.sitePrepVal > 0) {
      addItems.push({ t: `Site Prep & Foundations (${moduleCount} modules)`, a: cs.sitePrepBase });
      if (cs.slopingSurchargePerMod > 0) addItems.push({ t: `${siteType === "sloping" ? "Sloping" : "Steep"} surcharge (${moduleCount} modules)`, a: cs.slopingSurchargePerMod, i: true });
      if (cs.slopingSurchargePerHouse > 0) addItems.push({ t: `${siteType === "sloping" ? "Sloping" : "Steep"} surcharge`, a: cs.slopingSurchargePerHouse, i: true });
      if (cs.sitePrepWater > 0) addItems.push({ t: "Water & drainage", a: cs.sitePrepWater, i: true });
    }
    if (cs.deliveryVal > 0) {
      addItems.push({ t: `Transport (${moduleCount} modules)`, a: cs.deliveryVal - cs.ferryCost });
      if (cs.needsFerry) addItems.push({ t: `Ferry crossing (${moduleCount} modules)`, a: cs.ferryCost, i: true });
    }
    if (cs.installVal > 0) {
      addItems.push({ t: `Labour (${moduleCount} modules)`, a: cs.labourVal });
      addItems.push({ t: `Cranage (${moduleCount} modules)`, a: cs.cranageVal });
      if (cs.waterVal > 0) addItems.push({ t: `Water & drainage (${cs.wetModuleCount} wet modules)`, a: cs.waterVal });
      if (cs.electricalVal > 0) addItems.push({ t: "Electrical connection", a: cs.electricalVal });
    }
    if (addItems.length > 0) {
      sectionBar("SITE, DELIVERY & INSTALLATION", "TOTAL");
      addItems.forEach(item => {
        tableRow([
          { text: item.t, x: col1 + (item.i ? 7 : 3) },
          { text: `$${item.a.toLocaleString()}`, x: col2 - 4, align: "right" },
        ]);
      });
      y += 2;
    }

    // ── TOTALS ──
    checkPage(40);
    setD(C.rule); doc.setLineWidth(0.15); doc.line(col1, y, col2, y); y += 5;
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); setC(C.dark);
    doc.text("Subtotal (excl. GST)", col1 + 3, y + 3);
    doc.text(`$${cs.subtotal.toLocaleString()}`, col2 - 4, y + 3, { align: "right" }); y += 7;
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); setC(C.mid);
    doc.text(`GST (${cs.gstRateVal}%)`, col1 + 3, y + 3);
    doc.text(`$${cs.gstAmount.toLocaleString()}`, col2 - 4, y + 3, { align: "right" }); y += 9;

    checkPage(16); setF(C.brand); doc.rect(col1, y, cw, 12, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); setC([255, 255, 255]);
    doc.text("TOTAL ESTIMATE (incl. GST)", col1 + 5, y + 7.5);
    doc.text(`$${cs.grandTotal.toLocaleString()}`, col2 - 5, y + 7.5, { align: "right" }); y += 17;

    checkPage(10); doc.setFontSize(7); doc.setFont("helvetica", "normal"); setC(C.mid);
    doc.text(`Total Floor Area: ${totalSqm.toFixed(1)} m\u00B2   |   Modules: ${placedModules.length}   |   Wall Panels: ${walls.length}`, col1, y); y += 5;

    drawFooter();

    const filename = `connectapod-estimate-${projectName ? projectName.replace(/\s+/g, "-").toLowerCase() + "-" : ""}${refNum}.pdf`;
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
    const markupPct = pc.markup_percentage || 0;
    const markupMul = 1 + (markupPct / 100);
    const sitePrepBase = Math.round((pc.site_prep_per_module || 0) * moduleCount * markupMul);
    const slopingSurchargePerMod = siteType === "sloping" ? Math.round((pc.site_prep_sloping_surcharge_per_module || 0) * moduleCount * markupMul) :
                                   siteType === "steep" ? Math.round((pc.site_prep_steep_surcharge_per_module || 0) * moduleCount * markupMul) : 0;
    const slopingSurchargePerHouse = siteType === "sloping" ? Math.round((pc.site_prep_sloping_surcharge_per_house || 0) * markupMul) :
                                     siteType === "steep" ? Math.round((pc.site_prep_steep_surcharge_per_house || 0) * markupMul) : 0;
    const siteSurcharge = slopingSurchargePerMod + slopingSurchargePerHouse;
    const sitePrepWater = Math.round((pc.site_prep_water_drainage_per_house || 0) * markupMul);
    const sitePrepVal = sitePrepBase + siteSurcharge + sitePrepWater;
    const rawDeliveryTransport = deliveryEstimate ? (deliveryEstimate.estimated_hours * 2 * (pc.delivery_rate_per_hour || 0) * moduleCount) : 0;
    const rawFerryCost = (deliveryEstimate && deliveryEstimate.needs_ferry) ? (pc.ferry_crossing_cost || 0) * moduleCount : 0;
    const deliveryVal = Math.round((rawDeliveryTransport + rawFerryCost) * markupMul);
    const deliveryHours = deliveryEstimate ? deliveryEstimate.estimated_hours : 0;
    const needsFerry = deliveryEstimate ? deliveryEstimate.needs_ferry : false;
    const ferryCost = Math.round(rawFerryCost * markupMul);
    const labourVal = Math.round((pc.install_labour_per_module || 0) * moduleCount * markupMul);
    const cranageVal = Math.round((pc.install_cranage_per_module || 0) * moduleCount * markupMul);
    const wetModuleCount = placedModules.filter(m => {
      const label = (m.label || m.name || "").toLowerCase();
      return label.includes("bathroom") || label.includes("kitchen") || label.includes("laundry");
    }).length;
    const waterVal = Math.round((pc.install_water_drainage_per_wetmodule || 0) * wetModuleCount * markupMul);
    const electricalVal = Math.round((pc.install_electrical_per_house || 0) * markupMul);
    const installVal = labourVal + cranageVal + waterVal + electricalVal;
    const subtotal = modulesTotal + wallsTotal + sitePrepVal + deliveryVal + installVal;
    const marginPct = markupPct > 0 ? parseFloat((markupPct / (100 + markupPct) * 100).toFixed(2)) : 0;
    const gstRateVal = pc.gst_rate || 15;
    const gstAmount = Math.round(subtotal * gstRateVal / 100);
    const grandTotal = subtotal + gstAmount;
    return { modulesTotal, wallsTotal, sitePrepBase, slopingSurchargePerMod, slopingSurchargePerHouse, siteSurcharge, sitePrepWater, sitePrepVal, deliveryVal, deliveryHours, needsFerry, ferryCost, labourVal, cranageVal, waterVal, wetModuleCount, electricalVal, installVal, markupPct, marginPct, subtotal, gstRateVal, gstAmount, grandTotal };
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
              {costSummary && !isAdmin && (
                <div className="bg-gray-50 border border-gray-100 p-4 space-y-1.5 text-sm">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Summary</p>
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
              {costSummary && isAdmin && (
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
                    <span>{moduleCount} modules</span>
                    <span>${costSummary.sitePrepBase.toLocaleString()}</span>
                  </div>
                  {costSummary.slopingSurchargePerMod > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>{siteType === "sloping" ? "Sloping" : "Steep"} ({moduleCount} modules)</span>
                      <span>${costSummary.slopingSurchargePerMod.toLocaleString()}</span>
                    </div>
                  )}
                  {costSummary.slopingSurchargePerHouse > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>{siteType === "sloping" ? "Sloping" : "Steep"} surcharge</span>
                      <span>${costSummary.slopingSurchargePerHouse.toLocaleString()}</span>
                    </div>
                  )}
                  {costSummary.sitePrepWater > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Water & drainage</span>
                      <span>${costSummary.sitePrepWater.toLocaleString()}</span>
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-3 mb-1">Delivery</p>
                  <div className="flex justify-between text-gray-600">
                    <span>Transport ({moduleCount} modules)</span>
                    <span>${(costSummary.deliveryVal - costSummary.ferryCost).toLocaleString()}</span>
                  </div>
                  {costSummary.needsFerry && (
                    <div className="flex justify-between text-gray-600">
                      <span>Ferry crossing ({moduleCount} modules)</span>
                      <span>${costSummary.ferryCost.toLocaleString()}</span>
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-3 mb-1">Installation</p>
                  <div className="flex justify-between text-gray-600">
                    <span>Labour ({moduleCount} modules)</span>
                    <span>${costSummary.labourVal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Cranage ({moduleCount} modules)</span>
                    <span>${costSummary.cranageVal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Water & drainage ({costSummary.wetModuleCount} wet modules)</span>
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
              {costSummary && (
                <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">This estimate is indicative only and subject to final confirmation and site inspection to the satisfaction of connectapod.</p>
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