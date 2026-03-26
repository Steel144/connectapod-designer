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
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

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
    if (val.length < 3) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
       try {
         const response = await base44.functions.invoke('geocodeAddress', {
           query: val,
           limit: 5
         });
         const data = response.data?.results || [];
         setSuggestions(data);
         setOpen(data.length > 0);
       } catch (err) {
         console.error('Geocoding error:', err);
         setSuggestions([]);
       }
     }, 350);
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
        placeholder="e.g. 123 Main St, Auckland"
        className="mt-1 rounded-none text-sm w-full px-3 py-2 border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none min-h-[60px]"
        autoComplete="off"
      />
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
  printMode = null // 'plans' or 'elevations'
}) {
  const [projectName, setProjectName] = useState("");
  const [clientFirstName, setClientFirstName] = useState("");
  const [clientFamilyName, setClientFamilyName] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (open) {
      const saved = loadFromLocalStorage();
      setProjectName(saved.projectName || "");
      setClientFirstName(saved.clientFirstName || "");
      setClientFamilyName(saved.clientFamilyName || "");
      setHomeAddress(saved.homeAddress || "");
      setSiteAddress(saved.siteAddress || "");
      setEmail(saved.email || "");
      setPhone(saved.phone || "");
    }
  }, [open]);

  const handleSaveDetails = () => {
    const details = {
      projectName,
      clientFirstName,
      clientFamilyName,
      homeAddress,
      siteAddress,
      email,
      phone
    };
    saveToLocalStorage(details);
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
    const modulesTotal = placedModules.reduce((s, m) => s + (m.price || 0), 0);
    const wallsTotal = walls.reduce((s, w) => s + (w.price || 0), 0);
    const grandTotal = modulesTotal + wallsTotal;

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
    doc.text(`$${modulesTotal.toLocaleString()}`, col2, y + 3, { align: "right" });
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
      doc.text(`$${wallsTotal.toLocaleString()}`, col2, y + 3, { align: "right" });
      y += 12;
    }

    // Grand total
    y += 4;
    doc.setFillColor(30, 30, 30);
    doc.rect(col1, y, pageW - 2 * margin, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL ESTIMATE (excl. GST)", col1 + 4, y + 9.5);
    doc.text(`$${grandTotal.toLocaleString()}`, col2 - 2, y + 9.5, { align: "right" });
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
    doc.text("This quote is indicative only and subject to final confirmation. Prices exclude GST, delivery, site prep and installation.", col1, y);
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
  const costSummary = !isEstimate ? null : (() => {
    const modulesTotal = placedModules.reduce((s, m) => s + (m.price || 0), 0);
    const wallsTotal = walls.reduce((s, w) => s + (w.price || 0), 0);
    const grandTotal = modulesTotal + wallsTotal;
    return { modulesTotal, wallsTotal, grandTotal };
  })();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${isEstimate ? 'max-w-md' : 'max-w-sm'} rounded-none`} aria-describedby="dialog-description">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {isEstimate ? "Generate Estimate PDF" : isPrint ? `Print ${printMode === "plans" ? "Floor Plan" : "Elevations"}` : isSave ? "Save Design" : ""}
          </DialogTitle>
        </DialogHeader>

        <p id="dialog-description" className="text-xs text-gray-500 -mt-2">
          {isEstimate ? "These details will appear in the estimate." : isPrint ? "These details will appear in the title block." : isSave ? "Enter project and customer details." : ""}
        </p>

        {/* Cost summary for estimate */}
        {isEstimate && costSummary && (
          <div className="bg-gray-50 border border-gray-100 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Modules ({placedModules.length})</span>
              <span>${costSummary.modulesTotal.toLocaleString()}</span>
            </div>
            {walls.length > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Wall Panels ({walls.length})</span>
                <span>${costSummary.wallsTotal.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
              <span>Total Estimate</span>
              <span>${costSummary.grandTotal.toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-gray-400">Excl. GST, delivery, site prep & installation</p>
          </div>
        )}

        {/* Project details form */}
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
            <Label className="text-xs text-gray-600">Site Address</Label>
            <AddressAutocomplete value={siteAddress} onChange={setSiteAddress} />
          </div>
        </div>

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
            <Button 
              onClick={() => onConfirm(handleSaveDetails())} 
              className="flex-1 bg-[#F15A22] hover:bg-[#d94e1a] text-white rounded-none h-9"
            >
              <FileText size={14} className="mr-1.5" /> Save
            </Button>
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