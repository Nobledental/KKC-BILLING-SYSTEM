/* ============================================================================
   KCC Billing OS — PDF ENGINE (Ceramic V6 FINAL)
   ✔ Offline Safe
   ✔ jsPDF UMD Compatible
   ✔ AutoTable Supported
   ✔ Reads Live DOM (collectBillData)
   ✔ Reads Hospital Settings (IndexedDB)
   ✔ Amount in Words (amount-in-words.js)
============================================================================ */

async function exportPremiumPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });

    const bill = collectBillData();
    const hospital = await getHospitalSettings();

    const margin = 40;
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = margin;

    pdf.setFont("Times-Roman");

    /* -----------------------------------------------
       LOGO
    ----------------------------------------------- */
    if (hospital.logo) {
        try {
            pdf.addImage(hospital.logo, "PNG", margin, y, 90, 90);
        } catch (err) {
            console.warn("Logo error:", err);
        }
    }

    /* -----------------------------------------------
       HOSPITAL DETAILS
    ----------------------------------------------- */
    pdf.setFontSize(20);
    pdf.text(hospital.name || "Krishna Kidney Centre", margin + 120, y + 18);

    pdf.setFontSize(11);
    (hospital.address || "").split("\n").forEach((line, i) => {
        pdf.text(line, margin + 120, y + 42 + i * 14);
    });

    pdf.text("Phone: " + (hospital.phone || ""), margin + 120, y + 90);
    pdf.text("Email: " + (hospital.email || ""), margin + 120, y + 106);

    y += 130;
    pdf.setLineWidth(0.7);
    pdf.line(margin, y, pageWidth - margin, y);

    y += 30;

    /* -----------------------------------------------
       BILL DETAILS
    ----------------------------------------------- */
    pdf.setFontSize(13);
    pdf.text("BILL DETAILS", margin, y);
    y += 18;

    pdf.setFontSize(11);
    pdf.text(`Bill No: ${bill.bill_no}`, margin, y);
    pdf.text(`Date: ${bill.date}`, margin + 220, y);
    pdf.text(`Time: ${bill.time}`, margin + 380, y);

    y += 24;

    /* -----------------------------------------------
       PATIENT DETAILS
    ----------------------------------------------- */
    pdf.setFontSize(13);
    pdf.text("PATIENT DETAILS", margin, y);
    y += 18;

    pdf.setFontSize(11);
    pdf.text(`UHID: ${bill.patient_id}`, margin, y);
    pdf.text(`Name: ${bill.name}`, margin + 220, y);
    y += 18;

    pdf.text(`Age / Gender: ${bill.age} / ${bill.gender}`, margin, y);
    pdf.text(`Doctor: ${bill.doctor}`, margin + 220, y);
    y += 18;

    pdf.text(`Date of Admission: ${bill.doa}`, margin, y);
    pdf.text(`Date of Discharge: ${bill.dod}`, margin + 220, y);
    y += 18;

    pdf.text(`Admission Time: ${bill.adm}`, margin, y);
    pdf.text(`Discharge Time: ${bill.dis}`, margin + 220, y);
    y += 30;

    pdf.line(margin, y, pageWidth - margin, y);
    y += 20;

    /* -----------------------------------------------
       CHARGES TABLE — AutoTable
    ----------------------------------------------- */
    const tableData = bill.charges.map(row => [
        row.desc,
        "₹" + Number(row.rate).toLocaleString("en-IN"),
        row.qty,
        "₹" + (row.rate * row.qty).toLocaleString("en-IN"),
    ]);

    pdf.autoTable({
        startY: y,
        theme: "grid",
        head: [["Description", "Rate", "Qty", "Total"]],
        body: tableData,
        styles: { fontSize: 11 },
        margin: { left: margin, right: margin },
        headStyles: {
            fillColor: [0, 62, 138], // Dark Blue
            textColor: 255,
            fontStyle: "bold",
        },
        didDrawPage: (data) => drawFooter(pdf)
    });

    let afterTable = pdf.lastAutoTable.finalY + 30;

    /* -----------------------------------------------
       TOTAL SUMMARY
    ----------------------------------------------- */
    pdf.setFontSize(13);
    pdf.text("TOTAL SUMMARY", margin, afterTable);
    afterTable += 18;

    pdf.setFontSize(11);
    pdf.text(`Sub Total: ${bill.subtotal}`, margin, afterTable);
    pdf.text(`Discount: ${bill.discount}`, margin + 220, afterTable);
    afterTable += 22;

    pdf.setFontSize(15);
    pdf.text(`Grand Total: ${bill.total}`, margin, afterTable);
    afterTable += 26;

    /* -----------------------------------------------
       AMOUNT IN WORDS
    ----------------------------------------------- */
    const numericTotal = parseInt(bill.total.replace(/[₹,]/g, ""));
    const words = inrToWords(numericTotal);

    pdf.setFontSize(11);
    pdf.text(`Amount in Words: ${words}`, margin, afterTable, {
        maxWidth: pageWidth - margin * 2
    });

    /* -----------------------------------------------
       SAVE PDF
    ----------------------------------------------- */
    pdf.save(`${bill.bill_no}.pdf`);
}

/* -----------------------------------------------
   FOOTER (Tamil optional)
----------------------------------------------- */
function drawFooter(pdf) {
    const h = pdf.internal.pageSize.getHeight();
    const cx = pdf.internal.pageSize.getWidth() / 2;

    pdf.setFontSize(10);
    pdf.setTextColor(70, 70, 70);

    pdf.text("CLINIC TIMINGS", cx, h - 45, { align: "center" });
    pdf.text("பார்வை நேரம்: காலை 9.00 – இரவு 9.00 மணி", cx, h - 30, { align: "center" });
    pdf.text("ஞாயிறு: முன்பதிவு மட்டும்", cx, h - 15, { align: "center" });
}

/* -----------------------------------------------
   HOSPITAL SETTINGS LOADER
----------------------------------------------- */
function getHospitalSettings() {
    return new Promise(resolve => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onsuccess = () => {
            const dbx = req.result;
            const tx = dbx.transaction("settings", "readonly");
            tx.objectStore("settings").get("hospital").onsuccess = (e) => {
                resolve(e.target.result || {});
            };
        };
    });
}
