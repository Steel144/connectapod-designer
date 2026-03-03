import React from "react";
import { AlertCircle } from "lucide-react";

export default function WallSuggestions({ selectedModule, selectedWall }) {
  if (!selectedModule || selectedWall) return null;

  // Check if it's an end cap (single cell wide modules tend to be end caps)
  const isEndCap = selectedModule.w === 1 || selectedModule.h === 1;

  if (!isEndCap) return null;

  return (
    <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
      <div className="flex gap-2">
        <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">Wall suggestions for this end cap:</p>
          <ul className="space-y-0.5 ml-2 list-disc text-blue-600">
            <li><strong>W face</strong> (top/outside): horizontal wall</li>
            <li><strong>Y face</strong> (bottom/outside): horizontal wall</li>
            <li><strong>End faces</strong> (Z or X): vertical wall on external side only</li>
          </ul>
        </div>
      </div>
    </div>
  );
}