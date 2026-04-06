import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, Share2, FileText, Clock, Mail, Phone, MapPin, ExternalLink, ChevronDown, ChevronUp, DollarSign } from "lucide-react";

const API_BASE = "/api";

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("leads");

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 shadow-sm p-8 w-full max-w-sm" data-testid="admin-login">
          <h1 className="text-lg font-bold text-gray-800 mb-1">Admin Dashboard</h1>
          <p className="text-xs text-gray-400 mb-6">Enter your admin password to continue.</p>
          <form autoComplete="off" onSubmit={e => { e.preventDefault(); if (password === "admin123") setAuthed(true); }}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="new-password"
            className="w-full px-3 py-2.5 border border-gray-200 text-sm mb-3"
            data-testid="admin-password-input"
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-[#F15A22] text-white text-sm font-medium hover:bg-[#d94e1a] transition-all"
            data-testid="admin-login-btn"
          >
            Sign In
          </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-dashboard">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-400 hover:text-[#F15A22] transition-colors"><ArrowLeft size={18} /></Link>
          <h1 className="text-base font-bold text-gray-800">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatsBar />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 flex gap-0">
        {[
          { id: "leads", label: "Client Leads", icon: Users },
          { id: "shares", label: "Shared Designs", icon: Share2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`admin-tab-${tab.id}`}
            className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.id ? "border-[#F15A22] text-[#F15A22]" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "leads" && <LeadsTable />}
        {activeTab === "shares" && <SharesTable />}
      </div>
    </div>
  );
}

function StatsBar() {
  const { data: stats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/admin/stats`);
      return res.ok ? res.json() : { leads: 0, shares: 0, newLeads: 0 };
    },
    refetchInterval: 30000,
  });

  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1.5">
        <Users size={13} className="text-gray-400" />
        <span className="text-gray-600 font-medium">{stats?.leads ?? "—"} leads</span>
        {stats?.newLeads > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full" data-testid="new-leads-badge">
            {stats.newLeads} new
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <Share2 size={13} className="text-gray-400" />
        <span className="text-gray-600 font-medium">{stats?.shares ?? "—"} shares</span>
      </div>
    </div>
  );
}

function LeadsTable() {
  const [expandedId, setExpandedId] = useState(null);
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["adminLeads"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/admin/leads`);
      return res.ok ? res.json() : [];
    },
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>;
  if (leads.length === 0) return <div className="text-center py-12 text-gray-400 text-sm">No leads yet. Client details will appear here when designs are saved.</div>;

  return (
    <div className="bg-white border border-gray-200 shadow-sm divide-y divide-gray-100" data-testid="leads-table">
      <div className="grid grid-cols-12 gap-2 px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50">
        <div className="col-span-3">Client</div>
        <div className="col-span-3">Project</div>
        <div className="col-span-2">Contact</div>
        <div className="col-span-2">Design</div>
        <div className="col-span-2">Date</div>
      </div>
      {leads.map(lead => {
        const isExpanded = expandedId === lead.id;
        const isNew = lead.is_new;
        return (
          <div key={lead.id}>
            <button
              onClick={() => setExpandedId(isExpanded ? null : lead.id)}
              className={`w-full grid grid-cols-12 gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${isNew ? "bg-orange-50/50" : ""}`}
              data-testid={`lead-row-${lead.id}`}
            >
              <div className="col-span-3 flex items-center gap-2">
                {isNew && <span className="w-2 h-2 bg-[#F15A22] rounded-full flex-shrink-0" />}
                <div>
                  <p className="text-xs font-semibold text-gray-800">{lead.clientFirstName || "—"} {lead.clientFamilyName || ""}</p>
                </div>
              </div>
              <div className="col-span-3">
                <p className="text-xs text-gray-700 truncate">{lead.name || "Untitled"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[11px] text-gray-500 truncate">{lead.email || lead.phone || "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[11px] text-gray-500">{lead.moduleCount || 0} mods · {(lead.totalSqm || 0).toFixed(0)}m²</p>
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <p className="text-[11px] text-gray-400">{lead.created_date ? new Date(lead.created_date).toLocaleDateString() : "—"}</p>
                {isExpanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
              </div>
            </button>
            {isExpanded && (
              <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 pt-3">
                  <DetailRow icon={Mail} label="Email" value={lead.email} />
                  <DetailRow icon={Phone} label="Phone" value={lead.phone} />
                  <DetailRow icon={MapPin} label="Home Address" value={lead.homeAddress} />
                  <DetailRow icon={MapPin} label="Site Address" value={lead.siteAddress} />
                  <DetailRow icon={FileText} label="Modules" value={`${lead.moduleCount || 0} modules, ${(lead.totalSqm || 0).toFixed(1)} m²`} />
                  <DetailRow icon={FileText} label="Est. Price" value={lead.estimatedPrice ? `$${(lead.estimatedPrice / 1000).toFixed(0)}k` : "—"} />
                </div>
                {lead.share_id && (
                  <a href={`/shared/${lead.share_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-xs text-[#F15A22] hover:underline">
                    <ExternalLink size={11} /> View shared design
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SharesTable() {
  const { data: shares = [], isLoading } = useQuery({
    queryKey: ["adminShares"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/admin/shares`);
      return res.ok ? res.json() : [];
    },
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>;
  if (shares.length === 0) return <div className="text-center py-12 text-gray-400 text-sm">No shared designs yet.</div>;

  return (
    <div className="bg-white border border-gray-200 shadow-sm divide-y divide-gray-100" data-testid="shares-table">
      <div className="grid grid-cols-12 gap-2 px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50">
        <div className="col-span-3">Design Name</div>
        <div className="col-span-3">Client</div>
        <div className="col-span-2">Modules</div>
        <div className="col-span-2">Date</div>
        <div className="col-span-2">Link</div>
      </div>
      {shares.map(share => (
        <div key={share.share_id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 transition-colors" data-testid={`share-row-${share.share_id}`}>
          <div className="col-span-3">
            <p className="text-xs font-semibold text-gray-800 truncate">{share.name || "Untitled"}</p>
          </div>
          <div className="col-span-3">
            <p className="text-[11px] text-gray-500">{share.clientFirstName || "—"} {share.clientFamilyName || ""}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[11px] text-gray-500">{share.moduleCount || 0} mods · {(share.totalSqm || 0).toFixed(0)}m²</p>
          </div>
          <div className="col-span-2">
            <p className="text-[11px] text-gray-400">{share.created_date ? new Date(share.created_date).toLocaleDateString() : "—"}</p>
          </div>
          <div className="col-span-2">
            <a href={`/shared/${share.share_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#F15A22] hover:underline">
              <ExternalLink size={11} /> View
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[10px] text-gray-400 uppercase">{label}</p>
        <p className="text-xs text-gray-700">{value}</p>
      </div>
    </div>
  );
}
