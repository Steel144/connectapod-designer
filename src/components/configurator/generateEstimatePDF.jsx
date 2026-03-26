import { jsPDF } from "jspdf";

export async function generateEstimatePDF({
  placedModules,
  walls,
  projectName,
  clientFirstName,
  clientFamilyName,
  siteAddress,
  phone,
  email
}) {
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

  // Group modules and their attached walls
  const moduleGroups = {};
  placedModules.forEach(m => {
    const key = m.id || m.label || m.type;
    if (!moduleGroups[key]) {
      moduleGroups[key] = { 
        module: m, 
        label: m.label || m.type, 
        sqm: m.sqm || 0, 
        price: m.price || 0, 
        count: 0,
        attachedWalls: []
      };
    }
    moduleGroups[key].count += 1;
  });

  // Assign walls to modules based on position and face
  const CELL_M = 0.6;
  walls.forEach(w => {
    let attachedModule = null;
    
    if (w.face === "W") {
      attachedModule = placedModules.find(m => 
        Math.abs(m.y * CELL_M - (w.y * CELL_M + (w.thickness || 0.15))) < 0.1 &&
        Math.abs(m.w * CELL_M - w.length) < 0.1
      );
    } else if (w.face === "Y") {
      attachedModule = placedModules.find(m => 
        Math.abs((m.y + m.h) * CELL_M - w.y * CELL_M) < 0.1 &&
        Math.abs(m.w * CELL_M - w.length) < 0.1
      );
    } else if (w.face === "Z") {
      attachedModule = placedModules.find(m => 
        Math.abs(m.x * CELL_M - w.x * CELL_M) < 0.1 &&
        Math.abs(m.h * CELL_M - w.length) < 0.1
      );
    } else if (w.face === "X") {
      attachedModule = placedModules.find(m => 
        Math.abs((m.x + m.w) * CELL_M - w.x * CELL_M) < 0.1 &&
        Math.abs(m.h * CELL_M - w.length) < 0.1
      );
    }
    
    if (attachedModule) {
      const key = attachedModule.id || attachedModule.label || attachedModule.type;
      if (moduleGroups[key]) {
        moduleGroups[key].attachedWalls.push(w);
      }
    }
  });

  // Render each module with its attached walls
  doc.setFillColor(241, 90, 34);
  doc.rect(col1, y, pageW - 2 * margin, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("MODULES & WALLS", col1 + 3, y + 5);
  doc.text("SQM", pageW - margin - 60, y + 5, { align: "right" });
  doc.text("UNIT PRICE", pageW - margin - 20, y + 5, { align: "right" });
  doc.text("TOTAL", col2, y + 5, { align: "right" });
  y += 10;

  let rowAlt = false;
  Object.values(moduleGroups).forEach(g => {
    // Module row
    if (rowAlt) {
      doc.setFillColor(252, 252, 252);
      doc.rect(col1, y - 2, pageW - 2 * margin, 8, "F");
    }
    rowAlt = !rowAlt;
    const label = g.count > 1 ? `${g.label} ×${g.count}` : g.label;
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(label, col1 + 2, y + 4);
    doc.text(`${(g.sqm * g.count).toFixed(1)} m²`, pageW - margin - 60, y + 4, { align: "right" });
    doc.text(`$${g.price.toLocaleString()}`, pageW - margin - 20, y + 4, { align: "right" });
    doc.text(`$${(g.price * g.count).toLocaleString()}`, col2, y + 4, { align: "right" });
    y += 8;

    // Attached walls (indented)
    if (g.attachedWalls.length > 0) {
      g.attachedWalls.forEach(wall => {
        if (rowAlt) {
          doc.setFillColor(252, 252, 252);
          doc.rect(col1, y - 2, pageW - 2 * margin, 8, "F");
        }
        rowAlt = !rowAlt;
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        const wallLabel = wall.label || wall.type || "Wall";
        doc.text(`  └ ${wallLabel} (${wall.face || "-"})`, col1 + 2, y + 4);
        doc.text(`$${(wall.price || 0).toLocaleString()}`, col2, y + 4, { align: "right" });
        y += 8;
      });
    }
  });

  doc.setDrawColor(200, 200, 200);
  doc.line(col1, y, col2, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text("Total", col1 + 2, y + 3);
  doc.text(`$${grandTotal.toLocaleString()}`, col2, y + 3, { align: "right" });
  y += 12;

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
}