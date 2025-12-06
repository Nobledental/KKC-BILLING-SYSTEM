/* =============================================================================
   KRISHNA KIDNEY CENTRE — BILLING OS
   FULL PRODUCTION BUILD — app.js (FINAL, CLEAN, ALL FEATURES)
============================================================================= */

/* ---------------------------------------------------------------------------
   SHORTCUTS
--------------------------------------------------------------------------- */
const $  = (id) => document.getElementById(id);
const q  = (sel, root=document) => root.querySelector(sel);
const qa = (sel, root=document) => [...root.querySelectorAll(sel)];

/* ---------------------------------------------------------------------------
   PAGE SWITCHER
--------------------------------------------------------------------------- */
function openPage(id) {
    qa(".page").forEach(p => p.classList.remove("active-page"));
    $(id).classList.add("active-page");

    qa(".nav-btn").forEach(btn => btn.classList.remove("active"));
    qa(".nav-btn").forEach(btn => {
        if (btn.dataset.target === id) btn.classList.add("active");
    });
}

/* ---------------------------------------------------------------------------
   INDEXEDDB INITIALIZATION
--------------------------------------------------------------------------- */
let db;

const request = indexedDB.open("KCC_BILLING_DB_V5", 5);

request.onupgradeneeded = (e) => {
    db = e.target.result;

    if (!db.objectStoreNames.contains("bills"))
        db.createObjectStore("bills", { keyPath: "bill_no" });

    if (!db.objectStoreNames.contains("tariff"))
        db.createObjectStore("tariff", { keyPath: "id", autoIncrement: true });

    if (!db.objectStoreNames.contains("settings"))
        db.createObjectStore("settings", { keyPath: "id" });

    if (!db.objectStoreNames.contains("doctors"))
        db.createObjectStore("doctors", { keyPath: "id", autoIncrement: true });

    if (!db.objectStoreNames.contains("staff"))
        db.createObjectStore("staff", { keyPath: "id", autoIncrement: true });

    if (!db.objectStoreNames.contains("roles"))
        db.createObjectStore("roles", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = (e) => {
    db = e.target.result;
    loadTariffSelect();
    loadBillsTable();
    loadDoctors();
    loadStaff();
    loadRoles();
    loadSettings();
};

request.onerror = () => alert("IndexedDB failed to load!");


/* =============================================================================
   NEW BILL SETUP
============================================================================= */
function prepareNewBill() {
    $("bill_no").value = "KCC-" + Date.now();
    $("bill_date").value = new Date().toISOString().slice(0, 10);
    $("bill_time").value = new Date().toLocaleTimeString("en-IN", { hour12: false });

    $("patient_id").value = "UHID-" + Math.floor(Math.random() * 99999);

    qa("#chargesTable tbody")[0].innerHTML = "";
    addRow(); // Add initial row

    updateTotals();
}

/* =============================================================================
   CHARGES TABLE
============================================================================= */
function addRow(desc = "", rate = 0, qty = 1) {
    const tbody = q("#chargesTable tbody");

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><input class="desc" value="${desc}"></td>
        <td><input class="rate" type="number" value="${rate}" oninput="updateTotals()"></td>
        <td><input class="qty" type="number" value="${qty}" oninput="updateTotals()"></td>
        <td class="row-total">₹0</td>
        <td><button class="delete-row" onclick="this.closest('tr').remove(); updateTotals();">✕</button></td>
    `;

    tbody.appendChild(tr);
    updateTotals();
}

$("addRowBtn").onclick = () => addRow();


/* =============================================================================
   TARIFF MASTER → LOAD INTO DROPDOWN
============================================================================= */
function loadTariffSelect() {
    const tx = db.transaction("tariff", "readonly");
    const store = tx.objectStore("tariff");

    $("procedureSelect").innerHTML = `<option value="">Select Tariff</option>`;

    store.openCursor().onsuccess = (e) => {
        const cur = e.target.result;
        if (!cur) return;

        const opt = document.createElement("option");
        opt.value = cur.value.rate;
        opt.textContent = cur.value.name;
        opt.dataset.name = cur.value.name;
        $("procedureSelect").appendChild(opt);

        cur.continue();
    };
}

$("procedureSelect").onchange = () => {
    const sel = $("procedureSelect");
    if (!sel.value) return;

    const name = sel.options[sel.selectedIndex].dataset.name;
    const rate = Number(sel.value);

    addRow(name, rate, 1);
};


/* =============================================================================
   TOTALS CALCULATION
============================================================================= */
function updateTotals() {
    let subtotal = 0;

    qa("#chargesTable tbody tr").forEach(row => {
        const rate = Number(row.querySelector(".rate").value) || 0;
        const qty  = Number(row.querySelector(".qty").value) || 0;

        const total = rate * qty;
        subtotal += total;

        row.querySelector(".row-total").textContent = "₹" + total.toLocaleString("en-IN");
    });

    const discountAmount = Number($("discount_amount").value) || 0;
    const finalTotal = subtotal - discountAmount;

    $("subTotal").textContent = "₹" + subtotal.toLocaleString("en-IN");
    $("discountValue").textContent = "₹" + discountAmount.toLocaleString("en-IN");
    $("grandTotal").textContent = "₹" + finalTotal.toLocaleString("en-IN");
}


/* AUTO UPDATE TOTALS ON DISCOUNT */
$("discount_amount").oninput =
$("discount_percent").oninput = () => updateTotals();


/* =============================================================================
   COLLECT ALL BILL DATA
============================================================================= */
function collectBillData() {
    return {
        bill_no: $("bill_no").value,
        patient_id: $("patient_id").value,
        date: $("bill_date").value,
        time: $("bill_time").value,

        name: $("p_name").value,
        age: $("p_age").value,
        gender: $("p_gender").value,
        doctor: $("p_doctor").value,

        doa: $("p_doa").value,
        dod: $("p_dod").value,
        adm: $("p_adm_time").value,
        dis: $("p_dis_time").value,

        insurance: $("insurance_mode").value,
        subtotal: $("subTotal").textContent,
        discount: $("discount_amount").value,
        total: $("grandTotal").textContent,

        charges: qa("#chargesTable tbody tr").map(r => ({
            desc: r.querySelector(".desc").value,
            rate: Number(r.querySelector(".rate").value),
            qty: Number(r.querySelector(".qty").value),
        }))
    };
}


/* =============================================================================
   SAVE BILL
============================================================================= */
$("saveBill").onclick = () => {
    const bill = collectBillData();

    const tx = db.transaction("bills", "readwrite");
    tx.objectStore("bills").put(bill);

    tx.oncomplete = () => {
        alert("Bill Saved Successfully!");
        loadBillsTable();
    };
};


/* =============================================================================
   LOAD BILL HISTORY TABLE
============================================================================= */
function loadBillsTable() {
    const tbody = $("billsTable").querySelector("tbody");
    tbody.innerHTML = "";

    const tx = db.transaction("bills", "readonly");
    tx.objectStore("bills").openCursor().onsuccess = (e) => {
        const cur = e.target.result;
        if (!cur) return;

        const bill = cur.value;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${bill.bill_no}</td>
            <td>${bill.patient_id}</td>
            <td>${bill.name}</td>
            <td>${bill.date}</td>
            <td>${bill.total}</td>
            <td><button class="btn" onclick='loadExistingBill("${bill.bill_no}")'>Open</button></td>
        `;
        tbody.appendChild(tr);

        cur.continue();
    };
}


/* LOAD BILL INTO FORM */
function loadExistingBill(id) {
    openPage("newBillPage");

    const tx = db.transaction("bills", "readonly");
    tx.objectStore("bills").get(id).onsuccess = (e) => {
        const b = e.target.result;
        if (!b) return;

        $("bill_no").value = b.bill_no;
        $("patient_id").value = b.patient_id;
        $("bill_date").value = b.date;
        $("bill_time").value = b.time;

        $("p_name").value = b.name;
        $("p_age").value = b.age;
        $("p_gender").value = b.gender;
        $("p_doctor").value = b.doctor;

        $("p_doa").value = b.doa;
        $("p_dod").value = b.dod;
        $("p_adm_time").value = b.adm;
        $("p_dis_time").value = b.dis;

        $("insurance_mode").value = b.insurance;
        $("discount_amount").value = b.discount;

        const tbody = q("#chargesTable tbody");
        tbody.innerHTML = "";

        b.charges.forEach(c => addRow(c.desc, c.rate, c.qty));

        updateTotals();
    };
}


/* =============================================================================
   HOSPITAL SETTINGS SAVE/LOAD
============================================================================= */

$("saveSettings").onclick = () => {
    const settings = {
        id: "hospital",
        name: $("set_h_name").value,
        address: $("set_h_address").value,
        phone: $("set_h_phone").value,
        email: $("set_h_email").value,
        gst: $("set_h_gst").value,
        logo: null
    };

    const file = $("set_h_logo").files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            settings.logo = reader.result;
            saveSettings(settings);
        };
        reader.readAsDataURL(file);
    } else {
        saveSettings(settings);
    }
};

function saveSettings(settings) {
    const tx = db.transaction("settings", "readwrite");
    tx.objectStore("settings").put(settings);

    tx.oncomplete = () => alert("Settings Saved Successfully!");
}

function loadSettings() {
    const tx = db.transaction("settings", "readonly");
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


/* =============================================================================
   DOCTORS / STAFF / ROLES
============================================================================= */
function loadDoctors() {
    const tbody = $("doctorTable").querySelector("tbody");
    tbody.innerHTML = "";

    const tx = db.transaction("doctors", "readonly");
    tx.objectStore("doctors").openCursor().onsuccess = (e) => {
        const cur = e.target.result;
        if (!cur) return;

        const d = cur.value;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${d.name}</td>
            <td>${d.specialization}</td>
            <td>${d.phone}</td>
            <td>${d.email}</td>
        `;
        tbody.appendChild(tr);

        cur.continue();
    };
}

$("saveDoctor").onclick = () => {
    const d = {
        name: $("doc_name").value,
        specialization: $("doc_specialization").value,
        phone: $("doc_phone").value,
        email: $("doc_email").value
    };

    const tx = db.transaction("doctors", "readwrite");
    tx.objectStore("doctors").put(d).onsuccess = () => loadDoctors();
};


/* =============================================================================
   STAFF
============================================================================= */
function loadStaff() {
    const tbody = $("staffTable").querySelector("tbody");
    tbody.innerHTML = "";

    const tx = db.transaction("staff", "readonly");
    tx.objectStore("staff").openCursor().onsuccess = (e) => {
        const cur = e.target.result;
        if (!cur) return;

        const s = cur.value;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${s.name}</td>
            <td>${s.role}</td>
            <td>${s.phone}</td>
            <td>${s.email}</td>
        `;

        tbody.appendChild(tr);
        cur.continue();
    };
}

$("saveStaff").onclick = () => {
    const s = {
        name: $("staff_name").value,
        role: $("staff_role").value,
        phone: $("staff_phone").value,
        email: $("staff_email").value
    };

    const tx = db.transaction("staff", "readwrite");
    tx.objectStore("staff").put(s).onsuccess = () => loadStaff();
};


/* =============================================================================
   ROLES
============================================================================= */
function loadRoles() {
    const tbody = $("rolesTable").querySelector("tbody");
    tbody.innerHTML = "";

    const tx = db.transaction("roles", "readonly");
    tx.objectStore("roles").openCursor().onsuccess = (e) => {
        const cur = e.target.result;
        if (!cur) return;

        const r = cur.value;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${r.name}</td>
            <td>${r.permissions.join(", ")}</td>
        `;
        tbody.appendChild(tr);

        cur.continue();
    };
}

$("saveRole").onclick = () => {
    const perms = [...document.querySelectorAll(".permissions-box input:checked")]
        .map(c => c.value);

    const r = {
        name: $("role_name").value,
        permissions: perms
    };

    const tx = db.transaction("roles", "readwrite");
    tx.objectStore("roles").put(r).onsuccess = () => loadRoles();
};


/* =============================================================================
   END OF FILE
============================================================================= */
