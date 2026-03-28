import React from "react";

export default function HeroSection({ onStartQuiz }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gray-900 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url('https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/153eb6fc1_6128cf5e-9b8d-4fb5-a8c1-57407ba32afd.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-gray-900/40 to-gray-900/80" />

      {/* Logo */}
      <div className="relative z-10 mb-8">
        <img
          src="https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/1a43e85d2_Connectapod-01.png"
          alt="connectapod"
          className="h-24 w-auto brightness-0 invert"
        />
      </div>

      <div className="relative z-10 text-center px-6 max-w-3xl">
        <p className="text-[#F15A22] text-sm font-semibold uppercase tracking-widest mb-4">
          New Zealand's Modular Home Specialists
        </p>
        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
          Find Your Perfect
          <br />
          <span className="text-[#F15A22]">Modular Home</span>
        </h1>
        <p className="text-gray-300 text-lg md:text-xl mb-10 leading-relaxed">
          Answer 3 quick questions and we'll match you with a design that fits your needs and budget — then customise it your way.
        </p>
        <button
          onClick={onStartQuiz}
          className="inline-flex items-center gap-3 px-10 py-4 bg-[#F15A22] text-white text-base font-semibold hover:bg-[#d94e1a] transition-all shadow-xl"
        >
          Find My Design →
        </button>
        <p className="text-gray-500 text-sm mt-4">Takes 30 seconds · No sign-up required</p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-gray-400">
        <span className="text-xs uppercase tracking-widest">Scroll to browse all</span>
        <div className="w-px h-8 bg-gray-500" />
      </div>
    </div>
  );
}