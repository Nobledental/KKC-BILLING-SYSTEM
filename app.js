/* ============================================================================
   KRISHNA KIDNEY CENTRE — BILLING OS (Ceramic V3)
   VisionOS Floating UI + HealthFlo PDF Engine
   Features:
   - Auto Bill No + Patient ID
   - Tariff Master
   - Admin: Doctors + Staff
   - Discount Engine
   - Insurance Mode
   - Save/Edit Bills (IndexedDB)
   - A4 Multi-page PDF Export (Teal + Navy)
============================================================================ */

/* ---------- SHORTHANDS ---------- */
const $ = (id) => document.getElementById(id);
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));

/* ---------- CURRENCY ---------- */
const INR = (v) => "₹" + Number(v || 0).toLocaleString("en-IN");
const num = (x) => (isNaN(parseFloat(x)) ? 0 : parseFloat(x));

/* ============================================================================
   PAGE SWITCHING
============================================================================ */
qsa(".nav-btn").forEach((btn) =>
  btn.addEventListener("click", () => {
    qsa(".nav-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    openPage(btn.dataset.target);
  })
);

function openPage(id) {
  qsa(".page").forEach((p) => p.classList.remove("active-page"));
  $(id).classList.add("active-page");
}

/* ============================================================================
   INDEXEDDB SETUP
============================================================================ */
let DB;
const req = indexedDB.open("KCC_Billing_DB_V3", 4);

req.onupgradeneeded = (e) => {
  DB = e.target.result;

  if (!DB.objectStoreNames.contains("bills"))
    DB.createObjectStore("bills", { keyPath: "bill_no" });

  if (!DB.objectStoreNames.contains("tariffs"))
    DB.createObjectStore("tariffs", { keyPath: "name" });

  if (!DB.objectStoreNames.contains("settings"))
    DB.createObjectStore("settings", { keyPath: "id" });

  if (!DB.objectStoreNames.contains("doctors"))
    DB.createObjectStore("doctors", { keyPath: "id", autoIncrement: true });

  if (!DB.objectStoreNames.contains("staff"))
    DB.createObjectStore("staff", { keyPath: "id", autoIncrement: true });
};

req.onsuccess = (e) => {
  DB = e.target.result;
  loadSettings();
  loadTariffList();
  loadBillsList();
  loadDoctors();
  loadStaff();
  prepareNewBill();
};

/* ============================================================================
   AUTO ID GENERATORS
============================================================================ */
const randomID = (p) => `${p}-${Math.floor(100000 + Math.random() * 900000)}`;
const newBillNo = () => randomID("KCC-BILL");
const newPatientID = () => randomID("MR");

/* ============================================================================
   CREATE NEW BILL
============================================================================ */
function prepareNewBill() {
  $("bill_no").value = newBillNo();
  $("patient_id").value = newPatientID();
  $("bill_date").value = new Date().toISOString().slice(0, 10);
  $("bill_time").value = new Date().toTimeString().slice(0, 5);

  qs("#chargesTable tbody").innerHTML = "";
  updateTotals();
}

$("addRowBtn").onclick = () => addRow();

/* ============================================================================
   ADD ROW TO CHARGES TABLE
============================================================================ */
const tbody = qs("#chargesTable tbody");

function addRow(desc = "", rate = "", qty = 1) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input class="desc" value="${desc}"></td>
    <td><input class="rate" type="number" value="${rate}"></td>
    <td><input class="qty" type="number" value="${qty}"></td>
    <td class="rowTotal">₹0</td>
    <td><button class="delete-row">X</button></td>
  `;
  tbody.appendChild(tr);
  updateTotals();
}

tbody.addEventListener("input", updateTotals);
tbody.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-row")) {
    e.target.closest("tr").remove();
    updateTotals();
  }
});

/* ============================================================================
   DISCOUNT + TOTAL ENGINE
============================================================================ */
["discount_percent", "discount_amount"].forEach((id) =>
  $(id).addEventListener("input", updateTotals)
);

function calculateTotals() {
  let gross = 0;

  qsa("#chargesTable tbody tr").forEach((row) => {
    const rate = num(row.querySelector(".rate").value);
    const qty = num(row.querySelector(".qty").value);
    const total = rate * qty;

    row.querySelector(".rowTotal").textContent = INR(total);
    gross += total;
  });

  let dP = num($("discount_percent").value);
  let dA = num($("discount_amount").value);

  if (dP > 0) {
    dA = (gross * dP) / 100;
    $("discount_amount").value = dA.toFixed(0);
  }

  const final = Math.max(gross - dA, 0);

  return { gross, dA, final };
}

function updateTotals() {
  const t = calculateTotals();
  $("subTotal").textContent = INR(t.gross);
  $("discountValue").textContent = t.dA ? "-" + INR(t.dA) : INR(0);
  $("grandTotal").textContent = INR(t.final);
}

/* ============================================================================
   TARIFF MASTER
============================================================================ */
$("saveTariff").onclick = saveTariff;

function saveTariff() {
  const name = $("tariff_name").value.trim();
  const rate = num($("tariff_rate").value);

  if (!name || !rate) return alert("Enter Tariff Name & Rate");

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
      table.innerHTML += `
        <tr>
          <td>${t.name}</td>
          <td>${INR(t.rate)}</td>
          <td><button class="delete-row" onclick="deleteTariff('${t.name}')">Delete</button></td>
        </tr>
      `;
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
  select.innerHTML = `<option value="">Select Procedure</option>`;

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

$("procedureSelect").onchange = () => {
  const name = $("procedureSelect").value;
  if (!name) return;

  const tx = DB.transaction("tariffs", "readonly");
  tx.objectStore("tariffs").get(name).onsuccess = (e) => {
    addRow(name, e.target.result.rate, 1);
  };
};

/* ============================================================================
   SAVE BILL
============================================================================ */
$("saveBill").onclick = saveBill;

function saveBill() {
  updateTotals();

  const rows = qsa("#chargesTable tbody tr").map((r) => ({
    desc: r.querySelector(".desc").value,
    rate: r.querySelector(".rate").value,
    qty: r.querySelector(".qty").value,
  }));

  const bill = {
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
    insurance: $("insurance_mode").value,
    discount_percent: $("discount_percent").value,
    discount_amount: $("discount_amount").value,
    total: $("grandTotal").textContent,
    charges: rows,
  };

  const tx = DB.transaction("bills", "readwrite");
  tx.objectStore("bills").put(bill);

  alert("Bill Saved Successfully.");
  loadBillsList();
}

/* ============================================================================
   BILL HISTORY
============================================================================ */
function loadBillsList() {
  const tx = DB.transaction("bills", "readonly");
  tx.objectStore("bills").getAll().onsuccess = (e) => {
    const table = $("billsTable").querySelector("tbody");
    table.innerHTML = "";

    e.target.result.forEach((b) => {
      table.innerHTML += `
        <tr>
          <td>${b.bill_no}</td>
          <td>${b.patient_id}</td>
          <td>${b.name}</td>
          <td>${b.date}</td>
          <td>${b.total}</td>
          <td><button class="btn" onclick="openBill('${b.bill_no}')">Open</button></td>
        </tr>
      `;
    });
  };
}

function openBill(id) {
  const tx = DB.transaction("bills", "readonly");
  tx.objectStore("bills").get(id).onsuccess = (e) => {
    const b = e.target.result;
    if (!b) return;

    openPage("newBillPage");

    $("bill_no").value = b.bill_no;
    $("patient_id").value = b.patient_id;
    $("p_name").value = b.name;
    $("p_age").value = b.age;
    $("p_gender").value = b.gender;
    $("p_doctor").value = b.doctor;
    $("p_doa").value = b.doa;
    $("p_dod").value = b.dod;
    $("p_adm_time").value = b.adm;
    $("p_dis_time").value = b.dis;

    $("bill_date").value = b.date;
    $("bill_time").value = b.time;

    $("discount_percent").value = b.discount_percent;
    $("discount_amount").value = b.discount_amount;
    $("insurance_mode").value = b.insurance;

    tbody.innerHTML = "";
    b.charges.forEach((c) => addRow(c.desc, c.rate, c.qty));

    updateTotals();
  };
}

/* ============================================================================
   ADMIN — DOCTOR MASTER
============================================================================ */
function loadDoctors() {
  const tx = DB.transaction("doctors", "readonly");
  tx.objectStore("doctors").getAll().onsuccess = (e) => {
    $("doctorList").innerHTML = "";

    e.target.result.forEach((d) => {
      $("doctorList").innerHTML += `
        <li>${d.name} — ${d.role}</li>
      `;
    });
  };
}

/* ============================================================================
   ADMIN — STAFF MASTER
============================================================================ */
function loadStaff() {
  const tx = DB.transaction("staff", "readonly");
  tx.objectStore("staff").getAll().onsuccess = (e) => {
    $("staffList").innerHTML = "";

    e.target.result.forEach((s) => {
      $("staffList").innerHTML += `
        <li>${s.name} — ${s.designation}</li>
      `;
    });
  };
}

/* ============================================================================
   SETTINGS
============================================================================ */
$("saveSettings").onclick = saveSettings;

function saveSettings() {
  const data = {
    id: "hospital",
    name: $("set_h_name").value,
    address: $("set_h_address").value,
    phone: $("set_h_phone").value,
    email: $("set_h_email").value,
    gst: $("set_h_gst").value,
  };

  const file = $("set_h_logo").files[0];
  if (file) {
    const r = new FileReader();
    r.onload = () => {
      data.logo = r.result;
      saveSettingsFinal(data);
    };
    r.readAsDataURL(file);
  } else {
    saveSettingsFinal(data);
  }
}

function saveSettingsFinal(data) {
  DB.transaction("settings", "readwrite")
    .objectStore("settings")
    .put(data);
  alert("Settings Updated");
}

function loadSettings() {
  DB.transaction("settings", "readonly")
    .objectStore("settings")
    .get("hospital").onsuccess = (e) => {
      const s = e.target.result || {};
      $("set_h_name").value = s.name || "";
      $("set_h_address").value = s.address || "";
      $("set_h_phone").value = s.phone || "";
      $("set_h_email").value = s.email || "";
      $("set_h_gst").value = s.gst || "";
    };
}

/* ============================================================================
   PREMIUM PDF ENGINE — NEXT FILE
============================================================================ */
$("exportPDF").onclick = () => exportPremiumPDF();

/* NEXT MESSAGE → I will deliver FULL premium pdf-engine.js */
