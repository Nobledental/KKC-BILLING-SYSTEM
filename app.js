/* ============================================================================
   KRISHNA KIDNEY CENTRE — BILLING OS (Ceramic V3)
   ULTRA-STABLE OFFLINE ENGINE (All hospital defaults + sample bill included)
============================================================================ */

const $ = (id) => document.getElementById(id);
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));

const INR = (v) => "₹" + Number(v || 0).toLocaleString("en-IN");
const num = (x) => (isNaN(parseFloat(x)) ? 0 : parseFloat(x));

/* ============================================================================
   NAVIGATION
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
const req = indexedDB.open("KCC_Billing_DB_V4", 7);

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

  preloadHospitalDefaults();
  preloadDoctorDefaults();
  preloadTariffDefaults();

  loadSettings();
  loadTariffList();
  loadTariffDropdown();
  loadBillsList();
  loadDoctorsTable();
  loadStaffTable();

  prepareNewBill();
};

/* ============================================================================
   DEFAULT DATA — FIRST RUN ONLY (Hospital + Doctor + Tariff)
============================================================================ */

function preloadHospitalDefaults() {
  const tx = DB.transaction("settings", "readonly");
  tx.objectStore("settings").get("hospital").onsuccess = (e) => {
    if (e.target.result) return;

    const hospital = {
      id: "hospital",
      name: "Krishna Kidney Centre",
      address:
        "No.1/375-7, Rayakottai Main Road,\n[Near Flyover], Krishnagiri - 635001.",
      phone: "8300224569 / 9442318169",
      email: "bksrinivasan1980@yahoo.co.in",
      gst: "",
      logo: "assets/logo.png",
      tamil:
        "பார்வை நுரை, காலை 9.00–9.00 மணியரை\nஞாயிறு: முன் பதிவு மட்டும்"
    };

    DB.transaction("settings", "readwrite")
      .objectStore("settings")
      .put(hospital);
  };
}

function preloadDoctorDefaults() {
  const tx = DB.transaction("doctors", "readonly");
  tx.objectStore("doctors").getAll().onsuccess = (e) => {
    if (e.target.result.length) return;

    const def = {
      name: "Dr. B.K. SRINIVASAN",
      specialization: "M.S., M.Ch (Urology) — Urologist & Andrologist",
      phone: "8300224569",
      email: "bksrinivasan1980@yahoo.co.in",
      reg: "73759"
    };

    DB.transaction("doctors", "readwrite")
      .objectStore("doctors")
      .put(def);
  };
}

function preloadTariffDefaults() {
  const tx = DB.transaction("tariffs", "readonly");
  tx.objectStore("tariffs").getAll().onsuccess = (e) => {
    if (e.target.result.length) return;

    const list = [
      ["SURGEON FEES", 50000],
      ["ASSISTANT SURGEON FEES", 16000],
      ["DJ STENDING", 12000],
      ["ANAESTHESIA FEES", 16000],
      ["ICU CHARGE", 5000],
      ["DOCTOR CHARGE", 1200],
      ["SPECIALITY DOCTOR ICU VISIT", 1500],
      ["BED CHARGE", 1500],
      ["NURSING CHARGES", 450],
      ["OT CHARGE", 27000],
      ["PREANESTHETIC CHECKUP", 1200],
      ["MEDICINE CHARGE", 19243],
      ["LAB AMOUNT", 4750]
    ];

    const store = DB.transaction("tariffs", "readwrite").objectStore("tariffs");
    list.forEach(([name, rate]) => store.put({ name, rate }));
  };
}

/* ============================================================================
   BILL NUMBER GENERATOR (Incremental & Offline)
============================================================================ */
function nextBillNo(cb) {
  const key = "bill_counter";

  const tx = DB.transaction("settings", "readwrite");
  const store = tx.objectStore("settings");

  store.get(key).onsuccess = (e) => {
    let x = e.target.result ? e.target.result.value : 1;
    store.put({ id: key, value: x + 1 });

    cb(`KCC-${String(x).padStart(5, "0")}`);
  };
}

function nextUHID(cb) {
  const key = "uhid_counter";

  const tx = DB.transaction("settings", "readwrite");
  const store = tx.objectStore("settings");

  store.get(key).onsuccess = (e) => {
    let x = e.target.result ? e.target.result.value : 1;
    store.put({ id: key, value: x + 1 });

    cb(`MR-${String(x).padStart(5, "0")}`);
  };
}

/* ============================================================================
   NEW BILL PREPARATION
============================================================================ */
function prepareNewBill() {
  nextBillNo((id) => ($("bill_no").value = id));
  nextUHID((id) => ($("patient_id").value = id));

  $("bill_date").value = new Date().toISOString().slice(0, 10);
  $("bill_time").value = new Date().toTimeString().slice(0, 5);

  $("discount_percent").value = 0;
  $("discount_amount").value = 0;
  $("insurance_mode").value = "no";

  qs("#chargesTable tbody").innerHTML = "";
  updateTotals();
}

/* ============================================================================
   ADD ROWS
============================================================================ */
$("addRowBtn").onclick = () => addRow();

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
   TOTAL ENGINE
============================================================================ */
["discount_percent", "discount_amount"].forEach((id) =>
  $(id).addEventListener("input", updateTotals)
);

function calculateTotals() {
  let gross = 0;

  qsa("#chargesTable tbody tr").forEach((row) => {
    const rate = num(row.querySelector(".rate").value);
    const qty = num(row.querySelector(".qty").value);
    const t = rate * qty;

    row.querySelector(".rowTotal").textContent = INR(t);
    gross += t;
  });

  let dP = num($("discount_percent").value);
  let dA = num($("discount_amount").value);

  if (dP > 0) {
    dA = (gross * dP) / 100;
    $("discount_amount").value = dA.toFixed(0);
  }

  return {
    gross,
    dA,
    final: Math.max(gross - dA, 0)
  };
}

function updateTotals() {
  const t = calculateTotals();
  $("subTotal").textContent = INR(t.gross);
  $("discountValue").textContent =
    t.dA > 0 ? "-" + INR(t.dA) : INR(0);
  $("grandTotal").textContent = INR(t.final);
}

/* ============================================================================
   TARIFF
============================================================================ */
$("saveTariff").onclick = saveTariff;

function saveTariff() {
  const name = $("tariff_name").value.trim();
  const rate = num($("tariff_rate").value);
  if (!name || !rate) return alert("Enter Tariff Name & Rate");

  DB.transaction("tariffs", "readwrite")
    .objectStore("tariffs")
    .put({ name, rate });

  $("tariff_name").value = "";
  $("tariff_rate").value = "";
  loadTariffList();
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
  DB.transaction("tariffs", "readwrite")
    .objectStore("tariffs")
    .delete(name);

  loadTariffList();
}

function loadTariffDropdown() {
  const sel = $("procedureSelect");
  sel.innerHTML = `<option value="">Select Procedure</option>`;

  const tx = DB.transaction("tariffs", "readonly");
  tx.objectStore("tariffs").getAll().onsuccess = (e) => {
    e.target.result.forEach((t) => {
      let opt = document.createElement("option");
      opt.value = t.name;
      opt.textContent = t.name;
      sel.appendChild(opt);
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

  const charges = qsa("#chargesTable tbody tr").map((r) => ({
    desc: r.querySelector(".desc").value,
    rate: r.querySelector(".rate").value,
    qty: r.querySelector(".qty").value
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
    discount_percent: $("discount_percent").value,
    discount_amount: $("discount_amount").value,
    total: $("grandTotal").textContent,
    insurance: $("insurance_mode").value,
    charges,
    paid: true
  };

  DB.transaction("bills", "readwrite")
    .objectStore("bills")
    .put(bill);

  alert("Bill saved successfully.");
  loadBillsList();
}

/* ============================================================================
   BILL HISTORY
============================================================================ */
function loadBillsList() {
  DB.transaction("bills", "readonly")
    .objectStore("bills")
    .getAll().onsuccess = (e) => {
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
            <td>
              <button class="btn" onclick="openBill('${b.bill_no}')">Open</button>
            </td>
          </tr>
        `;
      });
    };
}

function openBill(id) {
  DB.transaction("bills", "readonly")
    .objectStore("bills")
    .get(id).onsuccess = (e) => {
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
   ADMIN — DOCTORS
============================================================================ */
function loadDoctorsTable() {
  const tx = DB.transaction("doctors", "readonly");
  tx.objectStore("doctors").getAll().onsuccess = (e) => {
    const table = $("doctorTable").querySelector("tbody");
    table.innerHTML = "";

    e.target.result.forEach((d) => {
      table.innerHTML += `
        <tr>
          <td>${d.name}</td>
          <td>${d.specialization}</td>
          <td>${d.phone}</td>
          <td>${d.email}</td>
          <td></td>
        </tr>
      `;
    });
  };
}

$("saveDoctor").onclick = () => {
  const doc = {
    name: $("doc_name").value,
    specialization: $("doc_specialization").value,
    phone: $("doc_phone").value,
    email: $("doc_email").value
  };

  DB.transaction("doctors", "readwrite")
    .objectStore("doctors")
    .put(doc);

  loadDoctorsTable();
  alert("Doctor saved.");
};

/* ============================================================================
   ADMIN — STAFF
============================================================================ */
function loadStaffTable() {
  const tx = DB.transaction("staff", "readonly");
  tx.objectStore("staff").getAll().onsuccess = (e) => {
    const table = $("staffTable").querySelector("tbody");
    table.innerHTML = "";

    e.target.result.forEach((s) => {
      table.innerHTML += `
        <tr>
          <td>${s.name}</td>
          <td>${s.role}</td>
          <td>${s.phone}</td>
          <td>${s.email}</td>
          <td></td>
        </tr>
      `;
    });
  };
}

$("saveStaff").onclick = () => {
  const st = {
    name: $("staff_name").value,
    role: $("staff_role").value,
    phone: $("staff_phone").value,
    email: $("staff_email").value
  };

  DB.transaction("staff", "readwrite")
    .objectStore("staff")
    .put(st);

  loadStaffTable();
  alert("Staff saved.");
};

/* ============================================================================
   SETTINGS
============================================================================ */
$("saveSettings").onclick = saveSettings;

function saveSettings() {
  const d = {
    id: "hospital",
    name: $("set_h_name").value,
    address: $("set_h_address").value,
    phone: $("set_h_phone").value,
    email: $("set_h_email").value,
    gst: $("set_h_gst").value
  };

  const file = $("set_h_logo").files[0];
  if (file) {
    const r = new FileReader();
    r.onload = () => {
      d.logo = r.result;
      saveSettingsFinal(d);
    };
    r.readAsDataURL(file);
  } else saveSettingsFinal(d);
}

function saveSettingsFinal(d) {
  DB.transaction("settings", "readwrite").objectStore("settings").put(d);
  alert("Settings updated.");
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
   LOAD DEMO BILL (PATIENT FROM SCANNED IMAGE)
============================================================================ */
$("loadDemoBill").onclick = () => {
  openPage("newBillPage");

  $("p_name").value = "Mr. Praveen Kumar";
  $("p_age").value = "46";
  $("p_gender").value = "Male";
  $("p_doctor").value = "Dr. B.K. SRINIVASAN";

  $("p_doa").value = "2025-09-27";
  $("p_dod").value = "2025-09-28";

  $("p_adm_time").value = "09:30";
  $("p_dis_time").value = "12:00";

  tbody.innerHTML = "";

  const list = [
    ["SURGEON FEES", 50000, 1],
    ["ASSISTANT SURGEON FEES", 16000, 1],
    ["DJ STENDING", 12000, 1],
    ["ANAESTHESIA FEES", 16000, 1],
    ["ICU CHARGE", 5000, 1],
    ["DOCTOR CHARGE", 1200, 3],
    ["SPECIALITY DOCTOR ICU VISIT", 1500, 1],
    ["BED CHARGE", 1500, 2],
    ["NURSING CHARGES", 450, 2],
    ["OT CHARGE", 27000, 1],
    ["PREANESTHETIC CHECKUP", 1200, 1],
    ["MEDICINE CHARGE", 19243, 1],
    ["LAB AMOUNT", 4750, 1]
  ];

  list.forEach((i) => addRow(i[0], i[1], i[2]));

  updateTotals();
};

/* ============================================================================
   PDF EXPORT → Delegated to pdf-engine.js
============================================================================ */
$("exportPDF").onclick = () => exportPremiumPDF();

/* ============================================================================
   ADMIN TAB SWITCHING
============================================================================ */
document.querySelectorAll(".admin-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".admin-tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    document
      .querySelectorAll(".admin-tab-content")
      .forEach((box) => box.classList.remove("active-admin-tab"));

    $(tab.dataset.adminTarget).classList.add("active-admin-tab");
  });
});
