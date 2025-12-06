/* ============================================================================
   KCC — BILL PREVIEW ENGINE (FINAL • IFRAME VERSION)
============================================================================ */

function openBillPreview() {
    const bill = collectBillData();
    if (!bill) return alert("Unable to load bill.");

    // Get modal + iframe
    const modal = document.getElementById("billPreviewModal");
    const frame = document.getElementById("billPreviewFrame");

    // Show modal
    modal.classList.add("active");

    // Load template into iframe
    const template = document.querySelector(".bill-wrapper").outerHTML;
    const doc = frame.contentDocument || frame.contentWindow.document;

    doc.open();
    doc.write(`
        <html>
        <head>
          <style>
            body { font-family: Manrope, sans-serif; padding:20px; }
          </style>
        </head>
        <body>${template}</body>
        </html>
    `);
    doc.close();

    // Wait for content to load
    setTimeout(() => fillTemplate(doc, bill), 200);
}

/* Fill template fields inside iframe */
function fillTemplate(doc, bill) {

    const set = (id, val) => {
        const el = doc.getElementById(id);
        if (el) el.textContent = val;
    };

    set("tpl_billNo", bill.bill_no);
    set("tpl_billDate", bill.date);
    set("tpl_patientID", bill.patient_id);
    set("tpl_insurance", bill.insurance === "yes" ? "Yes" : "No");

    set("tpl_name", bill.name);
    set("tpl_ageGender", bill.age + " / " + bill.gender);
    set("tpl_doctor", bill.doctor);
    set("tpl_address", "-");

    set("tpl_doa", bill.doa);
    set("tpl_dod", bill.dod);
    set("tpl_admTime", bill.adm);
    set("tpl_disTime", bill.dis);

    /* CHARGES TABLE */
    const tbody = doc.getElementById("tpl_tableBody");
    tbody.innerHTML = "";

    let gross = 0;

    bill.charges.forEach((row) => {
        const amount = row.rate * row.qty;
        gross += amount;

        const tr = doc.createElement("tr");
        tr.innerHTML = `
            <td style="padding:10px; border-bottom:1px solid #eee;">${row.desc}</td>
            <td style="padding:10px; text-align:center; border-bottom:1px solid #eee;">₹${row.rate.toLocaleString("en-IN")}</td>
            <td style="padding:10px; text-align:center; border-bottom:1px solid #eee;">${row.qty}</td>
            <td style="padding:10px; text-align:right; border-bottom:1px solid #eee;">₹${amount.toLocaleString("en-IN")}</td>
            <td style="padding:10px; text-align:center; border-bottom:1px solid #eee;">-</td>
        `;
        tbody.appendChild(tr);
    });

    const discount = Number(bill.discount) || 0;
    const final = gross - discount;

    set("tpl_grossTotal", "₹" + gross.toLocaleString("en-IN"));
    set("tpl_discount", "₹" + discount.toLocaleString("en-IN"));
    set("tpl_finalTotal", "₹" + final.toLocaleString("en-IN"));
    set("tpl_amountWords", amountInWords(final));
}

/* Close Modal */
document.getElementById("closePreview").onclick =
document.getElementById("closePreview2").onclick = () => {
    document.getElementById("billPreviewModal").classList.remove("active");
};
