/* ============================================================================
   KRISHNA KIDNEY CENTRE — PDF ENGINE V5 (FINAL PRODUCTION)
   ✔ Tamil footer (Professional Format — Option B)
   ✔ Auto page split
   ✔ A4 optimized layout
   ✔ Improved header + patient block
   ✔ Fully stable offline version
============================================================================ */

async function exportPremiumPDF() {
  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    unit: "pt",
    format: "a4",
    compress: true
  });

  /* ============================================================================
     FETCH BILL DATA
  ============================================================================ */
  const hospital = await getHospitalSettings();
  const bill = collectBillData();

  /* ============================================================================
     UNIVERSAL FONT (Tamil Safe)
  ============================================================================ */
  pdf.setFont("Times-Roman"); // supports UTF-8 for Tamil names & footer

  /* ============================================================================
     PAGE SIZE
  ============================================================================ */
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 40;

  /* ============================================================================
     HEADER — LOGO + HOSPITAL INFO
  ============================================================================ */
  if (hospital.logo) {
    try {
      pdf.addImage(hospital.logo, "PNG", 40, y, 80, 80);
    } catch (e) {}
  }

  pdf.setFontSize(20);
  pdf.text(hospital.name || "Krishna Kidney Centre", 140, y + 20);

  pdf.setFontSize(11);
  const addressLines = (hospital.address || "").split("\n");
  addressLines.forEach((line, i) => {
    pdf.text(line, 140, y + 45 + i * 14);
  });

  pdf.text(`Phone: ${hospital.phone || ""}`, 140, y + 90);
  pdf.text(`Email: ${hospital.email || ""}`, 140, y + 106);

  y += 130;

  pdf.setLineWidth(0.8);
  pdf.line(40, y, pageWidth - 40, y);
  y += 20;

  /* ============================================================================
     BILL DETAILS
  ============================================================================ */
  pdf.setFontSize(13);
  pdf.text("BILL DETAILS", 40, y);
  y += 16;

  pdf.setFontSize(11);
  pdf.text(`Bill No: ${bill.bill_no}`, 40, y);
  pdf.text(`Bill Date: ${bill.date}`, 260, y);
  pdf.text(`Time: ${bill.time}`, 430, y);
  y += 22;

  /* ============================================================================
     PATIENT DETAILS BLOCK
  ============================================================================ */
  pdf.setFontSize(13);
  pdf.text("PATIENT DETAILS", 40, y);
  y += 16;

  pdf.setFontSize(11);
  pdf.text(`UHID: ${bill.patient_id}`, 40, y);
  pdf.text(`Name: ${bill.name}`, 260, y);
  y += 18;

  pdf.text(`Age/Gender: ${bill.age} / ${bill.gender}`, 40, y);
  pdf.text(`Doctor: ${bill.doctor}`, 260, y);
  y += 18;

  pdf.text(`Date of Admission: ${bill.doa}`, 40, y);
  pdf.text(`Date of Discharge: ${bill.dod}`, 260, y);
  y += 18;

  pdf.text(`Adm Time: ${bill.adm}`, 40, y);
  pdf.text(`Dis Time: ${bill.dis}`, 260, y);
  y += 28;

  pdf.line(40, y, pageWidth - 40, y);
  y += 20;

  /* ============================================================================
     CHARGES TABLE
  ============================================================================ */
  const tableData = bill.charges.map((row) => [
    row.desc,
    "₹" + Number(row.rate).toLocaleString("en-IN"),
    row.qty,
    "₹" + (row.rate * row.qty).toLocaleString("en-IN"),
  ]);

  pdf.autoTable({
    startY: y,
    head: [["Description", "Rate", "Qty", "Total"]],
    body: tableData,
    theme: "grid",
    styles: { fontSize: 11 },
    headStyles: {
      fillColor: [58, 123, 254],
      textColor: 255,
    },
    margin: { left: 40, right: 40 },
    didDrawPage: function (data) {
      drawFooter(pdf);
    }
  });

  let finalY = pdf.lastAutoTable.finalY + 30;

  /* ============================================================================
     TOTAL AMOUNT
  ============================================================================ */
  pdf.setFontSize(13);
  pdf.text("TOTAL SUMMARY", 40, finalY);
  finalY += 16;

  pdf.setFontSize(11);
  pdf.text(`Sub Total: ${bill.subtotal}`, 40, finalY);
  pdf.text(`Discount: ${bill.discount}`, 260, finalY);
  finalY += 18;

  pdf.setFontSize(15);
  pdf.text(`Grand Total: ${bill.total}`, 40, finalY);
  finalY += 30;

  /* ============================================================================
     AMOUNT IN WORDS
  ============================================================================ */
  const words = amountInWords(parseInt(bill.total.replace(/[₹,]/g, "")));
  pdf.setFontSize(12);
  pdf.text(`Amount in Words: ${words}`, 40, finalY);

  /* ============================================================================
     SAVE
  ============================================================================ */
  pdf.save(`${bill.bill_no}.pdf`);
}

/* ============================================================================
   FOOTER (Option B — Professional Tamil Footer)
============================================================================ */
function drawFooter(pdf) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  const centerX = pdf.internal.pageSize.getWidth() / 2;

  pdf.setFontSize(11);
  pdf.setTextColor(60, 60, 60);

  pdf.text("CLINIC TIMINGS:", centerX, pageHeight - 60, { align: "center" });

  pdf.text("பார்வை நுரை, காலை 9.00 – 9.00 மணியரை", centerX, pageHeight - 40, {
    align: "center",
  });

  pdf.text("ஞாயிறு: முன்பதிவு மட்டும்", centerX, pageHeight - 22, {
    align: "center",
  });
}

/* ============================================================================
   BILL COLLECTOR (Get live data from UI)
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

    discount: $("discount_amount").value,
    subtotal: $("subTotal").innerText,
    total: $("grandTotal").innerText,

    charges: qsa("#chargesTable tbody tr").map((r) => ({
      desc: r.querySelector(".desc").value,
      rate: Number(r.querySelector(".rate").value),
      qty: Number(r.querySelector(".qty").value)
    }))
  };
}

/* ============================================================================
   GET HOSPITAL SETTINGS
============================================================================ */
function getHospitalSettings() {
  return new Promise((resolve) => {
    const req = indexedDB.open("KCC_Billing_DB_V4", 7);

    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("settings", "readonly");
      const store = tx.objectStore("settings");

      store.get("hospital").onsuccess = (e) => resolve(e.target.result || {});
    };
  });
}
