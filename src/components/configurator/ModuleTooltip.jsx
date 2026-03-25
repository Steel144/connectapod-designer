import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Edit2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import EditTooltipModal from "./EditTooltipModal";

export function getModuleTypeInfo(item) {
  const variants = item.description ? item.description.split(",").map(v => v.trim()) : [];
  const chassis = item.chassis || "SF";
  
  const isEnd = chassis === "EF" || chassis === "ER" || chassis === "LF" || chassis === "RF";
  const isConnection = chassis === "C";
  const isDeck = chassis === "DK" || chassis === "SO";

  if (isEnd) {
    return {
      type: "End Module",
      description: "End modules terminate the building structure. They attach to the ends of standard modules and feature enclosed sides. Used for creating complete building perimeters.",
      color: "bg-blue-50 border-blue-200"
    };
  }
  
  if (isConnection) {
    return {
      type: "Connection Module",
      description: "Connection modules bridge gaps between standard modules of different widths. They ensure structural continuity when joining modules with width variations.",
      color: "bg-purple-50 border-purple-200"
    };
  }
  
  if (isDeck) {
    return {
      type: "Deck Module",
      description: "Deck modules are open-air outdoor spaces for patios, decks, or porches. They add usable external space to the building without enclosed walls.",
      color: "bg-amber-50 border-amber-200"
    };
  }

  return {
    type: "Standard Module",
    description: "Standard modules form the main building structure. They can be joined together in rows and columns to create various floor plan configurations.",
    color: "bg-green-50 border-green-200"
  };
}

export function TypeTooltip({ type, children }) {
  const { user } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [info, setInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const defaultInfo = {
    standard: {
      key: "standard-module",
      type: "Standard Module",
      description: "Standard modules form the main building structure. They can be joined together in rows and columns to create various floor plan configurations.",
      color: "bg-green-50 border-green-200"
    },
    end: {
      key: "end-module",
      type: "End Module",
      description: "End modules terminate the building structure. They attach to the ends of standard modules and feature enclosed sides. Used for creating complete building perimeters.",
      color: "bg-blue-50 border-blue-200"
    }
  };

  useEffect(() => {
    const loadTooltipData = async () => {
      try {
        const defaultData = defaultInfo[type];
        if (!defaultData) {
          setIsLoading(false);
          return;
        }

        const records = await base44.entities.TooltipContent.filter({ key: defaultData.key });
        if (records.length > 0) {
          setInfo({ ...defaultData, ...records[0] });
        } else {
          setInfo(defaultData);
        }
      } catch (error) {
        console.error("Error loading tooltip:", error);
        setInfo(defaultInfo[type]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTooltipData();
  }, [type]);

  if (!info || isLoading) return children;
  
  const isAdmin = user?.role === "admin";

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {children}
          </TooltipTrigger>
          <TooltipContent side="right" className="w-64">
            <div className={`p-3 rounded-lg border ${info.color}`}>
              <div className="flex items-start gap-2 mb-2">
                <Info size={14} className="mt-0.5 shrink-0 text-gray-600" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-800">{info.type}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="shrink-0 ml-1 p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <Edit2 size={12} className="text-gray-600" />
                  </button>
                )}
              </div>
              <p className="text-xs leading-relaxed text-gray-700">{info.description}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <EditTooltipModal 
        isOpen={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        type={info}
        onSave={(newData) => {
          setInfo({ ...info, ...newData });
        }}
      />
    </>
  );
}

export default function ModuleTooltip({ item, children }) {
  const info = getModuleTypeInfo(item);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="right" className="w-64">
          <div className={`p-3 rounded-lg border ${info.color}`}>
            <div className="flex items-start gap-2 mb-2">
              <Info size={14} className="mt-0.5 shrink-0 text-gray-600" />
              <div className="text-xs">
                <p className="font-semibold text-gray-800">{info.type}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-gray-700">{info.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}