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

  const left = 40;
  let y = 40;

  try {
    const logo = await loadImage("assets/logo.png");
    doc.addImage(logo, "PNG", left, y, 60, 60);
  } catch (e) {}

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Krishna Kidney Centre", left + 80, y + 25);

  doc.setFontSize(13);
  doc.setFont("Helvetica", "normal");
  doc.text("Final Hospital Bill (A4)", left + 80, y + 45);

  y += 90;

  /* PATIENT DETAILS */
  sectionHeader(doc, "Patient Information", y);
  y += 30;

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
    ["Length of Stay", p.los + " days"],
    ["Insurance", p.insurance === "yes" ? p.policy : "No"],
    ["Claim Number", p.claim]
  ];

  autoTable(doc, patientRows, y);
  y = doc.lastAutoTable.finalY + 30;

  /* ROOM CHARGES */
  sectionHeader(doc, "Room & Daily Charges", y);
  y += 30;

  const los = +p.los || 1;
  const roomRows = [
    ["Room Rent × " + los, +qs("#room_rent").value * los],
    ["Nursing × " + los, +qs("#nursing_charge").value * los],
    ["Duty Doctor × " + los, +qs("#duty_charge").value * los],
  ];

  autoTable(doc, roomRows, y);
  y = doc.lastAutoTable.finalY + 30;

  /* VISITS */
  if (bill.visits.length) {
    sectionHeader(doc, "Consultant Visits", y);
    y += 30;

    const visitRows = bill.visits.map(v => [
      `Visit on ${v.date} (${v.count})`,
      v.count * (+qs("#consultant_charge").value || 0)
    ]);

    autoTable(doc, visitRows, y);
    y = doc.lastAutoTable.finalY + 30;
  }

  /* SURGERIES */
  if (bill.surgeries.length) {
    sectionHeader(doc, "Surgical Procedures", y);
    y += 20;

    bill.surgeries.forEach((surg, index) => {
      doc.setFontSize(14);
      doc.setFont("Helvetica", "bold");
      doc.text(`${index + 1}. ${surg.name}`, left, y += 25);

      const subtotal =
        surg.ot +
        surg.surgeon +
        surg.assistant +
        surg.anesthetist +
        surg.implant +
        surg.gas +
        surg.cons;

      let discountLabel = "No Discount";
      let finalAmount = subtotal;

      if (surg.mode === "50") {
        discountLabel = "50% Package Applied";
        finalAmount = subtotal * 0.5;
      }
      if (surg.mode === "custom") {
        discountLabel = `${surg.custom}% Custom Discount`;
        finalAmount = subtotal * (100 - surg.custom) / 100;
      }

      const surgRows = [
        ["OT Charges", surg.ot],
        ["Surgeon Fees", surg.surgeon],
        ["Assistant Fees", surg.assistant],
        ["Anesthetist Fees", surg.anesthetist],
        ["Implant Charges", surg.implant],
        ["OT Gas Charges", surg.gas],
        ["Consumables", surg.cons],
        ["Subtotal", subtotal],
        ["Discount", discountLabel],
        ["Final Surgery Total", finalAmount]
      ];

      autoTable(doc, surgRows, y + 5);
      y = doc.lastAutoTable.finalY + 20;
    });
  }

  /* PHARMACY */
  sectionHeader(doc, "Pharmacy Charges", y);
  y += 30;

  autoTable(doc, [["Pharmacy Total", +qs("#pharmacy_total").value]], y);
  y = doc.lastAutoTable.finalY + 20;

  if (bill.pharmacy.length) {
    const pharmRows = bill.pharmacy.map(i => [
      i.item,
      i.qty,
      i.amt
    ]);

    autoTable(doc, pharmRows, y, ["Item", "Qty", "Amount"]);
    y = doc.lastAutoTable.finalY + 30;
  }

  /* INVESTIGATIONS */
  if (bill.investigations.length) {
    sectionHeader(doc, "Investigations", y);
    y += 30;

    const invRows = bill.investigations.map(i => [
      i.name,
      i.amt
    ]);

    autoTable(doc, invRows, y, ["Investigation", "Amount"]);
    y = doc.lastAutoTable.finalY + 30;
  }

  /* MISC */
  if (bill.misc.length) {
    sectionHeader(doc, "Miscellaneous", y);
    y += 30;

    const miscRows = bill.misc.map(i => [
      i.desc,
      i.amt
    ]);

    autoTable(doc, miscRows, y, ["Description", "Amount"]);
    y = doc.lastAutoTable.finalY + 30;
  }

  /* RECEIPTS */
  sectionHeader(doc, "Receipts", y);
  y += 30;

  const recRows = bill.receipts.map(r => [
    r.no, r.date, r.mode, r.amt
  ]);

  autoTable(doc, recRows, y, ["Receipt No", "Date", "Mode", "Amount"]);
  y = doc.lastAutoTable.finalY + 30;

  /* FINAL SUMMARY */
  sectionHeader(doc, "Final Summary", y);
  y += 30;

  const final = [
    ["Gross Amount", qs("#gross_amount").value],
    ["Total Received", qs("#total_receipts").value],
    ["Balance Amount", qs("#balance_amount").value]
  ];

  autoTable(doc, final, y);
  y = doc.lastAutoTable.finalY + 30;

  /* AMOUNT IN WORDS */
  const amountWords = convertAmountToWords(+qs("#balance_amount").value);
  doc.setFontSize(12);
  doc.text(`Amount in Words: ${amountWords}`, left, y);

  doc.save(`KCC_Final_Bill_${qs("#bill_no").value}.pdf`);
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
