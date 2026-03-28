import React from "react";
import { Maximize2, BedDouble, Bath, ArrowRight } from "lucide-react";

const CATEGORY_LABELS = {
  granny_flat: "Granny Flat",
  minor_dwelling: "Minor Dwelling",
  standalone_home: "Standalone Home",
  studio: "Studio",
  multi_unit: "Multi Unit",
};

const USE_CASE_LABELS = {
  rental_income: "Rental Income",
  family: "Family",
  home_office: "Home Office",
  guest_accommodation: "Guest Accommodation",
  multi_generational: "Multi-Generational",
  bach: "Bach",
};

export default function DesignCard({ design, onSelect, isFeatured }) {
  const primaryCategory = design.categories?.[0];
  const heroImage = design.heroImage || "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80";

  return (
    <div
      className={`bg-white border overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer ${
        isFeatured ? "border-[#F15A22] shadow-md" : "border-gray-200"
      }`}
      onClick={() => onSelect(design)}
    >
      {isFeatured && (
        <div className="bg-[#F15A22] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 text-center">
          Popular Choice
        </div>
      )}

      {/* Hero image */}
      <div className="relative h-52 overflow-hidden bg-gray-100">
        <img
          src={heroImage}
          alt={design.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {primaryCategory && (
          <span className="absolute top-3 left-3 bg-white/90 text-gray-700 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1">
            {CATEGORY_LABELS[primaryCategory] || primaryCategory}
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-base mb-1 leading-tight">{design.name}</h3>
        {design.description && (
          <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">{design.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
          {design.size_sqm && (
            <span className="flex items-center gap-1.5">
              <Maximize2 size={13} className="text-[#F15A22]" />
              {design.size_sqm}m²
            </span>
          )}
          {design.bedrooms != null && (
            <span className="flex items-center gap-1.5">
              <BedDouble size={13} className="text-[#F15A22]" />
              {design.bedrooms === 0 ? "Studio" : `${design.bedrooms} bed`}
            </span>
          )}
          {design.bathrooms != null && (
            <span className="flex items-center gap-1.5">
              <Bath size={13} className="text-[#F15A22]" />
              {design.bathrooms} bath
            </span>
          )}
        </div>

        {/* Use cases */}
        {design.use_cases?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {design.use_cases.slice(0, 3).map((uc) => (
              <span key={uc} className="px-2 py-0.5 bg-orange-50 text-[#F15A22] text-[10px] font-medium">
                {USE_CASE_LABELS[uc] || uc}
              </span>
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Starting from</p>
            <p className="text-lg font-bold text-gray-900">
              ${(design.starting_price || 0).toLocaleString()}
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#F15A22] text-white text-xs font-semibold hover:bg-[#d94e1a] transition-colors group-hover:gap-3">
            View Design <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}