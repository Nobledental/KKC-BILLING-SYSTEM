/* ============================================================================
   AMOUNT IN WORDS — INDIAN NUMBERING SYSTEM
   Compatible with: Premium PDF Engine + Bill Preview Engine
   Converts numbers → English words (₹ Indian Format)
============================================================================ */

function amountInWords(num) {
    num = Math.round(Number(num || 0));

    if (num === 0) return "Rupees Zero Only";

    const a = [
        "", "One", "Two", "Three", "Four", "Five", "Six",
        "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
        "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
        "Eighteen", "Nineteen"
    ];

    const b = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty",
        "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    function twoDigits(n) {
        if (n < 20) return a[n];
        return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    }

    function threeDigits(n) {
        let str = "";
        if (n > 99) {
            str += a[Math.floor(n / 100)] + " Hundred";
            n = n % 100;
            if (n) str += " and ";
        }
        if (n) str += twoDigits(n);
        return str;
    }

    let crore = Math.floor(num / 10000000);
    num = num % 10000000;

    let lakh = Math.floor(num / 100000);
    num = num % 100000;

    let thousand = Math.floor(num / 1000);
    num = num % 1000;

    let hundred = num;

    let result = "";

    if (crore) result += threeDigits(crore) + " Crore ";
    if (lakh) result += threeDigits(lakh) + " Lakh ";
    if (thousand) result += threeDigits(thousand) + " Thousand ";
    if (hundred) result += threeDigits(hundred) + " ";

    return ("Rupees " + result.trim() + " Only").replace(/\s+/g, " ");
}

/* Allow global usage */
window.amountInWords = amountInWords;
