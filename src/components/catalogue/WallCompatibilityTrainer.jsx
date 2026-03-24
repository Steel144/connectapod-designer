import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function WallCompatibilityTrainer({ open, onClose, module, wallTypes = [] }) {
  const [selectedWalls, setSelectedWalls] = useState(new Set());
  const queryClient = useQueryClient();

  // Fetch existing compatibility for this module
  const { data: existing } = useQuery({
    queryKey: ["moduleWallCompatibility", module?.code],
    queryFn: async () => {
      if (!module?.code) return null;
      const results = await base44.entities.ModuleWallCompatibility.filter({
        moduleCode: module.code
      });
      return results[0] || null;
    },
    enabled: !!module?.code
  });

  // Initialize selected walls from existing data
  useEffect(() => {
    if (existing?.compatibleWallTypes) {
      setSelectedWalls(new Set(existing.compatibleWallTypes));
    } else {
      setSelectedWalls(new Set());
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!module?.code) return;
      const wallArray = Array.from(selectedWalls);
      
      if (existing) {
        await base44.entities.ModuleWallCompatibility.update(existing.id, {
          compatibleWallTypes: wallArray
        });
      } else {
        await base44.entities.ModuleWallCompatibility.create({
          moduleCode: module.code,
          compatibleWallTypes: wallArray
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moduleWallCompatibility"] });
      onClose();
    }
  });

  if (!open || !module) return null;

  const toggleWall = (wallType) => {
    setSelectedWalls(prev => {
      const next = new Set(prev);
      if (next.has(wallType)) {
        next.delete(wallType);
      } else {
        next.add(wallType);
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Wall Compatibility Trainer</h2>
            <p className="text-sm text-gray-600 mt-1">{module.name} ({module.code})</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-700 mb-4">
            Select which wall types are compatible with this module:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {wallTypes.map(wall => (
              <label key={wall.type} className="flex items-center gap-3 p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                <Checkbox
                  checked={selectedWalls.has(wall.type)}
                  onCheckedChange={() => toggleWall(wall.type)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{wall.label}</p>
                  <p className="text-xs text-gray-500">{wall.type}</p>
                </div>
              </label>
            ))}
          </div>

          {selectedWalls.size === 0 && (
            <p className="text-sm text-gray-500 mt-4 italic">No walls selected yet</p>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="ml-auto flex items-center gap-2 px-4 py-2 text-sm bg-[#F15A22] text-white rounded hover:bg-[#d94e1a] disabled:opacity-50"
          >
            <Save size={14} />
            {saveMutation.isPending ? "Saving..." : "Save Compatibility"}
          </button>
        </div>
      </div>
    </div>
  );
}