import React, { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, SkipForward } from "lucide-react";

const TOUR_STEPS = [
  {
    id: "welcome",
    target: null,
    title: "Welcome to Connectapod Designer",
    message: "Design your perfect modular building in just a few steps. This quick tour will walk you through each stage — just follow the orange step bar at the top. You can turn this guide off or replay it anytime from the Settings menu in the top-right corner.",
    position: "center",
  },
  {
    id: "choose-design",
    target: '[data-tour="step-1"]',
    title: "1. Choose a Design",
    message: "By now you would have chosen a starter layout from our catalogue. At any time you can change that by selecting a new starter layout here, or select a design that you have previously saved. You'll customise everything in the next step.",
    position: "below",
  },
  {
    id: "module-library",
    target: '[data-tour="module-library"]',
    title: "Module Library",
    message: "This is your building toolbox. Modules are grouped by category — Living, Bedroom, Bathroom, Kitchen, Laundry, Connection, Deck, and Soffit. Expand a category to see available modules, then drag and drop them onto the grid to place them. Scroll down to find the Furniture section where you can add sofas, tables, beds and more to visualise your interior layout.",
    position: "right",
  },
  {
    id: "customise",
    target: '[data-tour="step-2"]',
    title: "2. Customise Your Layout",
    message: "Drag modules from the left Module Library panel to add rooms. Each pavilion must start and finish with an end-type module and have standard-type modules in between. Once placed, you can select walls by clicking on the wall selection letters W, X, Y, Z located on the selected floor plans. Deck modules can be added in the same way.",
    position: "below",
  },
  {
    id: "elevations",
    target: '[data-tour="step-3"]',
    title: "3. Check Elevations",
    message: "See how your building looks from all four sides. Check your window sizes and location.",
    position: "below",
  },
  {
    id: "site-plan",
    target: '[data-tour="step-4"]',
    title: "4. Place on Your Site",
    message: "Search your address to see your property boundaries, then position and rotate your building on the map. Once you are happy with where it sits, lock it in position using the lock button.",
    position: "below",
  },
  {
    id: "save",
    target: '[data-tour="step-5"]',
    title: "5. Save Your Design",
    message: "Save your progress anytime. Your designs are stored so you can come back and keep editing.",
    position: "below",
  },
  {
    id: "share-price",
    target: '[data-tour="step-6"]',
    title: "6. Share & Get a Price",
    message: "Share a link with friends, email your design, print plans, and generate a detailed cost estimate.",
    position: "below",
  },
  {
    id: "zoom-controls",
    target: '[data-tour="zoom-controls"]',
    title: "Zoom Controls",
    message: "Use these buttons to zoom in and out of the floor plan or elevations view. Click the percentage in the middle to reset to the default zoom level.",
    position: "below",
  },
  {
    id: "settings",
    target: '[data-tour="settings-btn"]',
    title: "Settings",
    message: "Open Settings to toggle labels, furniture, dimensions, and photo images on or off. You can also restart this guided tour from here at any time if you need a refresher.",
    position: "below",
  },
];

const STORAGE_KEY = "connectapod_tour_completed";

export default function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [anchor, setAnchor] = useState(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
      const timer = setTimeout(() => setActive(true), 800);
      return () => clearTimeout(timer);
    } catch {
      /* no localStorage */
    }
  }, []);

  const updateAnchor = useCallback(() => {
    const step = TOUR_STEPS[stepIndex];
    if (!step?.target) { setAnchor(null); return; }
    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (step.position === "right") {
        setAnchor({ top: rect.top, left: rect.right + 12, arrowSide: "left" });
      } else {
        const clampedLeft = Math.max(200, Math.min(window.innerWidth - 200, rect.left + rect.width / 2));
        setAnchor({ top: rect.bottom + 12, left: clampedLeft, arrowSide: "top" });
      }
    } else {
      setAnchor(null);
    }
  }, [stepIndex]);

  useEffect(() => {
    if (!active) return;
    updateAnchor();
    window.addEventListener("resize", updateAnchor);
    return () => window.removeEventListener("resize", updateAnchor);
  }, [active, stepIndex, updateAnchor]);

  const finish = useCallback(() => {
    setActive(false);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
  }, []);

  const next = useCallback(() => {
    if (stepIndex >= TOUR_STEPS.length - 1) { finish(); return; }
    setStepIndex(i => i + 1);
  }, [stepIndex, finish]);

  const prev = useCallback(() => {
    if (stepIndex > 0) setStepIndex(i => i - 1);
  }, [stepIndex]);

  if (!active) return null;

  const step = TOUR_STEPS[stepIndex];
  const isCenter = step.position === "center" || !anchor;
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const isFirst = stepIndex === 0;
  const arrowSide = anchor?.arrowSide || "top";

  // Determine tooltip position style
  let posStyle;
  if (isCenter) {
    posStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  } else if (arrowSide === "left") {
    posStyle = { top: anchor.top, left: anchor.left };
  } else {
    posStyle = { top: anchor.top, left: anchor.left, transform: "translateX(-50%)" };
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998] bg-black/30 transition-opacity duration-300" onClick={finish} />

      {/* Tooltip card */}
      <div
        className="fixed z-[9999] transition-all duration-300 ease-out"
        style={posStyle}
        data-testid={`tour-step-${step.id}`}
      >
        {/* Arrow */}
        {!isCenter && arrowSide === "top" && (
          <div className="absolute -top-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45" />
        )}
        {!isCenter && arrowSide === "left" && (
          <div className="absolute top-4 -left-[6px] w-3 h-3 bg-gray-900 rotate-45" />
        )}
        <div className="bg-gray-900 text-white shadow-2xl px-5 py-4 relative" style={{ borderRadius: 3, maxWidth: 380, minWidth: 260 }}>
          <button onClick={finish} className="absolute top-2.5 right-2.5 text-gray-500 hover:text-white transition-colors" data-testid="tour-close-btn">
            <X size={14} />
          </button>

          {/* Step counter */}
          <div className="flex items-center gap-1 mb-2">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === stepIndex ? "w-4 bg-[#F15A22]" : i < stepIndex ? "w-1.5 bg-[#F15A22]/50" : "w-1.5 bg-gray-600"}`} />
            ))}
          </div>

          <p className="text-sm font-bold text-white mb-1">{step.title}</p>
          <p className="text-xs text-gray-300 leading-relaxed">{step.message}</p>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-700/50">
            <button onClick={finish} className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors" data-testid="tour-skip-btn">
              <SkipForward size={10} /> Skip tour
            </button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={prev}
                  className="px-2.5 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors flex items-center gap-0.5"
                  data-testid="tour-prev-btn"
                >
                  <ChevronLeft size={13} /> Back
                </button>
              )}
              <button
                onClick={next}
                className="px-3 py-1.5 bg-[#F15A22] text-white text-xs font-semibold hover:bg-[#d94e1a] transition-colors flex items-center gap-1"
                data-testid="tour-next-btn"
              >
                {isLast ? "Get Started" : "Next"} <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function resetTour() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}
