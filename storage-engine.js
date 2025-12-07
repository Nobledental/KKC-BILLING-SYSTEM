/* ============================================================================
   KCC BILLING OS — STORAGE ENGINE (FINAL PRODUCTION VERSION)
   Handles:
   ✔ Bills (IndexedDB)
   ✔ Tariff
   ✔ Doctors / Staff / Roles
   ✔ Hospital Settings
   ✔ Receipts (LocalStorage)
   ✔ 31 Advanced Bill Data Fields
============================================================================ */

/* ============================================================
   GLOBAL SHORTCUTS
============================================================ */
const ls = localStorage;
const LS_RECEIPTS = "KCC_RECEIPTS_STORE";
const LS_ADV_DATA = "KCC_ADVANCED_DATA_STORE";

/* ============================================================
   1. LOAD ALL STORAGE ENGINES ON PAGE READY
============================================================ */
window.addEventListener("DOMContentLoaded", () => {
    console.log("🔥 Storage Engine Ready");

    initReceipts();
    initAdvancedData();
});

/* ============================================================================
   RECEIPTS ENGINE — Format B (Random Alphanumeric, Non-Serial)
   Example: RQ7-A93K-4F
============================================================================ */

/* Initialize receipts storage */
function initReceipts() {
    if (!ls.getItem(LS_RECEIPTS)) {
        ls.setItem(LS_RECEIPTS, JSON.stringify([]));
    }
}

/* Generate complex alphanumeric receipt number */
function generateReceiptCode() {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

    function block(len) {
        let out = "";
        for (let i = 0; i < len; i++) {
            out += chars[Math.floor(Math.random() * chars.length)];
        }
        return out;
    }

    return `${block(3)}-${block(4)}-${block(2)}`;
}

/* ADD receipt */
window.saveReceipt = function (receiptData) {
    const receipts = JSON.parse(ls.getItem(LS_RECEIPTS));
    receipts.push(receiptData);
    ls.setItem(LS_RECEIPTS, JSON.stringify(receipts));
};

/* LOAD all receipts */
window.loadReceipts = function () {
    return JSON.parse(ls.getItem(LS_RECEIPTS));
};

/* DELETE receipt */
window.deleteReceipt = function (rcNo) {
    const receipts = JSON.parse(ls.getItem(LS_RECEIPTS))
        .filter(r => r.number !== rcNo);

    ls.setItem(LS_RECEIPTS, JSON.stringify(receipts));
};


/* ============================================================================
   ADVANCED BILL DATA ENGINE (31 Fields)
============================================================================ */

/* Initialize advanced data store */
function initAdvancedData() {
    if (!ls.getItem(LS_ADV_DATA)) {
        ls.setItem(LS_ADV_DATA, JSON.stringify({}));
    }
}

/* Save advanced data for a specific bill */
window.saveAdvancedDataForBill = function (billNo, dataObj) {
    const store = JSON.parse(ls.getItem(LS_ADV_DATA));
    store[billNo] = dataObj;
    ls.setItem(LS_ADV_DATA, JSON.stringify(store));
};

/* Load advanced data for a bill */
window.loadAdvancedDataForBill = function (billNo) {
    const store = JSON.parse(ls.getItem(LS_ADV_DATA));
    return store[billNo] || null;
};


/* ============================================================================
   INDEXEDDB STORAGE HELPERS (Bills, Tariff, Doctors, Staff, Roles)
============================================================================ */

/* ---------------------- BILLS ---------------------- */

/* Save bill into IndexedDB */
window.storeBill = function (bill) {
    const tx = db.transaction("bills", "readwrite");
    tx.objectStore("bills").put(bill);
};

/* Load a bill */
window.getBill = function (billNo, callback) {
    const tx = db.transaction("bills", "readonly");
    const req = tx.objectStore("bills").get(billNo);

    req.onsuccess = () => callback(req.result);
};

/* Load all bills */
window.getAllBills = function (callback) {
    const tx = db.transaction("bills", "readonly");
    const store = tx.objectStore("bills");

    const output = [];
    store.openCursor().onsuccess = (e) => {
        const cur = e.target.result;
        if (!cur) {
            callback(output);
            return;
        }
        output.push(cur.value);
        cur.continue();
    };
};


/* ---------------------- TARIFF ---------------------- */

window.saveTariffItem = function (tariffObj) {
    const tx = db.transaction("tariff", "readwrite");
    tx.objectStore("tariff").put(tariffObj);
};

window.loadTariffItems = function (callback) {
    const tx = db.transaction("tariff", "readonly");
    const store = tx.objectStore("tariff");

    const list = [];
    store.openCursor().onsuccess = (e) => {
        const cur = e.target.result;
        if (!cur) {
            callback(list);
            return;
        }
        list.push(cur.value);
        cur.continue();
    };
};


/* ---------------------- DOCTORS ---------------------- */

window.addDoctor = function (doctorObj) {
    const tx = db.transaction("doctors", "readwrite");
    tx.objectStore("doctors").put(doctorObj);
};

window.loadDoctorsList = function (callback) {
    const tx = db.transaction("doctors", "readonly");
    const store = tx.objectStore("doctors");

    const arr = [];
    store.openCursor().onsuccess = (e) => {
        const cur = e.target.result;
        if (!cur) {
            callback(arr);
            return;
        }
        arr.push(cur.value);
        cur.continue();
    };
};


/* ---------------------- STAFF ---------------------- */

window.addStaff = function (staffObj) {
    const tx = db.transaction("staff", "readwrite");
    tx.objectStore("staff").put(staffObj);
};

window.loadStaffList = function (callback) {
    const tx = db.transaction("staff", "readonly");
    const store = tx.objectStore("staff");

    const out = [];
    store.openCursor().onsuccess = (e) => {
        const cur = e.target.result;
        if (!cur) {
            callback(out);
            return;
        }
        out.push(cur.value);
        cur.continue();
    };
};


/* ---------------------- ROLES ---------------------- */

window.addRole = function (roleObj) {
    const tx = db.transaction("roles", "readwrite");
    tx.objectStore("roles").put(roleObj);
};

window.loadRolesList = function (callback) {
    const tx = db.transaction("roles", "readonly");
    const store = tx.objectStore("roles");

    const out = [];
    store.openCursor().onsuccess = (e) => {
        const cur = e.target.result;
        if (!cur) {
            callback(out);
            return;
        }
        out.push(cur.value);
        cur.continue();
    };
};


/* ============================================================================
   END OF FILE
============================================================================ */
