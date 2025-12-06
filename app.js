/* ============================================================
   KRISHNA KIDNEY CENTRE — OFFLINE BILLING SOFTWARE JS
   Includes:
   - Dynamic rows
   - Auto totals
   - PDF Generator
============================================================ */

const $ = (id) => document.getElementById(id);
const tableBody = document.querySelector("#chargesTable tbody");
const addRowBtn = $("addRowBtn");
const grandTotalEl = $("grandTotal");

let rowIndex = 0;

/* ============================================================
   ADD NEW ROW
============================================================ */
addRowBtn.addEventListener("click", () => {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" class="desc" placeholder="Enter Description"></td>
    <td><input type="number" class="unit" value="0"></td>
    <td><input type="number" class="qty" value="1"></td>
    <td class="rowTotal">₹0</td>
    <td><button class="delete-row">X</button></td>
  `;

  tableBody.appendChild(tr);
  updateTotals();
});

/* ============================================================
   EVENT: UPDATE TOTALS WHEN USER TYPES
============================================================ */
tableBody.addEventListener("input", (e) => {
  if (e.target.classList.contains("unit") ||
      e.target.classList.contains("qty")) {
    updateTotals();
  }
});

/* ============================================================
   DELETE ROW
============================================================ */
tableBody.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-row")) {
    e.target.closest("tr").remove();
    updateTotals();
  }
});

/* ============================================================
   TOTAL CALCULATION
============================================================ */
function updateTotals() {
  let grandTotal = 0;

  document.querySelectorAll("#chargesTable tbody tr").forEach((row) => {
    const unit = parseFloat(row.querySelector(".unit").value || 0);
    const qty = parseFloat(row.querySelector(".qty").value || 0);
    const total = unit * qty;

    row.querySelector(".rowTotal").textContent = "₹" + total.toLocaleString("en-IN");
    grandTotal += total;
  });

  grandTotalEl.textContent = "₹" + grandTotal.toLocaleString("en-IN");
}



/* ============================================================
   PDF GENERATOR
============================================================ */
$("generateBill").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  /* --------------------------
     HEADER
  -------------------------- */
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.text("KRISHNA KIDNEY CENTRE", 40, 40);

  doc.setFontSize(11);
  doc.setFont("Helvetica", "normal");
  doc.text("Advanced Billing Software (Offline)", 40, 58);

  doc.setLineWidth(0.5);
  doc.line(40, 70, 550, 70);

  /* --------------------------
     PATIENT DETAILS
  -------------------------- */
  doc.setFontSize(13);
  doc.setFont("Helvetica", "bold");
  doc.text("Patient Information", 40, 100);

  doc.setFontSize(12);
  doc.setFont("Helvetica", "normal");

  const patientInfo = [
    ["Patient Name:", $("p_name").value],
    ["Age:", $("p_age").value],
    ["Gender:", $("p_gender").value],
    ["Doctor:", $("p_doctor").value],
    ["Date of Admission:", $("p_doa").value],
    ["Date of Discharge:", $("p_dod").value],
    ["Admission Time:", $("p_adm_time").value],
    ["Discharge Time:", $("p_dis_time").value],
  ];

  let y = 130;
  patientInfo.forEach((row) => {
    doc.text(row[0], 40, y);
    doc.text(row[1] || "-", 180, y);
    y += 22;
  });

  /* --------------------------
     CHARGES TABLE
  -------------------------- */
  const tableData = [];
  document.querySelectorAll("#chargesTable tbody tr").forEach((row) => {
    const desc = row.querySelector(".desc").value || "-";
    const unit = row.querySelector(".unit").value || "0";
    const qty = row.querySelector(".qty").value || "0";
    const total = (unit * qty).toLocaleString("en-IN");

    tableData.push([desc, unit, qty, total]);
  });

  doc.autoTable({
    head: [["Description", "Charge/Unit", "Units", "Total"]],
    body: tableData,
    startY: y + 10,
    theme: "grid",
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: "#fff",
      halign: "left",
    },
    styles: {
      fontSize: 11,
      cellPadding: 6,
      halign: "left",
    }
  });

  /* --------------------------
     GRAND TOTAL
  -------------------------- */
  const finalY = doc.lastAutoTable.finalY + 30;

  doc.setFontSize(14);
  doc.setFont("Helvetica", "bold");
  doc.text("Total Amount: " + grandTotalEl.textContent, 40, finalY);

  /* --------------------------
     SAVE PDF
  -------------------------- */
  doc.save("KCC_Bill.pdf");
});
