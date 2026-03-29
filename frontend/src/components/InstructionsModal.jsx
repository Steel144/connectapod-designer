import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X } from "lucide-react";

const TUTORIAL_SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    content: (
      <div className="space-y-4">
        <h3 className="font-semibold text-base text-gray-900">Welcome to Connectapod Designer</h3>
        <p className="text-sm text-gray-700">
          This tool lets you design custom modular buildings by dragging and dropping modules onto a grid, adding walls, furniture, and generating estimates.
        </p>
        <div className="bg-orange-50 border border-orange-200 rounded p-3 mt-4">
          <p className="text-sm text-orange-900">
            <strong>💡 Tip:</strong> You can undo changes at any time using the Undo button or Ctrl+Z.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "basics",
    title: "Configurator Basics",
    content: (
      <div className="space-y-4">
        <h3 className="font-semibold text-base text-gray-900">How to Use the Configurator</h3>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm text-gray-800">1. Browse Modules</h4>
            <p className="text-sm text-gray-700 mt-1">
              On the left panel, expand categories to view available modules. Modules are grouped by size (largest to smallest).
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-800">2. Place Modules</h4>
            <p className="text-sm text-gray-700 mt-1">
              Drag a module from the library onto the grid. Modules will snap to the nearest grid position automatically.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-800">3. Add Walls</h4>
            <p className="text-sm text-gray-700 mt-1">
              Select a module, then click a face (W, X, Y, Z) to see compatible wall options. Choose a wall to attach it.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-800">4. Arrange Furniture</h4>
            <p className="text-sm text-gray-700 mt-1">
              Drag furniture items from the Furniture section to place them inside your design.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "workflow",
    title: "Design Workflow",
    content: (
      <div className="space-y-4">
        <h3 className="font-semibold text-base text-gray-900">Complete Workflow</h3>
        <div className="space-y-3">
          <div className="bg-gray-50 rounded p-3">
            <h4 className="font-medium text-sm text-gray-800">Step 1: Design</h4>
            <p className="text-sm text-gray-700 mt-1">Build your layout using modules, walls, and furniture.</p>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <h4 className="font-medium text-sm text-gray-800">Step 2: Review</h4>
            <p className="text-sm text-gray-700 mt-1">
              Check the summary panel on the right for total area (m²) and estimated cost. Switch to Elevations to see wall views.
            </p>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <h4 className="font-medium text-sm text-gray-800">Step 3: Save</h4>
            <p className="text-sm text-gray-700 mt-1">Click the Save button to store your design. You can load saved designs anytime.</p>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <h4 className="font-medium text-sm text-gray-800">Step 4: Get Estimate</h4>
            <p className="text-sm text-gray-700 mt-1">
              Click "Get Estimate" to enter project details and generate a downloadable PDF quote.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "best-practices",
    title: "Design Best Practices",
    content: (
      <div className="space-y-4">
        <h3 className="font-semibold text-base text-gray-900">Tips for Great Designs</h3>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm text-gray-800">✓ Start with the largest modules</h4>
            <p className="text-sm text-gray-700 mt-1">
              Begin your layout with bigger modules to establish the structure, then add smaller complementary pieces.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-800">✓ Use consistent wall types</h4>
            <p className="text-sm text-gray-700 mt-1">
              Try to use the same wall type across connected modules for a cohesive appearance.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-800">✓ Check elevations</h4>
            <p className="text-sm text-gray-700 mt-1">
              Switch to Elevations view to verify your wall selections look good from the outside.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-800">✓ Leave at least one end open</h4>
            <p className="text-sm text-gray-700 mt-1">
              End modules need at least one open side for structural integrity.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-800">✓ Test different layouts</h4>
            <p className="text-sm text-gray-700 mt-1">
              Save multiple versions of your design to compare different configurations.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "features",
    title: "Key Features",
    content: (
      <div className="space-y-4">
        <h3 className="font-semibold text-base text-gray-900">Feature Guide</h3>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm text-gray-800">2D Grid View</h4>
            <p className="text-sm text-gray-700 mt-1">Top-down layout editor with drag-and-drop placement and snapping.</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-800">Elevations View</h4>
            <p className="text-sm text-gray-700 mt-1">See how your building looks from all sides (W, X, Y, Z faces).</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-800">Design Summary</h4>
            <p className="text-sm text-gray-700 mt-1">Real-time calculations of total area, module count, and estimated price.</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-800">My Designs</h4>
            <p className="text-sm text-gray-700 mt-1">View and load all your saved designs from one place.</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-800">Print & Export</h4>
            <p className="text-sm text-gray-700 mt-1">Generate PDF floor plans and elevation drawings for your projects.</p>
          </div>
        </div>
      </div>
    ),
  },
];

export default function InstructionsModal({ open, onClose }) {
  const [currentSection, setCurrentSection] = useState(0);

  const section = TUTORIAL_SECTIONS[currentSection];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>How to Use Connectapod Designer</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {/* Section Content */}
          <div className="mb-8">{section.content}</div>

          {/* Progress Indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {TUTORIAL_SECTIONS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSection(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentSection ? "bg-[#F15A22] w-6" : "bg-gray-300 hover:bg-gray-400"
                }`}
                title={TUTORIAL_SECTIONS[idx].title}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
              disabled={currentSection === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <span className="text-xs text-gray-500">
              {currentSection + 1} of {TUTORIAL_SECTIONS.length}
            </span>

            {currentSection === TUTORIAL_SECTIONS.length - 1 ? (
              <Button onClick={onClose} className="bg-[#F15A22] hover:bg-[#d94e1a]">
                Got it, let's go!
              </Button>
            ) : (
              <button
                onClick={() => setCurrentSection(Math.min(TUTORIAL_SECTIONS.length - 1, currentSection + 1))}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#F15A22] rounded hover:bg-[#d94e1a] transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}