import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function PrintSiteMapModal({ open, onOpenChange, mapContainerRef, siteAddress, saveDetails }) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('site-plan');

  const handlePrint = async () => {
    if (!mapContainerRef?.current) return;
    
    setLoading(true);
    try {
      // Capture the map container
      const canvas = await html2canvas(mapContainerRef.current, {
        allowTaint: true,
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 297; // A4 landscape width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Add header info
      pdf.setFontSize(12);
      pdf.text('SITE PLAN', 14, 10);
      
      if (saveDetails?.projectName) {
        pdf.setFontSize(10);
        pdf.text(`Project: ${saveDetails.projectName}`, 14, 18);
      }
      
      if (siteAddress) {
        pdf.setFontSize(10);
        pdf.text(`Site Address: ${siteAddress}`, 14, 25);
      }

      // Download
      pdf.save(`${fileName}.pdf`);
      onOpenChange(false);
    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Print Site Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700 block mb-2">File Name</Label>
            <Input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="site-plan"
              className="text-sm"
            />
          </div>
          {siteAddress && (
            <div>
              <Label className="text-sm font-semibold text-gray-700 block mb-2">Site Address</Label>
              <p className="text-sm text-gray-600">{siteAddress}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded hover:border-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-[#F15A22] text-white rounded hover:bg-[#d94e1a] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}