import React, { useState } from "react";
import { ChevronLeft, BedDouble, TrendingUp, Users, DoorOpen, Briefcase, Palmtree, Banknote, Coins, CircleDollarSign, Trophy, Home } from "lucide-react";

const STEPS = [
  {
    id: "bedrooms",
    question: "How many bedrooms do you need?",
    options: [
      { label: "Studio / 0 bed", value: 0, Icon: Home },
      { label: "1 Bedroom", value: 1, Icon: BedDouble },
      { label: "2 Bedrooms", value: 2, Icon: BedDouble },
      { label: "3+ Bedrooms", value: 3, Icon: BedDouble },
    ],
  },
  {
    id: "use_case",
    question: "What will you use it for?",
    options: [
      { label: "Rental Income", value: "rental_income", Icon: TrendingUp },
      { label: "Family / Extended Family", value: "family", Icon: Users },
      { label: "Guest Accommodation", value: "guest_accommodation", Icon: DoorOpen },
      { label: "Home Office / Studio", value: "home_office", Icon: Briefcase },
      { label: "Holiday Bach", value: "bach", Icon: Palmtree },
    ],
  },
  {
    id: "budget",
    question: "What's your rough budget?",
    options: [
      { label: "Under $100k", value: "under_100k", Icon: Coins },
      { label: "$100k – $200k", value: "100k-200k", Icon: Banknote },
      { label: "$200k – $300k", value: "200k-300k", Icon: CircleDollarSign },
      { label: "$300k+", value: "300k-400k", Icon: Trophy },
    ],
  },
];

export default function DesignQuiz({ onComplete, onSkip }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const currentStep = STEPS[step];

  const handleSelect = (value) => {
    const newAnswers = { ...answers, [currentStep.id]: value };
    setAnswers(newAnswers);

    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(newAnswers);
    }
  };

  const handleBack = () => {
    if (step === 0) return;
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F5] flex flex-col items-center justify-center px-4 py-16">
      {/* Progress */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 uppercase tracking-widest">Step {step + 1} of {STEPS.length}</span>
          <button onClick={onSkip} className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
            Skip — show all designs
          </button>
        </div>
        <div className="h-1 bg-gray-200 rounded-full">
          <div
            className="h-1 bg-[#F15A22] rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="w-full max-w-lg">
        {step > 0 && (
          <button onClick={handleBack} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
            <ChevronLeft size={16} /> Back
          </button>
        )}

        <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-900 mb-8">{currentStep.question}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentStep.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className="flex items-center gap-4 px-5 py-4 bg-white border-2 border-gray-200 hover:border-[#F15A22] hover:bg-orange-50 text-left transition-all group"
            >
              <opt.Icon size={18} className="text-[#F15A22] shrink-0" />
              <span className="font-medium text-gray-800 group-hover:text-[#F15A22] transition-colors">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}