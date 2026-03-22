import React, { useRef, useState } from "react";
import { X, Upload, CheckCircle, AlertCircle, Plus, Loader2 } from "lucide-react";
import { ModuleEntry } from "@/lib/supabase";

// Strip extension from filename to get the code
const getCodeFromFilename = (filename) => filename.replace(/\.[^.]+$/, "").trim();

export default function BulkUploadModal({ onClose, existingModules, onDone }) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]); // { file, code, status: 'pending'|'uploading'|'done'|'error', isNew, message }
  const [processing, setProcessing] = useState(false);

  const handleFilePick = (e) => {
    const picked = Array.from(e.target.files);
    e.target.value = "";
    const items = picked.map((file) => {
      const code = getCodeFromFilename(file.name);
      const exists = existingModules.some(m => m.code === code);
      return { file, code, status: "pending", isNew: !exists, message: exists ? "Will update image" : "Will create new module + image" };
    });
    setFiles(items);
  };

  const handleProcess = async () => {
    setProcessing(true);

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "uploading" } : f));

      try {
        // Upload image
        const { file_url } = await base44.integrations.Core.UploadFile({ file: item.file });

        // If new module, create a ModuleEntry
        if (item.isNew) {
          await ModuleEntry.create({
            category: "Living",
            code: item.code,
            name: item.code,
            width: 3.0,
            depth: 4.8,
            description: "",
          });
        }

        // Save or update the floor plan image
        const existing = await base44.entities.FloorPlanImage.filter({ moduleType: item.code });
        if (existing.length > 0) {
          await base44.entities.FloorPlanImage.update(existing[0].id, { imageUrl: file_url });
        } else {
          await base44.entities.FloorPlanImage.create({ moduleType: item.code, imageUrl: file_url });
        }

        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "done", message: item.isNew ? "Created + image saved" : "Image updated" } : f));
      } catch (err) {
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "error", message: err.message || "Failed" } : f));
      }
    }

    setProcessing(false);
    onDone();
  };

  const allDone = files.length > 0 && files.every(f => f.status === "done" || f.status === "error");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-lg mx-4 shadow-xl flex flex-col" style={{ maxHeight: "85vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Bulk Upload Floor Plans</h2>
            <p className="text-xs text-gray-400 mt-0.5">Name each file with the module code (e.g. EU1550K.png)</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {files.length === 0 ? (
            <button
              onClick={() => inputRef.current.click()}
              className="w-full border-2 border-dashed border-gray-300 hover:border-[#F15A22] text-gray-400 hover:text-[#F15A22] transition-colors flex flex-col items-center justify-center gap-2 py-12"
            >
              <Upload size={24} />
              <span className="text-sm font-medium">Click to select images</span>
              <span className="text-xs">Multiple files supported · PNG, JPG, SVG</span>
            </button>
          ) : (
            <div className="space-y-2">
              {files.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 border border-gray-100 bg-gray-50">
                  {item.status === "uploading" && <Loader2 size={14} className="animate-spin text-[#F15A22] shrink-0" />}
                  {item.status === "done" && <CheckCircle size={14} className="text-green-500 shrink-0" />}
                  {item.status === "error" && <AlertCircle size={14} className="text-red-500 shrink-0" />}
                  {item.status === "pending" && (
                    item.isNew
                      ? <Plus size={14} className="text-blue-500 shrink-0" />
                      : <CheckCircle size={14} className="text-gray-300 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono font-bold text-gray-800 truncate">{item.code}</p>
                    <p className={`text-[11px] truncate ${item.status === "error" ? "text-red-500" : item.isNew ? "text-blue-500" : "text-gray-400"}`}>
                      {item.message}
                    </p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 font-medium shrink-0 ${item.isNew ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}>
                    {item.isNew ? "NEW" : "UPDATE"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {files.length > 0 && !processing && !allDone && (
            <button
              onClick={() => { setFiles([]); inputRef.current.click(); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Change files
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-600 border border-gray-200 hover:border-gray-400 transition-colors"
            >
              {allDone ? "Close" : "Cancel"}
            </button>
            {files.length > 0 && !allDone && (
              <button
                onClick={handleProcess}
                disabled={processing}
                className="px-4 py-2 text-xs bg-[#F15A22] text-white hover:bg-[#d94f1e] disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {processing && <Loader2 size={12} className="animate-spin" />}
                {processing ? "Processing..." : `Upload ${files.length} file${files.length !== 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        </div>

        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilePick} />
      </div>
    </div>
  );
}
