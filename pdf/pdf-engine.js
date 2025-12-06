/* ============================================================================
   PREMIUM PDF ENGINE — HEALTHFLO OS
   A4 Multi-page Invoice Generator (Krishna Kidney Centre)
   - Multi-page table
   - Amount in words (Indian Format)
   - Auto hospital header
   - Auto patient details
   - Receipt block
   - Watermark PAID/UNPAID
   - Powered by HealthFlo OS
============================================================================ */

import { inrToWords } from './amount-in-words.js';

const INR = (v) => "₹" + Number(v || 0).toLocaleString("en-IN");
const $id = (id) => document.getElementById(id);

/* ============================================================================
   MAIN EXPORT FUNCTION
============================================================================ */
export async function exportPremiumPDF() {
  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    unit: "pt",
    format: "a4",
    orientation: "portrait"
  });

  let left = 40;
  let y = 40;

  /* ============================================================================
     LOAD HOSPITAL SETTINGS
  ============================================================================ */
  let settings = await loadSettingsFromDB();

  /* ============================================================================
     WATERMARK
  ============================================================================ */
  const watermark = $id("insurance_mode").value === "yes" ? "UNPAID" : "PAID";

  pdf.saveGraphicsState();
  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(90);
  pdf.setTextColor(230, 230, 230);
  pdf.text(watermark, 110, 420, { angle: 35, opacity: 0.12 });
  pdf.restoreGraphicsState();

  /* ============================================================================
     HEADER: LOGO + HOSPITAL DETAILS
  ============================================================================ */
  if (settings.logo) {
    pdf.addImage(settings.logo, "PNG", left, y, 110, 110);
  }

  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(0, 62, 138);
  pdf.text(settings.name || "Krishna Kidney Centre", left + 150, y + 25);

  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(40);
  pdf.text(settings.address || "", left + 150, y + 45);
  pdf.text("Phone: " + (settings.phone || ""), left + 150, y + 60);
  pdf.text("Email: " + (settings.email || ""), left + 150, y + 75);

  y += 135;

  /* ============================================================================
     SECTION DIVIDER
  ============================================================================ */
  pdf.setFillColor(0, 62, 138);
  pdf.rect(left, y, 515, 3, "F");
  y += 25;

  /* ============================================================================
     BILL INFORMATION
  ============================================================================ */
  const billInfo = {
    "Bill No": $id("bill_no").value,
    "Date": $id("bill_date").value,
    "Patient ID": $id("patient_id").value,
    "Insurance": $id("insurance_mode").value.toUpperCase()
  };

  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(13);

  for (let key in billInfo) {
    pdf.setTextColor(27, 167, 165);
    pdf.text(key, left, y);

    pdf.setTextColor(40);
    pdf.text(String(billInfo[key]), left + 150, y);
    y += 18;
  }

  y += 10;
  pdf.setFillColor(220, 240, 245);
  pdf.rect(left, y, 515, 1, "F");
  y += 20;

  /* ============================================================================
     PATIENT DETAILS
  ============================================================================ */
  const patient = {
    "Patient Name": $id("p_name").value,
    "Age / Gender": `${$id("p_age").value} / ${$id("p_gender").value}`,
    "Doctor": $id("p_doctor").value,
    "DOA": $id("p_doa").value,
    "DOD": $id("p_dod").value,
    "Admission Time": $id("p_adm_time").value,
    "Discharge Time": $id("p_dis_time").value
  };

  for (let key in patient) {
    pdf.setTextColor(27, 167, 165);
    pdf.text(key, left, y);

    pdf.setTextColor(40);
    pdf.text(String(patient[key]), left + 150, y);

    y += 18;
  }

  y += 15;

  /* ============================================================================
     CHARGES TABLE (MULTI PAGE)
  ============================================================================ */
  const rows = [];
  document.querySelectorAll("#chargesTable tbody tr").forEach((r) => {
    const desc = r.querySelector(".desc").value;
    const rate = Number(r.querySelector(".rate").value);
    const qty = Number(r.querySelector(".qty").value);
    const amt = rate * qty;

    rows.push([
      desc,
      INR(rate),
      qty,
      INR(amt),
      "9985"
    ]);
  });

  pdf.autoTable({
    startY: y,
    head: [["Description", "Rate (₹)", "Qty", "Amount (₹)", "HSN/SAC"]],
    body: rows,
    theme: "grid",
    margin: { left },
    headStyles: {
      fillColor: [238, 246, 255],
      textColor: [0, 62, 138]
    },
    styles: {
      fontSize: 11,
      cellPadding: 6
    },
    columnStyles: {
      0: { cellWidth: 200 },
      1: { cellWidth: 70 },
      2: { cellWidth: 40 },
      3: { cellWidth: 70 },
      4: { cellWidth: 60 }
    },
    didDrawPage: (data) => {
      let footerY = pdf.internal.pageSize.height - 40;

      pdf.setFontSize(10);
      pdf.setTextColor(120);
      pdf.text("Powered by HealthFlo OS — AI Billing Engine", left, footerY);

      pdf.setFontSize(10);
      pdf.text(
        `Page ${pdf.internal.getNumberOfPages()}`,
        left + 450,
        footerY
      );
    }
  });

  y = pdf.lastAutoTable.finalY + 30;

  /* ============================================================================
     TOTALS
  ============================================================================ */
  const totals = calculateTotals();

  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(0, 62, 138);

  pdf.text("Gross Total", left, y);
  pdf.text(INR(totals.total), left + 400, y);
  y += 20;

  pdf.text("Discount", left, y);
  pdf.text(INR(totals.discountAmount), left + 400, y);
  y += 30;

  pdf.setFillColor(230, 250, 248);
  pdf.rect(left, y - 15, 515, 40, "F");

  pdf.setFontSize(18);
  pdf.text("TOTAL PAYABLE", left + 10, y + 5);
  pdf.text(INR(totals.finalTotal), left + 380, y + 5);

  y += 70;

  /* ============================================================================
     AMOUNT IN WORDS
  ============================================================================ */
  const words = inrToWords(totals.finalTotal);

  pdf.setFontSize(12);
  pdf.setTextColor(0, 62, 138);
  pdf.text("Amount in Words:", left, y);

  pdf.setFont("Helvetica", "normal");
  pdf.setTextColor(40);
  pdf.text(words, left + 150, y, { maxWidth: 380 });

  y += 50;

  /* ============================================================================
     PAYMENT RECEIPT (IF PAID)
  ============================================================================ */
  if (watermark === "PAID") {
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(0, 62, 138);
    pdf.text("Payment Receipt:", left, y);

    pdf.setFont("Helvetica", "normal");
    pdf.setFontSize(12);
    pdf.setTextColor(40);

    y += 22;
    pdf.text("Receipt No: ____________________", left, y);
    y += 20;
    pdf.text("Receipt Date: ___________________", left, y);
    y += 20;
    pdf.text("Amount Received: ________________", left, y);
    y += 40;
  }

  /* ============================================================================
     SIGNATURE BLOCK
  ============================================================================ */
  pdf.text("_____________________________", left, y);
  pdf.text("Authorized Signature", left, y + 15);

  pdf.text("_____________________________", left + 300, y);
  pdf.text("Patient Signature", left + 300, y + 15);

  /* ============================================================================
     SAVE PDF
  ============================================================================ */
  pdf.save(`${$id("bill_no").value}.pdf`);
}

/* ============================================================================
   LOAD SETTINGS HELPER
============================================================================ */
function loadSettingsFromDB() {
  return new Promise((resolve) => {
    const tx = DB.transaction("settings", "readonly");
    tx.objectStore("settings").get("hospital").onsuccess = (e) => {
      resolve(e.target.result || {});
    };
  });
}
