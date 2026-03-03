import React from "react";
import { AlertCircle } from "lucide-react";

export default function WallSuggestions({ selectedModule, selectedWall, placedModules = [] }) {
  if (!selectedModule || selectedWall) return null;

  // Check if it's an end module (EF, LF, RF, ER chassis)
  const isEndModule = selectedModule.chassis && (selectedModule.chassis === "EF" || selectedModule.chassis === "LF" || selectedModule.chassis === "RF" || selectedModule.chassis === "ER");

  if (!isEndModule) return null;

  // Check which sides have adjacent modules (exclude decks/soffits)
  const hasModuleOnZ = placedModules.some(m => 
    m.id !== selectedModule.id && 
    m.x + m.w === selectedModule.x && 
    m.y < selectedModule.y + selectedModule.h && 
    m.y + m.h > selectedModule.y &&
    m.chassis !== "DK" && m.chassis !== "SO"
  );

  const hasModuleOnX = placedModules.some(m => 
    m.id !== selectedModule.id && 
    m.x === selectedModule.x + selectedModule.w && 
    m.y < selectedModule.y + selectedModule.h && 
    m.y + m.h > selectedModule.y &&
    m.chassis !== "DK" && m.chassis !== "SO"
  );

  const needsZWall = !hasModuleOnZ;
  const needsXWall = !hasModuleOnX;

  return (
    <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
      <div className="flex gap-2">
        <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">Walls needed for this end module:</p>
          <ul className="space-y-0.5 ml-2 list-disc text-blue-600">
            <li><strong>W & Y faces</strong> (front/back): horizontal walls</li>
            {needsZWall && <li><strong>Z face</strong> (left end): vertical end wall</li>}
            {needsXWall && <li><strong>X face</strong> (right end): vertical end wall</li>}
            {!needsZWall && <li className="opacity-50"><strong>Z face</strong>: has adjacent module</li>}
            {!needsXWall && <li className="opacity-50"><strong>X face</strong>: has adjacent module</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}