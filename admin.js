/* ================================================================
   KCC — BILLING OS v3 (Admin Control Panel Engine)
   VisionOS Ceramic Admin Module
   Doctors • Staff • Departments
   Offline First — IndexedDB
================================================================ */

/* ------------------------- Quick Query ------------------------- */
const $ = (id) => document.getElementById(id);

/* --------------------- IndexedDB Init -------------------------- */

let DB;

const dbReq = indexedDB.open("KCC_Billing_DB", 4);

dbReq.onupgradeneeded = (e) => {
  DB = e.target.result;

  if (!DB.objectStoreNames.contains("doctors"))
    DB.createObjectStore("doctors", { keyPath: "id" });

  if (!DB.objectStoreNames.contains("staff"))
    DB.createObjectStore("staff", { keyPath: "id" });

  if (!DB.objectStoreNames.contains("departments"))
    DB.createObjectStore("departments", { keyPath: "id" });
};

dbReq.onsuccess = (e) => {
  DB = e.target.result;

  loadDoctors();
  loadStaff();
  loadDepartments();
};

dbReq.onerror = () => alert("Database error!");



/* ================================================================
   MODAL ENGINE — Dynamic Field Generator
================================================================ */

function openModal(type, index = null, data = null) {
  $("modalType").value = type;
  $("modalEditIndex").value = index !== null ? index : "";

  $("modalName").value = "";
  $("modalField1").value = "";
  $("modalField2").value = "";

  // Hide optional field2
  $("modalField2Label").style.display = "none";
  $("modalField2").style.display = "none";

  if (type === "doctor") {
    $("modalTitle").textContent = index === null ? "Add Doctor" : "Edit Doctor";

    $("modalField1Label").textContent = "Department";
    $("modalField2Label").textContent = "Phone Number";

    $("modalField2Label").style.display = "block";
    $("modalField2").style.display = "block";

    if (data) {
      $("modalName").value = data.name;
      $("modalField1").value = data.department;
      $("modalField2").value = data.phone;
    }
  }

  if (type === "staff") {
    $("modalTitle").textContent = index === null ? "Add Staff" : "Edit Staff";

    $("modalField1Label").textContent = "Role";
    $("modalField2Label").textContent = "Phone Number";
    $("modalField2Label").style.display = "block";
    $("modalField2").style.display = "block";

    if (data) {
      $("modalName").value = data.name;
      $("modalField1").value = data.role;
      $("modalField2").value = data.phone;
    }
  }

  if (type === "dept") {
    $("modalTitle").textContent = index === null ? "Add Department" : "Edit Department";

    $("modalField1Label").textContent = "Department Code";
    if (data) {
      $("modalName").value = data.name;
      $("modalField1").value = data.code;
    }
  }

  // Show Modal
  $("adminModalBackdrop").style.display = "flex";
  $("adminModal").classList.add("modal-open");
}

function closeAdminModal() {
  $("adminModal").classList.remove("modal-open");
  setTimeout(() => {
    $("adminModalBackdrop").style.display = "none";
  }, 200);
}



/* ================================================================
   SAVE ENGINE — Doctors • Staff • Departments
================================================================ */

function saveAdminData() {
  const type = $("modalType").value;
  const index = $("modalEditIndex").value;

  const name = $("modalName").value.trim();
  const field1 = $("modalField1").value.trim();
  const field2 = $("modalField2").value.trim();

  if (!name) return alert("Name is required.");

  let store = DB.transaction(type, "readwrite").objectStore(type);

  // Generate ID only for new entry
  const id = index ? index : `${type}_${Date.now()}`;

  let data = { id, name };

  if (type === "doctor") data = { id, name, department: field1, phone: field2 };
  if (type === "staff") data = { id, name, role: field1, phone: field2 };
  if (type === "departments") data = { id, name, code: field1 };

  store.put(data);

  closeAdminModal();

  if (type === "doctors") loadDoctors();
  if (type === "staff") loadStaff();
  if (type === "departments") loadDepartments();
}



/* ================================================================
   DELETE ENGINE
================================================================ */
function deleteItem(type, id) {
  if (!confirm("Delete this entry?")) return;

  const tx = DB.transaction(type, "readwrite");
  tx.objectStore(type).delete(id);

  if (type === "doctors") loadDoctors();
  if (type === "staff") loadStaff();
  if (type === "departments") loadDepartments();
}



/* ================================================================
   TABLE LOADERS
================================================================ */

function loadDoctors() {
  const tx = DB.transaction("doctors", "readonly");
  tx.objectStore("doctors").getAll().onsuccess = (e) => {
    const data = e.target.result;
    const body = $("doctorTableBody");
    body.innerHTML = "";

    data.forEach((d) => {
      const row = `
        <tr>
          <td>${d.name}</td>
          <td>${d.department}</td>
          <td>${d.phone}</td>
          <td>
            <button class="btn-edit" onclick="openModal('doctor', '${d.id}', ${JSON.stringify(d)})">Edit</button>
            <button class="btn-del" onclick="deleteItem('doctors', '${d.id}')">Delete</button>
          </td>
        </tr>
      `;
      body.innerHTML += row;
    });
  };
}

function loadStaff() {
  const tx = DB.transaction("staff", "readonly");
  tx.objectStore("staff").getAll().onsuccess = (e) => {
    const data = e.target.result;
    const body = $("staffTableBody");
    body.innerHTML = "";

    data.forEach((s) => {
      const row = `
        <tr>
          <td>${s.name}</td>
          <td>${s.role}</td>
          <td>${s.phone}</td>
          <td>
            <button class="btn-edit" onclick="openModal('staff', '${s.id}', ${JSON.stringify(s)})">Edit</button>
            <button class="btn-del" onclick="deleteItem('staff', '${s.id}')">Delete</button>
          </td>
        </tr>
      `;
      body.innerHTML += row;
    });
  };
}

function loadDepartments() {
  const tx = DB.transaction("departments", "readonly");
  tx.objectStore("departments").getAll().onsuccess = (e) => {
    const data = e.target.result;
    const body = $("deptTableBody");
    body.innerHTML = "";

    data.forEach((d) => {
      const row = `
        <tr>
          <td>${d.name}</td>
          <td>
            <button class="btn-edit" onclick="openModal('dept', '${d.id}', ${JSON.stringify(d)})">Edit</button>
            <button class="btn-del" onclick="deleteItem('departments', '${d.id}')">Delete</button>
          </td>
        </tr>
      `;
      body.innerHTML += row;
    });
  };
}



/* ================================================================
   SEARCH & FILTER
================================================================ */
function filterTable(type) {
  let searchValue = "";
  let filterValue = "";

  if (type === "doctor") {
    searchValue = $("searchDoctor").value.toLowerCase();
    filterValue = $("doctorFilter").value;
  }

  if (type === "staff") {
    searchValue = $("searchStaff").value.toLowerCase();
    filterValue = $("staffFilter").value;
  }

  const tx = DB.transaction(type, "readonly");
  tx.objectStore(type).getAll().onsuccess = (e) => {
    let data = e.target.result;

    if (searchValue)
      data = data.filter((item) => item.name.toLowerCase().includes(searchValue));

    if (filterValue)
      data = data.filter((item) =>
        type === "doctor"
          ? item.department === filterValue
          : item.role === filterValue
      );

    const tableId =
      type === "doctor"
        ? "doctorTableBody"
        : type === "staff"
        ? "staffTableBody"
        : "deptTableBody";

    const body = $(tableId);
    body.innerHTML = "";

    data.forEach((d) => {
      const row =
        type === "doctor"
          ? `
        <tr>
          <td>${d.name}</td>
          <td>${d.department}</td>
          <td>${d.phone}</td>
          <td>
            <button class="btn-edit" onclick="openModal('doctor','${d.id}', ${JSON.stringify(
              d
            )})">Edit</button>
            <button class="btn-del" onclick="deleteItem('doctors','${d.id}')">Delete</button>
          </td>
        </tr>`
          : type === "staff"
          ? `
        <tr>
          <td>${d.name}</td>
          <td>${d.role}</td>
          <td>${d.phone}</td>
          <td>
            <button class="btn-edit" onclick="openModal('staff','${d.id}', ${JSON.stringify(
              d
            )})">Edit</button>
            <button class="btn-del" onclick="deleteItem('staff','${d.id}')">Delete</button>
          </td>
        </tr>`
          : `
        <tr>
          <td>${d.name}</td>
          <td>
            <button class="btn-edit" onclick="openModal('dept','${d.id}', ${JSON.stringify(
              d
            )})">Edit</button>
            <button class="btn-del" onclick="deleteItem('departments','${d.id}')">Delete</button>
          </td>
        </tr>`;

      body.innerHTML += row;
    });
  };
}
