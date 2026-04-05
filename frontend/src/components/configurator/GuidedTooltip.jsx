import React, { useState, useEffect } from "react";
import { X, Lightbulb } from "lucide-react";

const TIPS = {
  "select-design": {
    title: "Start with a Design",
    message: "Browse the Design Catalogue and select a starter layout. You can customise everything after.",
    position: "bottom",
  },
  "customise": {
    title: "Customise Your Layout",
    message: "Drag modules from the library on the left to place them on the grid. Click walls to swap cladding styles.",
    position: "bottom",
  },
  "elevations": {
    title: "Review Elevations",
    message: "See how your building looks from all sides. Drag walls to rearrange cladding on each face.",
    position: "bottom",
  },
  "sitemap": {
    title: "Place on Your Site",
    message: "Enter your address to see your property boundaries. Position and rotate your building on the map.",
    position: "bottom",
  },
  "save": {
    title: "Save Your Design",
    message: "Enter your details and save. Your design will be stored and you can return to it anytime.",
    position: "top",
  },
  "share": {
    title: "Share & Get Estimates",
    message: "Share a link with others, print plans, or request a formal estimate from our team.",
    position: "top",
  },
};

const STORAGE_KEY = "connectapod_dismissed_tips";

function getDismissed() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function setDismissed(tipId) {
  const current = getDismissed();
  if (!current.includes(tipId)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, tipId]));
  }
}

export default function GuidedTooltip({ tipId, show = false, anchorRef = null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show && !getDismissed().includes(tipId)) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [show, tipId]);

  if (!visible) return null;

  const tip = TIPS[tipId];
  if (!tip) return null;

  const dismiss = () => {
    setVisible(false);
    setDismissed(tipId);
  };

  return (
    <div
      className="fixed z-[60] animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{
        bottom: tip.position === "bottom" ? undefined : 80,
        top: tip.position === "bottom" ? 90 : undefined,
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: 340,
      }}
      data-testid={`tooltip-${tipId}`}
    >
      <div className="bg-gray-900 text-white shadow-xl border border-gray-700 px-4 py-3 relative" style={{ borderRadius: 2 }}>
        <button onClick={dismiss} className="absolute top-2 right-2 text-gray-400 hover:text-white" data-testid={`dismiss-tip-${tipId}`}>
          <X size={14} />
        </button>
        <div className="flex items-start gap-2.5">
          <Lightbulb size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-white mb-0.5">{tip.title}</p>
            <p className="text-[11px] text-gray-300 leading-relaxed">{tip.message}</p>
          </div>
        </div>
        <button onClick={dismiss} className="mt-2 text-[10px] text-gray-400 hover:text-amber-400 transition-colors">
          Got it, don't show again
        </button>
      </div>
    </div>
  );
}

export function resetAllTips() {
  localStorage.removeItem(STORAGE_KEY);
}
