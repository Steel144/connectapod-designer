import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Pencil, Upload, X, Loader2, Plus, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import AddModuleModal from "@/components/catalogue/AddModuleModal";
import EditModuleModal from "@/components/catalogue/EditModuleModal";

// wallElevations: { Z, W, Y, X } — compatible wall codes per face
const CATALOGUE = [
  {
    category: "Living",
    description: "Standard open modules with no internal partitions. Used for living, dining, sleeping areas.",
    modules: [
      { code: "006", name: "Open Module 0.6m", width: 0.6, depth: 4.8, sqm: 2.9, description: "Narrow end/connector module", chassisCodes: ["MP-48-SF06", "MP-48-SR06"], wallElevations: { Z: "N/A", W: "W000", Y: "Y000", X: "N/A" } },
      { code: "007", name: "Open Module 1.2m", width: 1.2, depth: 4.8, sqm: 5.8, description: "Half-width open module", chassisCodes: ["MP-48-SF12", "MP-48-SR12"], wallElevations: { Z: "N/A", W: "All (less L/R/D)", Y: "All (less L/R/D)", X: "N/A" } },
      { code: "008", name: "Open Module 1.8m", width: 1.8, depth: 4.8, sqm: 8.6, description: "Three-quarter width open module", chassisCodes: ["MP-48-SF18", "MP-48-SR18"], wallElevations: { Z: "N/A", W: "All (less L/R/D)", Y: "All (less L/R/D)", X: "N/A" } },
      { code: "009", name: "Open Module 2.4m", width: 2.4, depth: 4.8, sqm: 11.5, description: "Four-fifth width open module", chassisCodes: ["MP-48-SF24", "MP-48-SR24"], wallElevations: { Z: "N/A", W: "All (less L/R/D)", Y: "All (less L/R/D)", X: "N/A" } },
      { code: "010", name: "Open Module 3.0m", width: 3.0, depth: 4.8, sqm: 14.4, description: "Full-width standard open module", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "All (less L/R/D)", Y: "All (less L/R/D)", X: "N/A" } },
    ],
  },
  {
    category: "Bedroom",
    description: "End-of-row modules with finished end walls. Available in left-hand (LF/LR) and right-hand (RF/RR) configurations.",
    modules: [
      { code: "001", name: "End Cap 0.6m", width: 0.6, depth: 4.8, sqm: 2.9, description: "Narrow end cap, 600mm wide", chassisCodes: ["MP-48-LF06", "MP-48-LR06", "MP-48-RF06", "MP-48-RR06"], wallElevations: { Z: "All available", W: "W000L", Y: "Y000L", X: "N/A" } },
      { code: "002", name: "End Cap 1.2m", width: 1.2, depth: 4.8, sqm: 5.8, description: "End cap, 1200mm wide", chassisCodes: ["MP-48-LF12", "MP-48-LR12", "MP-48-RF12", "MP-48-RR12"], wallElevations: { Z: "All available", W: "W001L", Y: "Y001L", X: "N/A" } },
      { code: "003", name: "End Cap 1.8m", width: 1.8, depth: 4.8, sqm: 8.6, description: "End cap, 1800mm wide", chassisCodes: ["MP-48-LF18", "MP-48-LR18", "MP-48-RF18", "MP-48-RR18"], wallElevations: { Z: "All available", W: "W050EL / W series", Y: "Y050EL / Y series", X: "N/A (LF) / All (RF)" } },
      { code: "004", name: "End Cap 2.4m", width: 2.4, depth: 4.8, sqm: 11.5, description: "End cap, 2400mm wide", chassisCodes: ["MP-48-LF24", "MP-48-LR24", "MP-48-RF24", "MP-48-RR24"], wallElevations: { Z: "All available", W: "W200EL / W series", Y: "Y200EL / Y series", X: "N/A (LF) / All (RF)" } },
      { code: "005", name: "End Cap 3.0m", width: 3.0, depth: 4.8, sqm: 14.4, description: "Full-width end cap, 3000mm wide", chassisCodes: ["MP-48-LF30", "MP-48-LR30", "MP-48-RF30", "MP-48-RR30"], wallElevations: { Z: "All available", W: "W500L / W series", Y: "Y500L / Y503L / Y series", X: "N/A (LF) / All (RF)" } },
    ],
  },
  {
    category: "Bathroom",
    description: "Modules with internal door openings (DRH810 / DLH810). Used to connect adjacent rooms.",
    modules: [
      { code: "011-1", name: "Door — Top Left", width: 3.0, depth: 4.8, sqm: 14.4, description: "Single door top-left (DRH810). W000 on W/Y faces only.", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "W000", Y: "Y000", X: "N/A" } },
      { code: "011-2", name: "Door — Top Right", width: 3.0, depth: 4.8, sqm: 14.4, description: "Single door top-right (DRH810). All walls on W/Y faces.", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "All (less L/R/D)", Y: "All (less L/R/D)", X: "N/A" } },
      { code: "011-3", name: "Door — Bottom Left", width: 3.0, depth: 4.8, sqm: 14.4, description: "Single door bottom-left (DLH810). All walls on W/Y faces.", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "All (less L/R/D)", Y: "All (less L/R/D)", X: "N/A" } },
      { code: "011-4", name: "Door — Bottom Right", width: 3.0, depth: 4.8, sqm: 14.4, description: "Single door bottom-right (DLH810). All walls on W/Y faces.", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "All (less L/R/D)", Y: "All (less L/R/D)", X: "N/A" } },
      { code: "012-1", name: "Double Door — Left", width: 3.0, depth: 4.8, sqm: 14.4, description: "Two doors left side (DLH810 + DLH810). W000 on W/Y faces.", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "W000", Y: "Y000", X: "N/A" } },
      { code: "012-3", name: "Double Door — Right", width: 3.0, depth: 4.8, sqm: 14.4, description: "Two doors right side (DRH810 + DRH810). All walls on W/Y faces.", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "All (less L/R/D)", Y: "All (less L/R/D)", X: "N/A" } },
    ],
  },
  {
    category: "Laundry",
    description: "Modules with offset wall panels to create corner connections between perpendicular rows.",
    modules: [
      { code: "050-1", name: "L-Corner 1", width: 3.0, depth: 4.8, sqm: 14.4, description: "DLH810 + DRH810 + DLH660. Internal dims: 2,522 × 3,000 + 1,100 × 1,000mm zone.", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "W000", Y: "Y000", X: "N/A" } },
      { code: "050-2", name: "L-Corner 2", width: 3.0, depth: 4.8, sqm: 14.4, description: "DLH810 + DRH810 + DLH660 mirrored.", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "—", Y: "—", X: "N/A" } },
      { code: "050-3", name: "L-Corner 3", width: 3.0, depth: 4.8, sqm: 14.4, description: "DRH810 + DLH810 + DRH660.", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "—", Y: "—", X: "N/A" } },
      { code: "050-4", name: "L-Corner 4", width: 3.0, depth: 4.8, sqm: 14.4, description: "DRH810 + DRH660 + DLH810 mirrored.", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "—", Y: "—", X: "N/A" } },
    ],
  },
  {
    category: "Kitchen",
    description: "End-of-row kitchen modules with finished end wall and full cabinetry layout.",
    modules: [
      { code: "005-K30", name: "Kitchen End — U-Shape", width: 3.0, depth: 4.8, sqm: 14.4, description: "U-shaped bench: 900 + 2,700 + 1,200mm runs. Dims: 2,691 × 4,800mm frame.", chassisCodes: ["MP-48-LF30", "MP-48-LR30", "MP-48-RF30", "MP-48-RR30"], wallElevations: { Z: "Z000 / All", W: "W500 / W700 / W series", Y: "Y500 / Y530 / Y series", X: "N/A (LF) / X000 All (RF)" } },
      { code: "005-K31", name: "Kitchen End — Galley/DW", width: 3.0, depth: 4.8, sqm: 14.4, description: "Single galley run with dishwasher (DW). Frame: 2,691 × 4,800mm.", chassisCodes: ["MP-48-LF30", "MP-48-LR30", "MP-48-RF30", "MP-48-RR30"], wallElevations: { Z: "Z000 / All", W: "W500 / W700 / W series", Y: "Y500 / Y530 / Y series", X: "N/A (LF) / X000 All (RF)" } },
    ],
  },
  {
    category: "Soffit",
    description: "Soffit-only modules.",
    modules: [],
  },
  {
    category: "Bathroom",
    description: "Standard bathroom module with shower, vanity, and toilet.",
    modules: [
      { code: "401-B10", name: "Bathroom (B10)", width: 3.0, depth: 4.8, sqm: 14.4, description: "DRH710 or DLH710. Internal bath zone: 2,422 × 1,200mm. Frame: 2,911 × 2,822mm.", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "W500 / W series", Y: "Y500 / Y series", X: "N/A" } },
      { code: "412-B03", name: "Bathroom Compact (B03)", width: 3.0, depth: 4.8, sqm: 14.4, description: "DRH810 + DRH760 (or LH pair). Internal width: 1,400mm. Frame: 2,822 × 3,311mm.", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "W500 / W700 / W series", Y: "Y500 / Y530 / Y series", X: "N/A" } },
      { code: "423-B40", name: "Large Bathroom (B40)", width: 3.0, depth: 4.8, sqm: 14.4, description: "DLH810 or DRH810. Separate shower + bath. Bathroom zone: 2,602 × 2,400mm. Frame: 2,311 × 2,400mm.", chassisCodes: ["MP-48-LF30", "MP-48-LR30", "MP-48-RF30", "MP-48-RR30", "MP-48-EF30", "MP-48-ER30"], wallElevations: { Z: "Z000 (end) / N/A (mid)", W: "W500 / W700 / W series", Y: "Y500 / Y530 / Y series", X: "N/A (LF/EF) / X000 (RF/ER)" } },
    ],
  },
  {
    category: "Bedroom",
    description: "Combined ensuite and walk-in wardrobe (WIR) module.",
    modules: [
      { code: "402-B30", name: "Ensuite + WIR (B30) — Standard", width: 3.0, depth: 4.8, sqm: 14.4, description: "DLH810 × 2. SH90902 shower. Ensuite zone: 2,000 × 1,622mm. WIR: 2,000 × 2,222mm.", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "W500 / W series", Y: "Y500 / Y series", X: "N/A" } },
      { code: "421-B30", name: "Ensuite + WIR (B30) — End (Left)", width: 3.0, depth: 4.8, sqm: 14.4, description: "DLH810 end module. Z-face gable wall. WIR + ensuite. Frame: 220 × 2,222 × 380mm plan.", chassisCodes: ["MP-48-LF30", "MP-48-LR30", "MP-48-RF30", "MP-48-RR30"], wallElevations: { Z: "Z000 (LF) / N/A (RF)", W: "W500 / W700 / W series", Y: "Y500 / Y530 / Y series", X: "N/A (LF) / X000 (RF)" } },
      { code: "422-B30", name: "Ensuite + WIR (B30) — Passage End", width: 3.0, depth: 4.8, sqm: 14.4, description: "DLH810 + DRH810. WIR depth: 2,711mm. Frame: 220 × 2,222 × 380mm plan.", chassisCodes: ["MP-48-LF30", "MP-48-LR30", "MP-48-RF30", "MP-48-RR30"], wallElevations: { Z: "Z000 (LF) / N/A (RF)", W: "W500 / W700 / W series", Y: "Y500 / Y530 / Y series", X: "N/A (LF) / X000 (RF)" } },
    ],
  },
  {
    category: "Laundry",
    description: "Bathroom modules designed for the end of a row, with a finished Z gable end wall.",
    modules: [
      { code: "420-B01", name: "Bathroom End (B01)", width: 3.0, depth: 4.8, sqm: 14.4, description: "DCH760 door. WC zone: 1,089mm. Internal depth: 3,711mm. Frame: 220 + 2,602 + 89mm plan.", chassisCodes: ["MP-48-LF30", "MP-48-LR30", "MP-48-RF30", "MP-48-RR30"], wallElevations: { Z: "Z000 (LF) / N/A (RF)", W: "W500 / W700 / W series", Y: "Y500 / Y530 / Y series", X: "N/A (LF) / X000 (RF)" } },
    ],
  },
  {
    category: "Living",
    description: "Multi-function modules combining bathroom, kitchen, toilet, and/or laundry in one unit.",
    modules: [
      { code: "401-B10-K10", name: "Bathroom + Kitchen (B10/K10)", width: 3.0, depth: 4.8, sqm: 14.4, description: "DRH710. Kitchen + bathroom split. Bench: 1,120 + 760 + 1,120mm. Basic kitchen fit-out (W.M. PROV).", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "W500 / W700 / W series", Y: "Y500 / Y530 / Y series", X: "N/A" } },
      { code: "401-B10-K11", name: "Bathroom + Kitchen (B10/K11)", width: 3.0, depth: 4.8, sqm: 14.4, description: "DRH710. Kitchen includes FR700700 fridge, SH129LS, VW750420 rangehood. DW optional.", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "W500 / W series", Y: "Y500 / Y series", X: "N/A" } },
      { code: "413-K31-B30-L02", name: "Kitchen + Bathroom + Laundry (K31/B30/L02)", width: 3.0, depth: 4.8, sqm: 14.4, description: "DRH810 + DB310-4P + DRH710. Kitchen: CT6-6-IND hob, T-STD, SH812S, V75-42WH. Laundry: LT6-6H, WM-OS. 4 orientations.", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "W500 / W series", Y: "Y500 / Y series", X: "N/A" } },
      { code: "410-T01-B20-L01", name: "Toilet + Bathroom + Laundry (T01/B20/L01)", width: 3.0, depth: 4.8, sqm: 14.4, description: "DRH810 + DRH760 + DLH760 + DDH950P. Toilet, bathroom, laundry. Internal: 1,911 + 1,000 + 89mm plan. 4 orientations.", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "W500 / W700 / W series", Y: "Y500 / Y530 / Y series", X: "N/A" } },
      { code: "411-T01-B20-L01", name: "Toilet + Bathroom + Laundry — Narrow", width: 3.0, depth: 4.8, sqm: 14.4, description: "DDH900P door. Narrower variant. Internal: 1,675 + 89 + 3,036mm plan. 4 orientations.", chassisCodes: ["MP-48-SF30", "MP-48-SR30"], wallElevations: { Z: "N/A", W: "W500 / W series", Y: "Y500 / Y series", X: "N/A" } },
    ],
  },
  {
    category: "Deck",
    description: "Outdoor deck modules with wall panels and soffit options. Widths from 0.6m to 3.0m.",
    modules: [
      { code: "SO06", name: "Soffit Only 0.6m", width: 0.6, depth: 4.8, sqm: 2.9, description: "600mm soffit panel only — no deck walls.", chassisCodes: ["MP-48-SO06"], wallElevations: { Z: "N/A", W: "W000D", Y: "Y000D", X: "N/A" } },
      { code: "DK12", name: "Deck 1.2m", width: 1.2, depth: 4.8, sqm: 5.8, description: "1.2m wide deck. Wall: W001D / Y001D.", chassisCodes: ["MP-48-DK12"], wallElevations: { Z: "N/A", W: "W001D", Y: "Y001D", X: "N/A" } },
      { code: "DK18", name: "Deck 1.8m", width: 1.8, depth: 4.8, sqm: 8.6, description: "1.8m wide deck. Walls: W050D / W051D / Y050D / Y051D.", chassisCodes: ["MP-48-DK18"], wallElevations: { Z: "N/A", W: "W050D / W051D", Y: "Y050D / Y051D", X: "N/A" } },
      { code: "DK24", name: "Deck 2.4m", width: 2.4, depth: 4.8, sqm: 11.5, description: "2.4m wide deck. Walls: W200D / Y200D.", chassisCodes: ["MP-48-DK24"], wallElevations: { Z: "N/A", W: "W200D / W—D", Y: "Y200D / Y—D", X: "N/A" } },
      { code: "DK30", name: "Deck 3.0m", width: 3.0, depth: 4.8, sqm: 14.4, description: "Full 3.0m wide deck. Walls: W500D / Y500D.", chassisCodes: ["MP-48-DK30"], wallElevations: { Z: "N/A", W: "W500D / W—D", Y: "Y500D / Y—D", X: "N/A" } },
    ],
  },
];

const CATEGORY_COLORS = {
  "Living": "#E8F4FD",
  "Bedroom": "#F0FDF4",
  "Bathroom": "#F0F9FF",
  "Laundry": "#F5F3FF",
  "Kitchen": "#FFF1F2",
  "Soffit": "#F8FAFC",
  "Deck": "#F8FAFC",
};

export default function Catalogue() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [addingToCategory, setAddingToCategory] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [pendingUploadCode, setPendingUploadCode] = useState(null);

  const { data: customModules = [] } = useQuery({
    queryKey: ["moduleEntries"],
    queryFn: () => base44.entities.ModuleEntry.list(),
  });

  const { data: deletedModules = [] } = useQuery({
    queryKey: ["deletedModules"],
    queryFn: () => base44.entities.DeletedModule.list(),
  });
  const deletedCodes = new Set(deletedModules.map(d => d.moduleCode));

  const handleAddModule = async (data) => {
    await base44.entities.ModuleEntry.create(data);
    queryClient.invalidateQueries({ queryKey: ["moduleEntries"] });
    setAddingToCategory(null);
    toast.success("Module added");
  };

  const handleDeleteModule = async (entryId) => {
    await base44.entities.ModuleEntry.delete(entryId);
    queryClient.invalidateQueries({ queryKey: ["moduleEntries"] });
    toast.success("Module removed");
  };

  const handleDeleteBuiltinModule = async (code) => {
    await base44.entities.DeletedModule.create({ moduleCode: code });
    queryClient.invalidateQueries({ queryKey: ["deletedModules"] });
    toast.success("Module hidden");
  };

  const handleRestoreModule = async (code) => {
    const entry = deletedModules.find(d => d.moduleCode === code);
    if (entry) {
      await base44.entities.DeletedModule.delete(entry.id);
      queryClient.invalidateQueries({ queryKey: ["deletedModules"] });
      toast.success("Module restored");
    }
  };

  const handleEditModule = async (data) => {
    if (editingModule._custom) {
      await base44.entities.ModuleEntry.update(editingModule._id, {
        ...data,
        category: editingModule.category,
        originalCode: editingModule.originalCode || undefined,
      });
    } else {
      const existingOverride = customModules.find(c => c.originalCode === editingModule.code);
      if (existingOverride) {
        await base44.entities.ModuleEntry.update(existingOverride.id, {
          ...data,
          category: editingModule.category,
          originalCode: editingModule.code,
        });
      } else {
        await Promise.all([
          base44.entities.DeletedModule.create({ moduleCode: editingModule.code }),
          base44.entities.ModuleEntry.create({
            ...data,
            category: editingModule.category,
            originalCode: editingModule.code,
          }),
        ]);
      }
    }
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ["moduleEntries"] }),
      queryClient.refetchQueries({ queryKey: ["deletedModules"] }),
    ]);
    setEditingModule(null);
    toast.success("Module updated");
  };

  const { data: floorPlanImages = {} } = useQuery({
    queryKey: ["floorPlanImages"],
    queryFn: async () => {
      const images = await base44.entities.FloorPlanImage.list();
      return Object.fromEntries(images.map(img => [img.moduleType, img.imageUrl]));
    },
  });

  const handleUploadClick = (code) => {
    setPendingUploadCode(code);
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !pendingUploadCode) return;
    e.target.value = "";
    setUploading(pendingUploadCode);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const existing = await base44.entities.FloorPlanImage.filter({ moduleType: pendingUploadCode });
    if (existing.length > 0) {
      await base44.entities.FloorPlanImage.update(existing[0].id, { imageUrl: file_url });
    } else {
      await base44.entities.FloorPlanImage.create({ moduleType: pendingUploadCode, imageUrl: file_url });
    }
    queryClient.invalidateQueries({ queryKey: ["floorPlanImages"] });
    setUploading(null);
    toast.success("Image updated");
  };

  const handleRemoveImage = async (code) => {
    const existing = await base44.entities.FloorPlanImage.filter({ moduleType: code });
    if (existing.length > 0) {
      await base44.entities.FloorPlanImage.delete(existing[0].id);
      queryClient.invalidateQueries({ queryKey: ["floorPlanImages"] });
      toast.success("Image removed");
    }
  };

  const categories = ["All", ...Array.from(new Set(CATALOGUE.map(c => c.category)))];

  // Codes that have a custom override via originalCode
  const overriddenModuleCodes = new Set(customModules.filter(c => c.originalCode).map(c => c.originalCode));

  const moduleCodeNum = (code) => {
    const m = String(code).match(/\d+/);
    return m ? parseInt(m[0], 10) : 9999;
  };

  // Merge hardcoded + custom modules per category
  const allCatalogue = CATALOGUE.map(cat => {
    const builtins = cat.modules
      .filter(m => {
        if (overriddenModuleCodes.has(m.code)) return false;
        if (!deletedCodes.has(m.code)) return true;
        return editMode;
      })
      .map(m => ({ ...m, _custom: false, _deleted: deletedCodes.has(m.code) }));

    const customs = customModules.filter(c => c.category === cat.category).map(c => ({
        code: c.code, name: c.name, width: c.width || 3.0, depth: c.depth || 4.8,
        sqm: c.sqm || parseFloat(((c.width || 3.0) * (c.depth || 4.8)).toFixed(1)),
        description: c.description || "",
        chassisCodes: c.chassisCodes || [],
        wallElevations: { Z: c.wallElevationZ || "N/A", W: c.wallElevationW || "", Y: c.wallElevationY || "", X: c.wallElevationX || "N/A" },
        originalCode: c.originalCode || undefined,
        _custom: true, _id: c.id,
      }));

    const merged = [...builtins, ...customs];
    merged.sort((a, b) => moduleCodeNum(a.originalCode || a.code) - moduleCodeNum(b.originalCode || b.code));
    return { ...cat, modules: merged };
  });

  const totalModules = allCatalogue.reduce((s, c) => s + c.modules.length, 0);

  const filtered = allCatalogue
    .filter(cat => activeCategory === "All" || cat.category === activeCategory)
    .map(cat => ({
      ...cat,
      modules: cat.modules.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.code.toLowerCase().includes(search.toLowerCase()) ||
        (m.description || "").toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(cat => cat.modules.length > 0 || editMode);

  return (
    <div className="min-h-screen bg-[#F5F5F3]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">connectapod</h1>
            <p className="text-sm text-gray-500 mt-0.5">Module Catalogue — connectapod MP-48 System</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(e => !e)}
              className={`flex items-center gap-2 px-3 py-2 text-sm border transition-all ${editMode ? "bg-[#F15A22] text-white border-[#F15A22]" : "text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`}
            >
              <Pencil size={14} />
              {editMode ? "Done Editing" : "Edit Catalogue"}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] transition-all"
            >
              <ChevronLeft size={16} />
              Exit
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search + Stats */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search modules by name, code or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F15A22]"
          />
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 px-4 py-2.5">
            <span className="font-bold text-gray-800">{totalModules}</span> module layouts across
            <span className="font-bold text-gray-800">{categories.length - 1}</span> categories
          </div>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium border transition-all ${
                activeCategory === cat
                  ? "bg-[#F15A22] text-white border-[#F15A22]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"
              }`}
            >
              {cat === "All" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        {editingModule && (
          <EditModuleModal
            module={editingModule}
            onSave={handleEditModule}
            onClose={() => setEditingModule(null)}
          />
        )}

        {addingToCategory && (
          <AddModuleModal
            category={addingToCategory.category}
            onSave={handleAddModule}
            onClose={() => setAddingToCategory(null)}
          />
        )}

        {/* Catalogue Sections */}
        <div className="space-y-10">
          {filtered.map(cat => (
            <div key={cat.category}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{cat.category}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{cat.description}</p>
                </div>
                {editMode && (
                  <button
                    onClick={() => setAddingToCategory(cat)}
                    className="shrink-0 flex items-center gap-1 px-2 py-1 text-xs text-[#F15A22] border border-[#F15A22] hover:bg-[#F15A22] hover:text-white transition-colors"
                  >
                    <Plus size={11} /> Add Module
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.modules.map(mod => (
                  <div
                    key={mod.code}
                    className={`bg-white border p-4 transition-all group relative ${mod._deleted ? "border-red-200 opacity-50" : "border-gray-200 hover:shadow-md hover:border-[#F15A22]"}`}
                  >
                    {editMode && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                        {mod._deleted ? (
                          <button
                            onClick={() => handleRestoreModule(mod.code)}
                            className="text-xs text-green-600 hover:underline"
                          >Restore</button>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingModule({ ...mod, category: cat.category })}
                              className="text-gray-300 hover:text-[#F15A22] transition-colors"
                              title="Edit module"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => mod._custom ? handleDeleteModule(mod._id) : handleDeleteBuiltinModule(mod.code)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                              title="Remove module"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {editMode && uploading !== mod.code && !mod._deleted && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 hidden group-hover:flex">
                        <button
                          onClick={() => handleUploadClick(mod.code)}
                          className="flex items-center gap-1 px-2 py-1 bg-white text-gray-800 text-xs font-medium hover:bg-[#F15A22] hover:text-white transition-colors"
                        >
                          <Upload size={11} /> Upload
                        </button>
                        {floorPlanImages[mod.code] && (
                          <button
                            onClick={() => handleRemoveImage(mod.code)}
                            className="flex items-center gap-1 px-2 py-1 bg-white text-red-600 text-xs font-medium hover:bg-red-600 hover:text-white transition-colors"
                          >
                            <X size={11} /> Remove
                          </button>
                        )}
                      </div>
                    )}
                    {/* Visual preview */}
                    <div
                      className="w-full mb-3 relative flex items-center justify-center border border-gray-100"
                      style={{ aspectRatio: "3 / 4.8", backgroundColor: CATEGORY_COLORS[cat.category] || "#F5F5F3" }}
                    >
                      {uploading === mod.code ? (
                        <Loader2 size={20} className="animate-spin text-[#F15A22]" />
                      ) : floorPlanImages[mod.code] ? (
                        <img src={floorPlanImages[mod.code]} alt={mod.name} className="w-full h-full object-contain" />
                      ) : (
                        <div
                          className="border-2 border-gray-400 group-hover:border-[#F15A22] transition-colors flex items-center justify-center"
                          style={{ width: Math.min(55, (mod.width / 3) * 55), height: Math.min(55, (mod.width / 3) * 55) * (4.8 / mod.width) }}
                        >
                          <span className="text-xs font-mono text-gray-400 group-hover:text-[#F15A22]">
                            {mod.width}×{mod.depth}
                          </span>
                        </div>
                      )}
                      {editMode && uploading !== mod.code && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleUploadClick(mod.code)}
                            className="flex items-center gap-1 px-2 py-1 bg-white text-gray-800 text-xs font-medium hover:bg-[#F15A22] hover:text-white transition-colors"
                          >
                            <Upload size={11} /> Upload
                          </button>
                          {floorPlanImages[mod.code] && (
                            <button
                              onClick={() => handleRemoveImage(mod.code)}
                              className="flex items-center gap-1 px-2 py-1 bg-white text-red-600 text-xs font-medium hover:bg-red-600 hover:text-white transition-colors"
                            >
                              <X size={11} /> Remove
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-800 leading-tight">{mod.name}</h3>
                      <span className="text-xs font-mono text-[#F15A22] bg-orange-50 px-1.5 py-0.5 shrink-0">{mod.code}</span>
                    </div>
                    {editMode && (
                      <button
                        onClick={() => setEditingModule({ ...mod, category: cat.category })}
                        className="text-xs text-gray-400 hover:text-[#F15A22] mb-2 transition-colors flex items-center gap-1"
                        title="Edit module details"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                    )}
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">{mod.description}</p>

                    <div className="flex gap-3 text-xs text-gray-500 border-t border-gray-100 pt-2.5 mb-3">
                      <span><span className="font-semibold text-gray-700">{mod.width}m</span> wide</span>
                      <span><span className="font-semibold text-gray-700">{mod.depth}m</span> deep</span>
                      <span><span className="font-semibold text-gray-700">{mod.sqm.toFixed(1)}</span> m²</span>
                    </div>

                    {mod.chassisCodes && (
                      <div className="mb-2">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Chassis Codes</p>
                        <div className="flex flex-wrap gap-1">
                          {mod.chassisCodes.map(c => (
                            <span key={c} className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {mod.wallElevations && (
                      <div className="border-t border-gray-100 pt-2 mt-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Wall Elevations</p>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                          {Object.entries(mod.wallElevations).map(([face, val]) => (
                            <div key={face} className="flex items-start gap-1 text-[10px]">
                              <span className="font-bold text-[#F15A22] w-3 shrink-0">{face}</span>
                              <span className="text-gray-500 leading-tight">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-3">🔍</p>
            <p className="font-medium">No modules found for "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
}