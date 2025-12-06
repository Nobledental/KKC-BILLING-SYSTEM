/* ============================================================================
   KRISHNA KIDNEY CENTRE — PDF ENGINE (FINAL PRODUCTION • A4 PREMIUM)
   ✔ jsPDF UMD (window.jspdf.jsPDF)
   ✔ AutoTable layout
   ✔ Tamil footer
   ✔ Amount in words
   ✔ Fully synced with collectBillData()
============================================================================ */

async function exportPremiumPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "pt", format: "a4" });

  const hospital = await getHospitalSettings();
  const bill = collectBillData();

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  pdf.setFont("Times-Roman");

  /* ============================================================================
       HEADER — HOSPITAL LOGO + DETAILS
  ============================================================================ */

  if (hospital.logo) {
    try {
      pdf.addImage(hospital.logo, "PNG", margin, y, 80, 80);
    } catch (e) {
      console.warn("Logo draw error:", e);
    }
  }

  pdf.setFontSize(20);
  pdf.text(hospital.name || "Krishna Kidney Centre", margin + 110, y + 15);

  pdf.setFontSize(11);

  const addr = (hospital.address || "").split("\n");
  addr.forEach((line, i) => {
    pdf.text(line, margin + 110, y + 40 + i * 14);
  });

  pdf.text(`Phone: ${hospital.phone || ""}`, margin + 110, y + 95);
  pdf.text(`Email: ${hospital.email || ""}`, margin + 110, y + 110);

  y += 130;
  pdf.setLineWidth(0.8);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 25;

  /* ============================================================================
       BILL DETAILS
  ============================================================================ */
  pdf.setFontSize(13);
  pdf.text("BILL DETAILS", margin, y);
  y += 18;

  pdf.setFontSize(11);
  pdf.text(`Bill No: ${bill.bill_no}`, margin, y);
  pdf.text(`Bill Date: ${bill.date}`, margin + 200, y);
  pdf.text(`Time: ${bill.time}`, margin + 380, y);
  y += 20;

  /* ============================================================================
       PATIENT DETAILS
  ============================================================================ */
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

  /* ============================================================================
       CHARGES TABLE — AutoTable
  ============================================================================ */
  const tableData = bill.charges.map((row) => [
    row.desc,
    "₹" + Number(row.rate).toLocaleString("en-IN"),
    row.qty,
    "₹" + (row.rate * row.qty).toLocaleString("en-IN"),
  ]);

  pdf.autoTable({
    startY: y,
    head: [["Description", "Rate", "Qty", "Amount"]],
    body: tableData,
    theme: "grid",
    styles: { fontSize: 11 },
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [58, 123, 254],
      textColor: 255,
      halign: "left"
    },
    didDrawPage: (data) => drawFooter(pdf)
  });

  let finalY = pdf.lastAutoTable.finalY + 30;

  /* ============================================================================
       TOTAL SUMMARY
  ============================================================================ */
  pdf.setFontSize(13);
  pdf.text("TOTAL SUMMARY", margin, finalY);
  finalY += 18;

  pdf.setFontSize(11);
  pdf.text(`Sub Total: ${bill.subtotal}`, margin, finalY);
  pdf.text(`Discount: ${bill.discount}`, margin + 200, finalY);
  finalY += 22;

  pdf.setFontSize(15);
  pdf.text(`Grand Total: ${bill.total}`, margin, finalY);
  finalY += 30;

  /* ============================================================================
       AMOUNT IN WORDS
  ============================================================================ */
  const numericTotal = parseInt(bill.total.replace(/[₹,]/g, ""));
  const words = amountInWords(numericTotal);

  pdf.setFontSize(11);
  pdf.text(`Amount in Words: ${words}`, margin, finalY, {
    maxWidth: pageWidth - margin * 2,
  });

  /* ============================================================================
       FINAL SAVE
  ============================================================================ */
  pdf.save(`${bill.bill_no}.pdf`);
}

/* ============================================================================
   FOOTER — Tamil footer
============================================================================ */
function drawFooter(pdf) {
  const h = pdf.internal.pageSize.getHeight();
  const cx = pdf.internal.pageSize.getWidth() / 2;

  pdf.setFontSize(11);
  pdf.setTextColor(60, 60, 60);

  pdf.text("CLINIC TIMINGS", cx, h - 60, { align: "center" });
  pdf.text("பார்வை நுரை, காலை 9.00 – 9.00 மணியரை", cx, h - 40, { align: "center" });
  pdf.text("ஞாயிறு: முன்பதிவு மட்டும்", cx, h - 22, { align: "center" });
}

/* ============================================================================
   COLLECT DATA FROM UI (Used by both preview + PDF)
============================================================================ */
function collectBillData() {
  return {
    bill_no: $("bill_no").value,
    patient_id: $("patient_id").value,

    name: $("p_name").value,
    age: $("p_age").value,
    gender: $("p_gender").value,
    doctor: $("p_doctor").value,

    doa: $("p_doa").value,
    dod: $("p_dod").value,
    adm: $("p_adm_time").value,
    dis: $("p_dis_time").value,

    date: $("bill_date").value,
    time: $("bill_time").value,

    subtotal: $("subTotal").textContent,
    discount: $("discount_amount").value,
    total: $("grandTotal").textContent,

    charges: qsa("#chargesTable tbody tr").map((r) => ({
      desc: r.querySelector(".desc").value,
      rate: Number(r.querySelector(".rate").value),
      qty: Number(r.querySelector(".qty").value),
    })),
  };
}

/* ============================================================================
   GET HOSPITAL SETTINGS (IndexedDB)
============================================================================ */
function getHospitalSettings() {
  return new Promise((resolve) => {
    const req = indexedDB.open("KCC_Billing_DB_V4", 7);

    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("settings", "readonly");
      const store = tx.objectStore("settings");

      store.get("hospital").onsuccess = (e) =>
        resolve(e.target.result || {});
    };
  });
}
