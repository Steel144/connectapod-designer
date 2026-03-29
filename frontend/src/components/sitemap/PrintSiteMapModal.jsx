import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function PrintSiteMapModal({ open, onOpenChange, mapContainerRef, siteAddress, saveDetails }) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('site-plan');

  const handlePrint = async () => {
    setLoading(true);
    try {
      // Screenshot the actual visible map container
      const canvas = await html2canvas(mapContainerRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: false,
        foreignObjectRendering: false,
        ignoreElements: (el) => el.classList?.contains('sitemap-control-panel'),
      });
      const screenshotDataUrl = canvas.toDataURL('image/png');

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Orange title block
      pdf.setFillColor(241, 90, 34);
      pdf.rect(0, 0, pageWidth, 18, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.text('SITE PLAN', 10, 12);

      if (siteAddress) {
        pdf.setFontSize(8);
        const lines = pdf.splitTextToSize(siteAddress, pageWidth - 60);
        pdf.text(lines, pageWidth / 2, 8, { align: 'center' });
      }

      if (saveDetails?.projectName) {
        pdf.setFontSize(8);
        pdf.text(`Project: ${saveDetails.projectName}`, pageWidth - 10, 12, { align: 'right' });
      }

      // Map image fills remaining space
      const imgY = 20;
      const imgH = pageHeight - imgY - 8;
      const imgW = pageWidth - 20;
      pdf.addImage(screenshotDataUrl, 'PNG', 10, imgY, imgW, imgH);

      // Footer
      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated: ${new Date().toLocaleString('en-NZ')}`, pageWidth / 2, pageHeight - 2, { align: 'center' });

      pdf.save(`${fileName}.pdf`);
      onOpenChange(false);
    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to generate PDF: ' + error.message);
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
          <p className="text-xs text-gray-400">This will capture the map exactly as displayed on screen.</p>
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
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Download className="w-4 h-4" />Download PDF</>}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}