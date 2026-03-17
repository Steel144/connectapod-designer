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
           img { max-width: 100%; height: auto; }
          h1 { margin: 0 0 6mm 0; font-size: 18pt; color: #F15A22; font-weight: bold; border-left: 3pt solid #F15A22; padding-left: 4mm; }
          h2 { margin: 8mm 0 4mm 0; font-size: 14pt; color: #1a1a1a; font-weight: bold; }
          p { color: #666; }
          table { width: 100%; border-collapse: collapse; font-size: 8pt; }
          th, td { border: 0.5pt solid #ddd; padding: 2.5mm; text-align: left; }
          th { background-color: #F15A22; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          tr:hover { background-color: #fff9f5; }
          .footer { margin-top: 8mm; padding-top: 4mm; border-top: 1.5pt solid #F15A22; font-size: 7pt; color: #666; }
          .footer-brand { color: #F15A22; font-weight: bold; }
        }
      `}</style>

      <div className="print-page">
        {/* Logo header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "6mm", paddingBottom: "4mm", borderBottom: "2pt solid #F15A22" }}>
          <span style={{ color: "#F15A22", fontWeight: "bold", fontSize: "20pt", letterSpacing: "0.04em" }}>connectapod</span>
          <span style={{ marginLeft: "8mm", color: "#666", fontSize: "12pt", fontWeight: "normal" }}>{title} Catalogue</span>
        </div>
        <p style={{ fontSize: "9pt", color: "#666", margin: "0 0 4mm 0" }}>
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
                    <th style={{ width: "10%" }}>Thumbnail</th>
                    <th style={{ width: "12%" }}>Code</th>
                    <th style={{ width: "40%" }}>Name</th>
                    <th style={{ width: "14%" }}>Specs</th>
                    <th style={{ width: "24%" }}>Variants</th>
                  </tr>
                </thead>
                <tbody>
                  {category.items.map((item, i) => (
                    <tr key={i}>
                      <td style={{ padding: "1.5mm", textAlign: "center" }}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.code} style={{ maxHeight: "20mm", maxWidth: "15mm", objectFit: "contain" }} />
                        ) : (
                          <div style={{ fontSize: "7pt", color: "#999" }}>—</div>
                        )}
                      </td>
                      <td style={{ fontWeight: "bold", fontSize: "8pt" }}>
                        {item.code}
                      </td>
                      <td>{item.name}</td>
                      <td style={{ fontSize: "8pt" }}>
                        {item.specs || "—"}
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

        <div className="footer" style={{ borderTop: "1.5pt solid #F15A22" }}>
          <p style={{ margin: 0 }}>
            <span style={{ color: "#F15A22", fontWeight: "bold" }}>connectapod</span> · {title} Catalogue · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}