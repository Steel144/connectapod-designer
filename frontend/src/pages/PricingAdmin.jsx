import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, DollarSign, Save } from "lucide-react";
import { toast } from "sonner";

const API_BASE = "/api";

function PricingField({ label, value, onChange, suffix = "", prefix = "$" }) {
  return (
    <div>
      <label className="text-xs text-gray-500 font-medium block mb-1">{label}</label>
      <div className="flex items-center border border-gray-200 bg-white">
        {prefix && <span className="px-2 text-xs text-gray-400 bg-gray-50 border-r border-gray-200 py-2">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="flex-1 px-3 py-2 text-sm text-gray-800 outline-none min-w-0"
          data-testid={`pricing-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
        />
        {suffix && <span className="px-2 text-xs text-gray-400 bg-gray-50 border-l border-gray-200 py-2">{suffix}</span>}
      </div>
    </div>
  );
}

export default function PricingAdmin() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const qc = useQueryClient();
  const [form, setForm] = useState(null);

  const { isLoading } = useQuery({
    queryKey: ["pricingConfig"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/admin/pricing`);
      const data = await res.json();
      setForm(data);
      return data;
    },
    enabled: authed,
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch(`${API_BASE}/admin/pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pricingConfig"] });
      toast.success("Pricing config saved");
    },
  });

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 shadow-sm p-8 w-full max-w-sm" data-testid="pricing-login">
          <h1 className="text-lg font-bold text-gray-800 mb-1">Pricing Configuration</h1>
          <p className="text-xs text-gray-400 mb-6">Enter your admin password to continue.</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && password === "admin123") setAuthed(true); }}
            placeholder="Password"
            className="w-full px-3 py-2.5 border border-gray-200 text-sm mb-3"
            data-testid="pricing-password-input"
          />
          <button
            onClick={() => { if (password === "admin123") setAuthed(true); }}
            className="w-full py-2.5 bg-[#F15A22] text-white text-sm font-medium hover:bg-[#d94e1a] transition-all"
            data-testid="pricing-login-btn"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="min-h-screen bg-[#F8F7F5] pt-12" data-testid="pricing-admin">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/dashboard" className="text-gray-400 hover:text-[#F15A22] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Pricing Configuration</h1>
            <p className="text-sm text-gray-500">These rates are used to auto-calculate estimates. Changes apply to all new estimates.</p>
          </div>
        </div>
        <button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending || !form}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#F15A22] text-white text-sm font-semibold hover:bg-[#d94e1a] transition-colors disabled:opacity-50"
          data-testid="save-pricing-btn"
        >
          <Save size={14} />
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Content */}
      <div className="p-6 max-w-3xl">
        {(isLoading || !form) ? (
          <div className="text-center py-12 text-gray-400 animate-pulse">Loading pricing config...</div>
        ) : (
          <>
            {/* Site Prep & Foundations */}
            <div className="bg-white border border-gray-200 p-5 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#F15A22] inline-block"></span>
                Site Prep & Foundations
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <PricingField label="Per Module (flat site)" value={form.site_prep_per_module} onChange={v => update("site_prep_per_module", v)} />
                <PricingField label="Sloping Surcharge (per module)" value={form.site_prep_sloping_surcharge_per_module} onChange={v => update("site_prep_sloping_surcharge_per_module", v)} suffix="/mod" />
                <PricingField label="Sloping Surcharge (per house)" value={form.site_prep_sloping_surcharge_per_house} onChange={v => update("site_prep_sloping_surcharge_per_house", v)} />
                <PricingField label="Steep Surcharge (per module)" value={form.site_prep_steep_surcharge_per_module} onChange={v => update("site_prep_steep_surcharge_per_module", v)} suffix="/mod" />
                <PricingField label="Steep Surcharge (per house)" value={form.site_prep_steep_surcharge_per_house} onChange={v => update("site_prep_steep_surcharge_per_house", v)} />
                <PricingField label="Water & Drainage (per house)" value={form.site_prep_water_drainage_per_house} onChange={v => update("site_prep_water_drainage_per_house", v)} />
              </div>
            </div>

            {/* Delivery */}
            <div className="bg-white border border-gray-200 p-5 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#F15A22] inline-block"></span>
                Delivery
              </h3>
              <p className="text-[11px] text-gray-400 mb-3">Cost auto-calculated from 29 Studholme St, Waimate to site address. Ferry added for North Island deliveries.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PricingField label="Rate Per Hour" value={form.delivery_rate_per_hour} onChange={v => update("delivery_rate_per_hour", v)} suffix="/hr" />
                <PricingField label="Ferry Crossing (per module)" value={form.ferry_crossing_cost} onChange={v => update("ferry_crossing_cost", v)} suffix="/mod" />
              </div>
            </div>

            {/* Installation */}
            <div className="bg-white border border-gray-200 p-5 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#F15A22] inline-block"></span>
                Installation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PricingField label="Labour Per Module" value={form.install_labour_per_module} onChange={v => update("install_labour_per_module", v)} suffix="/mod" />
                <PricingField label="Cranage Per Module" value={form.install_cranage_per_module} onChange={v => update("install_cranage_per_module", v)} suffix="/mod" />
                <PricingField label="Water & Drainage (per wet module)" value={form.install_water_drainage_per_wetmodule} onChange={v => update("install_water_drainage_per_wetmodule", v)} suffix="/mod" />
                <PricingField label="Electrical Connection (per house)" value={form.install_electrical_per_house} onChange={v => update("install_electrical_per_house", v)} />
              </div>
            </div>

            {/* GST */}
            <div className="bg-white border border-gray-200 p-5 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#F15A22] inline-block"></span>
                Tax
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <PricingField label="GST Rate" value={form.gst_rate} onChange={v => update("gst_rate", v)} prefix="" suffix="%" />
                <PricingField label="Markup" value={form.markup_percentage} onChange={v => update("markup_percentage", v)} prefix="" suffix="%" />
                <PricingField label="Margin" value={form.margin_percentage} onChange={v => update("margin_percentage", v)} prefix="" suffix="%" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
