import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Home, Briefcase, BedDouble, Users, Plus, ArrowRight } from "lucide-react";

const useCaseCards = [
  { key: "sleepout", title: "Sleepouts", description: "Compact extra space, usually under 30sqm", icon: Home },
  { key: "office", title: "Office Space", description: "Work-from-home pods and backyard offices", icon: Briefcase },
  { key: "granny-flat", title: "Granny Flats", description: "Flexible minor dwellings up to 70sqm", icon: Users },
  { key: "1-bedroom", title: "1 Bedroom", description: "Efficient compact living", icon: BedDouble },
  { key: "2-bedroom", title: "2 Bedroom", description: "Balanced layouts for couples and rentals", icon: BedDouble },
  { key: "3-bedroom", title: "3 Bedroom", description: "Family-friendly starter plans", icon: BedDouble },
  { key: "4-bedroom", title: "4 Bedroom", description: "Larger family layouts", icon: BedDouble },
  { key: "5-plus", title: "5 Bedroom+", description: "Large homes and rural accommodation", icon: BedDouble },
  { key: "rural", title: "Rural Accommodation", description: "Lifestyle block and worker accommodation", icon: Home },
];

const sizeOptions = [
  { key: "all", label: "All sizes" },
  { key: "under30", label: "Under 30sqm" },
  { key: "30to70", label: "30–70sqm" },
  { key: "70to120", label: "70–120sqm" },
  { key: "120plus", label: "120sqm+" },
];

const bedroomOptions = [
  { key: "all", label: "Any bedrooms" },
  { key: "studio", label: "Studio" },
  { key: "1", label: "1 Bedroom" },
  { key: "2", label: "2 Bedroom" },
  { key: "3", label: "3 Bedroom" },
  { key: "4", label: "4 Bedroom" },
  { key: "5plus", label: "5+ Bedroom" },
];

function normalise(str) {
  return String(str || "").trim().toLowerCase();
}

function asArray(value) {
  if (Array.isArray(value)) return value.map(normalise);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((x) => normalise(x)).filter(Boolean);
  }
  return [];
}

function getSizeSqm(item) {
  if (typeof item.size_sqm === "number") return item.size_sqm;
  if (typeof item.sizeSqm === "number") return item.sizeSqm;
  if (typeof item.area === "number") return item.area;
  if (typeof item.width === "number" && typeof item.depth === "number") {
    return Number((item.width * item.depth).toFixed(1));
  }
  return null;
}

function getBedrooms(item) {
  if (typeof item.bedrooms === "number") return item.bedrooms;
  if (typeof item.bedroom_count === "number") return item.bedroom_count;
  if (typeof item.bedroomCount === "number") return item.bedroomCount;
  return null;
}

function getPrice(item) {
  if (typeof item.starting_price === "number") return item.starting_price;
  if (typeof item.startingPrice === "number") return item.startingPrice;
  if (typeof item.price === "number") return item.price;
  return null;
}

function formatPrice(value) {
  if (typeof value !== "number") return "Price on request";
  return new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD", maximumFractionDigits: 0 }).format(value);
}

function inSizeBucket(size, bucket) {
  if (bucket === "all") return true;
  if (typeof size !== "number") return false;
  if (bucket === "under30") return size < 30;
  if (bucket === "30to70") return size >= 30 && size <= 70;
  if (bucket === "70to120") return size > 70 && size <= 120;
  if (bucket === "120plus") return size > 120;
  return true;
}

function inBedroomBucket(bedrooms, bucket) {
  if (bucket === "all") return true;
  if (bucket === "studio") return bedrooms === 0;
  if (typeof bedrooms !== "number") return false;
  if (bucket === "5plus") return bedrooms >= 5;
  return bedrooms === Number(bucket);
}

function inferTags(item) {
  const tags = new Set([
    ...asArray(item.categories),
    ...asArray(item.category),
    ...asArray(item.tags),
    ...asArray(item.use_cases),
    ...asArray(item.useCases),
    normalise(item.designType),
    normalise(item.design_type),
    normalise(item.type),
  ]);

  const bedrooms = getBedrooms(item);
  const size = getSizeSqm(item);
  const name = normalise(item.name);
  const code = normalise(item.code);

  if (bedrooms === 1) tags.add("1-bedroom");
  if (bedrooms === 2) tags.add("2-bedroom");
  if (bedrooms === 3) tags.add("3-bedroom");
  if (bedrooms === 4) tags.add("4-bedroom");
  if (typeof bedrooms === "number" && bedrooms >= 5) tags.add("5-plus");
  if (size !== null && size < 30) tags.add("sleepout");
  if (size !== null && size <= 70) tags.add("granny-flat");
  if (name.includes("office") || code.includes("office")) tags.add("office");
  if (name.includes("sleepout")) tags.add("sleepout");
  if (name.includes("granny")) tags.add("granny-flat");
  if (name.includes("rural")) tags.add("rural");

  return Array.from(tags).filter(Boolean);
}

function pickImage(item, floorPlanImages) {
  return (
    item.heroImage ||
    item.hero_image ||
    item.image ||
    item.imageUrl ||
    item.thumbnail ||
    floorPlanImages?.[item.code] ||
    null
  );
}

function TemplateCard({ item, onOpen }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
      <div className="aspect-[16/10] bg-neutral-100">
        {item._image ? (
          <img src={item._image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">No preview image</div>
        )}
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <h4 className="text-lg font-semibold text-neutral-900">{item.name || item.code}</h4>
            <p className="text-xs uppercase tracking-wide text-neutral-400">{item.code}</p>
          </div>
        </div>
        <div className="mb-3 flex flex-wrap gap-2 text-xs text-neutral-600">
          {typeof item._sizeSqm === "number" && (
            <span className="rounded-full bg-neutral-100 px-3 py-1">{item._sizeSqm} sqm</span>
          )}
          {typeof item._bedrooms === "number" && (
            <span className="rounded-full bg-neutral-100 px-3 py-1">
              {item._bedrooms === 0 ? "Studio" : `${item._bedrooms} bed`}
            </span>
          )}
        </div>
        <p className="mb-4 min-h-[40px] text-sm text-neutral-600">
          {item.short_description || item.shortDescription || item.description || "Fully customisable starting design."}
        </p>
        <div className="mb-4 text-lg font-semibold text-neutral-900">{formatPrice(item._price)}</div>
        <button
          onClick={() => onOpen(item)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-black"
        >
          Customise this design
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function Catalogue() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [activeUseCase, setActiveUseCase] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [bedroomFilter, setBedroomFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");

  const { data: moduleEntries = [], isLoading: loadingModules } = useQuery({
    queryKey: ["moduleEntries"],
    queryFn: () => base44.entities.ModuleEntry.list(),
  });

  const { data: floorPlanImages = {}, isLoading: loadingImages } = useQuery({
    queryKey: ["floorPlanImages"],
    queryFn: async () => {
      const images = await base44.entities.FloorPlanImage.list();
      return Object.fromEntries(images.map((img) => [img.moduleType, img.imageUrl]));
    },
  });

  const templates = useMemo(() => {
    return moduleEntries
      .filter((item) => {
        const tags = inferTags(item);
        return (
          item.isTemplate === true ||
          item.is_template === true ||
          item.template === true ||
          item.starterDesign === true ||
          item.starter_design === true ||
          tags.some((t) => ["sleepout","office","granny-flat","1-bedroom","2-bedroom","3-bedroom","4-bedroom","5-plus","rural"].includes(t))
        );
      })
      .map((item) => ({
        ...item,
        _sizeSqm: getSizeSqm(item),
        _bedrooms: getBedrooms(item),
        _price: getPrice(item),
        _tags: inferTags(item),
        _image: pickImage(item, floorPlanImages),
      }));
  }, [moduleEntries, floorPlanImages]);

  const filteredTemplates = useMemo(() => {
    let rows = [...templates];

    if (search.trim()) {
      const q = normalise(search);
      rows = rows.filter((item) =>
        [item.name, item.code, item.description, item.short_description, item.shortDescription, ...(item._tags || [])]
          .filter(Boolean)
          .some((value) => normalise(value).includes(q))
      );
    }

    if (activeUseCase !== "all") rows = rows.filter((item) => item._tags.includes(activeUseCase));
    rows = rows.filter((item) => inSizeBucket(item._sizeSqm, sizeFilter));
    rows = rows.filter((item) => inBedroomBucket(item._bedrooms, bedroomFilter));

    rows.sort((a, b) => {
      if (sortBy === "smallest") return (a._sizeSqm ?? 9999) - (b._sizeSqm ?? 9999);
      if (sortBy === "largest") return (b._sizeSqm ?? -1) - (a._sizeSqm ?? -1);
      if (sortBy === "cheapest") return (a._price ?? 999999999) - (b._price ?? 999999999);
      if (sortBy === "name") return String(a.name || "").localeCompare(String(b.name || ""));
      return 0;
    });

    return rows;
  }, [templates, search, activeUseCase, sizeFilter, bedroomFilter, sortBy]);

  const featured = useMemo(() => templates.slice(0, 6), [templates]);

  function handleOpenTemplate(template) {
    localStorage.setItem("connectapod:selectedTemplate", JSON.stringify({
      id: template.id,
      code: template.code,
      name: template.name,
      source: "catalogue",
      selectedAt: new Date().toISOString(),
    }));
    navigate("/Configurator");
  }

  function handleStartFromScratch() {
    localStorage.removeItem("connectapod:selectedTemplate");
    navigate("/Configurator");
  }

  const loading = loadingModules || loadingImages;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-orange-600">Connectapod</p>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Choose a starting point</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600 md:text-base">
              Start with a proven design and customise it inside the configurator.
            </p>
          </div>
          <button
            onClick={handleStartFromScratch}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            Start from scratch
          </button>
        </div>

        {/* Use case cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          {useCaseCards.map((card) => {
            const Icon = card.icon;
            const active = activeUseCase === card.key;
            return (
              <button
                key={card.key}
                onClick={() => setActiveUseCase(active ? "all" : card.key)}
                className={`rounded-3xl border p-5 text-left transition ${active ? "border-orange-400 bg-orange-50 shadow-sm" : "border-neutral-200 bg-white hover:border-orange-300"}`}
              >
                <div className="mb-4 inline-flex rounded-2xl bg-neutral-100 p-3">
                  <Icon className="h-5 w-5 text-neutral-700" />
                </div>
                <h2 className="text-lg font-semibold text-neutral-900">{card.title}</h2>
                <p className="mt-2 text-sm text-neutral-600">{card.description}</p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="mb-6 grid gap-3 rounded-3xl border border-neutral-200 bg-white p-4 md:grid-cols-4">
          <div className="md:col-span-4">
            <label className="mb-2 block text-sm font-medium text-neutral-700">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, code, use case..."
                className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-orange-400"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Size</label>
            <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)} className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm">
              {sizeOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Bedrooms</label>
            <select value={bedroomFilter} onChange={(e) => setBedroomFilter(e.target.value)} className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm">
              {bedroomOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">Sort</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm">
              <option value="recommended">Recommended</option>
              <option value="smallest">Smallest first</option>
              <option value="largest">Largest first</option>
              <option value="cheapest">Cheapest first</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setSearch(""); setActiveUseCase("all"); setSizeFilter("all"); setBedroomFilter("all"); setSortBy("recommended"); }}
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700 hover:border-orange-300"
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* Featured */}
        {!loading && featured.length > 0 && activeUseCase === "all" && !search && (
          <div className="mb-8">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-neutral-900">Featured starter designs</h3>
              <p className="text-sm text-neutral-600">Quick starting points your customers can edit.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featured.map((item) => (
                <TemplateCard key={`featured-${item.id}`} item={item} onOpen={handleOpenTemplate} />
              ))}
            </div>
          </div>
        )}

        {/* All results */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-neutral-900">Starter designs</h3>
          <p className="text-sm text-neutral-600">
            {loading ? "Loading..." : `${filteredTemplates.length} design${filteredTemplates.length === 1 ? "" : "s"} found`}
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-sm text-neutral-600">Loading designs...</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-sm text-neutral-600">
            No matching starter designs found. Try clearing filters or start from scratch.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredTemplates.map((item) => (
              <TemplateCard key={item.id} item={item} onOpen={handleOpenTemplate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}