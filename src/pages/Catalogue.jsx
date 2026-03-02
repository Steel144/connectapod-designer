import React, { useState } from "react";

const CATALOGUE = [
  {
    category: "General — Open Modules",
    description: "Standard open modules with no internal partitions. Used for living, dining, sleeping areas.",
    modules: [
      { code: "006", name: "Open Module 0.6m", width: 0.6, depth: 4.8, sqm: 2.9, description: "Narrow end/connector module" },
      { code: "007", name: "Open Module 1.2m", width: 1.2, depth: 4.8, sqm: 5.8, description: "Half-width open module" },
      { code: "008", name: "Open Module 1.8m", width: 1.8, depth: 4.8, sqm: 8.6, description: "Three-quarter width open module" },
      { code: "009", name: "Open Module 2.4m", width: 2.4, depth: 4.8, sqm: 11.5, description: "Four-fifth width open module" },
      { code: "010", name: "Open Module 3.0m", width: 3.0, depth: 4.8, sqm: 14.4, description: "Full-width standard open module" },
    ],
  },
  {
    category: "General — End Cap Layouts",
    description: "End-of-row modules with finished end walls. Available in left-hand and right-hand configurations.",
    modules: [
      { code: "001", name: "End Cap 0.6m", width: 0.6, depth: 4.8, sqm: 2.9, description: "Narrow end cap, 600mm wide" },
      { code: "002", name: "End Cap 1.2m", width: 1.2, depth: 4.8, sqm: 5.8, description: "End cap, 1200mm wide" },
      { code: "003", name: "End Cap 1.8m", width: 1.8, depth: 4.8, sqm: 8.6, description: "End cap, 1800mm wide" },
      { code: "004", name: "End Cap 2.4m", width: 2.4, depth: 4.8, sqm: 11.5, description: "End cap, 2400mm wide" },
      { code: "005", name: "End Cap 3.0m", width: 3.0, depth: 4.8, sqm: 14.4, description: "Full-width end cap, 3000mm wide" },
    ],
  },
  {
    category: "General — Door Layouts",
    description: "Modules with internal door openings (DRH810 / DLH810). Used to connect adjacent rooms.",
    modules: [
      { code: "011-1", name: "Door — Top Left", width: 3.0, depth: 4.8, sqm: 14.4, description: "Single door, top-left position (DRH810)" },
      { code: "011-2", name: "Door — Top Right", width: 3.0, depth: 4.8, sqm: 14.4, description: "Single door, top-right position (DRH810)" },
      { code: "011-3", name: "Door — Bottom Left", width: 3.0, depth: 4.8, sqm: 14.4, description: "Single door, bottom-left position (DLH810)" },
      { code: "011-4", name: "Door — Bottom Right", width: 3.0, depth: 4.8, sqm: 14.4, description: "Single door, bottom-right position (DLH810)" },
      { code: "012-1", name: "Double Door — Top & Bottom Left", width: 3.0, depth: 4.8, sqm: 14.4, description: "Two doors on left side (DLH810 + DLH810)" },
      { code: "012-3", name: "Double Door — Top & Bottom Right", width: 3.0, depth: 4.8, sqm: 14.4, description: "Two doors on right side (DRH810 + DRH810)" },
    ],
  },
  {
    category: "General — Corner / L-Shape Layouts",
    description: "Modules with offset wall panels to create corner connections between perpendicular rows.",
    modules: [
      { code: "050-1", name: "L-Corner Left", width: 3.0, depth: 4.8, sqm: 14.4, description: "L-shaped corner, DLH810 + DLH660, left orientation" },
      { code: "050-2", name: "L-Corner Right", width: 3.0, depth: 4.8, sqm: 14.4, description: "L-shaped corner, DLH810 + DRH660, right orientation" },
      { code: "050-3", name: "L-Corner Mirrored Left", width: 3.0, depth: 4.8, sqm: 14.4, description: "Mirrored L-corner, DRH810 + DLH810" },
      { code: "050-4", name: "L-Corner Mirrored Right", width: 3.0, depth: 4.8, sqm: 14.4, description: "Mirrored L-corner, DRH810 + DRH660" },
    ],
  },
  {
    category: "Kitchen — End Modules",
    description: "End-of-row kitchen modules with finished end wall and full cabinetry layout.",
    modules: [
      { code: "005-K30", name: "Kitchen End — U-Shape", width: 3.0, depth: 4.8, sqm: 14.4, description: "U-shaped bench layout: 900 + 2700 + 1200mm runs. Left or right hand." },
      { code: "005-K31", name: "Kitchen End — Galley", width: 3.0, depth: 4.8, sqm: 14.4, description: "Single galley run with dishwasher (DW). Left or right hand." },
    ],
  },
  {
    category: "Kitchen — Standard Modules",
    description: "Pass-through kitchen modules that connect into a run. No end walls on the X faces.",
    modules: [
      { code: "012-K01", name: "Kitchen Standard — Single Run", width: 3.0, depth: 4.8, sqm: 14.4, description: "Single-side bench run with overhead cupboards. Door top or bottom." },
      { code: "012-K02", name: "Kitchen Standard — Double Run (Galley)", width: 3.0, depth: 4.8, sqm: 14.4, description: "Benches on both sides (galley). Door top or bottom." },
    ],
  },
  {
    category: "Bathroom — Standard",
    description: "Standard bathroom module with shower, vanity, and toilet.",
    modules: [
      { code: "401-B10", name: "Bathroom (B10)", width: 3.0, depth: 4.8, sqm: 14.4, description: "Standard bathroom — DRH710 or DLH710 door. Shower, vanity, toilet. Internal dim: 2,422 × 3,711mm." },
      { code: "412-B03", name: "Bathroom Compact (B03)", width: 3.0, depth: 4.8, sqm: 14.4, description: "Compact bathroom, 1,400mm wide internal zone. Standard shower size. DRH810 or DLH810." },
      { code: "423-B40", name: "Large Bathroom (B40)", width: 3.0, depth: 4.8, sqm: 14.4, description: "Large bathroom with separate shower and bath. 2,400mm deep bathroom zone." },
    ],
  },
  {
    category: "Bathroom — Ensuite + Walk-in Robe",
    description: "Combined ensuite and walk-in wardrobe (WIR) module.",
    modules: [
      { code: "402-B30", name: "Ensuite + WIR (B30) — Standard", width: 3.0, depth: 4.8, sqm: 14.4, description: "Ensuite with SH90902 shower + walk-in robe. Internal dims: 2,000 × 3,711mm split." },
      { code: "421-B30", name: "Ensuite + WIR (B30) — End", width: 3.0, depth: 4.8, sqm: 14.4, description: "End-of-row ensuite + WIR with finished end wall (Z-face)." },
      { code: "422-B30", name: "Ensuite + WIR (B30) — Passage End", width: 3.0, depth: 4.8, sqm: 14.4, description: "Ensuite + WIR passage variant, 2,711mm WIR depth." },
    ],
  },
  {
    category: "Bathroom End Modules",
    description: "Bathroom modules designed for the end of a row, with a finished Z end wall.",
    modules: [
      { code: "420-B01", name: "Bathroom End (B01)", width: 3.0, depth: 4.8, sqm: 14.4, description: "End bathroom with DCH760 door, 1,089mm WC zone. Left or right hand." },
    ],
  },
  {
    category: "Combined Wet Areas",
    description: "Multi-function modules combining bathroom, kitchen, toilet, and/or laundry in one unit.",
    modules: [
      { code: "401-B10-K10", name: "Bathroom + Kitchen (B10/K10)", width: 3.0, depth: 4.8, sqm: 14.4, description: "Kitchen and bathroom split module. Basic kitchen fit-out. Mirrored pairs available." },
      { code: "401-B10-K11", name: "Bathroom + Kitchen (B10/K11)", width: 3.0, depth: 4.8, sqm: 14.4, description: "Kitchen and bathroom split — includes FR700700 fridge space, SH129LS, VW750420 rangehood. DW optional." },
      { code: "413-K31-B30-L02", name: "Kitchen + Bathroom + Laundry (K31/B30/L02)", width: 3.0, depth: 4.8, sqm: 14.4, description: "Full wet zone: kitchen (CT6-6-IND hob, T-STD, SH812S oven), bathroom, and laundry (LT6-6H, WM-OS). 4 orientations." },
      { code: "410-T01-B20-L01", name: "Toilet + Bathroom + Laundry (T01/B20/L01)", width: 3.0, depth: 4.8, sqm: 14.4, description: "Separate WC, bathroom, and laundry zone with DDH950P door. 4 orientations." },
      { code: "411-T01-B20-L01", name: "Toilet + Bathroom + Laundry (T01/B20/L01) — Narrow", width: 3.0, depth: 4.8, sqm: 14.4, description: "Narrower variant with DDH900P door. Toilet + bathroom + laundry." },
    ],
  },
  {
    category: "Deck & Soffit",
    description: "Outdoor deck modules with wall panels and soffit options. Widths from 0.6m to 3.0m.",
    modules: [
      { code: "SO06", name: "Soffit Only", width: 0.6, depth: 4.8, sqm: 2.9, description: "600mm soffit panel only — no deck walls." },
      { code: "DK12", name: "Deck 1.2m", width: 1.2, depth: 4.8, sqm: 5.8, description: "1.2m wide deck with vertical slat wall panels (W001D / Y001D)." },
      { code: "DK18", name: "Deck 1.8m", width: 1.8, depth: 4.8, sqm: 8.6, description: "1.8m wide deck with slat wall options (W050D/W051D)." },
      { code: "DK24", name: "Deck 2.4m", width: 2.4, depth: 4.8, sqm: 11.5, description: "2.4m wide deck — W200D and custom wall options." },
      { code: "DK30", name: "Deck 3.0m", width: 3.0, depth: 4.8, sqm: 14.4, description: "Full 3.0m wide deck — W500D and custom wall options." },
    ],
  },
];

const CATEGORY_COLORS = {
  "General — Open Modules": "#E8F4FD",
  "General — End Cap Layouts": "#F0FDF4",
  "General — Door Layouts": "#FFF7ED",
  "General — Corner / L-Shape Layouts": "#F5F3FF",
  "Kitchen — End Modules": "#FFF1F2",
  "Kitchen — Standard Modules": "#FFF1F2",
  "Bathroom — Standard": "#F0F9FF",
  "Bathroom — Ensuite + Walk-in Robe": "#F0F9FF",
  "Bathroom End Modules": "#F0F9FF",
  "Combined Wet Areas": "#FEFCE8",
  "Deck & Soffit": "#F8FAFC",
};

export default function Catalogue() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...CATALOGUE.map(c => c.category)];

  const filtered = CATALOGUE
    .filter(cat => activeCategory === "All" || cat.category === activeCategory)
    .map(cat => ({
      ...cat,
      modules: cat.modules.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.code.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(cat => cat.modules.length > 0);

  return (
    <div className="min-h-screen bg-[#F5F5F3]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">connectapod</h1>
          <p className="text-sm text-gray-500 mt-0.5">Module Catalogue — Moduletec MP-48 System</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search + Stats */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search modules by name, code or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F15A22]"
          />
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 px-4 py-2.5">
            <span className="font-bold text-gray-800">{CATALOGUE.reduce((s, c) => s + c.modules.length, 0)}</span> module layouts across
            <span className="font-bold text-gray-800">{CATALOGUE.length}</span> categories
          </div>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium border transition-all ${
                activeCategory === cat
                  ? "bg-[#F15A22] text-white border-[#F15A22]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"
              }`}
            >
              {cat === "All" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        {/* Catalogue Sections */}
        <div className="space-y-10">
          {filtered.map(cat => (
            <div key={cat.category}>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">{cat.category}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{cat.description}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cat.modules.map(mod => (
                  <div
                    key={mod.code}
                    className="bg-white border border-gray-200 p-4 hover:shadow-md hover:border-[#F15A22] transition-all group"
                  >
                    {/* Visual preview */}
                    <div
                      className="w-full mb-3 flex items-center justify-center border border-gray-100"
                      style={{
                        height: 80,
                        backgroundColor: CATEGORY_COLORS[cat.category] || "#F5F5F3",
                      }}
                    >
                      <div
                        className="border-2 border-gray-400 group-hover:border-[#F15A22] transition-colors flex items-center justify-center"
                        style={{
                          width: Math.min(60, (mod.width / 3) * 60),
                          height: 60,
                        }}
                      >
                        <span className="text-xs font-mono text-gray-400 group-hover:text-[#F15A22]">
                          {mod.width}×{mod.depth}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-800 leading-tight">{mod.name}</h3>
                      <span className="text-xs font-mono text-[#F15A22] bg-orange-50 px-1.5 py-0.5 shrink-0">{mod.code}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">{mod.description}</p>

                    <div className="flex gap-3 text-xs text-gray-500 border-t border-gray-100 pt-2.5">
                      <span><span className="font-semibold text-gray-700">{mod.width}m</span> wide</span>
                      <span><span className="font-semibold text-gray-700">{mod.depth}m</span> deep</span>
                      <span><span className="font-semibold text-gray-700">{mod.sqm.toFixed(1)}</span> m²</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-3">🔍</p>
            <p className="font-medium">No modules found for "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
}