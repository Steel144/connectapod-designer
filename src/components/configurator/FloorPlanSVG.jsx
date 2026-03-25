import React from "react";

// Simple architectural floor plan SVGs per module code
// All drawn in a normalized viewBox="0 0 60 96" (3:4.8 ratio)
// Stroke = walls, thin lines = fixtures

const W = 60;
const H = 96;
const wall = 3;
const stroke = "#334155";
const fixture = "#64748b";
const fill = "none";

function Box({ x, y, w, h, r = 0, c }) {
  return <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke={c || fixture} strokeWidth="1" />;
}
function Line({ x1, y1, x2, y2, dashed }) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={fixture} strokeWidth="1"
      strokeDasharray={dashed ? "3 2" : undefined}
    />
  );
}
function Arc({ cx, cy, r, startAngle, endAngle }) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  return <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`} fill={fill} stroke={fixture} strokeWidth="1" />;
}

const PLANS = {
  // ── OPEN MODULES ──────────────────────────────
  "006": () => (
    <g>
      <text x={W/2} y={H/2+4} textAnchor="middle" fontSize="8" fill={fixture} fontFamily="monospace">0.6m</text>
    </g>
  ),
  "007": () => (
    <g>
      <text x={W/2} y={H/2+4} textAnchor="middle" fontSize="8" fill={fixture} fontFamily="monospace">1.2m</text>
    </g>
  ),
  "008": () => (
    <g>
      <text x={W/2} y={H/2+4} textAnchor="middle" fontSize="8" fill={fixture} fontFamily="monospace">1.8m</text>
    </g>
  ),
  "009": () => (
    <g>
      <text x={W/2} y={H/2+4} textAnchor="middle" fontSize="8" fill={fixture} fontFamily="monospace">2.4m</text>
    </g>
  ),
  "010": () => (
    <g>
      <text x={W/2} y={H/2+4} textAnchor="middle" fontSize="8" fill={fixture} fontFamily="monospace">3.0m open</text>
    </g>
  ),

  // ── END CAPS ──────────────────────────────────
  "001": () => <EndCapPlan label="0.6m" />,
  "002": () => <EndCapPlan label="1.2m" />,
  "003": () => <EndCapPlan label="1.8m" />,
  "004": () => <EndCapPlan label="2.4m" />,
  "005": () => <EndCapPlan label="3.0m" />,

  // ── DOOR LAYOUTS ──────────────────────────────
  "011-1": () => <DoorPlan pos="top-left" />,
  "011-2": () => <DoorPlan pos="top-right" />,
  "011-3": () => <DoorPlan pos="bottom-left" />,
  "011-4": () => <DoorPlan pos="bottom-right" />,
  "012-1": () => <DoorPlan pos="double-left" />,
  "012-3": () => <DoorPlan pos="double-right" />,

  // ── L-CORNERS ─────────────────────────────────
  "050-1": () => <LCornerPlan mirror={false} flip={false} />,
  "050-2": () => <LCornerPlan mirror={false} flip={true} />,
  "050-3": () => <LCornerPlan mirror={true} flip={false} />,
  "050-4": () => <LCornerPlan mirror={true} flip={true} />,

  // ── KITCHEN ───────────────────────────────────
  "005-K30": () => <KitchenUShape orange />,
  "005-K31": () => <KitchenGalley orange />,
  "012-K01": () => <KitchenSingleRun orange />,
  "012-K02": () => <KitchenDoubleRun orange />,

  // ── BATHROOM ──────────────────────────────────
  "401-B10": () => <BathroomStandard />,
  "412-B03": () => <BathroomCompact />,
  "423-B40": () => <BathroomLarge />,
  "402-B30": () => <EnsuiteWIR />,
  "421-B30": () => <EnsuiteWIR end />,
  "422-B30": () => <EnsuiteWIR passage />,
  "420-B01": () => <BathroomEnd />,

  // ── COMBINED ──────────────────────────────────
  "401-B10-K10": () => <CombinedBathKitchen />,
  "401-B10-K11": () => <CombinedBathKitchen variant />,
  "413-K31-B30-L02": () => <CombinedKitchenBathLaundry />,
  "410-T01-B20-L01": () => <CombinedToiletBathLaundry />,
  "411-T01-B20-L01": () => <CombinedToiletBathLaundry narrow />,

  // ── DECK ──────────────────────────────────────
  "SO06": () => <DeckPlan soffit />,
  "DK12": () => <DeckPlan width={1.2} />,
  "DK18": () => <DeckPlan width={1.8} />,
  "DK24": () => <DeckPlan width={2.4} />,
  "DK30": () => <DeckPlan width={3.0} />,
};

// ── Reusable sub-components ────────────────────

function EndCapPlan({ label }) {
  return (
    <g>
      {/* End wall on left */}
      <Line x1={8} y1={8} x2={8} y2={H - 8} />
      <text x={W/2} y={H/2+4} textAnchor="middle" fontSize="7" fill={fixture} fontFamily="monospace">{label}</text>
    </g>
  );
}

function DoorPlan({ pos }) {
  const doorW = 12;
  const isTop = pos.includes("top");
  const isLeft = pos.includes("left") && !pos.includes("right");
  const isDouble = pos.includes("double");

  return (
    <g>
      {isTop || isDouble ? (
        <g>
          <Line x1={isLeft ? 8 : W - 8 - doorW} y1={8} x2={isLeft ? 8 + doorW : W - 8} y2={8} />
          <Arc cx={isLeft ? 8 : W - 8} cy={8} r={doorW} startAngle={0} endAngle={90} />
        </g>
      ) : null}
      {(!isTop || isDouble) ? (
        <g>
          <Line x1={isLeft ? 8 : W - 8 - doorW} y1={H - 8} x2={isLeft ? 8 + doorW : W - 8} y2={H - 8} />
          <Arc cx={isLeft ? 8 : W - 8} cy={H - 8} r={doorW} startAngle={-90} endAngle={0} />
        </g>
      ) : null}
    </g>
  );
}

function LCornerPlan({ mirror, flip }) {
  return (
    <g>
      <Line x1={8} y1={H/2} x2={W/2} y2={H/2} />
      <Line x1={W/2} y1={8} x2={W/2} y2={H/2} />
      <text x={W/2} y={H*0.78} textAnchor="middle" fontSize="7" fill={fixture} fontFamily="monospace">L-Corner</text>
    </g>
  );
}

function KitchenUShape({ orange }) {
  const c = orange ? "#F15A22" : fixture;
  return (
    <g>
      {/* U-shaped bench */}
      <Box x={8} y={8} w={W-16} h={10} c={c} /> {/* top run */}
      <Box x={8} y={8} w={10} h={H-16} c={c} /> {/* left run */}
      <Box x={8} y={H-18} w={W-16} h={10} c={c} /> {/* bottom run */}
      {/* sink */}
      <circle cx={W/2} cy={13} r={3} fill={fill} stroke={c} strokeWidth="0.8" />
      {/* hob */}
      <circle cx={20} cy={H-13} r={2} fill={fill} stroke={c} strokeWidth="0.8" />
      <circle cx={28} cy={H-13} r={2} fill={fill} stroke={c} strokeWidth="0.8" />
      <text x={W/2} y={H/2+3} textAnchor="middle" fontSize="7" fill={c} fontFamily="monospace">U-Shape</text>
    </g>
  );
}

function KitchenGalley({ orange }) {
  const c = orange ? "#F15A22" : fixture;
  return (
    <g>
      <Box x={8} y={8} w={W-16} h={10} c={c} />
      {/* sink */}
      <circle cx={W/2} cy={13} r={3} fill={fill} stroke={c} strokeWidth="0.8" />
      {/* DW */}
      <Box x={W-22} y={8} w={10} h={10} c={c} />
      <text x={W/2} y={H/2+3} textAnchor="middle" fontSize="7" fill={c} fontFamily="monospace">Galley</text>
    </g>
  );
}

function KitchenSingleRun({ orange }) {
  const c = orange ? "#F15A22" : fixture;
  return (
    <g>
      <Box x={8} y={8} w={W-16} h={12} c={c} />
      <circle cx={W*0.4} cy={14} r={3} fill={fill} stroke={c} strokeWidth="0.8" />
      {/* overhead cabinets dashed */}
      <Box x={8} y={22} w={W-16} h={6} c={c} />
      <text x={W/2} y={H*0.6} textAnchor="middle" fontSize="7" fill={c} fontFamily="monospace">Single Run</text>
    </g>
  );
}

function KitchenDoubleRun() {
  return (
    <g>
      <Box x={8} y={8} w={W-16} h={10} />
      <circle cx={W*0.4} cy={13} r={3} fill={fill} stroke={fixture} strokeWidth="0.8" />
      <Box x={8} y={H-18} w={W-16} h={10} />
      <circle cx={W*0.6} cy={H-13} r={3} fill={fill} stroke={fixture} strokeWidth="0.8" />
      <text x={W/2} y={H/2+3} textAnchor="middle" fontSize="7" fill={fixture} fontFamily="monospace">Galley</text>
    </g>
  );
}

function BathroomStandard() {
  return (
    <g>
      {/* shower top-right */}
      <Box x={W-22} y={8} w={14} h={20} />
      <Line x1={W-22} y1={8} x2={W-8} y2={28} />
      {/* vanity */}
      <Box x={8} y={8} w={16} h={10} r={1} />
      <circle cx={16} cy={13} r={3} fill={fill} stroke={fixture} strokeWidth="0.8" />
      {/* toilet */}
      <Box x={8} y={H-22} w={12} h={14} r={2} />
      <ellipse cx={14} cy={H-15} rx={5} ry={6} fill={fill} stroke={fixture} strokeWidth="0.8" />
      <text x={W/2} y={H*0.6} textAnchor="middle" fontSize="7" fill={fixture} fontFamily="monospace">Bath B10</text>
    </g>
  );
}

function BathroomCompact() {
  return (
    <g>
      {/* shower */}
      <Box x={W-20} y={8} w={12} h={18} />
      {/* vanity */}
      <Box x={8} y={8} w={14} h={9} r={1} />
      <circle cx={15} cy={12} r={3} fill={fill} stroke={fixture} strokeWidth="0.8" />
      {/* toilet */}
      <Box x={8} y={H-20} w={11} h={12} r={2} />
      <ellipse cx={13} cy={H-14} rx={4} ry={5} fill={fill} stroke={fixture} strokeWidth="0.8" />
      <text x={W/2} y={H*0.65} textAnchor="middle" fontSize="7" fill={fixture} fontFamily="monospace">Compact</text>
    </g>
  );
}

function BathroomLarge() {
  return (
    <g>
      {/* shower */}
      <Box x={W-22} y={8} w={14} h={22} />
      {/* bath */}
      <Box x={8} y={8} w={20} h={30} r={2} />
      <Box x={11} y={12} w={14} h={22} r={3} />
      {/* vanity */}
      <Box x={8} y={H-20} w={16} h={10} r={1} />
      {/* toilet */}
      <Box x={W-20} y={H-20} w={12} h={12} r={2} />
      <text x={W/2} y={H*0.75} textAnchor="middle" fontSize="7" fill={fixture} fontFamily="monospace">Large B40</text>
    </g>
  );
}

function EnsuiteWIR({ end, passage }) {
  return (
    <g>
      {/* WIR left */}
      <Box x={8} y={8} w={20} h={H-16} />
      <Line x1={8} y1={H/2} x2={28} y2={H/2} dashed />
      {/* ensuite right */}
      <Box x={30} y={8} w={W-38} h={18} />
      <circle cx={37} cy={14} r={3} fill={fill} stroke={fixture} strokeWidth="0.8" />
      <Box x={30} y={H-22} w={11} h={14} r={2} />
      <ellipse cx={35} cy={H-15} rx={4} ry={5} fill={fill} stroke={fixture} strokeWidth="0.8" />
      <text x={W/2} y={H/2+3} textAnchor="middle" fontSize="6.5" fill={fixture} fontFamily="monospace">En+WIR</text>
    </g>
  );
}

function BathroomEnd() {
  return (
    <g>
      {/* end wall */}
      <Line x1={8} y1={8} x2={8} y2={H-8} />
      {/* toilet zone */}
      <Box x={10} y={H-22} w={12} h={14} r={2} />
      <ellipse cx={16} cy={H-15} rx={5} ry={6} fill={fill} stroke={fixture} strokeWidth="0.8" />
      {/* vanity */}
      <Box x={10} y={8} w={16} h={10} r={1} />
      <circle cx={18} cy={13} r={3} fill={fill} stroke={fixture} strokeWidth="0.8" />
      <text x={W/2} y={H*0.6} textAnchor="middle" fontSize="7" fill={fixture} fontFamily="monospace">End B01</text>
    </g>
  );
}

function CombinedBathKitchen({ variant }) {
  return (
    <g>
      {/* kitchen top */}
      <Box x={8} y={8} w={W-16} h={10} />
      <circle cx={W/2} cy={13} r={3} fill={fill} stroke={fixture} strokeWidth="0.8" />
      <Line x1={8} y1={22} x2={W-8} y2={22} dashed />
      {/* bathroom bottom */}
      <Box x={W-22} y={26} w={14} h={18} />
      <Box x={8} y={H-22} w={11} h={14} r={2} />
      <ellipse cx={13} cy={H-15} rx={4} ry={5} fill={fill} stroke={fixture} strokeWidth="0.8" />
      <text x={W/2} y={H*0.6} textAnchor="middle" fontSize="6.5" fill={fixture} fontFamily="monospace">Bath+Kit</text>
    </g>
  );
}

function CombinedKitchenBathLaundry() {
  return (
    <g>
      {/* kitchen */}
      <Box x={8} y={8} w={W-16} h={10} />
      <circle cx={20} cy={13} r={2.5} fill={fill} stroke={fixture} strokeWidth="0.8" />
      <circle cx={28} cy={13} r={2.5} fill={fill} stroke={fixture} strokeWidth="0.8" />
      <Line x1={8} y1={22} x2={W-8} y2={22} dashed />
      {/* bathroom */}
      <Box x={W-20} y={26} w={12} h={16} />
      {/* laundry */}
      <Box x={8} y={H-22} w={14} h={14} r={1} />
      <circle cx={15} cy={H-15} r={5} fill={fill} stroke={fixture} strokeWidth="0.8" />
      <text x={W/2} y={H*0.62} textAnchor="middle" fontSize="6" fill={fixture} fontFamily="monospace">Kit+Bath+Ldy</text>
    </g>
  );
}

function CombinedToiletBathLaundry({ narrow }) {
  return (
    <g>
      {/* toilet */}
      <Box x={8} y={8} w={18} h={14} r={2} />
      <ellipse cx={17} cy={15} rx={6} ry={5} fill={fill} stroke={fixture} strokeWidth="0.8" />
      <Line x1={8} y1={26} x2={W-8} y2={26} dashed />
      {/* bath */}
      <Box x={W-20} y={30} w={12} h={16} />
      <Box x={8} y={30} w={14} h={16} r={2} />
      {/* laundry */}
      <Box x={8} y={H-22} w={14} h={14} r={1} />
      <circle cx={15} cy={H-15} r={5} fill={fill} stroke={fixture} strokeWidth="0.8" />
      <text x={W/2} y={H*0.65} textAnchor="middle" fontSize="6" fill={fixture} fontFamily="monospace">WC+Bath+Ldy</text>
    </g>
  );
}

function DeckPlan({ soffit, width }) {
  const slats = 6;
  return (
    <g>
      {/* vertical slat lines */}
      {Array.from({ length: slats }).map((_, i) => (
        <Line key={i} x1={8 + ((W-16) / slats) * i} y1={8} x2={8 + ((W-16) / slats) * i} y2={H-8} />
      ))}
      <text x={W/2} y={H/2+3} textAnchor="middle" fontSize="7" fill={fixture} fontFamily="monospace">
        {soffit ? "Soffit" : `Deck ${width}m`}
      </text>
    </g>
  );
}

// ── Main export ────────────────────────────────

function FloorPlanSVG({ code, className = "" }) {
  const PlanComponent = PLANS[code];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Module outline */}
      <rect x={0} y={0} width={W} height={H} fill="#F8F9FA" stroke={stroke} strokeWidth={wall} rx={0} />
      {PlanComponent ? <PlanComponent /> : (
        <text x={W/2} y={H/2} textAnchor="middle" fontSize="7" fill={fixture} fontFamily="monospace">{code}</text>
      )}
    </svg>
  );
}

export { FloorPlanSVG };
export default FloorPlanSVG;