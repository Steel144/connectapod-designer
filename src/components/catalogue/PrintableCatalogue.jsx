import React, { useEffect } from "react";

export default function PrintableCatalogue({ title, categories, onClose }) {
  useEffect(() => {
    setTimeout(() => window.print(), 300);
    const handleAfterPrint = () => onClose?.();
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, [onClose]);

  return (
    <div className="p-8 bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { margin: 0; padding: 0; }
          .print-page { page-break-after: always; padding-bottom: 20mm; }
          .print-page:last-child { page-break-after: avoid; }
          .no-print { display: none; }
          h1 { margin: 0 0 6mm 0; font-size: 24pt; }
          h2 { margin: 8mm 0 4mm 0; font-size: 16pt; }
          table { width: 100%; border-collapse: collapse; font-size: 8pt; }
          th, td { border: 0.5pt solid #ccc; padding: 2mm; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          tr:nth-child(even) { background-color: #fafafa; }
          .footer { margin-top: 8mm; padding-top: 4mm; border-top: 0.5pt solid #ccc; font-size: 7pt; color: #666; }
        }
      `}</style>

      <div className="print-page">
        <h1 style={{ marginBottom: "8mm" }}>{title} – Printable Catalogue</h1>
        <p style={{ fontSize: "10pt", color: "#666", margin: "0 0 4mm 0" }}>
          Generated: {new Date().toLocaleDateString()} | Total items: {
            categories.reduce((sum, cat) => sum + (cat.items?.length || 0), 0)
          }
        </p>

        {categories.map((category, idx) => (
          <div key={idx} style={{ marginBottom: "12mm" }}>
            <h2 style={{ marginBottom: "2mm" }}>{category.name}</h2>
            {category.description && (
              <p style={{ fontSize: "9pt", color: "#666", margin: "0 0 3mm 0" }}>
                {category.description}
              </p>
            )}

            {category.items && category.items.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "15%" }}>Code</th>
                    <th style={{ width: "30%" }}>Name</th>
                    <th style={{ width: "15%" }}>Specs</th>
                    <th style={{ width: "25%" }}>Description</th>
                    <th style={{ width: "15%" }}>Variants</th>
                  </tr>
                </thead>
                <tbody>
                  {category.items.map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: "bold", fontSize: "8pt" }}>
                        {item.code}
                      </td>
                      <td>{item.name}</td>
                      <td style={{ fontSize: "8pt" }}>
                        {item.specs || "—"}
                      </td>
                      <td style={{ fontSize: "8pt" }}>
                        {item.description || "—"}
                      </td>
                      <td style={{ fontSize: "7pt" }}>
                        {item.variants?.length > 0 ? `${item.variants.length} variant${item.variants.length !== 1 ? "s" : ""}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: "9pt", color: "#999", fontStyle: "italic" }}>
                No items in this category
              </p>
            )}
          </div>
        ))}

        <div className="footer">
          <p style={{ margin: 0 }}>
            © connectapod · {title}
          </p>
        </div>
      </div>
    </div>
  );
}