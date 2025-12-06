/* ============================================================================
   KKC CLASSIC BILL PDF – EXACT HOSPITAL FORMAT (TYPE A)
   Recreated from scanned JPG you provided
   A4 • Single Column Layout • Green Line • Classic Table
============================================================================ */

import { inrToWords } from "./amount-in-words.js";

const INR = (v) => "₹" + Number(v || 0).toLocaleString("en-IN");

export async function exportClassicPDF() {
  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    unit: "pt",
    format: "a4",
    orientation: "portrait",
  });

  let y = 40;
  const left = 40;

  /* ============================================================================
     LOAD SETTINGS (Hospital Name, Logo, Address etc.)
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
     HEADER – EXACT AS YOUR HARD COPY BILL
  ============================================================================ */

  // Logo
  if (settings.logo) {
    pdf.addImage(settings.logo, "PNG", left, y, 90, 90);
  }

  // Hospital Name
  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(200, 50, 50); // Slightly red tone like original
  pdf.text("KRISHNA", left + 120, y + 20);
  pdf.text("KIDNEY CENTRE", left + 120, y + 45);

  // Doctor Name + Reg
  pdf.setFontSize(12);
  pdf.setFont("Helvetica", "bold");
  pdf.setTextColor(10, 40, 90);
  pdf.text("Dr. B.K. SRINIVASAN, M.S., M.Ch. (Urology)", left + 120, y + 70);

  pdf.setFont("Helvetica", "normal");
  pdf.text("Urologist & Andrologist", left + 120, y + 90);
  pdf.text("Regd. No: 73759", left + 120, y + 108);

  // Right block (Phone, Email, Address)
  pdf.setFontSize(11);
  pdf.text("Mobile: 8300224569 / 9442318169", 330, y + 20);
  pdf.text("E-mail: bksrinivasan1980@yahoo.co.in", 330, y + 38);
  pdf.text("No.1/375-7, Rayakottai Main Road,", 330, y + 56);
  pdf.text("[Near Flyover], Krishnagiri - 635001.", 330, y + 74);

  // Tamil Note
  pdf.setFontSize(12);
  pdf.setTextColor(10, 80, 10);
  pdf.text("பார்வை நேரம்", 330, y + 102);
  pdf.text("காலை : 9.00 - 9.00 மணி வரை", 330, y + 118);
  pdf.text("ஞாயிறு : முன் பதிவு மட்டும்", 330, y + 134);

  y += 150;

  /* ============================================================================
     GREEN TITLE LINE
  ============================================================================ */
  pdf.setDrawColor(0, 100, 0);
  pdf.setLineWidth(1.2);
  pdf.line(left, y, 555, y);
  y += 20;

  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text("HOSPITAL BREAK-UP BILL", left, y);
  y += 35;

  /* ============================================================================
     PATIENT DETAILS – EXACT TWO COLUMN LAYOUT
  ============================================================================ */
  const p = {
    Name: $("p_name").value,
    AgeGender: `${$("p_age").value} / ${$("p_gender").value}`,
    DOA: $("p_doa").value,
    DOD: $("p_dod").value,
    Adm: $("p_adm_time").value,
    Dis: $("p_dis_time").value,
  };

  pdf.setFontSize(12);
  pdf.setFont("Helvetica", "bold");

  pdf.text(`NAME : ${p.Name}`, left, y);
  pdf.text(`AGE/MALE : ${p.AgeGender}`, 330, y);
  y += 22;

  pdf.text(`D.O.A : ${p.DOA}`, left, y);
  pdf.text(`ADMISSION TIME : ${p.Adm}`, 330, y);
  y += 22;

  pdf.text(`D.O.D : ${p.DOD}`, left, y);
  pdf.text(`DISCHARGE TIME : ${p.Dis}`, 330, y);
  y += 35;

  /* ============================================================================
     TABLE – EXACT AS ORIGINAL BILL
  ============================================================================ */
  pdf.setFontSize(12);

  const rows = [];
  qsa("#chargesTable tbody tr").forEach((r) => {
    const desc = r.querySelector(".desc").value;
    const rate = Number(r.querySelector(".rate").value);
    const qty = Number(r.querySelector(".qty").value);
    const amt = rate * qty;

    rows.push([desc, rate, qty, amt]);
  });

  pdf.autoTable({
    startY: y,
    head: [["DESCRIPTION", "CHARGES/U", "UNITS", "TOTAL"]],
    body: rows,
    margin: { left },
    theme: "plain",

    headStyles: {
      fontSize: 12,
      fontStyle: "bold",
      textColor: [0, 0, 0],
      lineWidth: 0.5,
    },

    styles: {
      fontSize: 12,
      lineWidth: 0.5,
      halign: "left",
      cellPadding: 4,
    },

    columnStyles: {
      0: { cellWidth: 220 },
      1: { halign: "right", cellWidth: 90 },
      2: { halign: "center", cellWidth: 60 },
      3: { halign: "right", cellWidth: 90 },
    },
  });

  y = pdf.lastAutoTable.finalY + 20;

  /* ============================================================================
     TOTAL
  ============================================================================ */
  const totals = calculateTotals();

  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("TOTAL", left, y);
  pdf.text(INR(totals.finalTotal), 480, y); // RIGHT ALIGN EXACT LIKE BILL
  y += 35;

  /* ============================================================================
     PAID STAMP
  ============================================================================ */
  pdf.setTextColor(150, 0, 150);
  pdf.setFontSize(30);
  pdf.text("PAID", 430, y + 10);

  /* ============================================================================
     FOOTER FACILITIES (Exact from bill)
  ============================================================================ */
  pdf.setFontSize(11);
  pdf.setTextColor(200, 0, 0);

  y += 60;
  pdf.text(
    "ULTRA SOUND SCAN / UROFLOWMETRY / LAB FACILITY / LAPAROSCOPY SURGERY / ECG",
    left,
    y
  );
  y += 18;
  pdf.text(
    "LASER SURGERY : URETERORENOSCOPY * PCNL * CYSTOSCOPY * TURP",
    left,
    y
  );

  /* ============================================================================
     SAVE PDF
  ============================================================================ */
  pdf.save(`${$("bill_no").value}-CLASSIC.pdf`);
}
