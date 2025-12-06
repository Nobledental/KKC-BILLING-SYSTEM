/* ============================================================================
   INDIAN RUPEES → WORDS CONVERTER (Final Production Build)
   KRISHNA KIDNEY CENTRE — Billing OS (Ceramic V4)
   ✔ Indian numbering (Crores, Lakhs, Thousands)
   ✔ Supports Paise
   ✔ Cleans ₹ symbols & commas
   ✔ Used by pdf-engine.js as: inrToWords()
============================================================================ */

function inrToWords(value) {
    if (value === null || value === undefined || value === "") 
        return "Zero Rupees Only";

    // Remove ₹, commas, spaces
    let num = value.toString().replace(/[^0-9.]/g, "");

    if (num === "" || isNaN(num)) return "Zero Rupees Only";
    num = Number(num);

    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num % 1) * 100);

    let words = convertIndian(integerPart) + " Rupees";

    if (decimalPart > 0) {
        words += " and " + convertIndian(decimalPart) + " Paise";
    }

    return words + " Only";
}

/* ============================================================================
   CORE NUMBER → WORDS ENGINE (Indian System)
============================================================================ */
function convertIndian(num) {
    const ones = [
        "Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
        "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen",
        "Sixteen","Seventeen","Eighteen","Nineteen"
    ];

    const tens = [
        "", "", "Twenty","Thirty","Forty","Fifty",
        "Sixty","Seventy","Eighty","Ninety"
    ];

    if (num < 20) return ones[num];

    if (num < 100)
        return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");

    if (num < 1000)
        return (
            ones[Math.floor(num / 100)] +
            " Hundred" +
            (num % 100 === 0 ? "" : " " + convertIndian(num % 100))
        );

    if (num < 100000)
        return (
            convertIndian(Math.floor(num / 1000)) +
            " Thousand" +
            (num % 1000 === 0 ? "" : " " + convertIndian(num % 1000))
        );

    if (num < 10000000)
        return (
            convertIndian(Math.floor(num / 100000)) +
            " Lakh" +
            (num % 100000 === 0 ? "" : " " + convertIndian(num % 100000))
        );

    return (
        convertIndian(Math.floor(num / 10000000)) +
        " Crore" +
        (num % 10000000 === 0 ? "" : " " + convertIndian(num % 10000000))
    );
}
