import React, { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, SkipForward } from "lucide-react";

const TOUR_STEPS = [
  {
    id: "welcome",
    target: null,
    title: "Welcome to Connectapod Designer",
    message: "Design your perfect modular building in minutes. We'll walk you through the steps — just follow the orange bar above.",
    position: "center",
  },
  {
    id: "choose-design",
    target: '[data-tour="step-1"]',
    title: "1. Choose a Design",
    message: "Start by picking a starter layout from our catalogue. You'll customise everything in the next step.",
    position: "below",
  },
  {
    id: "customise",
    target: '[data-tour="step-2"]',
    title: "2. Customise Your Layout",
    message: "Drag modules from the left panel to add rooms. Click placed walls to swap cladding styles.",
    position: "below",
  },
  {
    id: "elevations",
    target: '[data-tour="step-3"]',
    title: "3. Check Elevations",
    message: "See how your building looks from all four sides. Drag and drop wall panels to customise each face.",
    position: "below",
  },
  {
    id: "site-plan",
    target: '[data-tour="step-4"]',
    title: "4. Place on Your Site",
    message: "Search your address to see your property boundaries, then position and rotate your building on the map.",
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
    message: "Share a link with friends, email your design, print plans, or generate a detailed cost estimate.",
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
      setAnchor({ top: rect.bottom + 12, left: rect.left + rect.width / 2 });
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

  if (!active) return null;

  const step = TOUR_STEPS[stepIndex];
  const isCenter = step.position === "center" || !anchor;
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998] bg-black/30 transition-opacity duration-300" onClick={finish} />

      {/* Tooltip card */}
      <div
        className="fixed z-[9999] transition-all duration-300 ease-out"
        style={
          isCenter
            ? { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
            : { top: anchor.top, left: anchor.left, transform: "translateX(-50%)" }
        }
        data-testid={`tour-step-${step.id}`}
      >
        {/* Arrow pointing up to target */}
        {!isCenter && (
          <div
            className="absolute -top-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45"
          />
        )}
        <div className="bg-gray-900 text-white shadow-2xl px-5 py-4 relative" style={{ borderRadius: 3, maxWidth: 340, minWidth: 260 }}>
          <button onClick={finish} className="absolute top-2.5 right-2.5 text-gray-500 hover:text-white transition-colors" data-testid="tour-close-btn">
            <X size={14} />
          </button>

          {/* Step counter */}
          <div className="flex items-center gap-1.5 mb-2">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === stepIndex ? "w-5 bg-[#F15A22]" : i < stepIndex ? "w-2 bg-[#F15A22]/50" : "w-2 bg-gray-600"}`} />
            ))}
          </div>

          <p className="text-sm font-bold text-white mb-1">{step.title}</p>
          <p className="text-xs text-gray-300 leading-relaxed">{step.message}</p>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-700/50">
            <button onClick={finish} className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors" data-testid="tour-skip-btn">
              <SkipForward size={10} /> Skip tour
            </button>
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
    </>
  );
}

export function resetTour() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}
