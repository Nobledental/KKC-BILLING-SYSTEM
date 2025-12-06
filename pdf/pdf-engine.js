/* ============================================================================
   KCC — PDF ENGINE FINAL (A4 • Offline • Tamil Footer)
============================================================================ */

async function exportPremiumPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });

  const hospital = await getHospitalSettings();
  const bill = collectBillData();

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  pdf.setFont("Times-Roman");

  /* HEADER */
  if (hospital.logo) {
    try {
      pdf.addImage(hospital.logo, "PNG", margin, y, 80, 80);
    } catch {}
  }

  pdf.setFontSize(20);
  pdf.text(hospital.name || "Krishna Kidney Centre", margin + 110, y + 20);

  pdf.setFontSize(11);
  (hospital.address || "").split("\n").forEach((line, i) =>
    pdf.text(line, margin + 110, y + 42 + i * 14)
  );

  pdf.text(`Phone: ${hospital.phone || ""}`, margin + 110, y + 92);
  pdf.text(`Email: ${hospital.email || ""}`, margin + 110, y + 108);

  y += 135;
  pdf.line(margin, y, pageWidth - margin, y);
  y += 25;

  /* BILL DETAILS */
  pdf.setFontSize(13);
  pdf.text("BILL DETAILS", margin, y);
  y += 18;

  pdf.setFontSize(11);
  pdf.text(`Bill No: ${bill.bill_no}`, margin, y);
  pdf.text(`Bill Date: ${bill.date}`, margin + 220, y);
  pdf.text(`Time: ${bill.time}`, margin + 380, y);

  y += 22;

  /* PATIENT */
  pdf.setFontSize(13);
  pdf.text("PATIENT DETAILS", margin, y);
  y += 18;

  pdf.setFontSize(11);
  pdf.text(`UHID: ${bill.patient_id}`, margin, y);
  pdf.text(`Name: ${bill.name}`, margin + 200, y);
  y += 18;

  pdf.text(`Age/Gender: ${bill.age} / ${bill.gender}`, margin, y);
  pdf.text(`Doctor: ${bill.doctor}`, margin + 200, y);
  y += 18;

  pdf.text(`DOA: ${bill.doa}`, margin, y);
  pdf.text(`DOD: ${bill.dod}`, margin + 200, y);
  y += 18;

  pdf.text(`Admission: ${bill.adm}`, margin, y);
  pdf.text(`Discharge: ${bill.dis}`, margin + 200, y);
  y += 30;

  pdf.line(margin, y, pageWidth - margin, y);
  y += 20;

  /* TABLE */
  const rows = bill.charges.map((c) => [
    c.desc,
    `₹${c.rate.toLocaleString("en-IN")}`,
    c.qty,
    `₹${(c.rate * c.qty).toLocaleString("en-IN")}`,
  ]);

  pdf.autoTable({
    startY: y,
    head: [["Description", "Rate", "Qty", "Total"]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 11 },
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [58, 123, 254],
      textColor: 255,
    },
    didDrawPage: drawFooter,
  });

  y = pdf.lastAutoTable.finalY + 20;

  /* SUMMARY */
  pdf.setFontSize(13);
  pdf.text("TOTAL SUMMARY", margin, y);
  y += 18;

  pdf.setFontSize(11);

  pdf.text(`Sub Total: ${bill.subtotal}`, margin, y);
  pdf.text(`Discount: ₹${bill.discount}`, margin + 220, y);

  y += 22;

  pdf.setFontSize(15);
  pdf.text(`Grand Total: ${bill.total}`, margin, y);

  y += 28;

  /* AMOUNT IN WORDS */
  const totalNum = parseInt(bill.total.replace(/[₹,]/g, ""));
  const words = inrToWords(totalNum);

  pdf.setFontSize(11);
  pdf.text(`Amount in Words: ${words}`, margin, y, {
    maxWidth: pageWidth - margin * 2,
  });

  pdf.save(`${bill.bill_no}.pdf`);
}

function drawFooter(pdf) {
  const h = pdf.internal.pageSize.getHeight();
  const cx = pdf.internal.pageSize.getWidth() / 2;

  pdf.setFont("Times-Roman");
  pdf.setFontSize(11);

  pdf.text("CLINIC TIMINGS", cx, h - 60, { align: "center" });
  pdf.text("பார்வை நுரை, காலை 9.00 – 9.00 மணியரை", cx, h - 40, { align: "center" });
  pdf.text("ஞாயிறு: முன்பதிவு மட்டும்", cx, h - 22, { align: "center" });
}
