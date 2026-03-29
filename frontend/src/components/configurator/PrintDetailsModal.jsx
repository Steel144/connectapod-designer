import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

const STORAGE_KEY = "connectapod_print_details";

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function AddressAutocomplete({ value, onChange }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const cacheRef = useRef(new Map()); // Cache results
  const lastRequestRef = useRef(0); // Rate limiting

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    clearTimeout(debounceRef.current);
    
    if (val.length < 3) { 
      setSuggestions([]); 
      setOpen(false); 
      return; 
    }

    // Check cache first
    if (cacheRef.current.has(val)) {
      const cached = cacheRef.current.get(val);
      setSuggestions(cached);
      setOpen(cached.length > 0);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        // Rate limiting: ensure at least 1 second between requests
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestRef.current;
        if (timeSinceLastRequest < 1000) {
          await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
        }
        lastRequestRef.current = Date.now();

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(val)}` +
          `&format=json` +
          `&addressdetails=1` +
          `&limit=8` +
          `&countrycodes=nz` +
          `&accept-language=en`,
          { 
            headers: { 
              "User-Agent": "Connectapod/1.0",
              "Accept-Language": "en"
            } 
          }
        );
        
        if (!res.ok) {
          throw new Error(`Nominatim error: ${res.status}`);
        }

        const data = await res.json();
        
        // Cache the results
        cacheRef.current.set(val, data);
        
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch (err) {
        console.error('Address autocomplete error:', err);
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 800); // Increased debounce to reduce requests
  };

  const handleSelect = (place) => {
    const display = place.display_name;
    setQuery(display);
    onChange(display);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <textarea
        ref={textareaRef}
        value={query}
        onChange={handleInput}
        placeholder="e.g. 123 Queen St, Auckland, NZ"
        className="mt-1 rounded-none text-sm w-full px-3 py-2 border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none min-h-[60px]"
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-3 top-3 text-xs text-gray-400">
          Searching...
        </div>
      )}
      {open && (
        <ul className="absolute z-50 left-0 right-0 bg-white border border-gray-200 shadow-lg mt-0.5 max-h-48 overflow-y-auto text-sm">
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              className="px-3 py-2 cursor-pointer hover:bg-orange-50 hover:text-[#F15A22] border-b border-gray-100 last:border-0"
              onMouseDown={() => handleSelect(s)}
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PrintDetailsModal({ open, onClose, onConfirm, printMode }) {
  const loadPrintDetails = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  };

  const saved = loadPrintDetails();
  const [projectName, setProjectName] = useState(saved.projectName || "");
  const [clientName, setClientName] = useState(saved.clientName || "");
  const [address, setAddress] = useState(saved.address || "");
  const [email, setEmail] = useState(saved.email || "");
  const [phone, setPhone] = useState(saved.phone || "");

  // Re-populate from storage whenever modal opens
  useEffect(() => {
    if (open) {
      const s = loadPrintDetails();
      setProjectName(s.projectName || "");
      setClientName(s.clientName || "");
      setAddress(s.address || "");
      setEmail(s.email || "");
      setPhone(s.phone || "");
    }
  }, [open]);

  const handleConfirm = () => {
    const details = { projectName, clientName, address, email, phone };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
    onConfirm(details);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-none">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Print {printMode === "plans" ? "Floor Plan" : "Elevations"}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-gray-500 -mt-2">These details will appear in the title block.</p>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-600">Project / Design Name</Label>
            <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Beach House" className="mt-1 rounded-none text-sm h-9" />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Client Name</Label>
            <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Jane Smith" className="mt-1 rounded-none text-sm h-9" />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Site Address</Label>
            <AddressAutocomplete value={address} onChange={setAddress} />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Client Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. jane@example.com" className="mt-1 rounded-none text-sm h-9" />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Client Phone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 021 123 4567" className="mt-1 rounded-none text-sm h-9" />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-none border-gray-200 text-gray-500 h-9">
            <X size={14} className="mr-1.5" /> Cancel
          </Button>
          <Button onClick={handleConfirm} className="flex-1 bg-[#F15A22] hover:bg-[#d94e1a] text-white rounded-none h-9">
            <Printer size={14} className="mr-1.5" /> Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}