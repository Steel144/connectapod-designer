import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

const TIPS = {
  "select-design": {
    title: "Choose a Starter Design",
    message: "Browse the Design Catalogue and select a starter layout, or load one of your previously saved designs.",
    position: "bottom",
  },
  "customise": {
    title: "Customise Your Layout",
    message: "Drag modules from the Module Library on the left to add rooms. Click wall selection letters (W, X, Y, Z) on the floor plan to swap cladding styles.",
    position: "bottom",
  },
  "elevations": {
    title: "Review Elevations",
    message: "See how your building looks from all four sides. Check your window sizes and location.",
    position: "bottom",
  },
  "sitemap": {
    title: "Place on Your Site",
    message: "Search your address to see your property boundaries. Position and rotate your building, then lock it in place.",
    position: "bottom",
  },
  "save": {
    title: "Save Your Design",
    message: "Enter your details and save. Your design will be stored so you can return to it anytime.",
    position: "top",
  },
  "share": {
    title: "Share & Get a Price",
    message: "Share a link with friends, email your design, print plans, and generate a detailed cost estimate.",
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

export default function GuidedTooltip({ tipId, show = false }) {
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
        maxWidth: 380,
      }}
      data-testid={`tooltip-${tipId}`}
    >
      <div className="bg-gray-900 text-white shadow-2xl px-5 py-4 relative" style={{ borderRadius: 3 }}>
        <button onClick={dismiss} className="absolute top-2.5 right-2.5 text-gray-500 hover:text-white transition-colors" data-testid={`dismiss-tip-${tipId}`}>
          <X size={14} />
        </button>
        <p className="text-sm font-bold text-white mb-1">{tip.title}</p>
        <p className="text-xs text-gray-300 leading-relaxed">{tip.message}</p>
        <button onClick={dismiss} className="mt-2 text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
          Got it, don't show again
        </button>
      </div>
    </div>
  );
}

export function resetAllTips() {
  localStorage.removeItem(STORAGE_KEY);
}
