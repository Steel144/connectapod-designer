import React, { useRef } from "react";
import { X } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function PrintSiteMapModal({ onClose, placedModules, walls, siteAddress }) {
  const contentRef = useRef(null);

  const handlePrint = async () => {
    if (!contentRef.current) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a3",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save("site-plan.pdf");
    } catch (err) {
      console.error("Print failed:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-2xl w-11/12 h-5/6 flex flex-col max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Site Plan Print Preview</h2>
            {siteAddress && <p className="text-xs text-gray-500 mt-1">{siteAddress}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          <div
            ref={contentRef}
            className="bg-white mx-auto p-8 shadow-sm"
            style={{
              width: "1200px",
              minHeight: "800px",
              fontFamily: '"Chakra Petch", sans-serif',
            }}
          >
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Site Plan</h1>
              {siteAddress && (
                <p className="text-sm text-gray-600">Location: {siteAddress}</p>
              )}
              <p className="text-sm text-gray-600">
                Modules: {placedModules.length} | Walls: {walls.length}
              </p>
            </div>

            <div className="border-2 border-gray-300 bg-gray-50 p-8 text-center text-gray-500 min-h-96 flex items-center justify-center">
              <div>
                <p className="text-lg font-semibold mb-2">Site Map Overlay</p>
                <p className="text-sm">Map visualization would render here</p>
                <p className="text-xs mt-4 text-gray-400">
                  Print with site map view active to capture the live map
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <p className="font-semibold text-gray-700 mb-2">Design Summary</p>
                <p>Modules placed: {placedModules.length}</p>
                <p>Walls placed: {walls.length}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-2">Site Info</p>
                {siteAddress ? (
                  <p>Address: {siteAddress}</p>
                ) : (
                  <p className="text-gray-400">No site address set</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm bg-[#F15A22] text-white rounded hover:bg-[#d94e1a] transition-colors"
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}