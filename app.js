/* ================================================================
   KRISHNA KIDNEY CENTRE — BILLING OS (Ceramic v2 VisionOS)
   Full Offline SPA Engine
   - Unique Patient ID
   - Auto Bill Number
   - Save Bills (IndexedDB)
   - Edit Bills
   - Tariff Master
   - Discount Engine
   - Insurance Mode
   - Premium PDF Export
================================================================ */

/* ========== ELEMENT SELECTOR ========== */
const $ = (id) => document.getElementById(id);

/* ========== PAGE SWITCHING ENGINE ========== */
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    openPage(btn.dataset.target);
  });
});

function openPage(id) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active-page"));
  $(id).classList.add("active-page");
}




/* ================================================================
   INDEXEDDB INITIALIZATION
================================================================ */
let DB;

let dbReq = indexedDB.open("KCC_Billing_DB", 3);

dbReq.onupgradeneeded = function (e) {
  DB = e.target.result;

  // Bills store
  if (!DB.objectStoreNames.contains("bills")) {
    let store = DB.createObjectStore("bills", { keyPath: "bill_no" });
  }

  // Tariff master
  if (!DB.objectStoreNames.contains("tariffs")) {
    let store = DB.createObjectStore("tariffs", { keyPath: "name" });
  }

  // Settings
  if (!DB.objectStoreNames.contains("settings")) {
    let store = DB.createObjectStore("settings", { keyPath: "id" });
  }
};

dbReq.onsuccess = function (e) {
  DB = e.target.result;
  loadSettings();
  loadTariffList();
  loadBillsList();
  prepareNewBill();
};



/* ================================================================
   UNIQUE ID GENERATORS
================================================================ */

// Unique random ID
function generateRandomID(prefix) {
  return prefix + "-" + Math.floor(100000 + Math.random() * 900000);
}

function generateBillNo() {
  return generateRandomID("KCC-BILL");
}

function generatePatientID() {
  return generateRandomID("KCC-PAT");
}



/* ================================================================
   NEW BILL DEFAULT SETUP
================================================================ */
function prepareNewBill() {
  $("bill_no").value = generateBillNo();
  $("patient_id").value = generatePatientID();
  $("bill_date").value = new Date().toISOString().slice(0, 10);
  $("bill_time").value = new Date().toTimeString().slice(0, 5);

  tableBody.innerHTML = "";
  updateTotals();
}



/* ================================================================
   CHARGES TABLE ENGINE
================================================================ */
const tableBody = document.querySelector("#chargesTable tbody");
$("addRowBtn").addEventListener("click", addRow);

function addRow(desc = "", rate = "", qty = 1) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input class="desc" value="${desc}"></td>
    <td><input class="rate" type="number" value="${rate}"></td>
    <td><input class="qty" type="number" value="${qty}"></td>
    <td class="rowTotal">₹0</td>
    <td><button class="delete-row">X</button></td>
  `;
  tableBody.appendChild(tr);
  updateTotals();
}

tableBody.addEventListener("input", updateTotals);

tableBody.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-row")) {
    e.target.closest("tr").remove();
    updateTotals();
  }
});


/* ================================================================
   TOTAL CALCULATION ENGINE
================================================================ */
function updateTotals() {
  let total = 0;

  document.querySelectorAll("#chargesTable tbody tr").forEach((row) => {
    let rate = parseFloat(row.querySelector(".rate").value || 0);
    let qty = parseFloat(row.querySelector(".qty").value || 0);
    let t = rate * qty;

    row.querySelector(".rowTotal").textContent = "₹" + t.toLocaleString("en-IN");
    total += t;
  });

  // DISCOUNTS
  let discountPercent = parseFloat($("discount_percent").value || 0);
  let discountAmount = parseFloat($("discount_amount").value || 0);

  if (discountPercent > 0) {
    discountAmount = (total * discountPercent) / 100;
  }

  let finalTotal = total - discountAmount;

  $("grandTotal").textContent = "₹" + finalTotal.toLocaleString("en-IN");
}



/* ================================================================
   TARIFF MASTER ENGINE
================================================================ */
$("saveTariff").addEventListener("click", saveTariff);

function saveTariff() {
  const name = $("tariff_name").value.trim();
  const rate = parseFloat($("tariff_rate").value);

  if (!name || !rate) return alert("Fill all tariff fields!");

  let tx = DB.transaction("tariffs", "readwrite");
  tx.objectStore("tariffs").put({ name, rate });

  $("tariff_name").value = "";
  $("tariff_rate").value = "";

  loadTariffList();
  loadTariffDropdown();
}

function loadTariffList() {
  let tx = DB.transaction("tariffs", "readonly");
  let store = tx.objectStore("tariffs");
  let req = store.getAll();

  req.onsuccess = () => {
    let table = $("tariffTable").querySelector("tbody");
    table.innerHTML = "";

    req.result.forEach((t) => {
      let tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.name}</td>
        <td>₹${t.rate.toLocaleString("en-IN")}</td>
        <td><button class="delete-row" onclick="deleteTariff('${t.name}')">Delete</button></td>
      `;
      table.appendChild(tr);
    });

    loadTariffDropdown();
  };
}

function deleteTariff(name) {
  let tx = DB.transaction("tariffs", "readwrite");
  tx.objectStore("tariffs").delete(name);
  loadTariffList();
}

function loadTariffDropdown() {
  let select = $("procedureSelect");
  select.innerHTML = `<option value="">Select Procedure (Tariff)</option>`;

  let tx = DB.transaction("tariffs", "readonly");
  tx.objectStore("tariffs").getAll().onsuccess = (e) => {
    e.target.result.forEach((t) => {
      let opt = document.createElement("option");
      opt.value = t.name;
      opt.textContent = t.name;
      select.appendChild(opt);
    });
  };
}

$("procedureSelect").addEventListener("change", () => {
  let name = $("procedureSelect").value;
  if (!name) return;

  let tx = DB.transaction("tariffs", "readonly");
  tx.objectStore("tariffs").get(name).onsuccess = (e) => {
    let t = e.target.result;
    addRow(t.name, t.rate, 1);
  };
});



/* ================================================================
   SAVE BILL ENGINE
================================================================ */
$("saveBill").addEventListener("click", saveBill);

function saveBill() {
  let charges = [];

  document.querySelectorAll("#chargesTable tbody tr").forEach((r) => {
    charges.push({
      desc: r.querySelector(".desc").value,
      rate: r.querySelector(".rate").value,
      qty: r.querySelector(".qty").value,
    });
  });

  let billData = {
    bill_no: $("bill_no").value,
    patient_id: $("patient_id").value,
    name: $("p_name").value,
    age: $("p_age").value,
    gender: $("p_gender").value,
    doctor: $("p_doctor").value,
    doa: $("p_doa").value,
    dod: $("p_dod").value,
    adm_time: $("p_adm_time").value,
    dis_time: $("p_dis_time").value,
    date: $("bill_date").value,
    time: $("bill_time").value,
    insurance: $("insurance_mode").value,
    discount_percent: $("discount_percent").value,
    discount_amount: $("discount_amount").value,
    total: $("grandTotal").textContent,
    charges
  };

  let tx = DB.transaction("bills", "readwrite");
  tx.objectStore("bills").put(billData);

  alert("Bill Saved Successfully");
  loadBillsList();
}



/* ================================================================
   BILLS HISTORY ENGINE
================================================================ */
function loadBillsList() {
  let tx = DB.transaction("bills", "readonly");
  let store = tx.objectStore("bills");

  let req = store.getAll();
  req.onsuccess = () => {
    let table = $("billsTable").querySelector("tbody");
    table.innerHTML = "";

    req.result.forEach((b) => {
      let tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${b.bill_no}</td>
        <td>${b.patient_id}</td>
        <td>${b.name}</td>
        <td>${b.date}</td>
        <td>${b.total}</td>
        <td><button class="btn" onclick="openSavedBill('${b.bill_no}')">Open</button></td>
      `;
      table.appendChild(tr);
    });
  };
}

function openSavedBill(bill_no) {
  let tx = DB.transaction("bills", "readonly");
  tx.objectStore("bills").get(bill_no).onsuccess = (e) => {
    let b = e.target.result;

    openPage("newBillPage");

    $("bill_no").value = b.bill_no;
    $("patient_id").value = b.patient_id;
    $("p_name").value = b.name;
    $("p_age").value = b.age;
    $("p_gender").value = b.gender;
    $("p_doctor").value = b.doctor;
    $("p_doa").value = b.doa;
    $("p_dod").value = b.dod;
    $("p_adm_time").value = b.adm_time;
    $("p_dis_time").value = b.dis_time;

    $("bill_date").value = b.date;
    $("bill_time").value = b.time;

    $("discount_percent").value = b.discount_percent;
    $("discount_amount").value = b.discount_amount;
    $("insurance_mode").value = b.insurance;

    tableBody.innerHTML = "";

    b.charges.forEach((c) => addRow(c.desc, c.rate, c.qty));

    updateTotals();
  };
}



/* ================================================================
   HOSPITAL SETTINGS ENGINE
================================================================ */
$("saveSettings").addEventListener("click", saveSettings);

function saveSettings() {
  let settings = {
    id: "hospital",
    name: $("set_h_name").value,
    address: $("set_h_address").value,
    phone: $("set_h_phone").value,
    email: $("set_h_email").value,
    gst: $("set_h_gst").value
  };

  let file = $("set_h_logo").files[0];
  if (file) {
    let reader = new FileReader();
    reader.onload = function () {
      settings.logo = reader.result;
      saveSettingsToDB(settings);
    };
    reader.readAsDataURL(file);
  } else {
    saveSettingsToDB(settings);
  }
}

function saveSettingsToDB(settings) {
  let tx = DB.transaction("settings", "readwrite");
  tx.objectStore("settings").put(settings);
  alert("Settings Saved");
}

function loadSettings() {
  let tx = DB.transaction("settings", "readonly");
  tx.objectStore("settings").get("hospital").onsuccess = (e) => {
    let s = e.target.result;
    if (!s) return;

    $("set_h_name").value = s.name || "";
    $("set_h_address").value = s.address || "";
    $("set_h_phone").value = s.phone || "";
    $("set_h_email").value = s.email || "";
    $("set_h_gst").value = s.gst || "";
  };
}



/* ================================================================
   PDF EXPORT ENGINE — Ceramic v2 Premium
================================================================ */

$("exportPDF").addEventListener("click", exportPDF);

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  /* -------- HEADER -------- */
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.text("KRISHNA KIDNEY CENTRE", 40, 50);

  doc.setFontSize(11);
  doc.setFont("Helvetica", "normal");

  doc.text($("set_h_address").value || "", 40, 70);
  doc.text("Phone: " + ($("set_h_phone").value || ""), 40, 85);
  doc.text("Email: " + ($("set_h_email").value || ""), 40, 100);

  doc.text("GST: " + ($("set_h_gst").value || ""), 40, 120);

  doc.setLineWidth(0.5);
  doc.line(40, 130, 550, 130);

  /* -------- BILL INFO -------- */
  doc.setFontSize(13);
  doc.setFont("Helvetica", "bold");
  doc.text("Bill No: " + $("bill_no").value, 40, 160);
  doc.text("Date: " + $("bill_date").value, 40, 180);

  doc.text("Patient ID: " + $("patient_id").value, 360, 160);
  doc.text("Insurance: " + $("insurance_mode").value.toUpperCase(), 360, 180);

  /* -------- PATIENT INFO -------- */
  doc.setFontSize(12);
  doc.text("Name: " + $("p_name").value, 40, 215);
  doc.text("Age/Gender: " + $("p_age").value + "/" + $("p_gender").value, 40, 235);
  doc.text("Doctor: " + $("p_doctor").value, 40, 255);

  doc.text("DOA: " + $("p_doa").value + "  | Time: " + $("p_adm_time").value, 360, 215);
  doc.text("DOD: " + $("p_dod").value + "  | Time: " + $("p_dis_time").value, 360, 235);

  /* -------- CHARGES TABLE -------- */
  let body = [];

  document.querySelectorAll("#chargesTable tbody tr").forEach((r) => {
    body.push([
      r.querySelector(".desc").value,
      r.querySelector(".rate").value,
      r.querySelector(".qty").value,
      (r.querySelector(".rate").value * r.querySelector(".qty").value).toLocaleString("en-IN")
    ]);
  });

  doc.autoTable({
    startY: 280,
    head: [["Description", "Rate", "Qty", "Total"]],
    body,
    theme: "grid",
    headStyles: { fillColor: [30, 58, 138] },
    styles: { fontSize: 11 }
  });

  let finalY = doc.lastAutoTable.finalY + 40;

  /* -------- DISCOUNT / TOTAL -------- */
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(15);
  doc.text(
    "TOTAL : " + $("grandTotal").textContent,
    40,
    finalY
  );

  doc.save($("bill_no").value + ".pdf");
}
