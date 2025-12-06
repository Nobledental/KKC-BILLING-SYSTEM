/* ============================================================================
   KRISHNA KIDNEY CENTRE — Amount in Words Engine (FINAL PRODUCTION)
   Works for:
   ✔ 0 – 9,99,99,99,999 (99 crore)
   ✔ Preview modal
   ✔ PDF export
============================================================================ */

function amountInWords(num) {
    num = Number(num);
    if (isNaN(num) || num < 0) return "";

    if (num === 0) return "Zero Rupees Only";

    const a = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
        "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];

    const b = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty",
        "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    function twoDigits(n) {
        return n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    }

    function threeDigits(n) {
        return n > 99
            ? a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + twoDigits(n % 100) : "")
            : twoDigits(n);
    }

    let crore = Math.floor(num / 10000000);
    num %= 10000000;

    let lakh = Math.floor(num / 100000);
    num %= 100000;

    let thousand = Math.floor(num / 1000);
    num %= 1000;

    let hundred = Math.floor(num / 100);
    let rest = num % 100;

    let words = "";

    if (crore) words += threeDigits(crore) + " Crore ";
    if (lakh) words += threeDigits(lakh) + " Lakh ";
    if (thousand) words += threeDigits(thousand) + " Thousand ";
    if (hundred) words += a[hundred] + " Hundred ";
    if (rest) words += (hundred && rest ? "and " : "") + twoDigits(rest);

    return words.trim() + " Rupees Only";
}

/* ============================================================================
   PDF ENGINE COMPATIBILITY ALIAS
============================================================================ */
function inrToWords(n) {
    return amountInWords(n);
}

window.amountInWords = amountInWords;
window.inrToWords = inrToWords;
