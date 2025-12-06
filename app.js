/* ============================================================
   KRISHNA KIDNEY CENTRE — ADVANCED OFFLINE BILLING JS
============================================================ */

const $ = (id) => document.getElementById(id);
const tableBody = document.querySelector("#chargesTable tbody");

let DB;
let editingBill = null;


/* ============================================================
   INITIALIZE INDEXEDDB
============================================================ */
let request = indexedDB.open("KCC_Billing", 1);

request.onupgradeneeded = function (e) {
  DB = e.target.result;
  let store = DB.createObjectStore("bills", { keyPath: "bill_no" });
  store.createIndex("by_date", "bill_date");
};

request.onsuccess = function (e) {
  DB = e.target.result;
  loadNewBillDefaults();
};



/* ============================================================
   NEW BILL DEFAULT VALUES
============================================================ */
function loadNewBillDefaults() {
  editingBill = null;

  $("bill_no").value = "KCC-" + Date.now();
  $("bill_date").value = new Date().toISOString().substr(0, 10);
  $("bill_time").value = new Date().toTimeString().substr(0, 5);

  tableBody.innerHTML = "";
  updateTotals();
}



/* ============================================================
   ADD ROW
============================================================ */
$("addRowBtn").addEventListener("click", () => {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input class="desc" placeholder="Description"></td>
    <td><input class="unit" type="number" value="0"></td>
    <td><input class="qty" type="number" value="1"></td>
    <td class="rowTotal">₹0</td>
    <td><button class="delete-row">X</button></td>
  `;
  tableBody.appendChild(tr);
  updateTotals();
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
   AUTO TOTALS
============================================================ */
tableBody.addEventListener("input", updateTotals);

function updateTotals() {
  let grand = 0;

  document.querySelectorAll("#chargesTable tbody tr").forEach((row) => {
    const u = parseFloat(row.querySelector(".unit").value || 0);
    const q = parseFloat(row.querySelector(".qty").value || 0);
    const total = u * q;

    row.querySelector(".rowTotal").textContent = "₹" + total.toLocaleString("en-IN");
    grand += total;
  });

  $("grandTotal").textContent = "₹" + grand.toLocaleString("en-IN");
}



/* ============================================================
   PACKAGE TEMPLATES
============================================================ */
$("pkgSelect").addEventListener("change", () => {
  if (!$("pkgSelect").value) return;

  tableBody.innerHTML = "";
  let pkg = $("pkgSelect").value;

  let items = [];

  if (pkg === "dj") {
    items = [
      ["Surgeon Fees", 50000, 1],
      ["Assistant Surgeon Fees", 16000, 1],
      ["DJ Stenting", 12000, 1],
      ["Anaesthesia", 16000, 1],
      ["OT Charges", 27000, 1],
      ["Medicine", 20000, 1]
    ];
  }

  if (pkg === "surgery") {
    items = [
      ["Surgeon Fees", 70000, 1],
      ["OT Charges", 35000, 1],
      ["ICU Charges", 8000, 1],
      ["Nursing", 4000, 2],
      ["Medicine", 25000, 1]
    ];
  }

  items.forEach(([desc, unit, qty]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input class="desc" value="${desc}"></td>
      <td><input class="unit" type="number" value="${unit}"></td>
      <td><input class="qty" type="number" value="${qty}"></td>
      <td class="rowTotal">₹0</td>
      <td><button class="delete-row">X</button></td>
    `;
    tableBody.appendChild(tr);
  });

  updateTotals();
});



/* ============================================================
   SAVE BILL
============================================================ */
$("saveBill").addEventListener("click", () => {
  let data = collectBillData();

  let tx = DB.transaction("bills", "readwrite");
  tx.objectStore("bills").put(data);

  alert("Bill saved offline successfully.");
});

function collectBillData() {
  let rows = [];

  document.querySelectorAll("#chargesTable tbody tr").forEach((r) => {
    rows.push({
      desc: r.querySelector(".desc").value,
      unit: r.querySelector(".unit").value,
      qty: r.querySelector(".qty").value,
    });
  });

  return {
    bill_no: $("bill_no").value,
    bill_date: $("bill_date").value,
    bill_time: $("bill_time").value,
    name: $("p_name").value,
    age: $("p_age").value,
    gender: $("p_gender").value,
    doctor: $("p_doctor").value,
    doa: $("p_doa").value,
    dod: $("p_dod").value,
    charges: rows,
    total: $("grandTotal").textContent
  };
}



/* ============================================================
   LOAD SAVED BILLS
============================================================ */
$("viewBillsBtn").addEventListener("click", () => {
  document.querySelector("#modal").classList.remove("hidden");

  let tx = DB.transaction("bills", "readonly");
  let store = tx.objectStore("bills");

  let table = document.querySelector("#billsTable tbody");
  table.innerHTML = "";

  store.openCursor().onsuccess = function (e) {
    let cursor = e.target.result;
    if (cursor) {
      let b = cursor.value;

      let tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${b.bill_no}</td>
        <td>${b.name}</td>
        <td>${b.bill_date}</td>
        <td>${b.total}</td>
        <td><button class="openBill" data-id="${b.bill_no}">Open</button></td>
      `;
      table.appendChild(tr);

      cursor.continue();
    }
  };
});


document.querySelector("#billsTable").addEventListener("click", (e) => {
  if (e.target.classList.contains("openBill")) {
    loadBill(e.target.dataset.id);
    document.querySelector("#modal").classList.add("hidden");
  }
});


function loadBill(id) {
  let tx = DB.transaction("bills", "readonly");
  let store = tx.objectStore("bills");
  let req = store.get(id);

  req.onsuccess = function () {
    let b = req.result;

    $("bill_no").value = b.bill_no;
    $("bill_date").value = b.bill_date;
    $("bill_time").value = b.bill_time;

    $("p_name").value = b.name;
    $("p_age").value = b.age;
    $("p_gender").value = b.gender;
    $("p_doctor").value = b.doctor;
    $("p_doa").value = b.doa;
    $("p_dod").value = b.dod;

    tableBody.innerHTML = "";

    b.charges.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input class="desc" value="${c.desc}"></td>
        <td><input class="unit" type="number" value="${c.unit}"></td>
        <td><input class="qty" type="number" value="${c.qty}"></td>
        <td class="rowTotal">₹0</td>
        <td><button class="delete-row">X</button></td>
      `;
      tableBody.appendChild(tr);
    });

    updateTotals();
  };
}



/* ============================================================
   PDF GENERATOR
============================================================ */
$("generateBill").addEventListener("click", generatePDF);

function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // Logo
  try {
    let img = new Image();
    img.src = "kcc-logo.png";
    doc.addImage(img, "PNG", 40, 30, 60, 60);
  } catch {}

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(20);
  doc.text("KRISHNA KIDNEY CENTRE", 120, 60);

  doc.setLineWidth(0.5);
  doc.line(40, 100, 550, 100);

  // Patient Info
  doc.setFontSize(12);
  doc.text("Bill No: " + $("bill_no").value, 40, 130);
  doc.text("Date: " + $("bill_date").value, 40, 150);

  doc.text("Patient Name: " + $("p_name").value, 40, 180);
  doc.text("Age / Gender: " + $("p_age").value + " / " + $("p_gender").value, 40, 200);
  doc.text("Doctor: " + $("p_doctor").value, 40, 220);

  let body = [];

  document.querySelectorAll("#chargesTable tbody tr").forEach((r) => {
    body.push([
      r.querySelector(".desc").value,
      r.querySelector(".unit").value,
      r.querySelector(".qty").value,
      (r.querySelector(".unit").value * r.querySelector(".qty").value).toLocaleString("en-IN")
    ]);
  });

  doc.autoTable({
    head: [["Description", "Unit", "Qty", "Total"]],
    body,
    startY: 240
  });

  let finalY = doc.lastAutoTable.finalY + 40;

  doc.setFontSize(14);
  doc.text("TOTAL: " + $("grandTotal").textContent, 40, finalY);

  doc.save($("bill_no").value + ".pdf");
}



/* ============================================================
   MODAL CLOSE
============================================================ */
$("closeModal").addEventListener("click", () => {
  document.querySelector("#modal").classList.add("hidden");
});


$("newBillBtn").addEventListener("click", loadNewBillDefaults);
