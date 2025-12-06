/* ============================================================================
   KCC BILLING OS — PDF PREVIEW ENGINE (Ceramic V6 FINAL)
   ✔ Reads bill-template from <template id="billTemplate">
   ✔ Populates tpl_* fields perfectly
   ✔ Opens a clean modal with iframe sandbox
   ✔ 100% offline safe
   ✔ Calls exportPremiumPDF() for final download
============================================================================ */

window.openBillPreview = function () {
    const bill = collectBillData();
    if (!bill) {
        alert("Failed to load bill data.");
        return;
    }

    buildPreviewModal();      // Create modal + iframe
    const doc = populatePreviewTemplate(bill); // Returns full HTML
    renderPreview(doc);       // Inject into iframe
};

/* ============================================================================
   BUILD PREVIEW MODAL — CLEAN & MODERN
============================================================================ */
function buildPreviewModal() {
    const old = document.getElementById("billPreviewModal");
    if (old) old.remove();

    const modal = document.createElement("div");
    modal.id = "billPreviewModal";
    modal.style = `
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.55);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        z-index: 2000;
    `;

    modal.innerHTML = `
        <div style="
            width: 900px;
            max-height: 90vh;
            background: white;
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.32);
            position: relative;
            display: flex;
            flex-direction: column;
        ">
            <div style="
                padding: 18px 22px;
                background: #003e8a;
                color: white;
                font-weight: 700;
                font-size: 18px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <span>Bill Preview</span>
                <button onclick="document.getElementById('billPreviewModal').remove()"
                    style="
                        background: #ff5a67;
                        border: none;
                        color: white;
                        padding: 8px 14px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                    ">Close</button>
            </div>

            <iframe id="billPreviewFrame"
                style="flex: 1; width: 100%; border: none;"></iframe>

            <div style="
                padding: 16px;
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                border-top: 1px solid #ddd;
            ">
                <button onclick="exportPremiumPDF()"
                    style="
                        padding: 12px 20px;
                        background:#3A7BFE; 
                        color:white;
                        border:none; 
                        border-radius:8px;
                        font-weight:600;
                        cursor:pointer;
                    ">Download PDF</button>

                <button onclick="document.getElementById('billPreviewModal').remove()"
                    style="
                        padding:12px 20px;
                        background:#2CC8A5; 
                        color:white;
                        border:none; 
                        border-radius:8px;
                        font-weight:600;
                        cursor:pointer;
                    ">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/* ============================================================================
   POPULATE TEMPLATE — RETURNS FINAL HTML STRING
============================================================================ */
function populatePreviewTemplate(bill) {
    const tpl = document.getElementById("billTemplate").innerHTML;
    const parser = new DOMParser();
    const doc = parser.parseFromString(tpl, "text/html");
    const root = doc.querySelector(".bill-wrapper");

    /* SET FIELD VALUES */
    set(root, "tpl_billNo", bill.bill_no);
    set(root, "tpl_billDate", bill.date);
    set(root, "tpl_patientID", bill.patient_id);
    set(root, "tpl_insurance", bill.insurance === "yes" ? "Yes" : "No");

    set(root, "tpl_name", bill.name);
    set(root, "tpl_ageGender", `${bill.age} / ${bill.gender}`);
    set(root, "tpl_doctor", bill.doctor);
    set(root, "tpl_address", "-");

    set(root, "tpl_doa", bill.doa);
    set(root, "tpl_dod", bill.dod);
    set(root, "tpl_admTime", bill.adm);
    set(root, "tpl_disTime", bill.dis);

    /* ---------- CHARGES ---------- */
    const tableBody = root.querySelector("#tpl_tableBody");
    tableBody.innerHTML = "";

    let gross = 0;
    bill.charges.forEach(row => {
        const amt = row.rate * row.qty;
        gross += amt;

        const tr = doc.createElement("tr");
        tr.innerHTML = `
            <td style="padding:10px; border-bottom:1px solid #eee;">${row.desc}</td>
            <td style="padding:10px; text-align:center; border-bottom:1px solid #eee;">₹${row.rate.toLocaleString('en-IN')}</td>
            <td style="padding:10px; text-align:center; border-bottom:1px solid #eee;">${row.qty}</td>
            <td style="padding:10px; text-align:right; border-bottom:1px solid #eee;">₹${amt.toLocaleString('en-IN')}</td>
            <td style="padding:10px; text-align:center; border-bottom:1px solid #eee;">-</td>
        `;
        tableBody.appendChild(tr);
    });

    const discount = Number(bill.discount_amount) || 0;
    const final = gross - discount;

    set(root, "tpl_grossTotal", "₹" + gross.toLocaleString("en-IN"));
    set(root, "tpl_discount", "₹" + discount.toLocaleString("en-IN"));
    set(root, "tpl_finalTotal", "₹" + final.toLocaleString("en-IN"));

    /* Amount in words */
    set(root, "tpl_amountWords", amountInWords(final));

    return root.outerHTML;
}

/* ============================================================================
   RENDER FINAL HTML INTO IFRAME
============================================================================ */
function renderPreview(html) {
    const iframe = document.getElementById("billPreviewFrame");
    iframe.onload = () => {
        iframe.contentDocument.body.innerHTML = html;
    };
    iframe.src = "about:blank";
}

/* ============================================================================
   HELPER — SET VALUE INSIDE TEMPLATE ROOT
============================================================================ */
function set(root, id, value) {
    const el = root.querySelector(`#${id}`);
    if (el) el.textContent = value === undefined ? "-" : value;
}
