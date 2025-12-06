/* ============================================================================
   AMOUNT IN WORDS — Indian Rupees (Standalone Browser Version)
   ✔ Works without ES Modules
   ✔ Used directly by pdf-engine.js
   ✔ Crores, Lakhs, Thousands, Hundreds
   ✔ Paise conversion (0–99)
   ✔ Clean grammar + spacing
============================================================================ */

function inrToWords(num) {
    if (num === 0 || num === "0") return "Zero Rupees Only";

    // Clean unwanted characters (₹ , commas etc.)
    num = parseFloat(num.toString().replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return "";

    const fraction = Math.round((num % 1) * 100);
    const paiseWords = fraction > 0 ? " and " + convertNumber(fraction) + " Paise" : "";

    return convertNumber(Math.floor(num)) + " Rupees" + paiseWords + " Only";
}

function convertNumber(num) {
    const words0_19 = [
        "Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
        "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen",
        "Seventeen","Eighteen","Nineteen"
    ];

    const tensWords = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty",
        "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    if (num < 20)
        return words0_19[num];

    if (num < 100)
        return tensWords[Math.floor(num / 10)] +
            (num % 10 ? " " + words0_19[num % 10] : "");

    if (num < 1000)
        return words0_19[Math.floor(num / 100)] + " Hundred" +
            (num % 100 ? " " + convertNumber(num % 100) : "");

    if (num < 100000)
        return convertNumber(Math.floor(num / 1000)) + " Thousand" +
            (num % 1000 ? " " + convertNumber(num % 1000) : "");

    if (num < 10000000)
        return convertNumber(Math.floor(num / 100000)) + " Lakh" +
            (num % 100000 ? " " + convertNumber(num % 100000) : "");

    return convertNumber(Math.floor(num / 10000000)) + " Crore" +
        (num % 10000000 ? " " + convertNumber(num % 10000000) : "");
}
