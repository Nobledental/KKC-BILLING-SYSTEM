/* ============================================================================
   KRISHNA KIDNEY CENTRE — PREMIUM PDF ENGINE (A4 MULTI-PAGE)
   • Precise A4 Layout
   • Auto Header / Footer Blank Space
   • Charges Table Split Across Pages
   • 31 Extended Fields
   • Receipts (Format B – Complex Mixed Code)
   • QR + Barcode + Seal + Signature (Optional)
   • Bill Template Filled from <template id="billTemplate">
============================================================================ */

window.exportPremiumPDF = async function () {
    console.log("📄 Starting premium PDF export...");

    const { jsPDF } = window.jspdf;

    // Create A4 PDF
    const pdf = new jsPDF({
        unit: "pt",
        format: "a4",
        compress: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 40;
    let cursorY = 40;

    // SAFETY: Always leave top space for pre-printed header
    const HEADER_SPACE = 130;
    const FOOTER_SPACE = 60;

    cursorY += HEADER_SPACE;

    /* ------------------------------------------------------------
       GET THE FILLED BILL TEMPLATE FROM PREVIEW ENGINE
    ------------------------------------------------------------ */
    const billHTML = document.querySelector("#billPreviewFrame").contentDocument.body;
    const bill = {};

    // Helper for reading template values
    const getT = (id) => billHTML.querySelector("#" + id)?.innerText || "";

    // -----------------------------
    // PATIENT DETAILS
    // -----------------------------
    bill.name           = getT("tpl_name");
    bill.ageGender      = getT("tpl_ageGender");
    bill.uhid           = getT("tpl_patientID");
    bill.ipno           = getT("tpl_ipNo");
    bill.address        = getT("tpl_address");
    bill.phone          = getT("tpl_phone");
    bill.aadhaar        = getT("tpl_aadhaar");
    bill.relation       = getT("tpl_relation");
    bill.insurance      = getT("tpl_insurance");
    bill.policy         = getT("tpl_policyNo");
    bill.insCompany     = getT("tpl_insCompany");

    // -----------------------------
    // ADMISSION DETAILS
    // -----------------------------
    bill.doa       = getT("tpl_doa");
    bill.dod       = getT("tpl_dod");
    bill.admTime   = getT("tpl_admTime");
    bill.disTime   = getT("tpl_disTime");
    bill.room      = getT("tpl_room");
    bill.bed       = getT("tpl_bed");
    bill.department= getT("tpl_department");
    bill.consultant= getT("tpl_consultant");
    bill.nurse     = getT("tpl_nurse");
    bill.admType   = getT("tpl_admType");

    // -----------------------------
    // MEDICAL DETAILS
    // -----------------------------
    bill.diagnosis      = getT("tpl_diagnosis");
    bill.procedure      = getT("tpl_procedure");
    bill.icd            = getT("tpl_icd");
    bill.clinNotes      = getT("tpl_clinicalNotes");

    // -----------------------------
    // BILLING DETAILS
    // -----------------------------
    bill.gstPercent     = getT("tpl_gstPercent");
    bill.cgst           = getT("tpl_cgst");
    bill.sgst           = getT("tpl_sgst");
    bill.billOfficer    = getT("tpl_billOfficer");
    bill.counter        = getT("tpl_counter");
    bill.paymentMethod  = getT("tpl_paymentMethod");
    bill.txn            = getT("tpl_transactionID");
    bill.upi            = getT("tpl_upiID");

    // -----------------------------
    // TOTALS
    // -----------------------------
    bill.grossTotal     = getT("tpl_grossTotal");
    bill.discount       = getT("tpl_discount");
    bill.sumCGST        = getT("tpl_sumCGST");
    bill.sumSGST        = getT("tpl_sumSGST");
    bill.finalTotal     = getT("tpl_finalTotal");
    bill.amountWords    = getT("tpl_amountWords");

    // -----------------------------
    // RECEIPTS (FORMAT B COMPLEX)
    // -----------------------------
    bill.receipts = getT("tpl_receipts");

    // -----------------------------
    // CHARGES TABLE (read table rows)
    // -----------------------------
    let tableRows = [];
    billHTML.querySelectorAll("#tpl_tableBody tr").forEach((tr) => {
        const tds = tr.querySelectorAll("td");
        tableRows.push({
            description: tds[0]?.innerText || "",
            rate: tds[1]?.innerText || "",
            qty: tds[2]?.innerText || "",
            total: tds[3]?.innerText || "",
            hsn: tds[4]?.innerText || ""
        });
    });

    /* ============================================================
       PDF DRAW HELPERS
    ============================================================ */

    function addHeading(title) {
        pdf.setFont("Helvetica", "bold");
        pdf.setFontSize(13);
        pdf.text(title, marginX, cursorY);
        cursorY += 18;
    }

    function addField(label, value) {
        pdf.setFont("Helvetica", "normal");
        pdf.setFontSize(11);

        pdf.text(`${label}:`, marginX, cursorY);
        pdf.text(String(value || "-"), marginX + 130, cursorY);

        cursorY += 16;
    }

    function checkPageSpace(extra = 40) {
        if (cursorY + extra > pageHeight - FOOTER_SPACE) {
            pdf.addPage();
            cursorY = 40 + HEADER_SPACE;
        }
    }

    /* ============================================================
       RENDER PDF CONTENT
    ============================================================ */

    // Title
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("HOSPITAL BREAK-UP BILL", pageWidth / 2, cursorY, { align: "center" });
    cursorY += 30;

    // -----------------------------
    // PATIENT DETAILS BLOCK
    // -----------------------------
    addHeading("Patient Details");
    addField("Name", bill.name);
    addField("Age / Gender", bill.ageGender);
    addField("UHID", bill.uhid);
    addField("IP Number", bill.ipno);
    addField("Address", bill.address);
    addField("Phone", bill.phone);
    addField("Aadhaar", bill.aadhaar);
    addField("Relation", bill.relation);
    addField("Insurance", bill.insurance);
    addField("Policy No", bill.policy);
    addField("Insurance Company", bill.insCompany);

    checkPageSpace();

    // -----------------------------
    // ADMISSION DETAILS BLOCK
    // -----------------------------
    addHeading("Admission Details");
    addField("DOA", bill.doa);
    addField("DOD", bill.dod);
    addField("Admission Time", bill.admTime);
    addField("Discharge Time", bill.disTime);
    addField("Ward / Room", bill.room);
    addField("Bed No", bill.bed);
    addField("Department", bill.department);
    addField("Consultant", bill.consultant);
    addField("Attending Nurse", bill.nurse);
    addField("Admission Type", bill.admType);

    checkPageSpace();

    // -----------------------------
    // MEDICAL DETAILS BLOCK
    // -----------------------------
    addHeading("Medical Details");
    addField("Diagnosis", bill.diagnosis);
    addField("Procedure / Surgery", bill.procedure);
    addField("ICD Code", bill.icd);

    // Clinical notes (multi-line handling)
    pdf.text("Clinical Notes:", marginX, cursorY);
    cursorY += 14;

    const notesLines = pdf.splitTextToSize(bill.clinNotes || "-", pageWidth - marginX * 2);
    pdf.text(notesLines, marginX, cursorY);
    cursorY += notesLines.length * 14;

    checkPageSpace();

    /* ------------------------------------------------------------
       CHARGES TABLE (AUTOTABLE)
    ------------------------------------------------------------ */
    addHeading("Charges");

    pdf.autoTable({
        startY: cursorY,
        margin: { left: marginX },
        head: [["Description", "Rate", "Qty", "Total", "HSN"]],
        body: tableRows.map(r => [r.description, r.rate, r.qty, r.total, r.hsn]),
        theme: "grid",
        headStyles: {
            fillColor: [227, 242, 253],
            textColor: 40,
            fontSize: 11,
            halign: "center"
        },
        styles: {
            fontSize: 10
        },
        didDrawPage: (data) => {
            cursorY = data.cursor.y + 20;
        }
    });

    checkPageSpace();

    // -----------------------------
    // BILLING DETAILS
    // -----------------------------
    addHeading("Billing Details");
    addField("GST %", bill.gstPercent);
    addField("CGST", bill.cgst);
    addField("SGST", bill.sgst);
    addField("Billing Officer", bill.billOfficer);
    addField("Counter", bill.counter);
    addField("Payment Method", bill.paymentMethod);
    addField("Transaction ID", bill.txn);
    addField("UPI ID", bill.upi);

    checkPageSpace();

    // -----------------------------
    // RECEIPTS (FORMAT B COMPLEX)
    // -----------------------------
    addHeading("Receipts Against This Bill");

    const receiptLines = pdf.splitTextToSize(bill.receipts || "-", pageWidth - marginX * 2);
    pdf.text(receiptLines, marginX, cursorY);
    cursorY += receiptLines.length * 16;

    checkPageSpace();

    // -----------------------------
    // TOTALS BLOCK
    // -----------------------------
    addHeading("Totals");

    addField("Gross Total", bill.grossTotal);
    addField("Discount", bill.discount);
    addField("CGST", bill.sumCGST);
    addField("SGST", bill.sumSGST);

    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(`Total Payable: ${bill.finalTotal}`, marginX, cursorY + 10);
    cursorY += 30;

    checkPageSpace();

    // -----------------------------
    // AMOUNT IN WORDS
    // -----------------------------
    addHeading("Amount in Words");

    const words = pdf.splitTextToSize(bill.amountWords || "-", pageWidth - marginX * 2);
    pdf.text(words, marginX, cursorY);
    cursorY += words.length * 14;

    // End of PDF
    pdf.save(`KCC_Bill_${bill.uhid || "Patient"}.pdf`);

    console.log("✔ PDF Export Completed");
};
