/* ============================================================================
   BILL PREVIEW ENGINE — FINAL PRODUCTION VERSION
============================================================================ */

/* Render bill preview */
function openBillPreview() {
    const bill = collectBillData();
    if (!bill) return alert("Unable to load bill data.");

    // Show modal
    const modal = document.getElementById("billPreviewModal");
    modal.style.display = "flex";

    // Load template
    const template = document.getElementById("billTemplate").innerHTML;

    // Fill into iframe
    const frame = document.getElementById("billPreviewFrame");
    const doc = frame.contentDocument || frame.contentWindow.document;

    doc.open();
    doc.write(`
        <html>
        <head>
            <style>
                body { font-family: Manrope, sans-serif; padding: 20px; }
            </style>
        </head>
        <body>${template}</body>
        </html>
    `);
    doc.close();

    // Populate fields inside iframe
    populatePreview(bill, doc);
}

/* Populate all tpl_* IDs inside preview iframe */
function populatePreview(bill, doc) {
    const set = (id, value) => {
        const el = doc.getElementById(id);
        if (el) el.textContent = value;
    };

    set("tpl_billNo", bill.bill_no);
    set("tpl_billDate", bill.date);
    set("tpl_patientID", bill.patient_id);
    set("tpl_insurance", bill.insurance === "yes" ? "Yes" : "No");

    set("tpl_name", bill.name);
    set("tpl_ageGender", `${bill.age} / ${bill.gender}`);
    set("tpl_doctor", bill.doctor);
    set("tpl_address", "-");

    set("tpl_doa", bill.doa);
    set("tpl_dod", bill.dod);
    set("tpl_admTime", bill.adm);
    set("tpl_disTime", bill.dis);

    /* Fill table */
    const tbody = doc.getElementById("tpl_tableBody");
    tbody.innerHTML = "";

    let gross = 0;

    bill.charges.forEach(row => {
        const total = row.rate * row.qty;
        gross += total;

        const tr = doc.createElement("tr");
        tr.innerHTML = `
            <td>${row.desc}</td>
            <td>₹${row.rate.toLocaleString("en-IN")}</td>
            <td>${row.qty}</td>
            <td>₹${total.toLocaleString("en-IN")}</td>
            <td>-</td>
        `;
        tbody.appendChild(tr);
    });

    const discount = Number(bill.discount) || 0;
    const finalAmt = gross - discount;

    set("tpl_grossTotal", "₹" + gross.toLocaleString("en-IN"));
    set("tpl_discount", "₹" + discount.toLocaleString("en-IN"));
    set("tpl_finalTotal", "₹" + finalAmt.toLocaleString("en-IN"));
    set("tpl_amountWords", amountInWords(finalAmt));
}

/* Close preview modal */
document.getElementById("closePreview").onclick =
document.getElementById("closePreview2").onclick =
    () => (document.getElementById("billPreviewModal").style.display = "none");
