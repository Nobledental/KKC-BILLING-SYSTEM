/* ============================================================================
   KRISHNA KIDNEY CENTRE — PDF ENGINE V6 (FINAL PRODUCTION BUILD)
   ✔ Tamil Footer — Option B
   ✔ A4 multi-page AutoTable
   ✔ Hospital logo, GST, doctor info
   ✔ Amount-in-Words fixed (uses inrToWords)
   ✔ Fully compatible with your index.html + app.js V4
============================================================================ */

async function exportPremiumPDF() {
  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    unit: "pt",
    format: "a4",
    compress: true
  });

  /* ============================================================================
     FETCH BILL + HOSPITAL DATA
  ============================================================================ */
  const hospital = await getHospitalSettings();
  const bill = collectBillData();
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 40;

  pdf.setFont("Times-Roman");

  /* ============================================================================
     HEADER — HOSPITAL LOGO + INFO
  ============================================================================ */
  try {
    if (hospital.logo) {
      pdf.addImage(hospital.logo, "PNG", 40, y, 80, 80);
    }
  } catch(e){}

  pdf.setFontSize(20);
  pdf.text(hospital.name || "Krishna Kidney Centre", 140, y + 20);

  pdf.setFontSize(11);
  const addressLines = (hospital.address || "").split("\n");
  addressLines.forEach((line, i) =>
    pdf.text(line, 140, y + 45 + i * 14)
  );

  pdf.text(`Phone: ${hospital.phone || ""}`, 140, y + 90);
  pdf.text(`Email: ${hospital.email || ""}`, 140, y + 106);

  if (hospital.gst && hospital.gst.trim() !== "") {
    pdf.text(`GST: ${hospital.gst}`, 140, y + 122);
  }

  y += 140;

  pdf.setLineWidth(0.8);
  pdf.line(40, y, pageWidth - 40, y);
  y += 25;

  /* ============================================================================
     BILL DETAILS BLOCK
  ============================================================================ */
  pdf.setFontSize(13);
  pdf.text("BILL DETAILS", 40, y);
  y += 18;

  pdf.setFontSize(11);
  pdf.text(`Bill No: ${bill.bill_no}`, 40, y);
  pdf.text(`Bill Date: ${bill.date}`, 260, y);
  pdf.text(`Time: ${bill.time}`, 430, y);
  y += 20;

  /* ============================================================================
     PATIENT BLOCK
  ============================================================================ */
  pdf.setFontSize(13);
  pdf.text("PATIENT DETAILS", 40, y);
  y += 18;

  pdf.setFontSize(11);
  pdf.text(`UHID: ${bill.patient_id}`, 40, y);
  pdf.text(`Name: ${bill.name}`, 260, y);
  y += 18;

  pdf.text(`Age / Gender: ${bill.age} / ${bill.gender}`, 40, y);
  pdf.text(`Doctor: ${bill.doctor}`, 260, y);
  y += 18;

  pdf.text(`Date of Admission: ${bill.doa}`, 40, y);
  pdf.text(`Date of Discharge: ${bill.dod}`, 260, y);
  y += 18;

  pdf.text(`Admission Time: ${bill.adm}`, 40, y);
  pdf.text(`Discharge Time: ${bill.dis}`, 260, y);

  if (bill.insurance === "yes") {
    pdf.setTextColor(0,128,0);
    pdf.text("Insurance: YES", 430, y);
    pdf.setTextColor(0,0,0);
  }

  y += 28;
  pdf.line(40, y, pageWidth - 40, y);
  y += 20;

  /* ============================================================================
     CHARGES TABLE — AUTO TABLE
  ============================================================================ */
  const rows = bill.charges.map((r) => [
    r.desc,
    "₹" + Number(r.rate).toLocaleString("en-IN"),
    r.qty,
    "₹" + (r.rate * r.qty).toLocaleString("en-IN")
  ]);

  pdf.autoTable({
    startY: y,
    head: [["Description", "Rate", "Qty", "Total"]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 11 },
    headStyles: {
      fillColor: [58, 123, 254],
      textColor: 255
    },
    margin: { left: 40, right: 40 },
    didDrawPage: () => drawFooter(pdf)
  });

  y = pdf.lastAutoTable.finalY + 35;

  /* ============================================================================
     TOTAL SUMMARY
  ============================================================================ */
  pdf.setFontSize(14);
  pdf.text("TOTAL SUMMARY", 40, y);
  y += 18;

  pdf.setFontSize(11);
  pdf.text(`Sub Total: ${bill.subtotal}`, 40, y);
  pdf.text(`Discount: ${bill.discount}`, 260, y);
  y += 18;

  pdf.setFontSize(16);
  pdf.text(`Grand Total: ${bill.total}`, 40, y);
  y += 28;

  /* ============================================================================
     AMOUNT IN WORDS — FIXED
  ============================================================================ */
  const numericTotal = parseInt(bill.total.replace(/[₹,]/g, "")) || 0;
  const wordsRaw = inrToWords(numericTotal);

  const wrapped = pdf.splitTextToSize("Amount in Words: " + wordsRaw, pageWidth - 80);

  pdf.setFontSize(12);
  pdf.text(wrapped, 40, y);
  y += wrapped.length * 14 + 10;

  /* ============================================================================
     SAVE FILE
  ============================================================================ */
  pdf.save(`${bill.bill_no}.pdf`);
}

/* ============================================================================
   FOOTER (Tamil — Every Page)
============================================================================ */
function drawFooter(pdf) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  const center = pdf.internal.pageSize.getWidth() / 2;

  pdf.setFontSize(11);
  pdf.setTextColor(60, 60, 60);

  pdf.text("CLINIC TIMINGS", center, pageHeight - 65, { align: "center" });
  pdf.text("பார்வை நுரை, காலை 9.00 – 9.00 மணியரை", center, pageHeight - 45, {
    align: "center"
  });
  pdf.text("ஞாயிறு: முன்பதிவு மட்டும்", center, pageHeight - 28, {
    align: "center"
  });

  pdf.setTextColor(0,0,0);
}

/* ============================================================================
   GET BILL DATA FROM UI
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

    insurance: $("insurance_mode").value,

    charges: qsa("#chargesTable tbody tr").map((r) => ({
      desc: r.querySelector(".desc").value,
      rate: Number(r.querySelector(".rate").value),
      qty: Number(r.querySelector(".qty").value)
    }))
  };
}

/* ============================================================================
   FETCH HOSPITAL SETTINGS FROM INDEXEDDB
============================================================================ */
function getHospitalSettings() {
  return new Promise((resolve) => {
    const req = indexedDB.open("KCC_Billing_DB_V4", 7);

    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("settings", "readonly");
      tx.objectStore("settings").get("hospital").onsuccess = (e) => {
        resolve(e.target.result || {});
      };
    };
  });
}
