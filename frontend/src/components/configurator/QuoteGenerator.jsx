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
    const margin = 20;
    const col1 = margin;
    const col2 = pageW - margin;
    let y = margin;

    // Add logo image — preserve aspect ratio at fixed height of 14pt
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
    } catch (e) {
      doc.setTextColor(241, 90, 34);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("connectapod", margin, 18);
    }

    // Header line
    doc.setDrawColor(241, 90, 34);
    doc.setLineWidth(0.5);
    doc.line(0, 30, pageW, 30);

    doc.setTextColor(120, 120, 120);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Design Studio — Building Estimate", pageW - margin, 22, { align: "right" });

    y = 36;

    // Quote title
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("ESTIMATE", col1, y);
    y += 8;

    // Date & quote ref
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    const dateStr = new Date().toLocaleDateString("en-NZ", { day: "2-digit", month: "long", year: "numeric" });
    doc.text(`Date: ${dateStr}`, col1, y);
    doc.text(`Ref: QT-${Date.now().toString().slice(-6)}`, col2, y, { align: "right" });
    y += 10;

    // Client info box
    if (clientName || projectName || address || clientPhone || clientEmail) {
      const infoLines = [];
      if (projectName) infoLines.push({ label: "Project", value: projectName, bold: true });
      if (clientName) infoLines.push({ label: "Client", value: clientName });
      if (clientPhone) infoLines.push({ label: "Phone", value: clientPhone });
      if (clientEmail) infoLines.push({ label: "Email", value: clientEmail });
      if (address) infoLines.push({ label: "Site Address", value: address });
      
      const boxHeight = 10 + infoLines.length * 5.5;
      doc.setFillColor(250, 250, 250);
      doc.rect(col1, y, pageW - 2 * margin, boxHeight, "F");
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.rect(col1, y, pageW - 2 * margin, boxHeight);
      
      let infoY = y + 6;
      infoLines.forEach(item => {
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(item.label + ":", col1 + 5, infoY);
        
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", item.bold ? "bold" : "normal");
        doc.text(item.value, col1 + 32, infoY);
        infoY += 5.5;
      });
      
      y += boxHeight + 8;
    }

    y += 4;

    // Section: Modules
    doc.setFillColor(241, 90, 34);
    doc.rect(col1, y, pageW - 2 * margin, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("MODULES", col1 + 4, y + 5.5);
    doc.text("SQM", pageW - margin - 62, y + 5.5, { align: "right" });
    doc.text("UNIT PRICE", pageW - margin - 30, y + 5.5, { align: "right" });
    doc.text("TOTAL", col2 - 3, y + 5.5, { align: "right" });
    y += 11;

    // Group modules by label
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
        doc.setFillColor(248, 248, 248);
        doc.rect(col1, y - 2.5, pageW - 2 * margin, 9, "F");
      }
      rowAlt = !rowAlt;
      const label = g.count > 1 ? `${g.label} ×${g.count}` : g.label;
      doc.text(label, col1 + 4, y + 4);
      doc.text(`${(g.sqm * g.count).toFixed(1)} m²`, pageW - margin - 62, y + 4, { align: "right" });
      doc.text(`$${g.price.toLocaleString()}`, pageW - margin - 30, y + 4, { align: "right" });
      doc.text(`$${(g.price * g.count).toLocaleString()}`, col2 - 3, y + 4, { align: "right" });
      y += 9;
    });

    // Modules subtotal
    y += 1;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(col1, y, col2, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text("Modules Subtotal", col1 + 4, y);
    doc.text(`$${modulesTotal.toLocaleString()}`, col2 - 3, y, { align: "right" });
    y += 12;

    // Section: Walls
    if (walls.length > 0) {
      doc.setFillColor(241, 90, 34);
      doc.rect(col1, y, pageW - 2 * margin, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("WALL PANELS", col1 + 4, y + 5.5);
      doc.text("FACE", pageW - margin - 42, y + 5.5, { align: "right" });
      doc.text("TOTAL", col2 - 3, y + 5.5, { align: "right" });
      y += 11;

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
          doc.setFillColor(248, 248, 248);
          doc.rect(col1, y - 2.5, pageW - 2 * margin, 9, "F");
        }
        rowAlt = !rowAlt;
        const label = g.count > 1 ? `${g.label} ×${g.count}` : g.label;
        doc.text(label, col1 + 4, y + 4);
        doc.text(g.face, pageW - margin - 42, y + 4, { align: "right" });
        doc.text(`$${(g.price * g.count).toLocaleString()}`, col2 - 3, y + 4, { align: "right" });
        y += 9;
      });

      y += 1;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(col1, y, col2, y);
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text("Wall Panels Subtotal", col1 + 4, y);
      doc.text(`$${wallsTotal.toLocaleString()}`, col2 - 3, y, { align: "right" });
      y += 12;
    }

    // Grand total box
    y += 2;
    doc.setFillColor(30, 30, 30);
    doc.rect(col1, y, pageW - 2 * margin, 16, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL ESTIMATE (excl. GST)", col1 + 5, y + 10.5);
    doc.setFontSize(14);
    doc.text(`$${grandTotal.toLocaleString()}`, col2 - 5, y + 10.5, { align: "right" });
    y += 22;

    // Summary stats
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Floor Area: ${totalSqm.toFixed(1)} m²`, col1, y);
    doc.text(`|`, (col1 + col2) / 2, y, { align: "center" });
    doc.text(`Modules: ${placedModules.length}`, (col1 + col2) / 2 + 10, y);
    doc.text(`|`, col2 - 35, y);
    doc.text(`Wall Panels: ${walls.length}`, col2 - 25, y);
    y += 14;

    // Footer
    doc.setDrawColor(241, 90, 34);
    doc.setLineWidth(0.5);
    doc.line(col1, y, col2, y);
    y += 6;
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    doc.text("This estimate is indicative only and subject to final confirmation.", col1, y);
    y += 4;
    doc.text("Prices exclude GST, delivery, site preparation and installation.", col1, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text(`© ${new Date().getFullYear()} connectapod. All rights reserved.`, col1, y);
    doc.setTextColor(241, 90, 34);
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