import React, { useState } from "react";
import { ArrowLeft, Maximize2, BedDouble, Bath, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

const BUILD_TYPE_LABELS = {
  modular: "Modular",
  kitset: "Kitset",
  turnkey: "Turnkey",
};

export default function DesignDetail({ design, onBack }) {
  const navigate = useNavigate();
  const [galleryIndex, setGalleryIndex] = useState(0);

  const allImages = [design.heroImage, ...(design.gallery || [])].filter(Boolean);
  const currentImage = allImages[galleryIndex] || "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80";

  const handleCustomise = () => {
    // Navigate to design catalogue (configurator entry point) with this template pre-loaded
    navigate("/DesignCatalogue");
  };

  return (
    <div className="min-h-screen bg-[#F8F7F5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft size={18} /> <span className="text-sm">Back to designs</span>
        </button>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">{design.name}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image gallery */}
          <div>
            <div className="relative bg-gray-100 overflow-hidden aspect-[4/3] mb-3">
              <img src={currentImage} alt={design.name} className="w-full h-full object-cover" />
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setGalleryIndex(i => Math.max(0, i - 1))}
                    disabled={galleryIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 disabled:opacity-30 hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setGalleryIndex(i => Math.min(allImages.length - 1, i + 1))}
                    disabled={galleryIndex === allImages.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 disabled:opacity-30 hover:bg-white transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1">
                    {galleryIndex + 1} / {allImages.length}
                  </span>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setGalleryIndex(i)}
                    className={`shrink-0 w-16 h-12 overflow-hidden border-2 transition-colors ${
                      i === galleryIndex ? "border-[#F15A22]" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {design.categories?.length > 0 && (
              <div className="flex gap-2 mb-3">
                {design.categories.map(c => (
                  <span key={c} className="text-[10px] font-bold uppercase tracking-widest text-[#F15A22] bg-orange-50 px-2 py-1">
                    {CATEGORY_LABELS[c] || c}
                  </span>
                ))}
              </div>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{design.name}</h1>
            <p className="text-gray-600 leading-relaxed mb-6">{design.description}</p>

            {/* Specs */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {design.size_sqm && (
                <div className="bg-white border border-gray-200 p-3 text-center">
                  <Maximize2 size={16} className="text-[#F15A22] mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{design.size_sqm}</p>
                  <p className="text-xs text-gray-400">m²</p>
                </div>
              )}
              {design.bedrooms != null && (
                <div className="bg-white border border-gray-200 p-3 text-center">
                  <BedDouble size={16} className="text-[#F15A22] mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{design.bedrooms === 0 ? "—" : design.bedrooms}</p>
                  <p className="text-xs text-gray-400">{design.bedrooms === 0 ? "Studio" : "Bedrooms"}</p>
                </div>
              )}
              {design.bathrooms != null && (
                <div className="bg-white border border-gray-200 p-3 text-center">
                  <Bath size={16} className="text-[#F15A22] mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-900">{design.bathrooms}</p>
                  <p className="text-xs text-gray-400">Bathrooms</p>
                </div>
              )}
            </div>

            {/* Use cases */}
            {design.use_cases?.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Ideal for</p>
                <div className="flex flex-wrap gap-2">
                  {design.use_cases.map(uc => (
                    <span key={uc} className="px-3 py-1 bg-orange-50 text-[#F15A22] text-xs font-medium">
                      {USE_CASE_LABELS[uc] || uc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Build types */}
            {design.build_type?.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Available as</p>
                <div className="flex gap-2">
                  {design.build_type.map(bt => (
                    <span key={bt} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium">
                      {BUILD_TYPE_LABELS[bt] || bt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Price + CTA */}
            <div className="bg-gray-50 border border-gray-200 p-5">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Starting from</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${(design.starting_price || 0).toLocaleString()}
                    <span className="text-sm font-normal text-gray-400 ml-1">NZD</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleCustomise}
                className="w-full py-3.5 bg-[#F15A22] text-white font-semibold hover:bg-[#d94e1a] transition-colors mb-3"
              >
                Customise This Design →
              </button>
              <p className="text-center text-xs text-gray-400">
                Opens in the free design configurator · No account needed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}