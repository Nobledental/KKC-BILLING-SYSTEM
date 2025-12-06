/* ============================================================================
   KRISHNA KIDNEY CENTRE — BILL PREVIEW ENGINE V1
   ✔ Uses bill-template.html content already inside page
   ✔ Fills all tpl_* fields
   ✔ Populates charges table
   ✔ Opens modal instantly
   ✔ Clean INR formatting
   ✔ Uses amountInWords() from amount-in-words.js
============================================================================ */

function openBillPreview() {
    const bill = collectBillData();

    /* ------------------------------
       POPULATE HEADER
    ------------------------------ */
    set("tpl_billNo", bill.bill_no);
    set("tpl_billDate", bill.date);
    set("tpl_patientID", bill.patient_id);
    set("tpl_insurance", bill.insurance === "yes" ? "Yes" : "No");

    /* ------------------------------
       PATIENT INFO
    ------------------------------ */
    set("tpl_name", bill.name);
    set("tpl_ageGender", `${bill.age} / ${bill.gender}`);
    set("tpl_doctor", bill.doctor || "-");
    set("tpl_address", "-"); // No address field in UI yet

    set("tpl_doa", bill.doa || "-");
    set("tpl_dod", bill.dod || "-");
    set("tpl_admTime", bill.adm || "-");
    set("tpl_disTime", bill.dis || "-");

    /* ------------------------------
       CHARGES TABLE
    ------------------------------ */
    const tbody = document.getElementById("tpl_tableBody");
    tbody.innerHTML = "";

    let gross = 0;

    bill.charges.forEach((row) => {
        const amt = row.rate * row.qty;
        gross += amt;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="padding:10px; border-bottom:1px solid #eee;">${row.desc}</td>
            <td style="padding:10px; text-align:center; border-bottom:1px solid #eee;">₹${Number(row.rate).toLocaleString("en-IN")}</td>
            <td style="padding:10px; text-align:center; border-bottom:1px solid #eee;">${row.qty}</td>
            <td style="padding:10px; text-align:right; border-bottom:1px solid #eee;">₹${amt.toLocaleString("en-IN")}</td>
            <td style="padding:10px; text-align:center; border-bottom:1px solid #eee;">-</td>
        `;
        tbody.appendChild(tr);
    });

    /* ------------------------------
       TOTALS
    ------------------------------ */
    const discount = Number(bill.discount_amount);
    const final = gross - discount;

    set("tpl_grossTotal", "₹" + gross.toLocaleString("en-IN"));
    set("tpl_discount", "₹" + discount.toLocaleString("en-IN"));
    set("tpl_finalTotal", "₹" + final.toLocaleString("en-IN"));

    /* ------------------------------
       AMOUNT IN WORDS
    ------------------------------ */
    set("tpl_amountWords", amountInWords(final));

    /* ------------------------------
       SHOW PREVIEW MODAL
    ------------------------------ */
    showPreviewModal();
}

/* ============================================================================
   HELPERS
============================================================================ */

function set(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

/* ============================================================================
   MODAL SYSTEM (Creates automatically)
============================================================================ */

function showPreviewModal() {
    // If modal exists, remove it first
    const old = document.getElementById("previewModal");
    if (old) old.remove();

    const modal = document.createElement("div");
    modal.id = "previewModal";
    modal.style = `
        position: fixed;
        top:0; left:0;
        width:100vw; height:100vh;
        background: rgba(0,0,0,0.55);
        backdrop-filter: blur(6px);
        display:flex;
        justify-content:center;
        align-items:center;
        padding:40px;
        z-index:9999;
    `;

    modal.innerHTML = `
        <div style="
            width: 850px;
            max-height: 90vh;
            overflow-y: auto;
            background: white;
            border-radius: 16px;
            padding: 32px;
            position: relative;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        ">

            <!-- CLOSE BUTTON -->
            <button onclick="document.getElementById('previewModal').remove()" 
                style="
                  position:absolute; 
                  top:12px; right:12px; 
                  background:#ff5a67;
                  border:none;
                  color:white;
                  padding:8px 12px;
                  border-radius:8px;
                  cursor:pointer;
                ">Close</button>

            <!-- MAIN CONTENT (template wrapper) -->
            <div id="billPreviewContainer"></div>

            <!-- ACTIONS -->
            <div style="margin-top:25px; text-align:right;">
                <button onclick="exportPremiumPDF()" style="
                    padding:12px 18px;
                    background:#3A7BFE;
                    color:white;
                    border:none;
                    border-radius:8px;
                    font-weight:600;
                    cursor:pointer;
                ">Download PDF</button>

                <button onclick="window.print()" style="
                    padding:12px 18px;
                    background:#2CC8A5;
                    color:white;
                    border:none;
                    border-radius:8px;
                    font-weight:600;
                    cursor:pointer;
                    margin-left:10px;
                ">Print</button>
            </div>

        </div>
    `;

    document.body.appendChild(modal);

    /* Copy the existing bill template into the modal */
    const templateHTML = document.querySelector(".bill-wrapper").outerHTML;
    document.getElementById("billPreviewContainer").innerHTML = templateHTML;
}

/* ============================================================================
   PUBLIC API — attach to button
============================================================================ */
window.openBillPreview = openBillPreview;
