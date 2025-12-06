/* ============================================================================
   KRISHNA KIDNEY CENTRE — Billing OS Engine
   CERAMIC v2 — FULL OFFLINE SPA
   - IndexedDB for bills, tariffs, settings
   - Auto IDs
   - Charges engine
   - PDF Engine (Exact Hybrid Layout — Mode C)
============================================================================ */

/* =============================== SHORTCUT =============================== */
const $ = (id) => document.getElementById(id);

/* =============================== PAGE SWITCHING =============================== */
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

/* =============================== INDEXEDDB =============================== */
let DB;

let req = indexedDB.open("KCC_Billing_OS", 3);

req.onupgradeneeded = function (e) {
  DB = e.target.result;

  if (!DB.objectStoreNames.contains("bills")) {
    DB.createObjectStore("bills", { keyPath: "bill_no" });
  }
  if (!DB.objectStoreNames.contains("tariffs")) {
    DB.createObjectStore("tariffs", { keyPath: "name" });
  }
  if (!DB.objectStoreNames.contains("settings")) {
    DB.createObjectStore("settings", { keyPath: "id" });
  }
};

req.onsuccess = function (e) {
  DB = e.target.result;
  loadTariffList();
  loadBillsList();
  loadSettings();
  prepareNewBill();
};

/* =============================== ID GENERATORS =============================== */
function randomID(prefix) {
  return prefix + "-" + Math.floor(100000 + Math.random() * 900000);
}

function generateBillNo() { return randomID("KCC-BILL"); }
function generatePatientID() { return randomID("KCC-PAT"); }

/* =============================== NEW BILL SETUP =============================== */
function prepareNewBill() {
  $("bill_no").value = generateBillNo();
  $("patient_id").value = generatePatientID();

  $("bill_date").value = new Date().toISOString().slice(0, 10);
  $("bill_time").value = new Date().toTimeString().slice(0, 5);

  tableBody.innerHTML = "";
  updateTotals();
}

const tableBody = document.querySelector("#chargesTable tbody");

/* =============================== ROW ENGINE =============================== */
$("addRowBtn").addEventListener("click", () => addRow());

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

/* =============================== TOTAL ENGINE =============================== */
function updateTotals() {
  let total = 0;

  document.querySelectorAll("#chargesTable tbody tr").forEach((row) => {
    let rate = parseFloat(row.querySelector(".rate").value || 0);
    let qty = parseFloat(row.querySelector(".qty").value || 0);
    let t = rate * qty;

    row.querySelector(".rowTotal").textContent = "₹" + t.toLocaleString("en-IN");
    total += t;
  });

  let discountPercent = parseFloat($("discount_percent").value || 0);
  let discountAmount = parseFloat($("discount_amount").value || 0);

  if (discountPercent > 0) discountAmount = (total * discountPercent) / 100;

  let finalTotal = total - discountAmount;

  $("grandTotal").textContent = "₹" + finalTotal.toLocaleString("en-IN");
}

/* =============================== TARIFF ENGINE =============================== */
$("saveTariff").addEventListener("click", saveTariff);

function saveTariff() {
  let name = $("tariff_name").value.trim();
  let rate = parseFloat($("tariff_rate").value);

  if (!name || !rate) return alert("Enter name & rate");

  let tx = DB.transaction("tariffs", "readwrite");
  tx.objectStore("tariffs").put({ name, rate });

  $("tariff_name").value = "";
  $("tariff_rate").value = "";

  loadTariffList();
}

function loadTariffList() {
  let tx = DB.transaction("tariffs", "readonly");
  tx.objectStore("tariffs").getAll().onsuccess = (e) => {
    let tbl = $("tariffTable").querySelector("tbody");
    tbl.innerHTML = "";

    e.target.result.forEach((t) => {
      let tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.name}</td>
        <td>₹${t.rate.toLocaleString("en-IN")}</td>
        <td><button class="delete-row" onclick="deleteTariff('${t.name}')">Delete</button></td>
      `;
      tbl.appendChild(tr);
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
  let sel = $("procedureSelect");
  sel.innerHTML = `<option value="">Select Procedure (Tariff)</option>`;

  DB.transaction("tariffs", "readonly")
    .objectStore("tariffs")
    .getAll().onsuccess = (e) => {
      e.target.result.forEach((t) => {
        let opt = document.createElement("option");
        opt.value = t.name;
        opt.textContent = t.name;
        sel.appendChild(opt);
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

/* =============================== SAVE BILL =============================== */
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

  let bill = {
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

  DB.transaction("bills", "readwrite")
    .objectStore("bills")
    .put(bill);

  alert("Bill Saved Successfully ✔");
  loadBillsList();
}

/* =============================== LOAD SAVED BILLS =============================== */
function loadBillsList() {
  let tx = DB.transaction("bills", "readonly");
  tx.objectStore("bills").getAll().onsuccess = (e) => {
    let tbl = $("billsTable").querySelector("tbody");
    tbl.innerHTML = "";

    e.target.result.forEach((b) => {
      let tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${b.bill_no}</td>
        <td>${b.patient_id}</td>
        <td>${b.name}</td>
        <td>${b.date}</td>
        <td>${b.total}</td>
        <td><button class="btn" onclick="openSavedBill('${b.bill_no}')">Open</button></td>
      `;
      tbl.appendChild(tr);
    });
  };
}

function openSavedBill(bill_no) {
  DB.transaction("bills", "readonly")
    .objectStore("bills")
    .get(bill_no).onsuccess = (e) => {
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

/* =============================== SETTINGS ENGINE =============================== */
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

  let logoFile = $("set_h_logo").files[0];

  if (logoFile) {
    let r = new FileReader();
    r.onload = () => {
      settings.logo = r.result;
      saveSettingsToDB(settings);
    };
    r.readAsDataURL(logoFile);
  } else {
    saveSettingsToDB(settings);
  }
}

function saveSettingsToDB(settings) {
  DB.transaction("settings", "readwrite")
    .objectStore("settings")
    .put(settings);

  alert("Settings Saved ✔");
}

function loadSettings() {
  DB.transaction("settings", "readonly")
    .objectStore("settings")
    .get("hospital").onsuccess = (e) => {
      let s = e.target.result;
      if (!s) return;

      $("set_h_name").value = s.name || "";
      $("set_h_address").value = s.address || "";
      $("set_h_phone").value = s.phone || "";
      $("set_h_email").value = s.email || "";
      $("set_h_gst").value = s.gst || "";
    };
}

/* ============================================================================
   PDF EXPORT — Mode C (Modern Clean Font + Exact Alignment)
============================================================================ */
$("exportPDF").addEventListener("click", exportPDF);

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  /* HEADER */
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.text("KRISHNA KIDNEY CENTRE", 40, 50);

  doc.setFontSize(12);
  doc.setFont("Helvetica", "normal");

  let addr = $("set_h_address").value || "";
  let phone = $("set_h_phone").value || "";
  let email = $("set_h_email").value || "";
  let gst = $("set_h_gst").value || "";

  doc.text(addr, 40, 70);
  doc.text("Phone: " + phone, 40, 85);
  doc.text("Email: " + email, 40, 100);
  doc.text("GST: " + gst, 40, 115);

  doc.setLineWidth(1.5);
  doc.setDrawColor(0, 110, 55);
  doc.line(40, 130, 550, 130);

  /* HOSPITAL BREAK UP BILL */
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  doc.text("HOSPITAL BREAK-UP BILL", 200, 160);

  /* BILL INFO */
  doc.setFontSize(12);
  doc.setFont("Helvetica", "bold");
  doc.text("Bill No: " + $("bill_no").value, 40, 190);
  
  doc.text("Date: " + $("bill_date").value, 40, 208);
  doc.text("Time: " + $("bill_time").value, 40, 226);

  doc.setFont("Helvetica", "normal");
  doc.text("Insurance: " + $("insurance_mode").value.toUpperCase(), 350, 190);

  /* PATIENT INFO */
  doc.setFont("Helvetica", "bold");
  doc.text("Patient Name: ", 40, 260);
  doc.setFont("Helvetica", "normal");
  doc.text($("p_name").value, 150, 260);

  doc.setFont("Helvetica", "bold");
  doc.text("Age / Gender:", 40, 280);
  doc.setFont("Helvetica", "normal");
  doc.text($("p_age").value + " / " + $("p_gender").value, 150, 280);

  doc.setFont("Helvetica", "bold");
  doc.text("Doctor:", 350, 260);
  doc.setFont("Helvetica", "normal");
  doc.text($("p_doctor").value, 420, 260);

  doc.setFont("Helvetica", "bold");
  doc.text("DOA:", 350, 280);
  doc.setFont("Helvetica", "normal");
  doc.text($("p_doa").value + "  " + $("p_adm_time").value, 420, 280);

  doc.setFont("Helvetica", "bold");
  doc.text("DOD:", 350, 300);
  doc.setFont("Helvetica", "normal");
  doc.text($("p_dod").value + "  " + $("p_dis_time").value, 420, 300);

  /* CHARGES TABLE */
  let body = [];
  document.querySelectorAll("#chargesTable tbody tr").forEach((r) => {
    body.push([
      r.querySelector(".desc").value,
      r.querySelector(".rate").value,
      r.querySelector(".qty").value,
      (parseFloat(r.querySelector(".rate").value) *
       parseFloat(r.querySelector(".qty").value)).toLocaleString("en-IN")
    ]);
  });

  doc.autoTable({
    startY: 330,
    head: [["Description", "Rate", "Qty", "Total"]],
    body,
    theme: "grid",
    headStyles: { fillColor: [30, 58, 138], halign: "left" },
    styles: { fontSize: 11, cellPadding: 4 }
  });

  let y = doc.lastAutoTable.finalY + 40;

  /* TOTAL */
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(15);
  doc.text("TOTAL: " + $("grandTotal").textContent, 40, y);

  /* FOOTER */
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 55, 155);
  doc.text("ULTRASOUND SCAN | LAB FACILITY | KIDNEY CARE SPECIALITY", 40, y + 40);

  doc.save($("bill_no").value + ".pdf");
}

function importSamplePatient() {
  const data = {
    bill_no: "KCC-BILL-160293",
    patient_id: "KCC-PAT-PRAVEEN",
    name: "MR.PRAVEEN KUMAR",
    age: "36",
    gender: "MALE",
    doctor: "Dr. B.K. SRINIVASAN",
    doa: "2025-09-27",
    dod: "2025-09-28",
    adm_time: "09:30",
    dis_time: "12:00",
    date: "2025-09-28",
    time: "12:00",
    insurance: "no",
    discount_percent: "0",
    discount_amount: "0",
    total: "₹160293",
    charges: [
      { desc: "SURGEON FEES", rate: "50000", qty: "1" },
      { desc: "ASSISTANT SURGEON FEES", rate: "16000", qty: "1" },
      { desc: "DJ STENDING", rate: "12000", qty: "1" },
      { desc: "ANAESTHESIA FEEES", rate: "16000", qty: "1" },
      { desc: "ICU CHARGE", rate: "5000", qty: "1" },
      { desc: "DOCTOR CHARGE", rate: "1200", qty: "3" },
      { desc: "SPECIALITY DOCTOR ICU VISIT", rate: "1500", qty: "1" },
      { desc: "BED CHARGE", rate: "1500", qty: "2" },
      { desc: "NURSING CHARGES", rate: "450", qty: "2" },
      { desc: "OT CHARGE", rate: "27000", qty: "1" },
      { desc: "PREANESTHETIC CHECKUP", rate: "1200", qty: "1" },
      { desc: "MEDICINE CHARGE", rate: "19243", qty: "1" },
      { desc: "LAB AMOUNT", rate: "4750", qty: "1" }
    ]
  };

  const tx = DB.transaction("bills", "readwrite");
  tx.objectStore("bills").put(data);
  alert("Sample patient imported ✔");
}
