/* ============================================================================
   KCC BILLING OS — MAIN APPLICATION ENGINE (Ceramic V6)
   Fully Offline | IndexedDB | Billing + Tariff + Admin + Settings
============================================================================ */

/* -----------------------------------------------
   SHORTHAND HELPERS
----------------------------------------------- */
const $  = (id) => document.getElementById(id);
const q  = (sel) => document.querySelector(sel);
const qa = (sel) => Array.from(document.querySelectorAll(sel));

/* -----------------------------------------------
   PAGE SWITCHER
----------------------------------------------- */
function openPage(id) {
    qa(".page").forEach(p => p.classList.remove("active-page"));
    $(id).classList.add("active-page");

    qa(".nav-btn").forEach(btn => btn.classList.remove("active"));
    qa(".nav-btn").forEach(btn => {
        if (btn.dataset.target === id) btn.classList.add("active");
    });
}
window.openPage = openPage;

/* -----------------------------------------------
   INDEXEDDB INITIALIZATION
----------------------------------------------- */
let db;
const DB_NAME = "KCC_Billing_DB_V6";
const DB_VERSION = 7;

const req = indexedDB.open(DB_NAME, DB_VERSION);

req.onupgradeneeded = (e) => {
    db = e.target.result;

    if (!db.objectStoreNames.contains("bills"))
        db.createObjectStore("bills", { keyPath: "bill_no" });

    if (!db.objectStoreNames.contains("tariff"))
        db.createObjectStore("tariff", { keyPath: "id", autoIncrement: true });

    if (!db.objectStoreNames.contains("doctors"))
        db.createObjectStore("doctors", { keyPath: "id", autoIncrement: true });

    if (!db.objectStoreNames.contains("staff"))
        db.createObjectStore("staff", { keyPath: "id", autoIncrement: true });

    if (!db.objectStoreNames.contains("roles"))
        db.createObjectStore("roles", { keyPath: "id", autoIncrement: true });

    if (!db.objectStoreNames.contains("settings"))
        db.createObjectStore("settings");
};

req.onsuccess = (e) => {
    db = e.target.result;
    loadTariffSelect();
    loadBillHistory();
    loadDoctors();
    loadStaff();
    loadRoles();
    loadHospitalSettings();
};

/* -----------------------------------------------
   BILL NUMBER GENERATOR
----------------------------------------------- */
function generateBillNumber() {
    return "KCC" + Date.now().toString().slice(-6);
}

/* -----------------------------------------------
   PREPARE NEW BILL
----------------------------------------------- */
function prepareNewBill() {
    $("bill_no").value = generateBillNumber();

    const t = new Date();
    $("bill_date").value = t.toISOString().slice(0, 10);
    $("bill_time").value = t.toTimeString().slice(0, 5);

    $("patient_id").value = "UH" + Math.floor(Math.random() * 90000 + 10000);

    qa("#chargesTable tbody tr").forEach(tr => tr.remove());
    calculateTotals();
}
window.prepareNewBill = prepareNewBill;

/* -----------------------------------------------
   ADD CHARGE ROW
----------------------------------------------- */
$("addRowBtn").addEventListener("click", () => addChargeRow());

function addChargeRow(desc = "", rate = 0, qty = 1) {
    const tbody = $("#chargesTable tbody");

    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td><input class="desc" value="${desc}"></td>
        <td><input class="rate" type="number" value="${rate}"></td>
        <td><input class="qty" type="number" value="${qty}"></td>
        <td class="lineTotal">₹0</td>
        <td><button class="delete-row">X</button></td>
    `;

    tbody.appendChild(tr);
    updateRowListeners();
    calculateTotals();
}

/* -----------------------------------------------
   DELETE ROW + INPUT CHANGE WATCHER
----------------------------------------------- */
function updateRowListeners() {
    qa(".delete-row").forEach(btn => {
        btn.onclick = (e) => {
            e.target.closest("tr").remove();
            calculateTotals();
        };
    });

    qa(".rate, .qty").forEach(inp => {
        inp.oninput = calculateTotals;
    });
}

/* -----------------------------------------------
   TOTAL CALCULATION
----------------------------------------------- */
function calculateTotals() {
    let subtotal = 0;

    qa("#chargesTable tbody tr").forEach(tr => {
        const rate = Number(tr.querySelector(".rate").value);
        const qty  = Number(tr.querySelector(".qty").value);
        const total = rate * qty;

        tr.querySelector(".lineTotal").textContent = "₹" + total.toLocaleString("en-IN");

        subtotal += total;
    });

    $("subTotal").textContent = "₹" + subtotal.toLocaleString("en-IN");

    const discountPercent = Number($("discount_percent").value);
    const discountAmount = Number($("discount_amount").value);

    let appliedDiscount = 0;

    if (discountAmount > 0) {
        appliedDiscount = discountAmount;
    } else {
        appliedDiscount = Math.round(subtotal * (discountPercent / 100));
    }

    $("discountValue").textContent = "₹" + appliedDiscount.toLocaleString("en-IN");

    const grand = subtotal - appliedDiscount;

    $("grandTotal").textContent = "₹" + grand.toLocaleString("en-IN");
}
qa("#discount_percent, #discount_amount").forEach(inp => {
    inp.addEventListener("input", calculateTotals);
});

/* -----------------------------------------------
   SAVE BILL
----------------------------------------------- */
$("saveBill").onclick = () => {
    const bill = collectBillData();
    const tx = db.transaction("bills", "readwrite");
    tx.objectStore("bills").put(bill);

    tx.oncomplete = () => {
        alert("Bill Saved Successfully");
        loadBillHistory();
        openPage("billsPage");
    };
};

/* -----------------------------------------------
   LOAD BILL HISTORY
----------------------------------------------- */
function loadBillHistory() {
    const tbody = $("#billsTable tbody");
    tbody.innerHTML = "";

    const tx = db.transaction("bills", "readonly");
    tx.objectStore("bills").getAll().onsuccess = (e) => {
        e.target.result.sort((a,b) => b.bill_no.localeCompare(a.bill_no));
        e.target.result.forEach(bill => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${bill.bill_no}</td>
                <td>${bill.patient_id}</td>
                <td>${bill.name}</td>
                <td>${bill.date}</td>
                <td>${bill.total}</td>
                <td>
                    <button class="btn" onclick="loadBillPreview('${bill.bill_no}')">View</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };
}

window.loadBillPreview = function (billNo) {
    const tx = db.transaction("bills", "readonly");
    tx.objectStore("bills").get(billNo).onsuccess = (e) => {
        const bill = e.target.result;
        populatePreviewTemplate(bill);
        buildPreviewModal();
    };
};

/* -----------------------------------------------
   TARIFF MASTER
----------------------------------------------- */
function loadTariffSelect() {
    const select = $("procedureSelect");
    select.innerHTML = `<option value="">Select Tariff</option>`;

    const tx = db.transaction("tariff", "readonly");
    tx.objectStore("tariff").getAll().onsuccess = (e) => {
        e.target.result.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t.desc;
            opt.textContent = t.desc;
            select.appendChild(opt);
        });
    };

    select.onchange = () => {
        const desc = select.value;
        if (!desc) return;

        const tx = db.transaction("tariff", "readonly");
        tx.objectStore("tariff").getAll().onsuccess = (e) => {
            const row = e.target.result.find(x => x.desc === desc);
            if (row) addChargeRow(row.desc, row.rate, 1);
            calculateTotals();
        };
    };
}

/* -----------------------------------------------
   DOCTORS
----------------------------------------------- */
$("saveDoctor").onclick = () => {
    const doc = {
        name: $("doc_name").value,
        specialization: $("doc_specialization").value,
        phone: $("doc_phone").value,
        email: $("doc_email").value
    };

    db.transaction("doctors", "readwrite")
      .objectStore("doctors")
      .add(doc).oncomplete = loadDoctors;
};

function loadDoctors() {
    const tbody = $("#doctorTable tbody");
    tbody.innerHTML = "";

    db.transaction("doctors", "readonly")
      .objectStore("doctors")
      .getAll().onsuccess = (e) => {
        e.target.result.forEach(d => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${d.name}</td>
                <td>${d.specialization}</td>
                <td>${d.phone}</td>
                <td>${d.email}</td>
            `;
            tbody.appendChild(tr);
        });
    };
}

/* -----------------------------------------------
   STAFF
----------------------------------------------- */
$("saveStaff").onclick = () => {
    const st = {
        name: $("staff_name").value,
        role: $("staff_role").value,
        phone: $("staff_phone").value,
        email: $("staff_email").value
    };

    db.transaction("staff", "readwrite")
      .objectStore("staff")
      .add(st).oncomplete = loadStaff;
};

function loadStaff() {
    const tbody = $("#staffTable tbody");
    tbody.innerHTML = "";

    db.transaction("staff", "readonly")
      .objectStore("staff")
      .getAll().onsuccess = (e) => {
        e.target.result.forEach(s => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${s.name}</td>
                <td>${s.role}</td>
                <td>${s.phone}</td>
                <td>${s.email}</td>
            `;
            tbody.appendChild(tr);
        });
    };
}

/* -----------------------------------------------
   ROLES
----------------------------------------------- */
$("saveRole").onclick = () => {
    const checked = qa(".permissions-box input:checked")
        .map(cb => cb.value);

    db.transaction("roles", "readwrite")
      .objectStore("roles")
      .add({
          name: $("role_name").value,
          permissions: checked
      }).oncomplete = loadRoles;
};

function loadRoles() {
    const tbody = $("#rolesTable tbody");
    tbody.innerHTML = "";

    db.transaction("roles", "readonly")
      .objectStore("roles")
      .getAll().onsuccess = (e) => {
        e.target.result.forEach(r => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${r.name}</td>
                <td>${r.permissions.join(", ")}</td>
            `;
            tbody.appendChild(tr);
        });
    };
}

/* -----------------------------------------------
   HOSPITAL SETTINGS
----------------------------------------------- */
$("saveSettings").onclick = () => {
    const reader = new FileReader();
    const file = $("set_h_logo").files[0];

    reader.onload = () => {
        const obj = {
            name: $("set_h_name").value,
            address: $("set_h_address").value,
            phone: $("set_h_phone").value,
            email: $("set_h_email").value,
            gst: $("set_h_gst").value,
            logo: reader.result || ""
        };

        db.transaction("settings", "readwrite")
          .objectStore("settings")
          .put(obj, "hospital").oncomplete = () => {
            alert("Settings Saved");
          };
    };

    if (file) reader.readAsDataURL(file);
    else reader.onload();
};

function loadHospitalSettings() {
    const tx = db.transaction("settings", "readonly");
    tx.objectStore("settings").get("hospital").onsuccess = (e) => {
        const s = e.target.result || {};
        $("set_h_name").value = s.name || "";
        $("set_h_address").value = s.address || "";
        $("set_h_phone").value = s.phone || "";
        $("set_h_email").value = s.email || "";
        $("set_h_gst").value = s.gst || "";
    };
}
