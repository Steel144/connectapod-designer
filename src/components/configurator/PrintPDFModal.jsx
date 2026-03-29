import React, { useState, useRef, useEffect } from "react";
import { X, Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const LOGO_URL = "https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/201470147_ConnectapodArchLogo-01.png";

/**
 * Generic PDF modal — renders children as hidden pages, captures them with html2canvas,
 * shows a preview of each page, and downloads as a multi-page A3 landscape PDF.
 *
 * Props:
 *  - title: string           — sheet title shown in header
 *  - printDetails: object    — { projectName, clientName, address }
 *  - onClose: fn
 *  - pages: Array<{ content: ReactNode, sheet: string, pageNum: number, totalPages: number }>
 */
export default function PrintPDFModal({ title, printDetails = {}, onClose, pages = [] }) {
  const [generating, setGenerating] = useState(false);
  const [previewPage, setPreviewPage] = useState(0);
  const [pageImages, setPageImages] = useState([]);
  const pagesRef = useRef([]);

  // Capture all hidden pages after mount
  useEffect(() => {
    const capture = async () => {
      const imgs = [];
      for (let i = 0; i < pagesRef.current.length; i++) {
        const el = pagesRef.current[i];
        if (!el) continue;
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: false,
          allowTaint: false,
          logging: false,
          backgroundColor: "#ffffff",
          imageTimeout: 0,
        });
        imgs.push(canvas.toDataURL("image/png"));
      }
      setPageImages(imgs);
    };
    // Small delay to allow images inside the hidden pages to load
    const t = setTimeout(capture, 800);
    return () => clearTimeout(t);
  }, [pages]);

  const handleDownload = async () => {
    if (pageImages.length === 0) return;
    setGenerating(true);
    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pageImages.length; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(pageImages[i], "PNG", 0, 0, pw, ph);
      }

      pdf.save(`${title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  const currentImage = pageImages[previewPage];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
      {/* Hidden render area — pages rendered off-screen for capture */}
      <div style={{ position: "fixed", top: 0, left: "-9999px", width: "1122px" }}>
        {pages.map((page, i) => (
          <div
            key={i}
            ref={el => { pagesRef.current[i] = el; }}
            style={{
              width: "1122px",
              height: "794px",
              background: "white",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              fontFamily: "sans-serif",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 8px", borderBottom: "3px solid #F15A22", flexShrink: 0 }}>
              <img src={LOGO_URL} alt="Connectapod" crossOrigin="anonymous" style={{ height: "56px", width: "auto" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#F15A22", fontSize: "13px", fontWeight: "600" }}>www.connectapod.co.nz</div>
                <div style={{ color: "#888", fontSize: "11px" }}>hello@connectapod.co.nz · 022 396 2657</div>
              </div>
              <span style={{ color: "#888", fontSize: "22px", fontWeight: "700" }}>{page.sheet || title}</span>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "hidden", padding: "12px 20px" }}>
              {page.content}
            </div>

            {/* Footer */}
            <div style={{ flexShrink: 0, borderTop: "4px solid #F15A22", display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr", fontSize: "10px" }}>
              <div style={{ borderRight: "1px solid #F15A22", padding: "5px 14px" }}>
                <p style={{ fontWeight: "bold", textTransform: "uppercase", color: "#F15A22", fontSize: "8px" }}>Project</p>
                <p style={{ marginTop: "2px", color: "#333", fontWeight: "600", fontSize: "13px" }}>{printDetails.projectName || "—"}</p>
              </div>
              <div style={{ borderRight: "1px solid #F15A22", padding: "5px 14px" }}>
                <p style={{ fontWeight: "bold", textTransform: "uppercase", color: "#F15A22", fontSize: "8px" }}>Client</p>
                <p style={{ marginTop: "2px", color: "#333", fontSize: "10px" }}>{printDetails.clientName || "—"}</p>
                {printDetails.address && <p style={{ marginTop: "1px", color: "#666", fontSize: "8px" }}>{printDetails.address}</p>}
              </div>
              <div style={{ borderRight: "1px solid #F15A22", padding: "5px 14px" }}>
                <p style={{ fontWeight: "bold", textTransform: "uppercase", color: "#F15A22", fontSize: "8px" }}>Sheet</p>
                <p style={{ marginTop: "2px", color: "#666", fontSize: "10px" }}>{page.sheet || title}</p>
              </div>
              <div style={{ borderRight: "1px solid #F15A22", padding: "5px 14px" }}>
                <p style={{ fontWeight: "bold", textTransform: "uppercase", color: "#F15A22", fontSize: "8px" }}>Date</p>
                <p style={{ marginTop: "2px", color: "#666", fontSize: "10px" }}>{new Date().toLocaleDateString("en-NZ")}</p>
              </div>
              <div style={{ padding: "5px 14px" }}>
                <p style={{ fontWeight: "bold", textTransform: "uppercase", color: "#F15A22", fontSize: "8px" }}>Page</p>
                <p style={{ marginTop: "2px", color: "#666", fontSize: "10px" }}>{page.pageNum} / {page.totalPages}</p>
                <p style={{ marginTop: "3px", color: "#000", fontSize: "7px", fontWeight: "600" }}>© {new Date().getFullYear()} Connectapod Ltd.</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <div className="bg-white rounded-lg shadow-2xl flex flex-col relative" style={{ width: "92vw", height: "92vh", maxWidth: "1400px" }}>
        {/* Close */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10 text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow">
          <X size={18} />
        </button>

        {/* Preview area */}
        <div className="flex-1 overflow-auto bg-gray-200 flex items-center justify-center p-6">
          {pageImages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#F15A22]" />
              <p className="text-sm">Generating preview…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full">
              <img
                src={currentImage}
                alt={`Page ${previewPage + 1}`}
                className="shadow-xl bg-white"
                style={{ maxWidth: "100%", maxHeight: "calc(92vh - 180px)", objectFit: "contain" }}
              />
              {pageImages.length > 1 && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <button
                    onClick={() => setPreviewPage(p => Math.max(0, p - 1))}
                    disabled={previewPage === 0}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span>Page {previewPage + 1} of {pageImages.length}</span>
                  <button
                    onClick={() => setPreviewPage(p => Math.min(pageImages.length - 1, p + 1))}
                    disabled={previewPage === pageImages.length - 1}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-gray-200 bg-gray-50 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={generating || pageImages.length === 0}
            className="px-4 py-2 text-sm bg-[#F15A22] text-white rounded hover:bg-[#d94e1a] disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF {pageImages.length > 1 ? `(${pageImages.length} pages)` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}