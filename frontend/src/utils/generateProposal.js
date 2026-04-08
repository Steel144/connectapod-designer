import { jsPDF } from "jspdf";

// ── Brand palette ──
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
  white: [255, 255, 255],
  coverBg: [38, 38, 38],
  accent: [241, 90, 34],
};

const LOGO_URL = "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/1a43e85d2_Connectapod-01.png";

const WEBSITE_IMAGES = {
  hero: "https://images.squarespace-cdn.com/content/v1/6993995369fbc10d1abf62eb/dd6bc4a3-4461-461a-bfa3-40e50426b281/ChatGPT+Image+Feb+17%2C+2026%2C+01_36_36+PM.png",
  deck: "https://images.squarespace-cdn.com/content/v1/6993995369fbc10d1abf62eb/5c4acb46-9212-4f1a-a7c1-2f9997bf0e6c/people+on+deck.png",
  rural: "https://images.squarespace-cdn.com/content/v1/6993995369fbc10d1abf62eb/01135c6e-4820-408a-b503-3b28f9a3bff2/ruralhouse2.png",
  bbq: "https://images.squarespace-cdn.com/content/v1/6993995369fbc10d1abf62eb/8219ed5e-b06d-48e8-99f5-48239115afbb/BBQ+on+the+deck.png",
  qc: "https://images.squarespace-cdn.com/content/v1/6993995369fbc10d1abf62eb/0abd04cd-aeed-49d3-82f4-8b3966e93a8a/QC+Connectapod2.png",
  delivery: "https://images.squarespace-cdn.com/content/v1/6993995369fbc10d1abf62eb/72e966da-e015-43d1-b852-2ff5c835f01b/IMG_2159.jpeg",
  siteworks: "https://images.squarespace-cdn.com/content/v1/6993995369fbc10d1abf62eb/8184c199-3431-47bb-8e7f-8a157e534b0d/IMG_1878.jpeg",
};

// ── Image loader (cross-origin safe) ──
async function loadImg(url, timeout = 4000) {
  try {
    return await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const timer = setTimeout(() => resolve(null), timeout);
      img.onload = () => { clearTimeout(timer); resolve(img); };
      img.onerror = () => { clearTimeout(timer); resolve(null); };
      img.src = url;
    });
  } catch { return null; }
}

// ── Placeholder image block ──
function placeholderRect(doc, x, y, w, h, label) {
  doc.setFillColor(235, 233, 230);
  doc.rect(x, y, w, h, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(170, 170, 170);
  doc.text(label || "Image placeholder", x + w / 2, y + h / 2, { align: "center" });
}

// ── Draw image or placeholder ──
async function drawImage(doc, url, x, y, w, h, label) {
  const img = await loadImg(url);
  if (img) {
    try {
      doc.addImage(img, url.endsWith(".png") ? "PNG" : "JPEG", x, y, w, h);
      return;
    } catch { /* fallback */ }
  }
  placeholderRect(doc, x, y, w, h, label);
}

export async function generateProposal({
  clientFirstName, clientFamilyName, projectName, phone, email,
  siteAddress, siteType, placedModules, walls, costSummary, pricingConfig, moduleCount,
}) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const mg = 20;
  const col1 = mg;
  const col2 = pw - mg;
  const cw = col2 - col1;
  let y = 0;
  let pageNum = 0;

  const setC = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const setF = (c) => doc.setFillColor(c[0], c[1], c[2]);
  const setD = (c) => doc.setDrawColor(c[0], c[1], c[2]);
  const dateStr = new Date().toLocaleDateString("en-NZ", { day: "2-digit", month: "long", year: "numeric" });
  const refNum = `CP-${Date.now().toString().slice(-6)}`;
  const cs = costSummary;
  const pc = pricingConfig || {};
  const totalSqm = placedModules.reduce((s, m) => s + (m.sqm || 0), 0);
  const fullName = `${clientFirstName || ""} ${clientFamilyName || ""}`.trim();

  // ── Footer helper ──
  const drawFooter = () => {
    const fy = ph - 14;
    setD(C.rule); doc.setLineWidth(0.15); doc.line(col1, fy, col2, fy);
    doc.setFontSize(6); doc.setFont("helvetica", "normal"); setC(C.light);
    doc.text(`\u00A9 ${new Date().getFullYear()} connectapod`, col1, fy + 5);
    setC(C.brand); doc.text("www.connectapod.co.nz", col2, fy + 5, { align: "right" });
    setC(C.light); doc.text(`${pageNum}`, pw / 2, fy + 5, { align: "center" });
  };

  // ── Page break check ──
  const footerReserve = 22;
  const checkPage = (needed) => {
    if (y + needed > ph - footerReserve) {
      drawFooter(); doc.addPage(); pageNum++;
      y = mg;
    }
  };

  // ── Table helpers ──
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

  const sectionBar = (label, right) => {
    checkPage(10); setF(C.headerBg);
    doc.rect(col1, y, cw, 7, "F");
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); setC(C.white);
    doc.text(label, col1 + 4, y + 4.8);
    if (right) doc.text(right, col2 - 4, y + 4.8, { align: "right" });
    y += 9; altRow = false;
  };

  const subtotalLine = (label, value) => {
    checkPage(10); setD(C.rule); doc.setLineWidth(0.15); doc.line(col1, y, col2, y);
    y += 4; doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); setC(C.dark);
    doc.text(label, col1 + 3, y + 3); doc.text(value, col2 - 4, y + 3, { align: "right" }); y += 8;
  };

  // ════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ════════════════════════════════════════════════════════════════
  pageNum = 1;
  setF(C.coverBg); doc.rect(0, 0, pw, ph, "F");

  // Hero image top half
  await drawImage(doc, WEBSITE_IMAGES.hero, 0, 0, pw, ph * 0.5, "Hero image — lifestyle render");

  // Dark gradient overlay on bottom half
  setF(C.coverBg); doc.rect(0, ph * 0.48, pw, ph * 0.52, "F");

  // Logo
  const logo = await loadImg(LOGO_URL);
  if (logo) {
    const lh = 14; const lw = (logo.naturalWidth / logo.naturalHeight) * lh;
    doc.addImage(logo, "PNG", col1, ph * 0.54, lw, lh);
  } else {
    setC(C.brand); doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("connectapod", col1, ph * 0.56);
  }

  // Title
  let cy = ph * 0.62;
  doc.setFontSize(28); doc.setFont("helvetica", "bold"); setC(C.white);
  doc.text("Building Proposal", col1, cy); cy += 12;

  if (projectName) {
    doc.setFontSize(14); doc.setFont("helvetica", "normal"); setC(C.brand);
    doc.text(projectName, col1, cy); cy += 8;
  }
  if (fullName) {
    doc.setFontSize(11); doc.setFont("helvetica", "normal"); setC([200, 200, 200]);
    doc.text(`Prepared for ${fullName}`, col1, cy); cy += 7;
  }
  doc.setFontSize(9); setC(C.light);
  doc.text(dateStr, col1, cy); cy += 5;
  doc.text(`Ref: ${refNum}`, col1, cy);

  // Bottom brand bar
  setF(C.brand); doc.rect(0, ph - 4, pw, 4, "F");

  // Cover footer
  doc.setFontSize(7); setC([140, 140, 140]);
  doc.text("www.connectapod.co.nz", col2, ph - 8, { align: "right" });

  // ════════════════════════════════════════════════════════════════
  // PAGE 2 — OUR STORY
  // ════════════════════════════════════════════════════════════════
  doc.addPage(); pageNum++;
  y = mg;

  // Section title
  setC(C.brand); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("OUR STORY", col1, y); y += 6;
  setC(C.dark); doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text("Building them better.", col1, y); y += 10;

  // Story text — condensed
  const storyParagraphs = [
    "I designed my first house when I was 15, got building consent, and then spent two years building it with my dad after school. That's where I learned what construction actually is — not drawings, not theory, but the reality of putting something together piece by piece.",
    "After studying marketing, working as a graphic designer, and becoming an LBP designer, the same thought kept coming back: why are we still building houses like this? We take a pile of materials to a site and try to assemble something complex in an uncontrolled environment. It works, but it's slow, expensive, and full of risk.",
    "If you bought a car and they dropped off truckloads of parts in your driveway with a couple of guys to assemble it, you wouldn't accept that. Yet that's how we build homes.",
    "Light gauge steel framing was the turning point. It allowed me to think about housing as a system — something accurate, repeatable, and transportable. That's where Connectapod came from.",
    "Since then, we've built and refined the system across multiple projects. Solving the construction and transport challenges, improving the process each time. For me, this isn't just about building houses. It's about building them better.",
  ];

  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); setC(C.text);
  const lineH = 4.2;
  storyParagraphs.forEach(para => {
    const lines = doc.splitTextToSize(para, cw);
    checkPage(lines.length * lineH + 4);
    lines.forEach(line => { doc.text(line, col1, y); y += lineH; });
    y += 3;
  });

  // Attribution
  y += 2;
  setC(C.dark); doc.setFontSize(8); doc.setFont("helvetica", "italic");
  doc.text("— Les McKenzie, Founder", col1, y); y += 6;

  // Lifestyle image
  const imgH = Math.min(65, ph - y - footerReserve - 5);
  if (imgH > 30) {
    await drawImage(doc, WEBSITE_IMAGES.deck, col1, y, cw, imgH, "Lifestyle image — people on deck");
    y += imgH + 4;
  }

  drawFooter();

  // ════════════════════════════════════════════════════════════════
  // PAGE 3 — YOUR DESIGN
  // ════════════════════════════════════════════════════════════════
  doc.addPage(); pageNum++;
  y = mg;

  setC(C.brand); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("YOUR DESIGN", col1, y); y += 6;
  setC(C.dark); doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text(projectName || "Custom Design", col1, y); y += 10;

  // Floor plan placeholder
  placeholderRect(doc, col1, y, cw, 80, "Floor plan — from configurator");
  y += 84;

  // Design specs
  const specs = [
    ["Total Modules", `${placedModules.length}`],
    ["Total Floor Area", `${totalSqm.toFixed(1)} m\u00B2`],
    ["Wall Panels", `${walls.length}`],
  ];
  if (siteAddress) specs.push(["Site Address", siteAddress]);
  if (siteType !== "flat") specs.push(["Site Conditions", siteType === "sloping" ? "Sloping" : "Steep"]);

  sectionBar("DESIGN SUMMARY", "");
  specs.forEach(([label, val]) => {
    tableRow([
      { text: label, x: col1 + 3 },
      { text: val, x: col2 - 4, align: "right" },
    ]);
  });

  // Module breakdown
  y += 4;
  sectionBar("MODULE BREAKDOWN", "");
  const moduleGroups = {};
  placedModules.forEach(mod => {
    const k = mod.label || mod.type;
    if (!moduleGroups[k]) moduleGroups[k] = { label: k, sqm: mod.sqm || 0, count: 0 };
    moduleGroups[k].count += 1;
  });
  Object.values(moduleGroups).forEach(g => {
    tableRow([
      { text: g.count > 1 ? `${g.label}  x${g.count}` : g.label, x: col1 + 3 },
      { text: `${(g.sqm * g.count).toFixed(1)} m\u00B2`, x: col2 - 4, align: "right", color: C.mid },
    ]);
  });

  drawFooter();

  // ════════════════════════════════════════════════════════════════
  // PAGE 4+ — ESTIMATE (reuses existing logic)
  // ════════════════════════════════════════════════════════════════
  doc.addPage(); pageNum++;
  y = mg;

  setC(C.brand); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("YOUR ESTIMATE", col1, y); y += 6;
  setC(C.dark); doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text("Estimate", col1, y); y += 3;
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); setC(C.mid);
  doc.text(`${dateStr}  |  Ref: ${refNum}`, col2, y, { align: "right" }); y += 8;

  // Client info box
  const infoF = [];
  if (projectName) infoF.push(["Project", projectName]);
  if (fullName) infoF.push(["Client", fullName]);
  if (phone) infoF.push(["Phone", phone]);
  if (email) infoF.push(["Email", email]);
  if (siteAddress) infoF.push(["Site Address", siteAddress]);
  if (siteType !== "flat") infoF.push(["Site Type", siteType === "sloping" ? "Sloping" : "Steep"]);

  if (infoF.length > 0) {
    const lh2 = 5; const bh = 5 + infoF.length * lh2 + 3;
    checkPage(bh + 4); setF(C.infoBg); doc.rect(col1, y, cw, bh, "F");
    setD(C.rule); doc.setLineWidth(0.15); doc.rect(col1, y, cw, bh, "S");
    let iy = y + 5;
    infoF.forEach(([l, v]) => {
      doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); setC(C.mid); doc.text(l, col1 + 4, iy);
      doc.setFont("helvetica", "normal"); setC(C.dark); doc.setFontSize(7.5);
      doc.text(doc.splitTextToSize(v, cw - 38)[0], col1 + 30, iy); iy += lh2;
    });
    y += bh + 5;
  }
  y += 2;

  // Modules table
  sectionBar("MODULES", "TOTAL");
  const mGroups = {};
  placedModules.forEach(mod => {
    const k = mod.label || mod.type;
    if (!mGroups[k]) mGroups[k] = { label: k, sqm: mod.sqm || 0, price: mod.price || 0, count: 0 };
    mGroups[k].count += 1;
  });
  Object.values(mGroups).forEach(g => {
    tableRow([
      { text: g.count > 1 ? `${g.label}  x${g.count}` : g.label, x: col1 + 3 },
      { text: `${(g.sqm * g.count).toFixed(1)} m\u00B2`, x: col1 + cw * 0.6, color: C.mid },
      { text: `$${(g.price * g.count).toLocaleString()}`, x: col2 - 4, align: "right" },
    ]);
  });
  subtotalLine("Modules Subtotal", `$${cs.modulesTotal.toLocaleString()}`);

  // Wall panels
  if (walls.length > 0) {
    sectionBar("WALL PANELS", "TOTAL");
    const wGroups = {};
    walls.forEach(w => {
      const k = w.label || w.type;
      if (!wGroups[k]) wGroups[k] = { label: k, face: w.face || "-", price: w.price || 0, count: 0 };
      wGroups[k].count += 1;
    });
    Object.values(wGroups).forEach(g => {
      tableRow([
        { text: g.count > 1 ? `${g.label}  x${g.count}` : g.label, x: col1 + 3 },
        { text: g.face, x: col1 + cw * 0.6, color: C.mid },
        { text: `$${(g.price * g.count).toLocaleString()}`, x: col2 - 4, align: "right" },
      ]);
    });
    subtotalLine("Wall Panels Subtotal", `$${cs.wallsTotal.toLocaleString()}`);
  }

  // Site, Delivery & Installation
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

  // Totals
  checkPage(40); setD(C.rule); doc.setLineWidth(0.15); doc.line(col1, y, col2, y); y += 5;
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); setC(C.dark);
  doc.text("Subtotal (excl. GST)", col1 + 3, y + 3);
  doc.text(`$${cs.subtotal.toLocaleString()}`, col2 - 4, y + 3, { align: "right" }); y += 7;
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); setC(C.mid);
  doc.text(`GST (${cs.gstRateVal}%)`, col1 + 3, y + 3);
  doc.text(`$${cs.gstAmount.toLocaleString()}`, col2 - 4, y + 3, { align: "right" }); y += 9;

  checkPage(16); setF(C.brand); doc.rect(col1, y, cw, 12, "F");
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); setC(C.white);
  doc.text("TOTAL ESTIMATE (incl. GST)", col1 + 5, y + 7.5);
  doc.text(`$${cs.grandTotal.toLocaleString()}`, col2 - 5, y + 7.5, { align: "right" }); y += 17;

  checkPage(10); doc.setFontSize(7); doc.setFont("helvetica", "normal"); setC(C.mid);
  doc.text(`Total Floor Area: ${totalSqm.toFixed(1)} m\u00B2   |   Modules: ${placedModules.length}   |   Wall Panels: ${walls.length}`, col1, y); y += 4;

  // Disclaimer
  doc.setFontSize(6.5); doc.setFont("helvetica", "italic"); setC(C.light);
  doc.text("This estimate is indicative only and subject to final confirmation and site inspection to the satisfaction of connectapod.", col1, y);

  drawFooter();

  // ════════════════════════════════════════════════════════════════
  // PAGE — OUR GUARANTEE
  // ════════════════════════════════════════════════════════════════
  doc.addPage(); pageNum++;
  y = mg;

  setC(C.brand); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("OUR GUARANTEE", col1, y); y += 6;
  setC(C.dark); doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text("The No Surprises Guarantee", col1, y); y += 10;

  const guarantees = [
    { title: "BUDGET", body: "Fixed price means fixed price. If something is uncertain, we flag it upfront and explain worst-case scenarios before you commit. All changes are priced and approved before work starts." },
    { title: "TIMELINE", body: "Typical build time is 3\u20136 months. We don\u2019t promise what we can\u2019t control. We do remove as many variables as possible through standardisation and off-site manufacturing." },
    { title: "TRUST", body: "No smoking or drugs on site. Site cleaned daily. Respectful behaviour required. All team members vetted. Minimal on-site time means less disruption and risk." },
    { title: "QUALITY", body: "12-month workmanship warranty. Standardised systems mean we know what\u2019s in your home, we use proven components, and parts can be replaced easily if needed. If something isn\u2019t right, we fix it." },
    { title: "COMMUNICATION", body: "Weekly updates minimum. Progress photos. Messages answered within the hour where possible. You\u2019re never left guessing." },
  ];

  guarantees.forEach(g => {
    checkPage(25);
    // Title bar with brand accent
    setF(C.brand); doc.rect(col1, y, 3, 12, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); setC(C.dark);
    doc.text(g.title, col1 + 7, y + 5);
    // Body
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); setC(C.text);
    const lines = doc.splitTextToSize(g.body, cw - 10);
    lines.forEach((line, i) => { doc.text(line, col1 + 7, y + 10 + i * 4); });
    y += 12 + lines.length * 4 + 4;
  });

  drawFooter();

  // ════════════════════════════════════════════════════════════════
  // PAGE — HOW WE WORK WITH YOU
  // ════════════════════════════════════════════════════════════════
  doc.addPage(); pageNum++;
  y = mg;

  setC(C.brand); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("THE PROCESS", col1, y); y += 6;
  setC(C.dark); doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text("How we work with you", col1, y); y += 10;

  const steps = [
    { step: "01", title: "Free Discovery Session", desc: "A no-obligation chat about your requirements, site conditions, budget, and timeline." },
    { step: "02", title: "Site Appraisal & Concept Design", desc: "Desktop review of council requirements, compliance, and suitability for your site. Accurate concept designs and pricing prepared." },
    { step: "03", title: "Detailed Design & Consent", desc: "Working drawings, site plans, and engineering documentation for consent submission." },
    { step: "04", title: "Manufacturing & QC", desc: "Pods fabricated in a controlled environment with staged inspections and documentation." },
    { step: "05", title: "Site Works", desc: "Foundations set out and installed on your site." },
    { step: "06", title: "Delivery & Installation", desc: "Individual pods delivered anywhere in NZ. Your home is held down and watertight within hours." },
    { step: "07", title: "Inspection & Sign-off", desc: "Council and third-party inspections, final approvals and compliance." },
    { step: "08", title: "Move-in Day", desc: "Keys handed over. Welcome home." },
  ];

  steps.forEach(s => {
    checkPage(16);
    // Step number circle
    setF(C.brand); doc.circle(col1 + 5, y + 4, 4, "F");
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); setC(C.white);
    doc.text(s.step, col1 + 5, y + 5.5, { align: "center" });
    // Title
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); setC(C.dark);
    doc.text(s.title, col1 + 14, y + 3.5);
    // Desc
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); setC(C.text);
    doc.text(s.desc, col1 + 14, y + 8.5);
    y += 15;
  });

  drawFooter();

  // ════════════════════════════════════════════════════════════════
  // PAGE — OUR TEAM + VALUES
  // ════════════════════════════════════════════════════════════════
  doc.addPage(); pageNum++;
  y = mg;

  setC(C.brand); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("OUR TEAM", col1, y); y += 6;
  setC(C.dark); doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text("The people behind your build", col1, y); y += 10;

  const team = [
    { name: "Les McKenzie", role: "Product Development & Technical Lead", desc: "Designs and refines the Connectapod system. Ensures every build works as intended." },
    { name: "Rishi Sharma", role: "Director", desc: "Handles financial systems, logistics, and operational structure." },
    { name: "Cheyenne Peek", role: "Admin & Client Reporting", desc: "Keeps communication, updates, and coordination running smoothly." },
    { name: "Charlie Kilongan", role: "Manufacturing & Construction", desc: "Bridges factory build and on-site installation." },
  ];

  team.forEach(t => {
    checkPage(20);
    // Avatar placeholder circle
    doc.setFillColor(235, 233, 230); doc.circle(col1 + 6, y + 5, 5, "F");
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); setC(C.light);
    doc.text(t.name.split(" ").map(n => n[0]).join(""), col1 + 6, y + 6.5, { align: "center" });
    // Name + role
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); setC(C.dark);
    doc.text(t.name, col1 + 16, y + 3.5);
    setC(C.brand); doc.setFontSize(7); doc.text(t.role, col1 + 16, y + 7.5);
    setC(C.text); doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
    doc.text(t.desc, col1 + 16, y + 12);
    y += 18;
  });

  // Preferred partners
  y += 6;
  checkPage(40);
  setC(C.brand); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("PREFERRED PARTNERS", col1, y); y += 6;
  setD(C.rule); doc.setLineWidth(0.15); doc.line(col1, y, col2, y); y += 4;

  const partners = [
    "Steel Frame Manufacturing Ltd — structural framing",
    "Omega Windows & Doors — 5+ years",
    "My Kitchen Mobile Express — kitchens",
    "Fisher & Paykel / Haier — appliances",
    "Abodo — timber cladding",
    "The Roofing Store — metal cladding",
  ];
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); setC(C.text);
  partners.forEach(p => { checkPage(6); doc.text(`\u2022  ${p}`, col1 + 2, y); y += 5; });

  y += 4;
  doc.setFontSize(7); doc.setFont("helvetica", "italic"); setC(C.mid);
  doc.text("Chosen for consistency, reliability, and known performance.", col1 + 2, y);

  // Values
  y += 10;
  checkPage(35);
  setC(C.brand); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("OUR VALUES", col1, y); y += 6;

  const values = [
    { title: "Integrity", desc: "If we say it, we do it. No hiding problems, no burying costs." },
    { title: "Honesty", desc: "We don\u2019t play games with pricing. If something is uncertain, we say it upfront." },
    { title: "Accountability", desc: "We show up. We communicate. We fix our mistakes. No excuses." },
    { title: "Discipline", desc: "Every site runs to a standard. Documentation is accurate. Communication is consistent." },
  ];
  values.forEach(v => {
    checkPage(12);
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); setC(C.dark);
    doc.text(v.title, col1 + 2, y);
    doc.setFont("helvetica", "normal"); setC(C.text); doc.setFontSize(7.5);
    doc.text(v.desc, col1 + 2, y + 5);
    y += 12;
  });

  drawFooter();

  // ════════════════════════════════════════════════════════════════
  // PAGE — NEXT STEPS (CTA)
  // ════════════════════════════════════════════════════════════════
  doc.addPage(); pageNum++;
  y = mg;

  setC(C.brand); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("NEXT STEPS", col1, y); y += 6;
  setC(C.dark); doc.setFontSize(18); doc.setFont("helvetica", "bold");
  doc.text("Ready to get started?", col1, y); y += 12;

  doc.setFontSize(9); doc.setFont("helvetica", "normal"); setC(C.text);
  const ctaLines = doc.splitTextToSize(
    "Thank you for considering Connectapod for your building project. The next step is a free, no-obligation discovery session where we can discuss your specific requirements, site conditions, and timeline in detail.",
    cw
  );
  ctaLines.forEach(l => { doc.text(l, col1, y); y += 4.5; });
  y += 8;

  // CTA box
  checkPage(50);
  setF(C.infoBg); doc.rect(col1, y, cw, 40, "F");
  setD(C.brand); doc.setLineWidth(0.5); doc.rect(col1, y, cw, 40, "S");

  let boxy = y + 8;
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); setC(C.brand);
  doc.text("Book your free discovery session", col1 + 8, boxy); boxy += 8;

  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); setC(C.text);
  doc.text("Visit:  www.connectapod.co.nz/appointments", col1 + 8, boxy); boxy += 6;
  doc.text("Email:  info@connectapod.co.nz", col1 + 8, boxy); boxy += 6;
  doc.text("Phone:  Contact us through our website", col1 + 8, boxy);

  y += 50;

  // Lifestyle image
  const remainSpace = ph - y - footerReserve - 10;
  if (remainSpace > 40) {
    await drawImage(doc, WEBSITE_IMAGES.bbq, col1, y, cw, Math.min(remainSpace, 70), "Lifestyle image — BBQ on the deck");
    y += Math.min(remainSpace, 70) + 4;
  }

  drawFooter();

  // ── Save ──
  const filename = `connectapod-proposal-${projectName ? projectName.replace(/\s+/g, "-").toLowerCase() + "-" : ""}${refNum}.pdf`;
  doc.save(filename);
}
