/* ============================================================
   TARIFF MASTER — FULL DATA CONFIG
   Krishna Kidney Centre — Hospital Billing OS
   PACKAGE-FIRST DISPLAY (Card Layout)
============================================================ */

const tariff = {

  /* ----------------------------------------------------------
     ROOM & DAILY CHARGES
  ---------------------------------------------------------- */
  rooms: {
    "General Ward": { room: 1200, nursing: 400, duty: 300, consult: 500 },
    "Semi-Private": { room: 2000, nursing: 600, duty: 400, consult: 600 },
    "Private":      { room: 3500, nursing: 800, duty: 500, consult: 700 },
    "Deluxe":       { room: 5000, nursing: 1200, duty: 700, consult: 800 }
  },

  /* ----------------------------------------------------------
     SURGICAL PROCEDURES — ALL CATEGORIES
------------------------------------------------------------- */
  surgeries: {

    /* ENT -------------------------------------------------- */
    ent: [
      {
        name: "Tonsillectomy",
        ot: 6000, surgeon: 8000, assistant: 2000,
        anesthetist: 3000, implant: 0, gas: 1000, consumables: 1500
      },
      {
        name: "Adenoidectomy",
        ot: 5500, surgeon: 7500, assistant: 2000,
        anesthetist: 2500, implant: 0, gas: 900, consumables: 1200
      }
    ],

    /* ORTHOPAEDICS ---------------------------------------- */
    ortho: [
      {
        name: "Closed Reduction",
        ot: 7000, surgeon: 9000, assistant: 3000,
        anesthetist: 3500, implant: 0, gas: 1200, consumables: 1800
      },
      {
        name: "ORIF Tibia",
        ot: 15000, surgeon: 20000, assistant: 6000,
        anesthetist: 5000, implant: 15000, gas: 2000, consumables: 3000
      }
    ],

    /* UROLOGY ---------------------------------------------- */
    uro: [
      {
        name: "URS + DJ Stenting",
        ot: 10000, surgeon: 12000, assistant: 4000,
        anesthetist: 3500, implant: 3000,
        gas: 1500, consumables: 2500
      },
      {
        name: "PCNL",
        ot: 18000, surgeon: 22000, assistant: 7000,
        anesthetist: 6000, implant: 8000,
        gas: 2500, consumables: 4000
      }
    ],

    /* GENERAL SURGERY ------------------------------------- */
    general: [
      {
        name: "Appendicectomy",
        ot: 8000, surgeon: 9000, assistant: 3000,
        anesthetist: 3500, implant: 0,
        gas: 1000, consumables: 2000
      },
      {
        name: "Hernia Repair",
        ot: 12000, surgeon: 15000, assistant: 5000,
        anesthetist: 4500, implant: 3000,
        gas: 1500, consumables: 2500
      }
    ],

    /* OBGY ------------------------------------------------- */
    obgy: [
      {
        name: "Cesarean Section",
        ot: 14000, surgeon: 18000, assistant: 6000,
        anesthetist: 6000, implant: 0,
        gas: 2000, consumables: 4000
      },
      {
        name: "Normal Delivery",
        ot: 3000, surgeon: 5000, assistant: 2000,
        anesthetist: 2000, implant: 0,
        gas: 800, consumables: 1000
      }
    ],

    /* CARDIAC ---------------------------------------------- */
    cardiac: [
      {
        name: "Pacemaker Implantation",
        ot: 20000, surgeon: 25000, assistant: 8000,
        anesthetist: 7000, implant: 45000,
        gas: 3000, consumables: 6000
      }
    ],

    /* OPHTHALMOLOGY ---------------------------------------- */
    opthal: [
      {
        name: "Cataract Surgery (Phaco)",
        ot: 9000, surgeon: 12000, assistant: 4000,
        anesthetist: 2500, implant: 6000,
        gas: 1200, consumables: 1500
      }
    ]
  },

  /* ----------------------------------------------------------
     INVESTIGATIONS
------------------------------------------------------------- */
  investigations: [
    { name: "CBC", price: 350 },
    { name: "Creatinine", price: 300 },
    { name: "Blood Urea", price: 250 },
    { name: "Liver Function Test", price: 900 },
    { name: "ECG", price: 400 },
    { name: "Ultrasound Abdomen", price: 1500 },
    { name: "X-Ray Chest", price: 500 }
  ]
};


/* ============================================================
   TARIFF UI — PACKAGE-FIRST + BREAKUP BELOW (CARD DESIGN)
============================================================ */

document.addEventListener("DOMContentLoaded", loadTariffTables);

function loadTariffTables() {

  /* --------- ROOM TARIFF TABLE --------- */
  const roomT = qs("#tariffRoomTable");
  roomT.innerHTML = "";
  Object.entries(tariff.rooms).forEach(([room, d]) => {
    roomT.innerHTML += `
      <tr>
        <td>${room}</td>
        <td>${d.room}</td>
        <td>${d.nursing}</td>
        <td>${d.duty}</td>
        <td>${d.consult}</td>
      </tr>`;
  });

  /* ---------- SURGERY CATEGORIES ---------- */
  createSurgeryCards("#tariffEnt", tariff.surgeries.ent);
  createSurgeryCards("#tariffOrtho", tariff.surgeries.ortho);
  createSurgeryCards("#tariffUro", tariff.surgeries.uro);
  createSurgeryCards("#tariffGen", tariff.surgeries.general);
  createSurgeryCards("#tariffObgy", tariff.surgeries.obgy);
  createSurgeryCards("#tariffCardiac", tariff.surgeries.cardiac);
  createSurgeryCards("#tariffOpthal", tariff.surgeries.opthal);

  /* ---------- INVESTIGATIONS ---------- */
  const invT = qs("#tariffInvestigationTable");
  invT.innerHTML = "";
  tariff.investigations.forEach((i, index) => {
    invT.innerHTML += `
      <tr>
        <td>${i.name}</td>
        <td>${i.price}</td>
        <td><button class="mini-add-btn del" data-type="inv" data-id="${index}">
          <i class="ri-delete-bin-line"></i>
        </button></td>
      </tr>`;
  });
}


/* ============================================================
   SURGERY CARD UI
   PACKAGE AT TOP → BREAKUP BELOW
============================================================ */

function createSurgeryCards(selector, arr) {
  const box = qs(selector);
  box.innerHTML = "";

  arr.forEach(s => {

    const subtotal =
      s.ot +
      s.surgeon +
      s.assistant +
      s.anesthetist +
      s.implant +
      s.gas +
      s.consumables;

    box.innerHTML += `
    <div class="tariff-card">
      
      <!-- PACKAGE SECTION -->
      <div class="tariff-card-header">
        <div class="tariff-title">${s.name}</div>
        <div class="tariff-price">₹${subtotal}</div>
      </div>

      <!-- BREAKUPS -->
      <div class="tariff-breakup">
        <div>OT Charges: <strong>₹${s.ot}</strong></div>
        <div>Surgeon: <strong>₹${s.surgeon}</strong></div>
        <div>Assistant: <strong>₹${s.assistant}</strong></div>
        <div>Anesthetist: <strong>₹${s.anesthetist}</strong></div>
        <div>Implant: <strong>₹${s.implant}</strong></div>
        <div>OT Gas: <strong>₹${s.gas}</strong></div>
        <div>Consumables: <strong>₹${s.consumables}</strong></div>
      </div>

    </div>
    `;
  });
}
