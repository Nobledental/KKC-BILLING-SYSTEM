/* ============================================================================
   KCC BILLING OS — Amount In Words (Indian Rupees)
   Works offline • Handles Lakhs & Crores
============================================================================ */

function amountInWords(num) {
    num = Math.round(num);

    if (num === 0) return "Zero Rupees Only";

    const ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    ];

    const tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty",
        "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    function twoDigits(n) {
        if (n < 20) return ones[n];
        return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    }

    function threeDigits(n) {
        return n > 99
            ? ones[Math.floor(n / 100)] + " Hundred " + twoDigits(n % 100)
            : twoDigits(n);
    }

    let crore = Math.floor(num / 10000000);
    let lakh = Math.floor((num % 10000000) / 100000);
    let thousand = Math.floor((num % 100000) / 1000);
    let hundred = num % 1000;

    let words = "";
    if (crore) words += twoDigits(crore) + " Crore ";
    if (lakh) words += twoDigits(lakh) + " Lakh ";
    if (thousand) words += twoDigits(thousand) + " Thousand ";
    if (hundred) words += threeDigits(hundred);

    return words.trim() + " Rupees Only";
}

/* PDF version */
function inrToWords(n) {
    return amountInWords(n);
}
