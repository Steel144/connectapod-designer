import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import HeroSection from "@/components/landing/HeroSection";
import DesignQuiz from "@/components/landing/DesignQuiz";
import DesignCard from "@/components/landing/DesignCard";
import { ArrowRight, SlidersHorizontal, HardHat } from "lucide-react";

// Score a design against quiz answers (higher = better match)
function scoreDesign(design, answers) {
  let score = 0;
  if (answers.bedrooms != null) {
    const bedrooms = answers.bedrooms;
    const diff = Math.abs((design.bedrooms ?? 1) - bedrooms);
    score += diff === 0 ? 3 : diff === 1 ? 1 : 0;
  }
  if (answers.use_case && design.use_cases?.includes(answers.use_case)) score += 3;
  if (answers.budget && design.budget_range === answers.budget) score += 2;
  if (design.is_featured) score += 1;
  return score;
}

export default function Landing() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("hero"); // hero | quiz | results
  const [quizAnswers, setQuizAnswers] = useState(null);

  const { data: designs = [], isLoading } = useQuery({
    queryKey: ["designTemplates"],
    queryFn: async () => {
      try {
        const r = await base44.entities.DesignTemplate.list("sort_order");
        return Array.isArray(r) ? r : [];
      } catch {
        return [];
      }
    },
    staleTime: 0,
  });

  const sortedDesigns = useMemo(() => {
    if (!quizAnswers) {
      // No quiz — show featured first, then by sort_order
      return [...designs].sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });
    }
    // Rank by quiz match score
    return [...designs]
      .map(d => ({ ...d, _score: scoreDesign(d, quizAnswers) }))
      .sort((a, b) => b._score - a._score);
  }, [designs, quizAnswers]);

  const handleQuizComplete = (answers) => {
    setQuizAnswers(answers);
    setPhase("results");
  };

  const handleSkipQuiz = () => {
    setQuizAnswers(null);
    setPhase("results");
  };

  const handleSelectDesign = (design) => {
    const payload = design.template_payload || {};
    const templateData = {
      name: design.name,
      grid: payload.layout?.grid || [],
      walls: payload.layout?.walls || [],
      furniture: payload.layout?.furniture || [],
    };
    sessionStorage.setItem("load_template", JSON.stringify(templateData));
    navigate("/Configurator");
  };

  const handleStartBlank = () => {
    // Clear ALL stored design data for a truly blank start
    sessionStorage.removeItem("load_template");
    localStorage.removeItem("configurator_modules");
    localStorage.removeItem("configurator_walls");
    localStorage.removeItem("configurator_furniture");
    localStorage.removeItem("configurator_last_saved_name");
    navigate("/Configurator");
  };

  if (phase === "quiz") {
    return <DesignQuiz onComplete={handleQuizComplete} onSkip={handleSkipQuiz} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F7F5]">
      {phase === "hero" && (
        <HeroSection onStartQuiz={() => setPhase("quiz")} />
      )}

      {/* Designs section — shown after hero scroll or after quiz */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            {quizAnswers ? (
              <>
                <p className="text-[#F15A22] text-sm font-semibold uppercase tracking-widest mb-2">Your Matches</p>
                <h2 className="font-heading text-3xl font-bold text-gray-900">Designs matched to your needs</h2>
                <p className="text-gray-500 mt-1">Best matches shown first based on your answers</p>
              </>
            ) : (
              <>
                <p className="text-[#F15A22] text-sm font-semibold uppercase tracking-widest mb-2">Our Designs</p>
                <h2 className="font-heading text-3xl font-bold text-gray-900">Browse all designs</h2>
                <p className="text-gray-500 mt-1">Click any design to explore, then customise it your way</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Start Blank button - always visible */}
            <button
              onClick={handleStartBlank}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Start Blank Design
            </button>
            {quizAnswers && (
              <button
                onClick={() => setPhase("quiz")}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm text-gray-600 hover:border-[#F15A22] hover:text-[#F15A22] bg-white transition-colors"
              >
                <SlidersHorizontal size={14} /> Refine answers
              </button>
            )}
            {phase === "hero" && (
              <button
                onClick={() => setPhase("quiz")}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#F15A22] text-white text-sm font-semibold hover:bg-[#d94e1a] transition-colors"
              >
                Find my match <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Design grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-[#F15A22] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sortedDesigns.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <HardHat size={48} className="text-[#F15A22] mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-500">Designs coming soon</p>
            <p className="text-sm mt-1">Check back shortly — we're adding new designs regularly</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedDesigns.map((design, i) => (
              <DesignCard
                key={design.id}
                design={design}
                onSelect={handleSelectDesign}
                isFeatured={quizAnswers ? i === 0 : design.is_featured}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white py-8 text-center">
        <img
          src="https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/1a43e85d2_Connectapod-01.png"
          alt="Designer"
          className="h-7 w-auto mx-auto mb-3 opacity-60"
        />
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} Designer. All rights reserved.</p>
      </div>
    </div>
  );
}