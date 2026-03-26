import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function PrintSiteMapModal({ open, onOpenChange, mapContainerRef, siteAddress, saveDetails, floorPlanImage }) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('site-plan');

  const handlePrint = async () => {
    setLoading(true);
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Orange title block
      pdf.setFillColor(245, 90, 34);
      pdf.rect(0, 0, pageWidth, 45, 'F');

      // White title text
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.text('SITE PLAN', pageWidth / 2, 20, { align: 'center' });

      // Project details
      pdf.setFontSize(11);
      let detailY = 32;
      
      if (saveDetails?.projectName) {
        pdf.text(`Project: ${saveDetails.projectName}`, 14, detailY);
        detailY += 7;
      }
      
      if (siteAddress) {
        const addressText = `Address: ${siteAddress}`;
        const maxWidth = pageWidth - 28;
        const lines = pdf.splitTextToSize(addressText, maxWidth);
        pdf.text(lines, 14, detailY);
      }

      // Add floor plan image if available
      if (floorPlanImage) {
        const imgWidth = pageWidth - 28;
        const imgHeight = (imgWidth / 16) * 9; // 16:9 aspect ratio
        const imgY = 50;
        pdf.addImage(floorPlanImage, 'PNG', 14, imgY, imgWidth, imgHeight);
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated: ${new Date().toLocaleString('en-NZ')}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

      pdf.save(`${fileName}.pdf`);
      onOpenChange(false);
    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to generate PDF');
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