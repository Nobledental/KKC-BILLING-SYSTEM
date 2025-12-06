/* ============================================================================
   KRISHNA KIDNEY CENTRE — BILL PREVIEW ENGINE (FINAL • PRODUCTION)
   ✔ iframe-based preview (stable)
   ✔ Reads inline <template id="billTemplate">
   ✔ Populates ALL tpl_* fields
   ✔ Matches your bill-template.html structure
   ✔ Works offline
============================================================================ */

/* ============================================================================
   OPEN PREVIEW
============================================================================ */
function openBillPreview() {
    const bill = collectBillData();
    if (!bill) return alert("Error: Could not collect bill data.");

    const modal = document.getElementById("billPreviewModal");
    const frame = document.getElementById("billPreviewFrame");
    const template = document.getElementById("billTemplate").innerHTML;

    // Make modal visible
    modal.classList.add("active");

    // Load template into iframe
    const doc = frame.contentDocument || frame.contentWindow.document;
    doc.open();
    doc.write(`
        <html>
        <head>
            <style>
                body {
                    font-family: Manrope, sans-serif;
                    padding: 30px;
                    color: #0b1a33;
                }
                table { border-collapse: collapse; width:100%; }
                th, td { padding: 10px; }
            </style>
        </head>
        <body>${template}</body>
        </html>
    `);
    doc.close();

    // After HTML loads → fill placeholders
    setTimeout(() => applyBillToPreview(doc, bill), 50);
}

/* ============================================================================
   FILL ALL TEMPLATE FIELDS
============================================================================ */
function applyBillToPreview(doc, bill) {

    const set = (id, val) => {
        const el = doc.getElementById(id);
        if (el) el.textContent = val;
    };

    // ---- BILL DETAILS ----
    set("tpl_billNo", bill.bill_no);
    set("tpl_billDate", bill.date);
    set("tpl_patientID", bill.patient_id);
    set("tpl_insurance", bill.insurance === "yes" ? "Yes" : "No");

    // ---- PATIENT DETAILS ----
    set("tpl_name", bill.name);
    set("tpl_ageGender", `${bill.age} / ${bill.gender}`);
    set("tpl_doctor", bill.doctor);
    set("tpl_address", "-");

    set("tpl_doa", bill.doa);
    set("tpl_dod", bill.dod);
    set("tpl_admTime", bill.adm);
    set("tpl_disTime", bill.dis);

    // ---- CHARGES TABLE ----
    const tbody = doc.getElementById("tpl_tableBody");
    tbody.innerHTML = "";

    let gross = 0;

    bill.charges.forEach((c) => {
        const amount = c.rate * c.qty;
        gross += amount;

        const tr = doc.createElement("tr");

        tr.innerHTML = `
            <td style="border-bottom:1px solid #eee;">${c.desc}</td>
            <td style="text-align:center; border-bottom:1px solid #eee;">₹${c.rate.toLocaleString("en-IN")}</td>
            <td style="text-align:center; border-bottom:1px solid #eee;">${c.qty}</td>
            <td style="text-align:right; border-bottom:1px solid #eee;">₹${amount.toLocaleString("en-IN")}</td>
            <td style="text-align:center; border-bottom:1px solid #eee;">-</td>
        `;

        tbody.appendChild(tr);
    });

    const discount = Number(bill.discount) || 0;
    const final = gross - discount;

    // ---- TOTALS ----
    set("tpl_grossTotal", "₹" + gross.toLocaleString("en-IN"));
    set("tpl_discount", "₹" + discount.toLocaleString("en-IN"));
    set("tpl_finalTotal", "₹" + final.toLocaleString("en-IN"));

    // ---- AMOUNT IN WORDS ----
    set("tpl_amountWords", amountInWords(final));
}

/* ============================================================================
   CLOSE MODAL
============================================================================ */
document.getElementById("closePreview").onclick =
document.getElementById("closePreview2").onclick = () => {
    document.getElementById("billPreviewModal").classList.remove("active");
};

/* ============================================================================
   PUBLIC ACCESS
============================================================================ */
window.openBillPreview = openBillPreview;
