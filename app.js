/* ============================================================================
   KCC BILLING OS — APP ENGINE (V10 ULTRA)
   Works with: pdf-engine.js + preview-engine.js + amount-in-words.js
============================================================================ */

/* -------------------------------
   QUICK HELPERS
--------------------------------*/
const qs = (x) => document.querySelector(x);
const qsa = (x) => [...document.querySelectorAll(x)];

function set(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value || "";
}

function fmtINR(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}

/* ============================================================================
   PAGE NAVIGATION
============================================================================ */
qsa(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    qsa(".nav-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const tgt = btn.dataset.target;
    qsa(".page").forEach((pg) => pg.classList.remove("active-page"));
    qs(`#${tgt}`).classList.add("active-page");
  });
});

/* ============================================================================
   INDEXEDDB (Bills + Tariffs + Doctors + Staff + Roles + Receipts + Advanced)
============================================================================ */
let db;

const DB_NAME = "kcc_billing_os_v10";
const DB_VERSION = 10;

const stores = [
  "bills",
  "tariffs",
  "doctors",
  "staff",
  "roles",
  "receipts",
  "advanced",
];

function initDB() {
  const req = indexedDB.open(DB_NAME, DB_VERSION);

  req.onupgradeneeded = (e) => {
    db = e.target.result;
    stores.forEach((s) => {
      if (!db.objectStoreNames.contains(s)) {
        db.createObjectStore(s, { keyPath: "id", autoIncrement: true });
      }
    });
  };

  req.onsuccess = (e) => {
    db = e.target.result;
    loadTariffs();
    loadDoctors();
    loadStaff();
    loadRoles();
    loadReceipts();
    loadBills();
  };
}

initDB();

/* -------------------------------
   DB WRITE
--------------------------------*/
function addItem(store, data) {
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).add(data);
    tx.oncomplete = () => resolve(true);
  });
}

function updateItem(store, data) {
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(data);
    tx.oncomplete = () => resolve(true);
  });
}

/* -------------------------------
   DB READ LIST
--------------------------------*/
function getAll(store) {
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
  });
}

/* ============================================================================
   BILL NUMBER + RECEIPT NUMBER GENERATOR
============================================================================ */

/* ---- BILL NO (Simple Increment) ---- */
async function nextBillNo() {
  const bills = await getAll("bills");
  return "KCC-B-" + String(bills.length + 1).padStart(4, "0");
}

/* ---- RECEIPT NO — FORMAT B (Complex Random) ---- */
function generateReceiptNo() {
  const randomSet = () =>
    Math.random().toString(36).substring(2, 5).toUpperCase();

  const part1 = randomSet(); // ABC
  const part2 = Math.floor(100 + Math.random() * 900); // 100–999
  const part3 = randomSet(); // XYZ

  return `RC-${part1}${part2}${part3}`;
}

/* ============================================================================
   NEW BILL INITIALIZATION
============================================================================ */

async function prepareNewBill() {
  qs("#bill_no").value = await nextBillNo();
  qs("#patient_id").value = "UHID-" + Math.floor(Math.random() * 900000);

  qs("#bill_date").value = new Date().toISOString().substr(0, 10);
  qs("#bill_time").value = new Date().toTimeString().substr(0, 5);

  qs("#chargesTable tbody").innerHTML = "";
  qs("#discount_percent").value = "";
  qs("#discount_amount").value = "";
  qs("#insurance_mode").value = "no";

  calculateTotals();
}

/* ============================================================================
   TARIFF SYSTEM
============================================================================ */

qs("#saveTariff").onclick = async () => {
  const item = {
    category: qs("#tariff_category").value.trim(),
    name: qs("#tariff_name").value.trim(),
    rate: Number(qs("#tariff_rate").value),
    hsn: qs("#tariff_hsn").value.trim(),
  };

  await addItem("tariffs", item);
  loadTariffs();
};

async function loadTariffs() {
  const list = await getAll("tariffs");

  const table = qs("#tariffTable tbody");
  table.innerHTML = "";

  const select = qs("#procedureSelect");
  select.innerHTML = `<option value="">Select Tariff</option>`;

  list.forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.category}</td>
      <td>${t.name}</td>
      <td>${fmtINR(t.rate)}</td>
      <td>${t.hsn}</td>
      <td><button class="btn" onclick="deleteTariff(${t.id})">Delete</button></td>
    `;
    table.appendChild(tr);

    const opt = document.createElement("option");
    opt.value = t.id;
    opt.innerText = `${t.category} — ${t.name}`;
    select.appendChild(opt);
  });
}

function deleteTariff(id) {
  const tx = db.transaction("tariffs", "readwrite");
  tx.objectStore("tariffs").delete(id);
  tx.oncomplete = loadTariffs;
}

/* ============================================================================
   ADDING CHARGES TO A BILL
============================================================================ */

qs("#addRowBtn").onclick = () => {
  addEmptyRow();
};

function addEmptyRow() {
  const tbody = qs("#chargesTable tbody");
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td><input class="desc"></td>
    <td><input class="rate" type="number"></td>
    <td><input class="qty" type="number" value="1"></td>
    <td class="total">0</td>
    <td><button class="btn" onclick="this.parentNode.parentNode.remove(); calculateTotals();">✕</button></td>
  `;

  tbody.appendChild(tr);
}

/* ---- When a tariff is selected ---- */
qs("#procedureSelect").addEventListener("change", async function () {
  if (!this.value) return;

  const store = db.transaction("tariffs", "readonly").objectStore("tariffs");
  const req = store.get(Number(this.value));

  req.onsuccess = () => {
    const t = req.result;
    const tbody = qs("#chargesTable tbody");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input class="desc" value="${t.name}"></td>
      <td><input class="rate" type="number" value="${t.rate}"></td>
      <td><input class="qty" type="number" value="1"></td>
      <td class="total">${fmtINR(t.rate)}</td>
      <td>${t.hsn}</td>
    `;

    tbody.appendChild(tr);
    calculateTotals();
  };
});

/* ============================================================================
   TOTAL CALCULATION
============================================================================ */

function calculateTotals() {
  let gross = 0;

  qsa("#chargesTable tbody tr").forEach((tr) => {
    const rate = Number(tr.querySelector(".rate")?.value || 0);
    const qty = Number(tr.querySelector(".qty")?.value || 0);
    const total = rate * qty;

    tr.querySelector(".total").innerText = fmtINR(total);
    gross += total;
  });

  const disP = Number(qs("#discount_percent").value || 0);
  const disA = Number(qs("#discount_amount").value || 0);

  let discount = disA > 0 ? disA : (gross * disP) / 100;

  let net = gross - discount;

  qs("#subTotal").innerText = fmtINR(gross);
  qs("#discountValue").innerText = fmtINR(discount);
  qs("#grandTotal").innerText = fmtINR(net);

  return { gross, discount, net };
}

["discount_percent", "discount_amount"].forEach((id) => {
  qs(`#${id}`).addEventListener("input", calculateTotals);
});

/* ============================================================================
   SAVE BILL
============================================================================ */

qs("#saveBill").onclick = async () => {
  const totals = calculateTotals();

  let charges = [];

  qsa("#chargesTable tbody tr").forEach((tr) => {
    charges.push({
      desc: tr.querySelector(".desc")?.value || "",
      rate: Number(tr.querySelector(".rate")?.value || 0),
      qty: Number(tr.querySelector(".qty")?.value || 0),
      total: (Number(tr.querySelector(".rate")?.value || 0)) *
             (Number(tr.querySelector(".qty")?.value || 0)),
    });
  });

  const bill = {
    bill_no: qs("#bill_no").value,
    date: qs("#bill_date").value,
    time: qs("#bill_time").value,

    patient_id: qs("#patient_id").value,
    name: qs("#p_name").value,
    age: qs("#p_age").value,
    gender: qs("#p_gender").value,
    doctor: qs("#p_doctor").value,

    doa: qs("#p_doa").value,
    dod: qs("#p_dod").value,
    adm_time: qs("#p_adm_time").value,
    dis_time: qs("#p_dis_time").value,

    insurance: qs("#insurance_mode").value,

    charges,
    totals,
  };

  await addItem("bills", bill);
  loadBills();

  alert("Bill Saved!");
};

/* ============================================================================
   BILL HISTORY
============================================================================ */

async function loadBills() {
  const list = await getAll("bills");

  const table = qs("#billsTable tbody");
  table.innerHTML = "";

  list.forEach((b) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${b.bill_no}</td>
      <td>${b.patient_id}</td>
      <td>${b.name}</td>
      <td>${b.date}</td>
      <td>${fmtINR(b.totals?.net)}</td>
      <td><button class="btn" onclick="openBillPreview('${b.bill_no}')">Preview</button></td>
    `;

    table.appendChild(tr);
  });
}

/* ============================================================================
   ADVANCED DATA SAVE
============================================================================ */

qs("#saveAdvancedData").onclick = async () => {
  const data = {
    latest: true,
    address: qs("#ex_address").value,
    phone: qs("#ex_phone").value,
    aadhaar: qs("#ex_aadhaar").value,
    ipno: qs("#ex_ipno").value,
    relation: qs("#ex_relation").value,
    policy: qs("#ex_policy").value,
    ins_company: qs("#ex_ins_company").value,

    room: qs("#ex_room").value,
    bed: qs("#ex_bed").value,
    department: qs("#ex_department").value,
    consultant: qs("#ex_consultant").value,
    nurse: qs("#ex_nurse").value,
    admtype: qs("#ex_admtype").value,

    gst: qs("#ex_gst").value,
    cgst: qs("#ex_cgst").value,
    sgst: qs("#ex_sgst").value,
    billOfficer: qs("#ex_billofficer").value,
    counter: qs("#ex_counter").value,
    paymentmethod: qs("#ex_paymentmethod").value,
    txnid: qs("#ex_txnid").value,
    upiid: qs("#ex_upiid").value,

    diagnosis: qs("#ex_diagnosis").value,
    procedure: qs("#ex_procedure").value,
    icd: qs("#ex_icd").value,
    clinnotes: qs("#ex_clinnotes").value,
  };

  await addItem("advanced", data);
  alert("Advanced data saved.");
};

/* ============================================================================
   RECEIPT MANAGEMENT
============================================================================ */

qs("#rc_addBtn").onclick = async () => {
  const rc = {
    rc_no: generateReceiptNo(),
    date: qs("#rc_date").value,
    amount: Number(qs("#rc_amount").value),
    mode: qs("#rc_mode").value,
    bill_no: qs("#rc_billno").value,
  };

  await addItem("receipts", rc);
  qs("#rc_no").value = "";

  loadReceipts();
  alert("Receipt Added!");
};

async function loadReceipts() {
  const list = await getAll("receipts");
  const table = qs("#receiptsTable tbody");
  table.innerHTML = "";

  list.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.rc_no}</td>
      <td>${r.date}</td>
      <td>${fmtINR(r.amount)}</td>
      <td>${r.mode}</td>
      <td>${r.bill_no}</td>
      <td></td>
    `;
    table.appendChild(tr);
  });
}

/* ============================================================================
   EXPOSED FOR PDF ENGINE
============================================================================ */

window._getBillByNo = async function (billNo) {
  const list = await getAll("bills");
  return list.find((b) => b.bill_no === billNo);
};

window._getReceiptsForBill = async function (billNo) {
  const list = await getAll("receipts");
  return list.filter((r) => r.bill_no === billNo);
};

window._getLatestAdvanced = async function () {
  const list = await getAll("advanced");
  return list[list.length - 1] || {};
};

