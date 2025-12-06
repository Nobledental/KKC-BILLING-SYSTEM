/* ============================================================================
   PREMIUM PDF ENGINE — HEALTHFLO OS (A4 PROFESSIONAL BILL GENERATOR)
   Krishna Kidney Centre — Teal + Navy Medical Invoice
   Features:
   - Multi-page A4 support
   - Dynamic table splitting
   - Amount in words
   - Auto hospital logo + headers
   - Auto patient details
   - Receipt info + signatures
   - HSN/SAC Code
============================================================================ */

const INR = (v) => "₹" + Number(v || 0).toLocaleString("en-IN");

/* -------------------- AMOUNT IN WORDS (INDIAN FORMAT) -------------------- */
function amountInWords(num) {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
    "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if ((num = num.toString()).length > 9) return "Overflow";

  let n = ("000000000" + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return "";

  let str = "";
  str += n[1] != 0 ? (a[n[1]] || b[n[1][0]] + " " + a[n[1][1]]) + " Crore " : "";
  str += n[2] != 0 ? (a[n[2]] || b[n[2][0]] + " " + a[n[2][1]]) + " Lakh " : "";
  str += n[3] != 0 ? (a[n[3]] || b[n[3][0]] + " " + a[n[3][1]]) + " Thousand " : "";
  str += n[4] != 0 ? (a[n[4]] || b[n[4][0]] + " " + a[n[4][1]]) + " Hundred " : "";
  str +=
    n[5] != 0
      ? (str != "" ? "and " : "") +
        (a[n[5]] || b[n[5][0]] + " " + a[n[5][1]]) +
        " "
      : "";

  return str.trim() + " Only";
}

/* ============================================================================
   MAIN EXPORT ENGINE
============================================================================ */
async function exportPremiumPDF() {
  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    unit: "pt",
    format: "a4",
    orientation: "portrait",
  });

  let y = 40;
  const left = 40;

  /* ============================================================================
     LOAD HOSPITAL SETTINGS
  ============================================================================ */
  let settings;
  await new Promise((resolve) => {
    const tx = DB.transaction("settings", "readonly");
    tx.objectStore("settings").get("hospital").onsuccess = (e) => {
      settings = e.target.result || {};
      resolve();
    };
  });

  /* ============================================================================
     WATERMARK "PAID" / "UNPAID"
  ============================================================================ */
  const watermark = $("insurance_mode").value === "yes" ? "UNPAID" : "PAID";
  pdf.saveGraphicsState();
  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(80);
  pdf.setTextColor(230, 230, 230);
  pdf.text(watermark, 100, 380, { angle: 35, opacity: 0.12 });
  pdf.restoreGraphicsState();

  /* ============================================================================
     HEADER — LOGO + HOSPITAL DETAILS
  ============================================================================ */
  if (settings.logo) {
    pdf.addImage(settings.logo, "PNG", left, y, 110, 110);
  }

  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(0, 62, 138);
  pdf.text(settings.name || "Krishna Kidney Centre", left + 150, y + 30);

  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(30);

  pdf.text(settings.address || "", left + 150, y + 50);
  pdf.text("Phone: " + (settings.phone || ""), left + 150, y + 65);
  pdf.text("Email: " + (settings.email || ""), left + 150, y + 80);

  y += 135;

  /* ============================================================================
     SECTION HEADER LINE
  ============================================================================ */
  pdf.setFillColor(0, 62, 138);
  pdf.rect(left, y, 515, 3, "F");
  y += 25;

  /* ============================================================================
     BILL INFO (H3)
  ============================================================================ */
  const billData = {
    BillNo: $("bill_no").value,
    Date: $("bill_date").value,
    PatientID: $("patient_id").value,
    Insurance: $("insurance_mode").value.toUpperCase(),
  };

  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(13);

  for (let key in billData) {
    pdf.setTextColor(27, 167, 165);
    pdf.text(key, left, y);

    pdf.setTextColor(30);
    pdf.text(String(billData[key]), left + 150, y);

    y += 18;
  }

  y += 10;
  pdf.setFillColor(220, 240, 245);
  pdf.rect(left, y, 515, 1, "F");
  y += 20;

  /* ============================================================================
     PATIENT INFO
  ============================================================================ */
  const p = {
    Name: $("p_name").value,
    "Age / Gender": `${$("p_age").value} / ${$("p_gender").value}`,
    Doctor: $("p_doctor").value,
    DOA: $("p_doa").value,
    DOD: $("p_dod").value,
    "Admission Time": $("p_adm_time").value,
    "Discharge Time": $("p_dis_time").value,
  };

  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(13);

  for (let key in p) {
    pdf.setTextColor(27, 167, 165);
    pdf.text(key, left, y);

    pdf.setTextColor(30);
    pdf.text(String(p[key]), left + 150, y);

    y += 18;
  }

  y += 15;

  /* ============================================================================
     CHARGES TABLE (MULTI PAGE)
  ============================================================================ */
  const rows = [];
  qsa("#chargesTable tbody tr").forEach((r) => {
    const desc = r.querySelector(".desc").value;
    const rate = Number(r.querySelector(".rate").value);
    const qty = Number(r.querySelector(".qty").value);
    const amt = rate * qty;

    rows.push([desc, INR(rate), qty, INR(amt), "9985"]);
  });

  pdf.autoTable({
    startY: y,
    head: [["Description", "Rate (₹)", "Qty", "Amount (₹)", "HSN/SAC"]],
    body: rows,
    theme: "grid",
    headStyles: {
      fillColor: [238, 246, 255],
      textColor: [0, 62, 138],
    },
    styles: {
      fontSize: 11,
      cellPadding: 6,
    },
    columnStyles: {
      0: { cellWidth: 200 },
      1: { cellWidth: 70 },
      2: { cellWidth: 40 },
      3: { cellWidth: 70 },
      4: { cellWidth: 60 },
    },
    margin: { left },
    didDrawPage: (data) => {
      // Footer per page
      let footerY = pdf.internal.pageSize.height - 40;

      pdf.setFontSize(10);
      pdf.setTextColor(120);
      pdf.text("Powered by HealthFlo OS — AI Billing Engine", left, footerY);

      pdf.setFontSize(9);
      pdf.text(
        `Page ${pdf.internal.getNumberOfPages()}`,
        520,
        footerY
      );
    },
  });

  y = pdf.lastAutoTable.finalY + 30;

  /* ============================================================================
     TOTALS
  ============================================================================ */
  const t = calculateTotals();

  pdf.setFont("Helvetica", "bold");
  pdf.setTextColor(0, 62, 138);
  pdf.setFontSize(13);

  pdf.text("Gross Total", left, y);
  pdf.text(INR(t.gross), left + 400, y);
  y += 20;

  pdf.text("Discount", left, y);
  pdf.text(INR(t.dA), left + 400, y);
  y += 30;

  pdf.setFillColor(230, 250, 248);
  pdf.rect(left, y - 15, 515, 40, "F");

  pdf.setFontSize(18);
  pdf.text("TOTAL PAYABLE", left + 10, y + 5);
  pdf.text(INR(t.final), left + 380, y + 5);

  y += 60;

  /* ============================================================================
     AMOUNT IN WORDS
  ============================================================================ */
  pdf.setFontSize(12);
  pdf.setTextColor(0, 62, 138);
  pdf.text("Amount in Words:", left, y);

  pdf.setFont("Helvetica", "normal");
  pdf.setTextColor(20);
  pdf.text(amountInWords(Math.round(t.final)), left + 150, y);

  y += 50;

  /* ============================================================================
     RECEIPT DETAILS (IF PAID)
  ============================================================================ */
  if (watermark === "PAID") {
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(0, 62, 138);
    pdf.text("Payment Receipt:", left, y);

    pdf.setFont("Helvetica", "normal");
    pdf.setFontSize(12);
    pdf.setTextColor(20);

    y += 20;
    pdf.text("Receipt No: ____________________", left, y);
    y += 20;
    pdf.text("Receipt Date: ___________________", left, y);
    y += 20;
    pdf.text("Amount Received: ________________", left, y);
    y += 40;
  }

  /* ============================================================================
     SIGNATURES
  ============================================================================ */
  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(12);

  pdf.text("_____________________________", left, y + 20);
  pdf.text("Authorized Signature", left, y + 35);

  pdf.text("_____________________________", left + 300, y + 20);
  pdf.text("Patient Signature", left + 300, y + 35);

  /* ============================================================================
     SAVE
  ============================================================================ */
  pdf.save(`${$("bill_no").value}.pdf`);
}

