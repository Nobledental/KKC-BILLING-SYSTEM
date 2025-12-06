/* ============================================================================
   PDF ENGINE — FINAL VERSION
============================================================================ */

async function exportPremiumPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });

  const bill = collectBillData();
  const hospital = await getHospitalSettings();

  let y = 40;
  const margin = 40;
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFont("Times-Roman");

  /* ================= HEADER ================= */
  if (hospital.logo) {
    try {
      pdf.addImage(hospital.logo, "PNG", margin, y, 80, 80);
    } catch {}
  }

  pdf.setFontSize(20);
  pdf.text(hospital.name || "Krishna Kidney Centre", margin + 110, y + 18);

  pdf.setFontSize(11);
  (hospital.address || "").split("\n").forEach((line, i) => {
    pdf.text(line, margin + 110, y + 42 + i * 14);
  });

  pdf.text(`Phone: ${hospital.phone || ""}`, margin + 110, y + 90);
  pdf.text(`Email: ${hospital.email || ""}`, margin + 110, y + 106);

  y += 130;
  pdf.line(margin, y, pageWidth - margin, y);
  y += 25;

  /* ================= BILL DETAILS ================= */
  pdf.setFontSize(13);
  pdf.text("BILL DETAILS", margin, y);
  y += 18;

  pdf.setFontSize(11);
  pdf.text(`Bill No: ${bill.bill_no}`, margin, y);
  pdf.text(`Bill Date: ${bill.date}`, margin + 200, y);
  pdf.text(`Time: ${bill.time}`, margin + 380, y);
  y += 22;

  /* ================= PATIENT ================= */
  pdf.setFontSize(13);
  pdf.text("PATIENT DETAILS", margin, y);
  y += 18;

  pdf.setFontSize(11);
  pdf.text(`UHID: ${bill.patient_id}`, margin, y);
  pdf.text(`Patient Name: ${bill.name}`, margin + 200, y);
  y += 18;

  pdf.text(`Age / Gender: ${bill.age} / ${bill.gender}`, margin, y);
  pdf.text(`Doctor: ${bill.doctor}`, margin + 200, y);
  y += 18;

  pdf.text(`Date of Admission: ${bill.doa}`, margin, y);
  pdf.text(`Date of Discharge: ${bill.dod}`, margin + 200, y);
  y += 18;

  pdf.text(`Admission Time: ${bill.adm}`, margin, y);
  pdf.text(`Discharge Time: ${bill.dis}`, margin + 200, y);
  y += 30;

  pdf.line(margin, y, pageWidth - margin, y);
  y += 20;

  /* ================= TABLE ================= */
  const rows = bill.charges.map(row => ([
    row.desc,
    "₹" + row.rate.toLocaleString("en-IN"),
    row.qty,
    "₹" + (row.rate * row.qty).toLocaleString("en-IN")
  ]));

  pdf.autoTable({
    startY: y,
    head: [["Description", "Rate", "Qty", "Total"]],
    body: rows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 11 },
    headStyles: { fillColor: [58, 123, 254], textColor: 255 },
    didDrawPage: () => drawFooter(pdf)
  });

  const finalY = pdf.lastAutoTable.finalY + 30;

  /* ================= TOTALS ================= */
  pdf.setFontSize(13);
  pdf.text("TOTAL SUMMARY", margin, finalY);

  pdf.setFontSize(11);
  pdf.text(`Sub Total: ${bill.subtotal}`, margin, finalY + 20);
  pdf.text(`Discount: ${bill.discount}`, margin + 200, finalY + 20);

  pdf.setFontSize(15);
  pdf.text(`Grand Total: ${bill.total}`, margin, finalY + 45);

  /* ================= WORDS ================= */
  const num = parseInt(bill.total.replace(/[₹,]/g,
