/* ================================================================
   ADMIN PANEL ENGINE — Doctors / Staff / Roles
================================================================ */

const $ = (x) => document.getElementById(x);

/* PAGE SWITCH */
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
    $(btn.dataset.target).classList.add("active-page");
  };
});

/* INIT DB */
let DB;
const dbReq = indexedDB.open("KCC_Admin_DB", 1);

dbReq.onupgradeneeded = (e) => {
  DB = e.target.result;

  if (!DB.objectStoreNames.contains("doctors"))
    DB.createObjectStore("doctors", { keyPath: "id" });

  if (!DB.objectStoreNames.contains("staff"))
    DB.createObjectStore("staff", { keyPath: "id" });

  if (!DB.objectStoreNames.contains("roles"))
    DB.createObjectStore("roles", { keyPath: "id" });
};

dbReq.onsuccess = (e) => {
  DB = e.target.result;
  loadDoctors();
  loadRoles();
  loadStaff();
};

/* RANDOM ID */
const randomID = () => "ID-" + Math.floor(Math.random() * 999999);

/* ---------------------- DOCTORS CRUD ---------------------- */

$("saveDoctor").onclick = () => {
  const doc = {
    id: randomID(),
    name: $("doc_name").value,
    specialization: $("doc_specialization").value,
    phone: $("doc_phone").value,
    email: $("doc_email").value
  };

  let tx = DB.transaction("doctors", "readwrite");
  tx.objectStore("doctors").put(doc);
  tx.oncomplete = () => {
    $("doc_name").value =
    $("doc_specialization").value =
    $("doc_phone").value =
    $("doc_email").value = "";
    loadDoctors();
  };
};

function deleteDoctor(id) {
  let tx = DB.transaction("doctors", "readwrite");
  tx.objectStore("doctors").delete(id);
  tx.oncomplete = loadDoctors;
}

function loadDoctors() {
  let tx = DB.transaction("doctors", "readonly");
  tx.objectStore("doctors").getAll().onsuccess = (e) => {
    const tb = $("doctorTable").querySelector("tbody");
    tb.innerHTML = "";
    e.target.result.forEach(d => {
      tb.innerHTML += `
        <tr>
          <td>${d.name}</td>
          <td>${d.specialization}</td>
          <td>${d.phone}</td>
          <td>${d.email}</td>
          <td><button class="btn" onclick="deleteDoctor('${d.id}')">Delete</button></td>
        </tr>`;
    });
  };
}

/* ---------------------- ROLES CRUD ---------------------- */

$("saveRole").onclick = () => {
  const checks = Array.from(document.querySelectorAll(".permissions-box input:checked"))
    .map(c => c.value);

  const role = {
    id: randomID(),
    name: $("role_name").value,
    permissions: checks
  };

  let tx = DB.transaction("roles", "readwrite");
  tx.objectStore("roles").put(role);
  tx.oncomplete = () => {
    $("role_name").value = "";
    document.querySelectorAll(".permissions-box input").forEach(i => i.checked = false);
    loadRoles();
    loadRolesToStaffDropdown();
  };
};

function deleteRole(id) {
  let tx = DB.transaction("roles", "readwrite");
  tx.objectStore("roles").delete(id);
  tx.oncomplete = () => {
    loadRoles();
    loadRolesToStaffDropdown();
  };
}

function loadRoles() {
  let tx = DB.transaction("roles", "readonly");
  tx.objectStore("roles").getAll().onsuccess = (e) => {
    const tb = $("rolesTable").querySelector("tbody");
    tb.innerHTML = "";

    e.target.result.forEach(r => {
      tb.innerHTML += `
        <tr>
          <td>${r.name}</td>
          <td>${r.permissions.join(", ")}</td>
          <td><button class="btn" onclick="deleteRole('${r.id}')">Delete</button></td>
        </tr>`;
    });
  };
}

/* Load roles in staff dropdown */
function loadRolesToStaffDropdown() {
  let tx = DB.transaction("roles", "readonly");
  tx.objectStore("roles").getAll().onsuccess = (e) => {
    const sel = $("staff_role");
    sel.innerHTML = `<option value="">Select Role</option>`;
    e.target.result.forEach(r => {
      sel.innerHTML += `<option value="${r.name}">${r.name}</option>`;
    });
  };
}

/* ---------------------- STAFF CRUD ---------------------- */

$("saveStaff").onclick = () => {
  const st = {
    id: randomID(),
    name: $("staff_name").value,
    role: $("staff_role").value,
    phone: $("staff_phone").value,
    email: $("staff_email").value
  };

  let tx = DB.transaction("staff", "readwrite");
  tx.objectStore("staff").put(st);
  tx.oncomplete = () => {
    $("staff_name").value =
    $("staff_role").value =
    $("staff_phone").value =
    $("staff_email").value = "";
    loadStaff();
  };
};

function deleteStaff(id) {
  let tx = DB.transaction("staff", "readwrite");
  tx.objectStore("staff").delete(id);
  tx.oncomplete = loadStaff;
}

function loadStaff() {
  let tx = DB.transaction("staff", "readonly");
  tx.objectStore("staff").getAll().onsuccess = (e) => {
    const tb = $("staffTable").querySelector("tbody");
    tb.innerHTML = "";

    e.target.result.forEach(s => {
      tb.innerHTML += `
        <tr>
          <td>${s.name}</td>
          <td>${s.role}</td>
          <td>${s.phone}</td>
          <td>${s.email}</td>
          <td><button class="btn" onclick="deleteStaff('${s.id}')">Delete</button></td>
        </tr>`;
    });
  };
}
