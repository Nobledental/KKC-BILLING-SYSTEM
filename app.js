/* ============================================================
   SELECTORS
============================================================ */
const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => [...r.querySelectorAll(s)];

/* ============================================================
   SIDEBAR NAVIGATION
============================================================ */
qsa(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    qsa(".nav-item").forEach(b => b.classList.remove("active"));
    qsa(".panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    qs("#" + btn.dataset.target).classList.add("active");
  });
});

/* Sidebar collapse */
qs("#sidebarToggle").addEventListener("click", () => {
  qs("#sidebar").classList.toggle("collapsed");
});

/* ============================================================
   THEME TOGGLE
============================================================ */
qs("#themeToggle").addEventListener("click", () => {
  const html = qs("html");
  const isDark = html.getAttribute("data-theme") === "dark";
  html.setAttribute("data-theme", isDark ? "light" : "dark");
});

/* ============================================================
   DRAWER ENGINE
============================================================ */
const drawer = qs("#drawer");
const drawerBackdrop = qs("#drawer-backdrop");
const drawerTitle = qs("#drawer-title");
const drawerContent = qs("#drawer-content");

function openDrawer(title, templateId, data = {}) {
  drawerTitle.textContent = title;
  drawerContent.innerHTML = "";
  drawerContent.append(qs("#" + templateId).content.cloneNode(true));

  fillDrawerFields(data);

  drawer.classList.add("active");
  drawerBackdrop.classList.add("active");
}

function fillDrawerFields(data) {
  Object.entries(data).forEach(([k, v]) => {
    const f = drawerContent.querySelector(`#${k}`);
    if (f) f.value = v;
  });
}

function closeDrawer() {
  drawer.classList.remove("active");
  drawerBackdrop.classList.remove("active");
}
qs("#drawer-close").onclick = closeDrawer;
drawerBackdrop.onclick = closeDrawer;

/* ============================================================
   BILL STATE
============================================================ */
let bill = {
  patient: {},
  visits: [],
  surgeries: [],
  pharmacy: [],
  investigations: [],
  misc: [],
  receipts: [],
};

/* ============================================================
   LENGTH OF STAY
============================================================ */
function calcLOS() {
  const a = qs("#admit_date").value;
  const b = qs("#discharge_date").value;
  if (!a || !b) return;
  const d1 = new Date(a);
  const d2 = new Date(b);
  const diff = Math.round((d2 - d1) / 86400000) + 1;
  qs("#los").value = diff > 0 ? diff : 1;
}

qs("#admit_date").onchange = calcLOS;
qs("#discharge_date").onchange = calcLOS;

/* ============================================================
   LOAD TARIFF (from tariffs.js)
============================================================ */
function loadRoomTypes() {
  const sel = qs("#room_type");
  sel.innerHTML = `<option value="">Select Room</option>`;
  Object.keys(tariff.rooms).forEach(r => {
    sel.innerHTML += `<option value="${r}">${r}</option>`;
  });
}
loadRoomTypes();

qs("#room_type").addEventListener("change", () => {
  const r = qs("#room_type").value;
  if (!r) return;
  const t = tariff.rooms[r];
  qs("#room_rent").value = t.room;
  qs("#nursing_charge").value = t.nursing;
  qs("#duty_charge").value = t.duty;
  qs("#consultant_charge").value = t.consult;
});

/* ============================================================
   CONSULTANT VISITS
============================================================ */
qs("#addVisitBtn").addEventListener("click", () => {
  const row = document.createElement("div");
  row.className = "visit-row";
  row.innerHTML = `
    <div class="two-input">
      <input type="date" class="visit_date">
      <input type="number" class="visit_count" placeholder="Visits">
    </div>
    <button class="mini-add-btn remove-btn"><i class="ri-delete-bin-line"></i></button>
  `;
  qs("#visitList").append(row);

  row.querySelector(".remove-btn").onclick = () => row.remove();
});

/* ============================================================
   SURGERIES
============================================================ */
qs("#addSurgeryBtn").onclick = () => {
  const surgNames = Object.values(tariff.surgeries).flat();

  openDrawer("Add Surgery", "tpl-surgery-form");

  const select = drawerContent.querySelector("#surg_name");
  surgNames.forEach(s => {
    const o = document.createElement("option");
    o.value = s.name;
    o.textContent = s.name;
    select.appendChild(o);
  });

  select.onchange = () => {
    const obj = surgNames.find(x => x.name === select.value);
    if (!obj) return;
    drawerContent.querySelector("#surg_ot").value = obj.ot;
    drawerContent.querySelector("#surg_surgeon").value = obj.surgeon;
    drawerContent.querySelector("#surg_assistant").value = obj.assistant;
    drawerContent.querySelector("#surg_anes").value = obj.anesthetist;
    drawerContent.querySelector("#surg_implant").value = obj.implant;
    drawerContent.querySelector("#surg_gas").value = obj.gas;
    drawerContent.querySelector("#surg_cons").value = obj.consumables;
  };

  drawerContent.querySelector("#surg_mode").onchange = e => {
    const custom = drawerContent.querySelector("#surg_custom");
    const lbl = drawerContent.querySelector("#lbl_surg_custom");
    if (e.target.value === "custom") {
      custom.classList.remove("hidden");
      lbl.classList.remove("hidden");
    } else {
      custom.classList.add("hidden");
      lbl.classList.add("hidden");
    }
  };

  drawerContent.querySelector("#saveSurgery").onclick = () => {
    const d = {
      name: drawerContent.querySelector("#surg_name").value,
      ot: +drawerContent.querySelector("#surg_ot").value,
      surgeon: +drawerContent.querySelector("#surg_surgeon").value,
      assistant: +drawerContent.querySelector("#surg_assistant").value,
      anesthetist: +drawerContent.querySelector("#surg_anes").value,
      implant: +drawerContent.querySelector("#surg_implant").value,
      gas: +drawerContent.querySelector("#surg_gas").value,
      cons: +drawerContent.querySelector("#surg_cons").value,
      mode: drawerContent.querySelector("#surg_mode").value,
      custom: +drawerContent.querySelector("#surg_custom").value || 0,
    };

    bill.surgeries.push(d);
    renderSurgeries();
    closeDrawer();
    calculateTotals();
  };
};

function renderSurgeries() {
  const box = qs("#surgeryList");
  box.innerHTML = "";
  bill.surgeries.forEach((s, i) => {
    const wrap = document.createElement("div");
    wrap.className = "surgery-row";
    wrap.innerHTML = `
      <div><strong>${s.name}</strong></div>
      <div>Mode: ${s.mode}${s.mode === "custom" ? ` (${s.custom}%)` : ""}</div>
      <button class="mini-add-btn remove"><i class="ri-delete-bin-line"></i></button>
    `;
    wrap.querySelector(".remove").onclick = () => {
      bill.surgeries.splice(i, 1);
      renderSurgeries();
      calculateTotals();
    };
    box.append(wrap);
  });
}

/* ============================================================
   PHARMACY
============================================================ */
qs("#togglePharmacyBreakup").onclick = () => {
  qs("#pharmacyBreakup").classList.toggle("hidden");
};

qs("#addPharmacyItem").onclick = () => {
  openDrawer("Add Pharmacy Item", "tpl-pharmacy-item");
  drawerContent.querySelector("#savePharmacyItem").onclick = () => {
    const d = {
      item: drawerContent.querySelector("#pharm_item").value,
      qty: +drawerContent.querySelector("#pharm_qty").value,
      amt: +drawerContent.querySelector("#pharm_amt").value,
    };
    bill.pharmacy.push(d);
    renderPharmacy();
    closeDrawer();
    calculateTotals();
  };
};

function renderPharmacy() {
  const list = qs("#pharmacyBreakupBody");
  list.innerHTML = "";
  bill.pharmacy.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.item}</td>
      <td>${p.qty}</td>
      <td>${p.amt}</td>
      <td><button class="mini-add-btn del"><i class="ri-close-line"></i></button></td>
    `;
    tr.querySelector(".del").onclick = () => {
      bill.pharmacy.splice(i, 1);
      renderPharmacy();
      calculateTotals();
    };
    list.appendChild(tr);
  });
}

/* ============================================================
   INVESTIGATIONS
============================================================ */
qs("#addInvestigationBtn").onclick = () => {
  openDrawer("Add Investigation", "tpl-investigation-form");
  drawerContent.querySelector("#saveInvestigation").onclick = () => {
    const d = {
      name: drawerContent.querySelector("#inv_name").value,
      amt: +drawerContent.querySelector("#inv_amount").value,
    };
    bill.investigations.push(d);
    renderInvestigations();
    closeDrawer();
    calculateTotals();
  };
};

function renderInvestigations() {
  const box = qs("#investigationList");
  box.innerHTML = "";
  bill.investigations.forEach((x, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${x.name}</td>
      <td>${x.amt}</td>
      <td><button class="mini-add-btn del"><i class="ri-close-line"></i></button></td>
    `;
    tr.querySelector(".del").onclick = () => {
      bill.investigations.splice(i, 1);
      renderInvestigations();
      calculateTotals();
    };
    box.append(tr);
  });
}

/* ============================================================
   MISC ITEMS
============================================================ */
qs("#addMiscBtn").onclick = () => {
  openDrawer("Add Misc Item", "tpl-misc-item");
  drawerContent.querySelector("#saveMiscItem").onclick = () => {
    const d = {
      desc: drawerContent.querySelector("#misc_desc").value,
      amt: +drawerContent.querySelector("#misc_amt").value,
    };
    bill.misc.push(d);
    renderMisc();
    closeDrawer();
    calculateTotals();
  };
};

function renderMisc() {
  const box = qs("#miscList");
  box.innerHTML = "";
  bill.misc.forEach((m, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.desc}</td>
      <td>${m.amt}</td>
      <td><button class="mini-add-btn del"><i class="ri-close-line"></i></button></td>
    `;
    tr.querySelector(".del").onclick = () => {
      bill.misc.splice(i, 1);
      renderMisc();
      calculateTotals();
    };
    box.append(tr);
  });
}

/* ============================================================
   RECEIPTS
============================================================ */
qs("#addReceiptBtn").onclick = () => {
  openDrawer("Add Receipt", "tpl-receipt-form");
  drawerContent.querySelector("#saveReceipt").onclick = () => {
    const d = {
      no: drawerContent.querySelector("#rec_no").value,
      date: drawerContent.querySelector("#rec_date").value,
      mode: drawerContent.querySelector("#rec_mode").value,
      amt: +drawerContent.querySelector("#rec_amt").value,
    };
    bill.receipts.push(d);
    renderReceipts();
    closeDrawer();
    calculateTotals();
  };
};

function renderReceipts() {
  const box = qs("#receiptList");
  box.innerHTML = "";
  bill.receipts.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.no}</td>
      <td>${r.date}</td>
      <td>${r.mode}</td>
      <td>${r.amt}</td>
      <td><button class="mini-add-btn del"><i class="ri-close-line"></i></button></td>
    `;
    tr.querySelector(".del").onclick = () => {
      bill.receipts.splice(i, 1);
      renderReceipts();
      calculateTotals();
    };
    box.append(tr);
  });
}

/* ============================================================
   CALCULATE TOTALS  (YOU SAID NOT TO MODIFY — so unchanged)
============================================================ */
function calculateTotals() {
  let total = 0;

  const los = +qs("#los").value || 1;
  total += (+qs("#room_rent").value || 0) * los;
  total += (+qs("#nursing_charge").value || 0) * los;
  total += (+qs("#duty_charge").value || 0) * los;

  bill.visits = [];
  qsa(".visit-row").forEach(row => {
    const date = row.querySelector(".visit_date").value;
    const count = +row.querySelector(".visit_count").value;
    if (date && count) {
      bill.visits.push({ date, count });
      total += count * (+qs("#consultant_charge").value || 0);
    }
  });

  bill.surgeries.forEach(s => {
    let sum =
      s.ot +
      s.surgeon +
      s.assistant +
      s.anesthetist +
      s.implant +
      s.gas +
      s.cons;

    if (s.mode === "50") sum *= 0.5;
    if (s.mode === "custom") sum *= (100 - s.custom) / 100;

    total += sum;
  });

  total += +qs("#pharmacy_total").value || 0;

  bill.investigations.forEach(i => total += i.amt);
  bill.misc.forEach(m => total += m.amt);

  let paid = 0;
  bill.receipts.forEach(r => paid += r.amt);

  qs("#gross_amount").value = total;
  qs("#total_receipts").value = paid;
  qs("#balance_amount").value = total - paid;
}

/* AUTO UPDATE */
qsa("input,select").forEach(el => {
  el.addEventListener("input", calculateTotals);
});

/* ============================================================
   BILL NUMBER GENERATOR
============================================================ */
qs("#generateBillNo").onclick = () => {
  qs("#bill_no").value = Math.floor(
    100000000000 + Math.random() * 900000000000
  );
};

/* ============================================================
   DASHBOARD (STATIC FOR NOW)
============================================================ */
function loadDashboard() {
  qs("#dash-total-bills").textContent = 0;
  qs("#dash-total-revenue").textContent = "₹0";
  qs("#dash-total-pending").textContent = "₹0";
  qs("#dash-surgical-cases").textContent = 0;
}
loadDashboard();

/* ============================================================
   PDF ENGINE (ULTRA PREMIUM)
============================================================ */
async function generatePremiumPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    /* ============================================================
       SAFE START OFFSET FOR PRE-PRINTED HEADER (CHOSEN BY ME)
       (PREVENTS OVERLAP WITH HOSPITAL FLYER HEADER)
    ============================================================ */
    const OFFSET = 130;   // <-- CHOSEN BY ME (Option B)

    const left = 40;
    let y = OFFSET;

    /* ============================================================
       GENERATE BARCODE (CODE128)
    ============================================================ */
    const billNo = qs("#bill_no").value || "000000000000";

    JsBarcode("#barcodeSvg", billNo, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 50,
        displayValue: false
    });

    const barcodeImg = await loadImage(
        document.querySelector("#barcodeSvg").toDataURL()
    );

    /* ============================================================
       QR CODE
    ============================================================ */
    const qrCanvas = document.createElement("canvas");
    new QRCode(qrCanvas, { text: billNo, width: 80, height: 80 });

    /* ============================================================
       HEADER (DUAL COLUMN — PREMIUM)
       LEFT: Nothing (pre-printed)
       RIGHT: QR + BARCODE + BILL NO
    ============================================================ */
    const rightStart = 400;

    // QR
    doc.addImage(qrCanvas.toDataURL("image/png"), "PNG", rightStart, y, 80, 80);

    // Barcode
    doc.addImage(barcodeImg, "PNG", rightStart - 5, y + 85, 170, 50);

    // Bill number text
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Bill No: ${billNo}`, rightStart + 20, y + 145);

    y += 170;

    /* ============================================================
       PATIENT INFORMATION
    ============================================================ */
    sectionHeader(doc, "Patient Information", y);
    y += 25;

    const p = {
        name: qs("#pt_name").value,
        id: qs("#pt_id").value,
        age: qs("#pt_age").value,
        gender: qs("#pt_gender").value,
        address: qs("#pt_address").value,
        dept: qs("#pt_dept").value,
        doctor: qs("#pt_doctor").value,
        admit: qs("#admit_date").value,
        discharge: qs("#discharge_date").value,
        los: qs("#los").value,
        insurance: qs("#insurance_flag").value,
        policy: qs("#insurance_name").value,
        claim: qs("#insurance_claim").value
    };

    const patientRows = [
        ["Patient Name", p.name],
        ["IP Number", p.id],
        ["Age / Gender", `${p.age} / ${p.gender}`],
        ["Address", p.address],
        ["Department", p.dept],
        ["Consultant", p.doctor],
        ["Admission Date", p.admit],
        ["Discharge Date", p.discharge],
        ["Length of Stay", `${p.los} days`],
        ["Insurance", p.insurance === "yes" ? p.policy : "No"],
        ["Claim Number", p.claim]
    ];

    autoTable(doc, patientRows, y);
    y = doc.lastAutoTable.finalY + 25;

    /* ============================================================
       ROOM & DAILY CHARGES
    ============================================================ */
    sectionHeader(doc, "Room & Daily Charges", y);
    y += 25;

    const los = Number(p.los) || 1;

    const roomRows = [
        [`Room Rent × ${los}`, (+qs("#room_rent").value || 0) * los],
        [`Nursing × ${los}`, (+qs("#nursing_charge").value || 0) * los],
        [`Duty Doctor × ${los}`, (+qs("#duty_charge").value || 0) * los]
    ];

    autoTable(doc, roomRows, y);
    y = doc.lastAutoTable.finalY + 25;

    /* ============================================================
       CONSULTANT VISITS
    ============================================================ */
    if (bill.visits.length) {
        sectionHeader(doc, "Consultant Visits", y);
        y += 25;

        const visitRows = bill.visits.map(v => [
            `${v.date} (${v.count} visits)`,
            v.count * (+qs("#consultant_charge").value || 0)
        ]);

        autoTable(doc, visitRows, y);
        y = doc.lastAutoTable.finalY + 25;
    }

    /* ============================================================
       SURGERIES — PREMIUM ADVANCED UI
    ============================================================ */
    if (bill.surgeries.length) {
        sectionHeader(doc, "Surgical Procedures", y);
        y += 15;

        bill.surgeries.forEach((s, i) => {
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(14);
            doc.text(`${i + 1}. ${s.name}`, left, y + 20);

            let subtotal =
                s.ot +
                s.surgeon +
                s.assistant +
                s.anesthetist +
                s.implant +
                s.gas +
                s.cons;

            let discountLabel = "None";
            let finalAmount = subtotal;

            if (s.mode === "50") {
                discountLabel = "50% Package";
                finalAmount = subtotal * 0.5;
            }
            if (s.mode === "custom") {
                discountLabel = `${s.custom}% Off`;
                finalAmount = subtotal * (100 - s.custom) / 100;
            }

            const surgTable = [
                ["OT Charges", s.ot],
                ["Surgeon", s.surgeon],
                ["Assistant", s.assistant],
                ["Anesthetist", s.anesthetist],
                ["Implants", s.implant],
                ["OT Gas", s.gas],
                ["Consumables", s.cons],
                ["Subtotal", subtotal],
                ["Discount", discountLabel],
                ["Final Total", finalAmount]
            ];

            autoTable(doc, surgTable, y + 25);
            y = doc.lastAutoTable.finalY + 20;
        });
    }

    /* ============================================================
       PHARMACY
    ============================================================ */
    sectionHeader(doc, "Pharmacy Charges", y);
    y += 25;

    autoTable(doc, [["Pharmacy Total", +qs("#pharmacy_total").value]], y);
    y = doc.lastAutoTable.finalY + 15;

    if (bill.pharmacy.length) {
        const rows = bill.pharmacy.map(x => [x.item, x.qty, x.amt]);
        autoTable(doc, rows, y, ["Item", "Qty", "Amount"]);
        y = doc.lastAutoTable.finalY + 25;
    }

    /* ============================================================
       INVESTIGATIONS
    ============================================================ */
    if (bill.investigations.length) {
        sectionHeader(doc, "Investigations", y);
        y += 25;

        autoTable(
            doc,
            bill.investigations.map(i => [i.name, i.amt]),
            y,
            ["Investigation", "Amount"]
        );
        y = doc.lastAutoTable.finalY + 25;
    }

    /* ============================================================
       MISCELLANEOUS
    ============================================================ */
    if (bill.misc.length) {
        sectionHeader(doc, "Miscellaneous Charges", y);
        y += 25;

        autoTable(
            doc,
            bill.misc.map(m => [m.desc, m.amt]),
            y,
            ["Description", "Amount"]
        );
        y = doc.lastAutoTable.finalY + 25;
    }

    /* ============================================================
       RECEIPTS
    ============================================================ */
    sectionHeader(doc, "Receipts", y);
    y += 25;

    autoTable(
        doc,
        bill.receipts.map(r => [r.no, r.date, r.mode, r.amt]),
        y,
        ["Receipt No", "Date", "Mode", "Amount"]
    );
    y = doc.lastAutoTable.finalY + 25;

    /* ============================================================
       FINAL SUMMARY
    ============================================================ */
    sectionHeader(doc, "Final Summary", y);
    y += 25;

    autoTable(
        doc,
        [
            ["Gross Amount", qs("#gross_amount").value],
            ["Total Received", qs("#total_receipts").value],
            ["Balance Amount", qs("#balance_amount").value]
        ],
        y
    );
    y = doc.lastAutoTable.finalY + 25;

    /* ============================================================
       AMOUNT IN WORDS
    ============================================================ */
    const words = convertAmountToWords(+qs("#balance_amount").value);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Amount in Words:`, left, y);

    doc.setFont("Helvetica", "normal");
    doc.text(words, left, y + 20);

    y += 50;

    /* ============================================================
       FOOTER (OPTION 1 + OPTION 4 COMBINED)
    ============================================================ */
    doc.setFontSize(11);
    doc.setFont("Helvetica", "normal");
    doc.text(
        "This is a computer-generated bill. No signature required.",
        left,
        doc.internal.pageSize.height - 80
    );

    doc.setFont("Helvetica", "bold");
    doc.text(
        "Thank you for choosing Krishna Kidney Centre",
        left,
        doc.internal.pageSize.height - 55
    );

    doc.setFont("Helvetica", "normal");
    doc.text(
        "24/7 Emergency & Urology Services",
        left,
        doc.internal.pageSize.height - 40
    );

    doc.text(
        "Urology · Nephrology · Stone Clinic · Laparoscopy · ICU · Pharmacy",
        left,
        doc.internal.pageSize.height - 25
    );

    /* ============================================================
       PAGE NUMBERING
    ============================================================ */
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
            `Page ${i} of ${totalPages}`,
            doc.internal.pageSize.width - 70,
            doc.internal.pageSize.height - 15
        );
    }

    /* ============================================================
       SAVE PDF
    ============================================================ */
    doc.save(`KCC_Final_Bill_${billNo}.pdf`);
}


/* ============================================================
   INDEXEDDB — BILL STORAGE ENGINE
============================================================ */
let db;

function initDB() {
  const req = indexedDB.open("KCC_BILLING_DB", 1);

  req.onupgradeneeded = (e) => {
    db = e.target.result;

    if (!db.objectStoreNames.contains("bills")) {
      db.createObjectStore("bills", { keyPath: "bill_no" });
    }
  };

  req.onsuccess = (e) => {
    db = e.target.result;
    loadBillHistory();
  };

  req.onerror = () => console.error("IndexedDB error");
}

initDB();

/* Save Bill */
function saveBill() {
  const data = {
    bill_no: qs("#bill_no").value,
    patient: qs("#pt_name").value,
    date: qs("#discharge_date").value,
    total: qs("#gross_amount").value,
    paid: qs("#total_receipts").value,
    balance: qs("#balance_amount").value,
    fullbill: structuredClone(bill)
  };

  const tx = db.transaction("bills", "readwrite");
  tx.objectStore("bills").put(data);
}

/* Load All Bills */
function loadBillHistory() {
  const tx = db.transaction("bills", "readonly");
  const store = tx.objectStore("bills");
  const req = store.getAll();

  req.onsuccess = () => renderHistory(req.result);
}

/* Delete Bill */
function deleteBill(billNo) {
  const tx = db.transaction("bills", "readwrite");
  tx.objectStore("bills").delete(billNo);
  tx.oncomplete = loadBillHistory;
}

/* ============================================================
   RENDER BILL HISTORY TABLE
============================================================ */
function renderHistory(list) {
  const body = qs("#historyTableBody");
  if (!body) return;

  body.innerHTML = "";

  list.forEach(b => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${b.bill_no}</td>
      <td>${b.patient}</td>
      <td>${b.date}</td>
      <td>${b.total}</td>
      <td>${b.paid}</td>
      <td>${b.balance}</td>
      <td>
        <button class="history-action-btn btn-view" onclick="openSavedBill('${b.bill_no}')">Open</button>
        <button class="history-action-btn btn-pdf" onclick="exportSavedPDF('${b.bill_no}')">PDF</button>
        <button class="history-action-btn btn-del" onclick="deleteBill('${b.bill_no}')">Delete</button>
      </td>
    `;

    body.appendChild(tr);
  });
}

/* Load bill back to UI */
function openSavedBill(billNo) {
  const tx = db.transaction("bills", "readonly");
  const store = tx.objectStore("bills");
  const req = store.get(billNo);

  req.onsuccess = () => {
    const data = req.result;

    // ✔ Restore fields
    qs("#pt_name").value = data.fullbill.patient?.name ?? "";
    qs("#pt_id").value = data.fullbill.patient?.id ?? "";
    // (Continue for other fields…)

    bill = data.fullbill;
    renderSurgeries();
    renderInvestigations();
    renderMisc();
    renderReceipts();
    calculateTotals();

    // Switch to New Bill panel
    qs("[data-target='panel-newbill']").click();
  };
}

/* Export PDF of saved bill */
function exportSavedPDF(billNo) {
  const tx = db.transaction("bills", "readonly");
  const store = tx.objectStore("bills");
  const req = store.get(billNo);

  req.onsuccess = () => {
    bill = req.result.fullbill;
    qs("#bill_no").value = billNo;
    generatePremiumPDF();
  };
}

/* ============================================================
   HELPERS
============================================================ */
function sectionHeader(doc, title, y) {
  doc.setFontSize(14);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(0, 156, 164);
  doc.text(title, 40, y);
  doc.setTextColor(0, 0, 0);
}

function autoTable(doc, body, y, head = ["Description", "Amount"]) {
  doc.autoTable({
    startY: y,
    head: [head],
    body,
    theme: "grid",
    styles: {
      fontSize: 11,
      cellPadding: 5
    },
    headStyles: {
      fillColor: [0, 156, 164],
      textColor: 255
    }
  });
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/* Convert Amount to Words (Indian System) */
function convertAmountToWords(n) {
  if (n === 0) return "Zero Rupees Only";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen"
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety"
  ];

  function inWords(num) {
    if ((num = num.toString()).length > 9) return "Overflow";
    const n = ("000000000" + num)
      .substr(-9)
      .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return "";
    let str = "";
    str += n[1] != 0 ? (a[n[1]] || b[n[1][0]] + " " + a[n[1][1]]) + " Crore " : "";
    str += n[2] != 0 ? (a[n[2]] || b[n[2][0]] + " " + a[n[2][1]]) + " Lakh " : "";
    str += n[3] != 0 ? (a[n[3]] || b[n[3][0]] + " " + a[n[3][1]]) + " Thousand " : "";
    str += n[4] != 0 ? (a[n[4]] || b[n[4][0]] + " " + a[n[4][1]]) + " Hundred " : "";
    str += n[5] != 0
      ? (str != "" ? "and " : "") +
        (a[n[5]] || b[n[5][0]] + " " + a[n[5][1]]) +
        " "
      : "";
    return str.trim() + " Rupees Only";
  }
  return inWords(n);
}

/* PDF BUTTON */
qs("#generatePDF").onclick = () => {
  calculateTotals();
  generatePremiumPDF();
};

