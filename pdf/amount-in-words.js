/* ============================================================================
   AMOUNT IN WORDS — Indian Rupees (Professional Grade)
   Supports:
   - Crores, Lakhs, Thousands, Hundreds
   - Decimal paise (optional)
   - Clean spacing, grammatical correctness
============================================================================ */

export function inrToWords(num) {
    if (num === 0 || num === "0") return "Zero Rupees Only";

    num = parseFloat(num.toString().replace(/[^0-9.]/g, "")); // clean input
    if (isNaN(num)) return "";

    let fraction = Math.round((num % 1) * 100);
    let paiseWords = fraction > 0 ? " and " + convertNumber(fraction) + " Paise" : "";

    return convertNumber(Math.floor(num)) + " Rupees" + paiseWords + " Only";
}

function convertNumber(num) {
    const words0_19 = [
        "Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
        "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen",
        "Seventeen","Eighteen","Nineteen"
    ];

    const tensWords = ["", "", "Twenty", "Thirty", "Forty",
        "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    if (num < 20) return words0_19[num];

    if (num < 100)
        return tensWords[Math.floor(num / 10)] + (num % 10 ? " " + words0_19[num % 10] : "");

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
