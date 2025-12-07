/* ============================================================================
   KCC BILLING OS — LIVE BILL PREVIEW ENGINE
   • Loads <template id="billTemplate">
   • Fills all tpl_* fields
   • Generates charges table
   • Loads receipts block
   • Renders inside iframe for perfect preview
   • Used by exportPremiumPDF() to pick final values
============================================================================ */

function setTpl(frameDoc, id, value) {
    const el = frameDoc.querySelector("#" + id);
    if (el) el.innerText = value || "-";
}

/* ============================================================
   MAIN: OPEN BILL PREVIEW MODAL
============================================================ */
window.openBillPreview = function () {

    const modal = document.getElementById("billPreviewModal");
    const iframe = document.getElementById("billPreviewFrame");

    modal.style.display = "flex";

    // Load template into iframe
    const tpl = document.getElementById("billTemplate").innerHTML;
    const frameDoc = iframe.contentDocument || iframe.contentWindow.document;
    frameDoc.open();
    frameDoc.write(tpl);
    frameDoc.close();

    // Fill data now
    fillPreview(frameDoc);

    // Close buttons
    document.getElementById("closePreview").onclick = () => modal.style.display = "none";
    document.getElementById("closePreview2").onclick = () => modal.style.display = "none";
};

/* ============================================================
   FILL ALL TEMPLATE FIELDS
============================================================ */
function fillPreview(frameDoc) {
    const get = (id) => document.getElementById(id)?.value || "";

    /* ------------------------------
       BASIC PATIENT INFO
    ------------------------------ */
    setTpl(frameDoc, "tpl_name", get("p_name"));
    setTpl(frameDoc, "tpl_ageGender", `${get("p_age")} / ${get("p_gender")}`);
    setTpl(frameDoc, "tpl_patientID", get("patient_id"));
    setTpl(frameDoc, "tpl_ipNo", get("ex_ipno"));

    setTpl(frameDoc, "tpl_address", get("ex_address"));
    setTpl(frameDoc, "tpl_phone", get("ex_phone"));
    setTpl(frameDoc, "tpl_aadhaar", get("ex_aadhaar"));
    setTpl(frameDoc, "tpl_relation", get("ex_relation"));

    /* ------------------------------
       INSURANCE INFO
    ------------------------------ */
    setTpl(frameDoc, "tpl_insurance", document.getElementById("insurance_mode").value);
    setTpl(frameDoc, "tpl_policyNo", get("ex_policy"));
    setTpl(frameDoc, "tpl_insCompany", get("ex_ins_company"));

    /* ------------------------------
       ADMISSION INFO
    ------------------------------ */
    setTpl(frameDoc, "tpl_doa", get("p_doa"));
    setTpl(frameDoc, "tpl_dod", get("p_dod"));
    setTpl(frameDoc, "tpl_admTime", get("p_adm_time"));
    setTpl(frameDoc, "tpl_disTime", get("p_dis_time"));

    setTpl(frameDoc, "tpl_room", get("ex_room"));
    setTpl(frameDoc, "tpl_bed", get("ex_bed"));
    setTpl(frameDoc, "tpl_department", get("ex_department"));
    setTpl(frameDoc, "tpl_consultant", get("ex_consultant"));
    setTpl(frameDoc, "tpl_nurse", get("ex_nurse"));
    setTpl(frameDoc, "tpl_admType", get("ex_admtype"));

    /* ------------------------------
       MEDICAL INFO
    ------------------------------ */
    setTpl(frameDoc, "tpl_diagnosis", get("ex_diagnosis"));
    setTpl(frameDoc, "tpl_procedure", get("ex_procedure"));
    setTpl(frameDoc, "tpl_icd", get("ex_icd"));
    setTpl(frameDoc, "tpl_clinicalNotes", get("ex_clinnotes"));

    /* ------------------------------
       BILLING DETAILS
    ------------------------------ */
    setTpl(frameDoc, "tpl_gstPercent", get("ex_gst"));
    setTpl(frameDoc, "tpl_cgst", get("ex_cgst"));
    setTpl(frameDoc, "tpl_sgst", get("ex_sgst"));

    setTpl(frameDoc, "tpl_billOfficer", get("ex_billofficer"));
    setTpl(frameDoc, "tpl_counter", get("ex_counter"));
    setTpl(frameDoc, "tpl_paymentMethod", get("ex_paymentmethod"));
    setTpl(frameDoc, "tpl_transactionID", get("ex_txnid"));
    setTpl(frameDoc, "tpl_upiID", get("ex_upiid"));

    /* ------------------------------
       TOTALS
    ------------------------------ */
    setTpl(frameDoc, "tpl_grossTotal", document.getElementById("subTotal").innerText);
    setTpl(frameDoc, "tpl_discount", document.getElementById("discountValue").innerText);
    setTpl(frameDoc, "tpl_sumCGST", get("ex_cgst"));
    setTpl(frameDoc, "tpl_sumSGST", get("ex_sgst"));
    setTpl(frameDoc, "tpl_finalTotal", document.getElementById("grandTotal").innerText);

    /* ------------------------------
       AMOUNT IN WORDS
    ------------------------------ */
    setTpl(frameDoc, "tpl_amountWords", document.getElementById("amountWordsFinal")?.innerText || "");

    /* ============================================================
       RECEIPTS (Format B Complex Code)
    ============================================================= */
    const receiptsTable = JSON.parse(localStorage.getItem("receipts") || "[]");
    const billNo = document.getElementById("bill_no").value;

    const linked = receiptsTable.filter(r => r.bill == billNo);

    let receiptText = "";

    linked.forEach(r => {
        // Format B → Complex alphanumeric codes like: R9X-A12B-77
        receiptText += `${r.number} — ₹${r.amount} — ${r.mode} — ${r.date}\n`;
    });

    setTpl(frameDoc, "tpl_receipts", receiptText || "No receipts available");

    /* ============================================================
       CHARGES TABLE
    ============================================================= */
    const tableBody = frameDoc.querySelector("#tpl_tableBody");
    tableBody.innerHTML = "";

    const rows = document.querySelectorAll("#chargesTable tbody tr");

    rows.forEach(row => {
        const tds = row.querySelectorAll("td");

        const tr = frameDoc.createElement("tr");

        tr.innerHTML = `
            <td style="padding:6px;">${tds[0].innerText}</td>
            <td style="padding:6px; text-align:right;">${tds[1].innerText}</td>
            <td style="padding:6px; text-align:center;">${tds[2].innerText}</td>
            <td style="padding:6px; text-align:right;">${tds[3].innerText}</td>
            <td style="padding:6px; text-align:center;">${tds[4].innerText}</td>
        `;

        tableBody.appendChild(tr);
    });

    /* ============================================================
       OPTIONAL: QR / BARCODE / SEAL / SIGNATURE (if uploaded)
    ============================================================= */
    if (window.KCC_QR_IMAGE) frameDoc.querySelector("#tpl_qr").src = window.KCC_QR_IMAGE;
    if (window.KCC_BARCODE_IMAGE) frameDoc.querySelector("#tpl_barcode").src = window.KCC_BARCODE_IMAGE;
    if (window.KCC_SIGNATURE_IMAGE) frameDoc.querySelector("#tpl_signature").src = window.KCC_SIGNATURE_IMAGE;
    if (window.KCC_SEAL_IMAGE) frameDoc.querySelector("#tpl_seal").src = window.KCC_SEAL_IMAGE;

}
