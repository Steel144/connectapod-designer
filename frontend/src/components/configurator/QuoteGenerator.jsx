import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import { FileText, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function AddressAutocomplete({ value, onChange }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const textareaRef = useRef(null);

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
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&addressdetails=1&limit=5&countrycodes=nz`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
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
        ref={textareaRef}
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

export default function QuoteGenerator({ placedModules, walls, open, onClose }) {
  const loadSavedQuoteDetails = () => {
    try {
      return JSON.parse(localStorage.getItem("connectapod_print_details")) || {};
    } catch {
      return {};
    }
  };

  const saved = loadSavedQuoteDetails();
  const [clientName, setClientName] = useState(saved.clientName || "");
  const [clientEmail, setClientEmail] = useState(saved.email || "");
  const [clientPhone, setClientPhone] = useState(saved.phone || "");
  const [projectName, setProjectName] = useState(saved.projectName || "");
  const [address, setAddress] = useState(saved.address || "");
  const [generating, setGenerating] = useState(false);

  // Re-populate from storage whenever modal opens
  useEffect(() => {
    if (open) {
      const s = loadSavedQuoteDetails();
      setClientName(s.clientName || "");
      setClientEmail(s.email || "");
      setClientPhone(s.phone || "");
      setProjectName(s.projectName || "");
      setAddress(s.address || "");
    }
  }, [open]);

  const totalSqm = placedModules.reduce((s, m) => s + (m.sqm || 0), 0);
  const modulesTotal = placedModules.reduce((s, m) => s + (m.price || 0), 0);
  const wallsTotal = walls.reduce((s, w) => s + (w.price || 0), 0);
  const grandTotal = modulesTotal + wallsTotal;

  const generatePDF = async () => {
    // Save to shared storage
    const details = { projectName, clientName, address, email: clientEmail, phone: clientPhone };
    localStorage.setItem("connectapod_print_details", JSON.stringify(details));
    setGenerating(true);
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 22;
    const col1 = margin;
    const col2 = pageW - margin;
    let y = 18;

    // Add logo image — preserve aspect ratio at fixed height of 12pt
    const logoUrl = "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/1a43e85d2_Connectapod-01.png";
    try {
      await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const logoH = 12;
          const logoW = (img.naturalWidth / img.naturalHeight) * logoH;
          doc.addImage(img, "PNG", margin, y - 4, logoW, logoH);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = logoUrl;
      });
    } catch (e) {
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("connectapod", margin, y + 4);
    }

    // Header metadata (right side)
    doc.setTextColor(90, 90, 90);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Building Estimate", col2, y + 2, { align: "right" });

    y = 35;

    // Horizontal divider
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(col1, y, col2, y);
    y += 12;

    // Quote title
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Building Estimate", col1, y);
    
    // Date & quote ref (same line as title, right aligned)
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 110, 110);
    const dateStr = new Date().toLocaleDateString("en-NZ", { day: "2-digit", month: "short", year: "numeric" });
    const refNum = `EST-${Date.now().toString().slice(-6)}`;
    doc.text(`${refNum} | ${dateStr}`, col2, y, { align: "right" });
    y += 12;

    // Client info section (clean, minimal)
    if (projectName || clientName || address || clientPhone || clientEmail) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      doc.text("PREPARED FOR", col1, y);
      y += 6;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      
      if (projectName) {
        doc.setFont("helvetica", "bold");
        doc.text(projectName, col1, y);
        y += 5;
        doc.setFont("helvetica", "normal");
      }
      if (clientName) {
        doc.text(clientName, col1, y);
        y += 4.5;
      }
      if (clientPhone) {
        doc.setTextColor(90, 90, 90);
        doc.setFontSize(8.5);
        doc.text(clientPhone, col1, y);
        y += 4;
      }
      if (clientEmail) {
        doc.setTextColor(90, 90, 90);
        doc.text(clientEmail, col1, y);
        y += 4;
      }
      if (address) {
        doc.setTextColor(90, 90, 90);
        const maxWidth = 85;
        const lines = doc.splitTextToSize(address, maxWidth);
        lines.forEach(line => {
          doc.text(line, col1, y);
          y += 4;
        });
      }
      
      y += 8;
    }

    // Section: Modules (clean table header)
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(col1, y, col2, y);
    y += 6;
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("ITEM", col1, y);
    doc.text("AREA", pageW - margin - 65, y, { align: "right" });
    doc.text("UNIT PRICE", pageW - margin - 35, y, { align: "right" });
    doc.text("AMOUNT", col2, y, { align: "right" });
    y += 5;

    // Group modules by label
    const moduleGroups = {};
    placedModules.forEach(m => {
      const key = m.label || m.type;
      if (!moduleGroups[key]) moduleGroups[key] = { label: key, sqm: m.sqm || 0, price: m.price || 0, count: 0 };
      moduleGroups[key].count += 1;
    });

    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    
    Object.values(moduleGroups).forEach((g, idx) => {
      y += 5;
      const label = g.count > 1 ? `${g.label} (×${g.count})` : g.label;
      doc.text(label, col1, y);
      doc.setTextColor(90, 90, 90);
      doc.text(`${(g.sqm * g.count).toFixed(1)} m²`, pageW - margin - 65, y, { align: "right" });
      doc.text(`$${g.price.toLocaleString()}`, pageW - margin - 35, y, { align: "right" });
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "bold");
      doc.text(`$${(g.price * g.count).toLocaleString()}`, col2, y, { align: "right" });
      doc.setFont("helvetica", "normal");
    });

    // Modules subtotal
    y += 6;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(pageW - margin - 50, y, col2, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 70);
    doc.text("Modules Subtotal", col1, y);
    doc.setFont("helvetica", "bold");
    doc.text(`$${modulesTotal.toLocaleString()}`, col2, y, { align: "right" });
    y += 10;

    // Section: Walls
    if (walls.length > 0) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(col1, y, col2, y);
      y += 6;
      
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("WALL PANELS", col1, y);
      doc.text("FACE", pageW - margin - 45, y, { align: "right" });
      doc.text("AMOUNT", col2, y, { align: "right" });
      y += 5;

      const wallGroups = {};
      walls.forEach(w => {
        const key = w.label || w.type;
        if (!wallGroups[key]) wallGroups[key] = { label: key, face: w.face || "-", price: w.price || 0, count: 0 };
        wallGroups[key].count += 1;
      });

      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      
      Object.values(wallGroups).forEach(g => {
        y += 5;
        const label = g.count > 1 ? `${g.label} (×${g.count})` : g.label;
        doc.text(label, col1, y);
        doc.setTextColor(90, 90, 90);
        doc.text(g.face, pageW - margin - 45, y, { align: "right" });
        doc.setTextColor(50, 50, 50);
        doc.setFont("helvetica", "bold");
        doc.text(`$${(g.price * g.count).toLocaleString()}`, col2, y, { align: "right" });
        doc.setFont("helvetica", "normal");
      });

      y += 6;
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(pageW - margin - 50, y, col2, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(70, 70, 70);
      doc.text("Wall Panels Subtotal", col1, y);
      doc.setFont("helvetica", "bold");
      doc.text(`$${wallsTotal.toLocaleString()}`, col2, y, { align: "right" });
      y += 10;
    }

    // Grand total (clean, bold line)
    y += 3;
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.8);
    doc.line(col1, y, col2, y);
    y += 7;
    
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL ESTIMATE", col1, y);
    doc.setFontSize(13);
    doc.text(`$${grandTotal.toLocaleString()}`, col2, y, { align: "right" });
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 110, 110);
    doc.text("(excl. GST)", col1, y + 4);
    y += 12;

    // Summary stats (minimal, single line)
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Floor Area: ${totalSqm.toFixed(1)}m² • ${placedModules.length} Modules • ${walls.length} Wall Panels`, col1, y);
    y += 12;

    // Footer (clean, minimal)
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.3);
    doc.line(col1, y, col2, y);
    y += 5;
    
    doc.setTextColor(110, 110, 110);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("This estimate is indicative only. Prices exclude GST, delivery, site preparation and installation.", col1, y);
    y += 8;
    
    doc.setTextColor(130, 130, 130);
    doc.setFontSize(6.5);
    doc.text(`© ${new Date().getFullYear()} Connectapod Ltd. All rights reserved.`, col1, y);
    doc.setTextColor(90, 90, 90);
    doc.text("www.connectapod.com", col2, y, { align: "right" });

    const filename = `connectapod-estimate-${projectName ? projectName.replace(/\s+/g, "-").toLowerCase() + "-" : ""}${Date.now().toString().slice(-6)}.pdf`;
    doc.save(filename);
    setGenerating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Generate Estimate PDF</DialogTitle>
        </DialogHeader>

        {/* Cost summary */}
        <div className="bg-gray-50 border border-gray-100 p-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Modules ({placedModules.length})</span>
            <span>${modulesTotal.toLocaleString()}</span>
          </div>
          {walls.length > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Wall Panels ({walls.length})</span>
              <span>${wallsTotal.toLocaleString()}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
            <span>Total Estimate</span>
            <span>${grandTotal.toLocaleString()}</span>
          </div>
          <p className="text-[10px] text-gray-400">Excl. GST, delivery, site prep & installation</p>
        </div>

        {/* Client details */}
         <div className="space-y-3">
           <div>
             <Label className="text-xs text-gray-600">Client Name</Label>
             <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Jane Smith" className="mt-1 rounded-none text-sm h-9" />
           </div>
           <div>
             <Label className="text-xs text-gray-600">Phone</Label>
             <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="e.g. 021 234 5678" className="mt-1 rounded-none text-sm h-9" />
           </div>
           <div>
             <Label className="text-xs text-gray-600">Email</Label>
             <Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="e.g. jane@example.com" className="mt-1 rounded-none text-sm h-9" />
           </div>
           <div>
             <Label className="text-xs text-gray-600">Street Address</Label>
             <AddressAutocomplete value={address} onChange={setAddress} />
           </div>
           <div>
             <Label className="text-xs text-gray-600">Project Name</Label>
             <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Beach House" className="mt-1 rounded-none text-sm h-9" />
           </div>
         </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-none border-gray-200 text-gray-500 h-9">
            <X size={14} className="mr-1.5" /> Cancel
          </Button>
          <Button
            onClick={generatePDF}
            disabled={generating || placedModules.length === 0}
            className="flex-1 bg-[#F15A22] hover:bg-[#d94e1a] text-white rounded-none h-9"
          >
            <Download size={14} className="mr-1.5" />
            {generating ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}