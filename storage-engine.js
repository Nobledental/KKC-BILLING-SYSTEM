/* ============================================================================
   KCC BILLING OS — STORAGE ENGINE (FINAL PRODUCTION VERSION)
   Handles:
   ✔ Bills (IndexedDB)
   ✔ Tariff (IndexedDB)
   ✔ Doctors / Staff / Roles (IndexedDB)
   ✔ Hospital Settings (IndexedDB)
   ✔ Receipts (LocalStorage → Ultra fast)
   ✔ Advanced Data (LocalStorage)
============================================================================ */

/* ============================================================
   GLOBAL SHORTCUTS
============================================================ */
const ls = localStorage;
const LS_RECEIPTS = "receipts";
const LS_ADV_DATA = "advanced_data";

/* ============================================================
   1. LOAD ALL DATA ON PAGE READY
============================================================ */
window.addEventListener("DOMContentLoaded", () => {
    console.log("🔥 Storage Engine Loaded");

    initReceipts();
    initAdvancedData();
});

/* ============================================================================
   RECEIPTS ENGINE — Format B (Non-serial Alphanumeric)
   Example: R9X-A12B-77
============================================================================ */

/* -------------------------------
   Initialize receipts storage
------------------------------- */
function initReceipts() {
    if (!ls.getItem(LS_RECEIPTS)) {
        ls.setItem(LS_RECEIPTS, "[]");
    }
}

/* -------------------------------
   Generate complex receipt number
------------------------------- */
function generateReceiptCode() {
    function block(len) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let str = "";
        for (let i = 0; i < len; i++) {
            str += chars[Math.floor(Math.random() * chars.length)];
        }
        return str;
    }
    // Format B: R9X-A12B-77
    return `${block(3)}-${block(4)}-${block(2)}`;
}

/* -------------------------------
   Add receipt
------------------------------- */
window.saveReceipt = function (data) {
    const receipts = JSON.parse(ls.getItem(LS_RECEIPTS));

    receipts.push(data);

    ls.setItem(LS_RECEIPTS, JSON.stringify(receipts));
};

/* -------------------------------
   Load all receipts
------------------------------- */
window.loadReceipts = function () {
    const receipts = JSON.parse(ls.getItem(LS_RECEIPTS));
    return receipts;
};

/* -------------------------------
   Delete a receipt
------------------------------- */
window.deleteReceipt = function (code) {
    let receipts = JSON.parse(ls.getItem(LS_RECEIPTS));
    receipts = receipts.filter(r => r.number !== code);
    ls.setItem(LS_RECEIPTS, JSON.stringify(receipts));
};

/* ============================================================================
   ADVANCED DATA ENGINE — 31 Fields
============================================================================ */

/* -------------------------------
   Initialize empty advanced data
------------------------------- */
function initAdvancedData() {
    if (!ls.getItem(LS_ADV_DATA)) {
        ls.setItem(LS_ADV_DATA, JSON.stringify({}));
    }
}

/* -------------------------------
   Save advanced data for bill
------------------------------- */
window.saveAdvancedDataForBill = function (billNo, data) {
    const store = JSON.parse(ls.getItem(LS_ADV_DATA));

    store[billNo] = data;

    ls.setItem(LS_ADV_DATA, JSON.stringify(store));
};

/* -------------------------------
   Load advanced data for a bill
------------------------------- */
window.loadAdvancedDataForBill = function (billNo) {
    const store = JSON.parse(ls.getItem(LS_ADV_DATA));
    return store[billNo] || null;
};

/* ============================================================================
   BILL STORAGE HELPERS (IndexedDB)
   These are thin wrappers around app.js methods
============================================================================ */

/* -------------------------------
   Save bill into IndexedDB
------------------------------- */
window.storeBill = function (bill) {
    const tx = db.transaction("bills", "readwrite");
    tx.objectStore("bills").put(bill);
};

/* -------------------------------
   Load bill from DB
------------------------------- */
window.getBill = function (billNo, callback) {
    const tx = db.transaction("bills", "readonly");
    const req = tx.objectStore("bills").get(billNo);
    req.onsuccess = () => callback(req.result);
};

/* -------------------------------
   Load all bills
------------------------------- */
window.getAllBills = function (callback) {
    const tx = db.transaction("bills", "readonly");
    const store = tx.objectStore("bills");

    const all = [];
    store.openCursor().onsuccess = (e) => {
        const cur = e.target.result;
        if (!cur) {
            callback(all);
            return;
        }
        all.push(cur.value);
        cur.continue();
    };
};

/* ============================================================================
   TARIFF STORAGE (IndexedDB)
============================================================================ */
window.saveTariffItem = function (item) {
    const tx = db.transaction("tariff", "readwrite");
    tx.objectStore("tariff").put(item);
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

/* ============================================================================
   DOCTORS / STAFF / ROLES (IndexedDB)
============================================================================ */
window.addDoctor = function (item) {
    const tx = db.transaction("doctors", "readwrite");
    tx.objectStore("doctors").put(item);
};

window.addStaff = function (item) {
    const tx = db.transaction("staff", "readwrite");
    tx.objectStore("staff").put(item);
};

window.addRole = function (item) {
    const tx = db.transaction("roles", "readwrite");
    tx.objectStore("roles").put(item);
};
