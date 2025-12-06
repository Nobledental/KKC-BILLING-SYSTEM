/* ================================================================
   KRISHNA KIDNEY CENTRE — BILLING OS (Ceramic v2 VisionOS)
   Full Offline SPA Engine (UPDATED PREMIUM VERSION)
   - Unique Patient ID
   - Auto Bill Number
   - Save Bills (IndexedDB)
   - Edit Bills
   - Tariff Master
   - Discount Engine
   - Insurance Mode
   - PREMIUM PDF EXPORT (H3 + T3 + TOT1/TOT3)
================================================================ */

/* ========== ELEMENT SELECTOR ========== */
const $ = (id) => document.getElementById(id);

const formatINR = (value = 0) => "₹" + Number(value || 0).toLocaleString("en-IN");
const safeNumber = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

/* ================================================================
   PAGE SWITCHING ENGINE
================================================================ */
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
const dbReq = indexedDB.open("KCC_Billing_DB", 3);

dbReq.onupgradeneeded = (e) => {
  DB = e.target.result;

  if (!DB.objectStoreNames.contains("bills"))
    DB.createObjectStore("bills", { keyPath: "bill_no" });

  if (!DB.objectStoreNames.contains("tariffs"))
    DB.createObjectStore("tariffs", { keyPath: "name" });

  if (!DB.objectStoreNames.contains("settings"))
    DB.createObjectStore("settings", { keyPath: "id" });
};

dbReq.onsuccess = (e) => {
  DB = e.target.result;
  loadSettings();
  loadTariffList();
  loadBillsList();
  prepareNewBill();
  seedDemoData();
};

/* ================================================================
   ID GENERATORS
================================================================ */
function generateRandomID(prefix) {
  return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
}

function generateBillNo() {
  return generateRandomID("KCC-BILL");
}

function generatePatientID() {
  return generateRandomID("KCC-PAT");
}

/* ================================================================
   DEFAULT DEMO DATA
================================================================ */
const demoCharges = [
  { desc: "Surgeon Fees", rate: 150000, qty: 1 },
  { desc: "Assistant Surgeon Fees", rate: 15000, qty: 1 },
  { desc: "DI Stenting", rate: 1300, qty: 1 },
  { desc: "Anaesthesia Fees", rate: 6000, qty: 1 },
  { desc: "ICU Charges", rate: 1500, qty: 2 },
  { desc: "Speciality Doctor ICU Visit", rate: 1500, qty: 2 },
  { desc: "Bed Charge", rate: 450, qty: 1 },
  { desc: "Nursing Charges", rate: 100, qty: 1 },
  { desc: "Medicine & Surgical", rate: 650, qty: 1 },
  { desc: "Diagnostic & Procedure", rate: 650, qty: 1 },
  { desc: "Lab Charges", rate: 800, qty: 1 },
  { desc: "Processing Charges", rate: 325, qty: 1 },
  { desc: "CGST 9%", rate: 9, qty: 2 },
  { desc: "SGST 9%", rate: 9, qty: 2 }
];

const demoBillData = {
  bill_no: "KCC-BILL-73579",
  patient_id: "MR-73579",
  name: "Mr. Praveen Kumar",
  age: 36,
  gender: "Male",
  doctor: "Dr. B.K. Srinivasan",
  doa: "2025-09-27",
  dod: "2025-09-28",
  adm_time: "09:30",
  dis_time: "11:00",
  date: "2025-09-28",
  time: "11:00",
  insurance: "no",
  discount_percent: 0,
  discount_amount: 21018,
  total: formatINR(160293),
  charges: demoCharges
};

/* ================================================================
   NEW BILL SETUP
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
   CHARGES TABLE
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

["discount_percent", "discount_amount"].forEach((id) =>
  $(id).addEventListener("input", updateTotals)
);

/* ================================================================
   TOTAL ENGINE
================================================================ */
function calculateTotals() {
  let total = 0;

  document.querySelectorAll("#chargesTable tbody tr").forEach((row) => {
    let rate = safeNumber(row.querySelector(".rate").value);
    let qty = safeNumber(row.querySelector(".qty").value);
    let line = rate * qty;

    row.querySelector(".rowTotal").textContent = formatINR(line);
    total += line;
  });

  let discountPercent = safeNumber($("discount_percent").value);
  let discountAmount = safeNumber($("discount_amount").value);

  if (discountPercent > 0) {
    discountAmount = (total * discountPercent) / 100;
    $("discount_amount").value = discountAmount.toFixed(0);
  }

  let finalTotal = Math.max(total - discountAmount, 0);

  return { total, discountAmount, finalTotal };
}

function updateTotals() {
  const { total, discountAmount, finalTotal } = calculateTotals();

  $("subTotal").textContent = formatINR(total);
  $("discountValue").textContent =
    discountAmount > 0 ? "-" + formatINR(discountAmount) : formatINR(0);
  $("grandTotal").textContent = formatINR(finalTotal);
}

/* ================================================================
   TARIFF MASTER
================================================================ */
$("saveTariff").addEventListener("click", saveTariff);

function saveTariff() {
  const name = $("tariff_name").value.trim();
  const rate = parseFloat($("tariff_rate").value);

  if (!name || !rate) return alert("Fill all tariff fields!");

  const tx = DB.transaction("tariffs", "readwrite");
  tx.objectStore("tariffs").put({ name, rate });

  $("tariff_name").value = "";
  $("tariff_rate").value = "";

  loadTariffList();
  loadTariffDropdown();
}

function loadTariffList() {
  const tx = DB.transaction("tariffs", "readonly");
  tx.objectStore("tariffs").getAll().onsuccess = (e) => {
    const table = $("tariffTable").querySelector("tbody");
    table.innerHTML = "";

    e.target.result.forEach((t) => {
      const tr = document.createElement("tr");
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
  const tx = DB.transaction("tariffs", "readwrite");
  tx.objectStore("tariffs").delete(name);
  loadTariffList();
}

function loadTariffDropdown() {
  const select = $("procedureSelect");
  select.innerHTML = `<option value="">Select Procedure (Tariff)</option>`;

  const tx = DB.transaction("tariffs", "readonly");
  tx.objectStore("tariffs").getAll().onsuccess = (e) => {
    e.target.result.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.name;
      opt.textContent = t.name;
      select.appendChild(opt);
    });
  };
}

$("procedureSelect").addEventListener("change", () => {
  const name = $("procedureSelect").value;
  if (!name) return;

  const tx = DB.transaction("tariffs", "readonly");
  tx.objectStore("tariffs").get(name).onsuccess = (e) => {
    const t = e.target.result;
    addRow(t.name, t.rate, 1);
  };
});

/* ================================================================
   SAVE BILL
================================================================ */
$("saveBill").addEventListener("click", saveBill);
$("loadDemoBill").addEventListener("click", () => openSavedBill(demoBillData.bill_no));

function saveBill() {
  updateTotals();

  let charges = [];
  document.querySelectorAll("#chargesTable tbody tr").forEach((r) => {
    charges.push({
      desc: r.querySelector(".desc").value,
      rate: r.querySelector(".rate").value,
      qty: r.querySelector(".qty").value
    });
  });

  const billData = {
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

  const tx = DB.transaction("bills", "readwrite");
  tx.objectStore("bills").put(billData);

  alert("Bill Saved Successfully");
  loadBillsList();
}

/* ================================================================
   BILLS HISTORY
================================================================ */
function loadBillsList() {
  const tx = DB.transaction("bills", "readonly");
  tx.objectStore("bills").getAll().onsuccess = (e) => {
    const table = $("billsTable").querySelector("tbody");
    table.innerHTML = "";

    e.target.result.forEach((b) => {
      const tr = document.createElement("tr");
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
  const tx = DB.transaction("bills", "readonly");
  tx.objectStore("bills").get(bill_no).onsuccess = (e) => {
    const b = e.target.result;
    if (!b) return alert("Bill not found.");

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
   SETTINGS ENGINE
================================================================ */
$("saveSettings").addEventListener("click", saveSettings);

function saveSettings() {
  const settings = {
    id: "hospital",
    name: $("set_h_name").value,
    address: $("set_h_address").value,
    phone: $("set_h_phone").value,
    email: $("set_h_email").value,
    gst: $("set_h_gst").value
  };

  const file = $("set_h_logo").files[0];
  if (file) {
    const reader = new FileReader();
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
  const tx = DB.transaction("settings", "readwrite");
  tx.objectStore("settings").put(settings);
  alert("Settings Saved");
}

function loadSettings() {
  const tx = DB.transaction("settings", "readonly");
  tx.objectStore("settings").get("hospital").onsuccess = (e) => {
    const s = e.target.result;
    if (!s) return;

    $("set_h_name").value = s.name || "";
    $("set_h_address").value = s.address || "";
    $("set_h_phone").value = s.phone || "";
    $("set_h_email").value = s.email || "";
    $("set_h_gst").value = s.gst || "";
  };
}

/* ================================================================
   DEMO DATA
================================================================ */
function seedDemoData() {
  const defaultSettings = {
    id: "hospital",
    name: "Krishna Kidney Centre",
    address: "No. 1/375-7, Rayakottai Main Road, Near Flyover, Krishnagiri - 635001",
    phone: "8300224589 / 9442318169",
    email: "bksrinivasan1980@yahoo.com",
    gst: ""
  };

  let tx = DB.transaction("settings", "readwrite");
  tx.objectStore("settings").get("hospital").onsuccess = (e) => {
    if (!e.target.result) tx.objectStore("settings").put(defaultSettings);
  };

  tx.oncomplete = loadSettings;

  let tariffTx = DB.transaction("tariffs", "readwrite");
  demoCharges.forEach((c) => tariffTx.objectStore("tariffs").put({ name: c.desc, rate: c.rate }));
  tariffTx.oncomplete = () => {
    loadTariffList();
    loadTariffDropdown();
  };

  let billTx = DB.transaction("bills", "readwrite");
  billTx.objectStore("bills").get(demoBillData.bill_no).onsuccess = (e) => {
    if (!e.target.result) billTx.objectStore("bills").put(demoBillData);
  };
  billTx.oncomplete = () => {
    loadBillsList();
    openSavedBill(demoBillData.bill_no);
  };
}

/* ================================================================
   PREMIUM PDF EXPORT ENGINE
================================================================ */
$("exportPDF").addEventListener("click", generatePremiumPDF);

function generatePremiumPDF() {
  const template = document.querySelector("#billTemplate");

  // ---------------------- FILL TEMPLATE ----------------------

  // Header will load from settings
  $("#b_billNo").textContent = $("bill_no").value;
  $("#b_billDate").textContent = $("bill_date").value;
  $("#b_patientID").textContent = $("patient_id").value;
  $("#b_insurance").textContent = $("insurance_mode").value.toUpperCase();

  $("#b_name").textContent = $("p_name").value;
  $("#b_ageGender").textContent = `${$("p_age").value} / ${$("p_gender").value}`;
  $("#b_doctor").textContent = $("p_doctor").value;

  $("#b_doa").textContent = $("p_doa").value;
  $("#b_dod").textContent = $("p_dod").value;
  $("#b_admTime").textContent = $("p_adm_time").value;
  $("#b_disTime").textContent = $("p_dis_time").value;

  const totals = calculateTotals();
  $("#b_grossTotal").textContent = formatINR(totals.total);
  $("#b_discount").textContent = formatINR(totals.discountAmount);
  $("#b_finalTotal").textContent = formatINR(totals.finalTotal);

  // Charges
  const body = $("#b_tableBody");
  body.innerHTML = "";
  document.querySelectorAll("#chargesTable tbody tr").forEach((r) => {
    const tr = document.createElement("tr");
    const rate = safeNumber(r.querySelector(".rate").value);
    const qty = safeNumber(r.querySelector(".qty").value);

    tr.innerHTML = `
      <td>${r.querySelector(".desc").value}</td>
      <td>${rate}</td>
      <td>${qty}</td>
      <td>${rate * qty}</td>
    `;
    body.appendChild(tr);
  });

  // Load hospital logo if saved
  const tx = DB.transaction("settings", "readonly");
  tx.objectStore("settings").get("hospital").onsuccess = (e) => {
    const s = e.target.result;
    if (s?.logo) $("#bill_hospital_logo").src = s.logo;

    // ---------------------- EXPORT PDF ----------------------
    html2pdf()
      .set({
        margin: 10,
        filename: $("bill_no").value + ".pdf",
        html2canvas: { scale: 2 },
        jsPDF: { unit: "pt", format: "a4", orientation: "portrait" }
      })
      .from(template)
      .save();
  };
}
