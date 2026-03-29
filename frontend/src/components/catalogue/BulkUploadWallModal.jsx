import React, { useState, useRef } from "react";
import { X, Upload, Loader2, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BulkUploadWallModal({ onClose, onDone }) {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef();

  const handleFilePick = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    const fileItems = await Promise.all(
      selectedFiles.map(async (file) => {
        const code = file.name.replace(/\.(png|jpg|jpeg|svg)$/i, "");
        
        // Check if wall exists by listing all and filtering
        const allWalls = await base44.entities.WallEntry.list();
        const existing = allWalls.filter(w => w.code === code);
        
        return {
          file,
          code,
          status: "pending",
          isNew: existing.length === 0,
          message: existing.length === 0 ? "Will create new wall" : "Will update image only"
        };
      })
    );

    setFiles(fileItems);
  };

  const handleUpload = async () => {
    if (!files.length || processing) return;
    setProcessing(true);

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "uploading", message: "Uploading..." } : f));

      try {
        console.log(`[Upload] Processing ${item.code}...`);
        
        // Upload the file
        const uploadResult = await base44.integrations.Core.UploadFile({ file: item.file });
        const { file_url } = uploadResult;
        console.log(`[Upload] File uploaded: ${file_url}`);

        // If new wall, create a WallEntry
        if (item.isNew) {
          console.log(`[Upload] Creating new wall entry for ${item.code}`);
          await base44.entities.WallEntry.create({
            code: item.code,
            name: item.code,
            width: 3000,
            height: 2400,
            price: 2500,
            description: "",
            variants: ["Standard"],
          });
        }

        // Save or update the wall image
        console.log(`[Upload] Checking for existing wall image...`);
        const allImages = await base44.entities.WallImage.list();
        const existing = allImages.filter(img => img.wallType === item.code);
        
        if (existing.length > 0) {
          console.log(`[Upload] Updating existing wall image ${existing[0].id}`);
          await base44.entities.WallImage.update(existing[0].id, { imageUrl: file_url });
        } else {
          console.log(`[Upload] Creating new wall image`);
          await base44.entities.WallImage.create({ wallType: item.code, imageUrl: file_url });
        }

        console.log(`[Upload] Success for ${item.code}`);
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: "done", message: item.isNew ? "Created + image saved" : "Image updated" } : f));
      } catch (err) {
        console.error(`[Upload] Error for ${item.code}:`, err);
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
            <h2 className="text-sm font-bold text-gray-900">Bulk Upload Wall Elevations</h2>
            <p className="text-xs text-gray-400 mt-0.5">Name each file with the wall code (e.g. WY30-B-500.png)</p>
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
          {files.length > 0 ? (
            <>
              <p className="text-xs text-gray-400">
                {files.filter(f => f.isNew).length} new · {files.filter(f => !f.isNew).length} updates
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('[BulkUpload] Upload button clicked!', { files: files.length, processing });
                    handleUpload();
                  }}
                  disabled={processing || allDone}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-[#F15A22] hover:bg-[#D14A1A] disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {processing ? "Uploading..." : allDone ? "Done" : `Upload ${files.length} file${files.length > 1 ? "s" : ""}`}
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400">No files selected</p>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml"
          multiple
          onChange={handleFilePick}
          className="hidden"
        />
      </div>
    </div>
  );
}
