import React, { useState } from "react";
import { jsPDF } from "jspdf";
import { FileText, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function QuoteGenerator({ placedModules, walls, open, onClose }) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);

  const totalSqm = placedModules.reduce((s, m) => s + (m.sqm || 0), 0);
  const modulesTotal = placedModules.reduce((s, m) => s + (m.price || 0), 0);
  const wallsTotal = walls.reduce((s, w) => s + (w.price || 0), 0);
  const grandTotal = modulesTotal + wallsTotal;

  // Calculate room counts
  const roomCounts = React.useMemo(() => {
    const counts = { bedroom: 0, bathroom: 0, kitchen: 0, living: 0, laundry: 0, deck: 0 };
    placedModules.forEach(m => {
      const groupKey = (m.groupKey || "").toLowerCase();
      const label = (m.label || m.type || "").toLowerCase();
      if (groupKey === "bedroom" || label.includes("bedroom") || label.includes("bed")) counts.bedroom++;
      else if (groupKey === "bathroom" || label.includes("bathroom") || label.includes("bath")) counts.bathroom++;
      else if (groupKey === "kitchen" || label.includes("kitchen")) counts.kitchen++;
      else if (groupKey === "living" || label.includes("living")) counts.living++;
      else if (groupKey === "laundry" || label.includes("laundry")) counts.laundry++;
      else if (groupKey === "deck" || label.includes("deck")) counts.deck++;
    });
    return counts;
  }, [placedModules]);

  // Calculate building dimensions
  const buildingDimensions = React.useMemo(() => {
    if (placedModules.length === 0) return null;
    const CELL_SIZE = 0.6;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    placedModules.forEach(m => {
      minX = Math.min(minX, m.x || 0);
      maxX = Math.max(maxX, (m.x || 0) + (m.w || 0));
      minY = Math.min(minY, m.y || 0);
      maxY = Math.max(maxY, (m.y || 0) + (m.h || 0));
    });
    return {
      width: ((maxX - minX) * CELL_SIZE).toFixed(1),
      depth: ((maxY - minY) * CELL_SIZE).toFixed(1),
    };
  }, [placedModules]);

  const generatePDF = async () => {
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
    if (clientName || projectName || projectAddress) {
      doc.setFillColor(248, 248, 248);
      doc.rect(col1, y, pageW - 2 * margin, projectAddress ? 32 : 22, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      if (clientName) {
        doc.text("Prepared for:", col1 + 4, y + 7);
        doc.setFont("helvetica", "normal");
        doc.text(clientName, col1 + 4, y + 14);
      }
      if (projectName) {
        doc.setFont("helvetica", "bold");
        doc.text("Project:", pageW / 2, y + 7);
        doc.setFont("helvetica", "normal");
        doc.text(projectName, pageW / 2, y + 14);
      }
      if (projectAddress) {
        doc.setFont("helvetica", "bold");
        doc.text("Site Address:", col1 + 4, y + 21);
        doc.setFont("helvetica", "normal");
        doc.text(projectAddress, col1 + 50, y + 21);
      }
      y += projectAddress ? 38 : 28;
    }

    // Building summary section
    y += 2;
    doc.setFillColor(240, 240, 240);
    doc.rect(col1, y, pageW - 2 * margin, 18, "F");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("BUILDING SUMMARY", col1 + 3, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    
    // Room breakdown
    const roomParts = [];
    if (roomCounts.bedroom > 0) roomParts.push(`${roomCounts.bedroom} Bedroom${roomCounts.bedroom > 1 ? "s" : ""}`);
    if (roomCounts.bathroom > 0) roomParts.push(`${roomCounts.bathroom} Bathroom${roomCounts.bathroom > 1 ? "s" : ""}`);
    if (roomCounts.kitchen > 0) roomParts.push(`${roomCounts.kitchen} Kitchen${roomCounts.kitchen > 1 ? "s" : ""}`);
    if (roomCounts.living > 0) roomParts.push(`${roomCounts.living} Living`);
    if (roomCounts.laundry > 0) roomParts.push(`${roomCounts.laundry} Laundry`);
    if (roomCounts.deck > 0) roomParts.push(`${roomCounts.deck} Deck${roomCounts.deck > 1 ? "s" : ""}`);
    
    if (roomParts.length > 0) {
      doc.text(`Rooms: ${roomParts.join(" | ")}`, col1 + 3, y + 11);
    }
    
    // Dimensions
    if (buildingDimensions) {
      doc.text(`Building Footprint: ${buildingDimensions.width}m × ${buildingDimensions.depth}m  |  Total Area: ${totalSqm.toFixed(1)} m²`, col1 + 3, y + 15);
    } else {
      doc.text(`Total Area: ${totalSqm.toFixed(1)} m²`, col1 + 3, y + 15);
    }
    y += 22;

    y += 2;

    // Section: Modules
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

    // Modules subtotal
    doc.setDrawColor(200, 200, 200);
    doc.line(col1, y, col2, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Modules Subtotal", col1 + 2, y + 3);
    doc.text(`$${modulesTotal.toLocaleString()}`, col2, y + 3, { align: "right" });
    y += 10;

    // Section: Walls
    if (walls.length > 0) {
      doc.setFillColor(241, 90, 34);
      doc.rect(col1, y, pageW - 2 * margin, 7, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("WALL PANELS", col1 + 3, y + 5);
      doc.text("WIDTH", pageW - margin - 60, y + 5, { align: "right" });
      doc.text("FACE", pageW - margin - 30, y + 5, { align: "right" });
      doc.text("TOTAL", col2, y + 5, { align: "right" });
      y += 10;

      const wallGroups = {};
      walls.forEach(w => {
        const key = w.label || w.type;
        if (!wallGroups[key]) wallGroups[key] = { 
          label: key, 
          face: w.face || "-", 
          price: w.price || 0, 
          width: w.width || 0,
          description: w.description || "",
          count: 0 
        };
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
        doc.text(g.width ? `${(g.width * 1000).toFixed(0)}mm` : "-", pageW - margin - 60, y + 4, { align: "right" });
        doc.text(g.face, pageW - margin - 30, y + 4, { align: "right" });
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

    // Grand total box
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
    const pricePerSqm = totalSqm > 0 ? (grandTotal / totalSqm).toFixed(0) : 0;
    doc.text(`Total Floor Area: ${totalSqm.toFixed(1)} m²  |  Modules: ${placedModules.length}  |  Wall Panels: ${walls.length}  |  Price/m²: $${pricePerSqm}`, col1, y);
    y += 8;

    // Notes section
    if (notes) {
      y += 4;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", col1, y);
      doc.setFont("helvetica", "normal");
      y += 5;
      // Split notes into multiple lines if needed
      const notesLines = doc.splitTextToSize(notes, pageW - 2 * margin);
      notesLines.forEach(line => {
        doc.text(line, col1, y);
        y += 4;
      });
      y += 4;
    } else {
      y += 4;
    }

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
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Generate Estimate PDF</DialogTitle>
        </DialogHeader>

        {/* Building summary */}
        <div className="bg-gray-50 border border-gray-100 p-4 space-y-3 text-sm">
          {/* Room breakdown */}
          <div className="flex flex-wrap gap-2 text-xs">
            {roomCounts.bedroom > 0 && <span className="bg-white border border-gray-200 px-2 py-0.5">{roomCounts.bedroom} Bed</span>}
            {roomCounts.bathroom > 0 && <span className="bg-white border border-gray-200 px-2 py-0.5">{roomCounts.bathroom} Bath</span>}
            {roomCounts.kitchen > 0 && <span className="bg-white border border-gray-200 px-2 py-0.5">{roomCounts.kitchen} Kitchen</span>}
            {roomCounts.living > 0 && <span className="bg-white border border-gray-200 px-2 py-0.5">{roomCounts.living} Living</span>}
            {roomCounts.laundry > 0 && <span className="bg-white border border-gray-200 px-2 py-0.5">{roomCounts.laundry} Laundry</span>}
            {roomCounts.deck > 0 && <span className="bg-white border border-gray-200 px-2 py-0.5">{roomCounts.deck} Deck</span>}
          </div>
          
          {/* Dimensions */}
          <div className="flex gap-4 text-xs text-gray-600 border-t border-gray-200 pt-2">
            <span><span className="font-semibold text-gray-800">{totalSqm.toFixed(1)}</span> m²</span>
            {buildingDimensions && (
              <span><span className="font-semibold text-gray-800">{buildingDimensions.width}m × {buildingDimensions.depth}m</span> footprint</span>
            )}
          </div>
          
          {/* Cost breakdown */}
          <div className="border-t border-gray-200 pt-2 space-y-1.5">
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
            {totalSqm > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Price per m²</span>
                <span>${(grandTotal / totalSqm).toFixed(0)}/m²</span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-400">Excl. GST, delivery, site prep & installation</p>
        </div>

        {/* Client details */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-600">Client Name</Label>
              <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Jane Smith" className="mt-1 rounded-none text-sm h-9" />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Project Name</Label>
              <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Beach House" className="mt-1 rounded-none text-sm h-9" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Site Address</Label>
            <Input value={projectAddress} onChange={e => setProjectAddress(e.target.value)} placeholder="e.g. 123 Main Street, Auckland" className="mt-1 rounded-none text-sm h-9" />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Notes</Label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="Additional notes or requirements..."
              className="mt-1 w-full rounded-none text-sm p-2 border border-input bg-background min-h-[60px] resize-none focus:outline-none focus:ring-1 focus:ring-[#F15A22]"
            />
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
