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
   CALCULATE TOTALS
============================================================ */
function calculateTotals() {
  let total = 0;

  /* Room charges */
  const los = +qs("#los").value || 1;
  total += (+qs("#room_rent").value || 0) * los;
  total += (+qs("#nursing_charge").value || 0) * los;
  total += (+qs("#duty_charge").value || 0) * los;

  /* Consultant visits */
  bill.visits = [];
  qsa(".visit-row").forEach(row => {
    const date = row.querySelector(".visit_date").value;
    const count = +row.querySelector(".visit_count").value;
    if (date && count) {
      bill.visits.push({ date, count });
      total += count * (+qs("#consultant_charge").value || 0);
    }
  });

  /* Surgeries */
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

  /* Pharmacy */
  total += +qs("#pharmacy_total").value || 0;

  /* Pharmacy breakup (optional, doesn't change total line) */
  bill.pharmacy.forEach(p => {});

  /* Investigations */
  bill.investigations.forEach(i => total += i.amt);

  /* Misc */
  bill.misc.forEach(m => total += m.amt);

  /* Receipts */
  let paid = 0;
  bill.receipts.forEach(r => paid += r.amt);

  qs("#gross_amount").value = total;
  qs("#total_receipts").value = paid;
  qs("#balance_amount").value = total - paid;
}

/* -----------------------------------------------------------
   AUTO-UPDATE TOTALS ON INPUTS
----------------------------------------------------------- */
qsa("input,select").forEach(el => {
  el.addEventListener("input", calculateTotals);
});

/* ============================================================
   BILL NUMBER GENERATOR (12 digits)
============================================================ */
qs("#generateBillNo").onclick = () => {
  qs("#bill_no").value = Math.floor(
    100000000000 + Math.random() * 900000000000
  );
};

/* ============================================================
   PDF GENERATION
============================================================ */
qs("#generatePDF").onclick = async () => {
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({ unit: "pt", format: "a4" });

  let y = 40;

  doc.setFontSize(16);
  doc.text("Krishna Kidney Centre — Final Bill", 40, y);
  y += 30;

  doc.setFontSize(12);
  doc.text(`Patient: ${qs("#pt_name").value}`, 40, y);
  y += 18;
  doc.text(`IP No: ${qs("#pt_id").value}`, 40, y);
  y += 18;
  doc.text(`Admission: ${qs("#admit_date").value}`, 40, y);
  y += 18;
  doc.text(`Discharge: ${qs("#discharge_date").value}`, 40, y);
  y += 25;

  /* Build table body */
  const rows = [];

  rows.push(["Room Rent", qs("#room_rent").value * qs("#los").value]);
  rows.push(["Nursing Charges", qs("#nursing_charge").value * qs("#los").value]);
  rows.push(["Duty Doctor", qs("#duty_charge").value * qs("#los").value]);

  bill.visits.forEach(v => {
    rows.push([`Consultant Visit (${v.count})`, v.count * qs("#consultant_charge").value]);
  });

  bill.surgeries.forEach(s => {
    let subtotal =
      s.ot + s.surgeon + s.assistant + s.anesthetist + s.implant + s.gas + s.cons;
    let final = subtotal;

    if (s.mode === "50") final = subtotal * 0.5;
    if (s.mode === "custom") final = subtotal * (100 - s.custom) / 100;

    rows.push([`Surgery: ${s.name}`, final]);
  });

  rows.push(["Pharmacy", qs("#pharmacy_total").value]);

  bill.investigations.forEach(i => rows.push([`Investigation: ${i.name}`, i.amt]));
  bill.misc.forEach(m => rows.push([`Misc: ${m.desc}`, m.amt]));

  rows.push(["Gross Total", qs("#gross_amount").value]);
  rows.push(["Total Paid", qs("#total_receipts").value]);
  rows.push(["Balance", qs("#balance_amount").value]);

  doc.autoTable({
    startY: y,
    head: [["Description", "Amount"]],
    body: rows,
    styles: { fontSize: 10, halign: "left" },
    headStyles: { fillColor: [0, 158, 164] }
  });

  doc.save(`KCC_BILL_${qs("#bill_no").value}.pdf`);
};

/* ============================================================
   DASHBOARD STATS
============================================================ */
function loadDashboard() {
  qs("#dash-total-bills").textContent = 0;
  qs("#dash-total-revenue").textContent = "₹0";
  qs("#dash-total-pending").textContent = "₹0";
  qs("#dash-surgical-cases").textContent = 0;
}
loadDashboard();
