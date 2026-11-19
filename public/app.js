const $ = (id) =>document.getElementById(id);

const money = (n) => "PHP " + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s) => String(s ?? "").replace(/[&<>"']/g,(c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dateOnly = (d) => new Date(d).toISOString().slice(0, 10);

let residents = [];
let transactions = [];

async function api(url, options = {}) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" },...options });
  const text = await res.text();
  let data = {};
 try{ data = text ? JSON.parse(text) : {}; } catch {}
  if(!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

function showMessage(text, isError = false) {
 constbox = $("message");
 if(!box) return;
 box.textContent = text;
 box.className = "message" + (isError ? " error" : "");
 box.hidden = false;
 clearTimeout(showMessage.t);
 showMessage.t = setTimeout(() => (box.hidden = true), 4000);
}

async function run(task) {
 try{ await task(); } catch (err) { showMessage(err.message, true); }
}

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
   document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b === btn));
   document.querySelectorAll(".panel").forEach((p) => (p.hidden = p.id !== btn.dataset.tab));
  });
});

/* DASHBOARD */
async function loadSummary() {
  const s = await api("/api/reports/summary");
  $("stats").innerHTML = `
    <div class="stat"><span>Registered residents</span><strong>${s.residents}</strong></div>
    <div class="stat"><span>Service transactions</span><strong>${s.transactions}</strong></div>
    <div class="stat money"><span>Fees collected</span><strong>${money(s.collected)}</strong></div>
    <div class="stat owed"><span>Unpaid (${s.unpaidCount})</span><strong>${money(s.unpaidAmount)}</strong></div>`;

  const max = Math.max(1,...s.byService.map((x) => x.count));
  $("serviceBreakdown").innerHTML = s.byService.length
    ? s.byService.map((x) => `
        <div class="bar-row">
          <div class="label"><span>${esc(x.service)}</span><strong>${x.count}</strong></div>
          <div class="bar"><I style="width:${(x.count / max) * 100}%"></i></div>
        </div>`).join("")
    : `<p class="empty">No services recorded yet. Add a transaction to see the breakdown.</p>`;
}

/* RESIDENTS */
async function loadResidents() {
residents = await api("/api/residents");
  $("residentRows").innerHTML = residents.length
    ? residents.map((r) => `
        <tr>
          <td>${esc(r.fullName)}</td><td>${r.age}</td><td>${esc(r.sex)}</td>
          <td>${esc(r.purok)}</td><td>${esc(r.contact)}</td>
          <td class="actions-cell">
            <button class="small" data-edit="${r._id}">Edit</button>
            <button class="small danger" data-del="${r._id}">Delete</button>
          </td>
        </tr>`).join("")
    : `<tr><td colspan="6" class="empty">No residents yet. Add the first resident above.</td></tr>`;

  $("tResident").innerHTML = `<option value="">Select resident</option>` +
  residents.map((r) => `<option value="${r._id}">${esc(r.fullName)} (${esc(r.purok)})</option>`).join("");
}

function resetResidentForm() {
  $("residentForm").reset();
  $("residentId").value = "";
  $("residentFormTitle").textContent = "Add resident";
  $("residentCancel").hidden = true;
}

$("residentForm").addEventListener("submit", (e) => {
  e.preventDefault();
  run(async () => {
    const body = JSON.stringify({
      fullName: $("fullName").value,
      age: Number($("age").value),
      sex: $("sex").value,
      purok: $("purok").value,
      contact: $("contact").value,
      address: $("address").value,
    });
    const id = $("residentId").value;
    await api(id ? `/api/residents/${id}` : "/api/residents", { method: id ? "PUT" : "POST", body });
    showMessage(id ? "Resident updated." : "Resident saved.");
    resetResidentForm();
    await refreshAll();
  });
});

$("residentCancel").addEventListener("click", resetResidentForm);

$("residentRows").addEventListener("click", (e) => {
  const editId = e.target.dataset.edit;
  const delId = e.target.dataset.del;
  if(editId) {
    const r = residents.find((x) => x._id === editId);
    $("residentId").value = r._id;
    $("fullName").value = r.fullName;
    $("age").value = r.age;
    $("sex").value = r.sex;
    $("purok").value = r.purok;
    $("contact").value = r.contact || "";
    $("address").value = r.address || "";
    $("residentFormTitle").textContent = "Edit resident";
    $("residentCancel").hidden = false;
    $("residentForm").scrollIntoView({ behavior: "smooth" });
  }
  if(delId && confirm("Delete this resident and all of their transactions?")) {
    run(async () => {
      await api(`/api/residents/${delId}`, { method: "DEletE" });
      showMessage("Resident deleted.");
      await refreshAll();
    });
  }
});

/* Transactions */
async function loadServices() {
  const list = await api("/api/transactions/services");
  $("tService").innerHTML = `<option value="">Select service</option>` +
    list.map((s) => `<option>${esc(s)}</option>`).join("");
}

async function loadTransactions() {
  transactions = await api("/api/transactions");
  $("transactionRows").innerHTML = transactions.length
    ? transactions.map((t) => `
        <tr>
          <td>${dateOnly(t.serviceDate)}</td>
          <td>${esc(t.resident ? t.resident.fullName : "Deleted resident")}</td>
          <td>${esc(t.service)}</td>
          <td>${money(t.amount)}</td>
          <td>
            <select data-pay="${t._id}" aria-label="Payment status">
              ${["Free", "Paid", "Unpaid"].map((p) => `<option ${p === t.paymentStatus ? "selected" : ""}>${p}</option>`).join("")}
            </select>
          </td>
          <td class="actions-cell">
            <button class="small" data-edit="${t._id}">Edit</button>
            <button class="small danger" data-del="${t._id}">Delete</button>
          </td>
        </tr>`).join("")
    : `<tr><td colspan="6" class="empty">No transactions yet. Record the first service above.</td></tr>`;
}

function resetTransactionForm() {
  $("transactionForm").reset();
  $("transactionId").value = "";
  $("tDate").value = new Date().toISOString().slice(0, 10);
  $("transactionFormTitle").textContent = "Record a service";
  $("transactionCancel").hidden = true;
}

$("transactionForm").addEventListener("submit", (e) => {
  e.preventDefault();
  run(async () => {
    const body = JSON.stringify({
      resident: $("tResident").value,
      service: $("tService").value,
      amount: Number($("tAmount").value || 0),
      paymentStatus: $("tPayment").value,
      serviceDate: $("tDate").value,
      notes: $("tNotes").value,
    });
    const id = $("transactionId").value;
    await api(id ? `/api/transactions/${id}` : "/api/transactions", { method: id ? "PUT" : "POST", body });
    showMessage(id ? "Transaction updated." : "Transaction saved.");
    resetTransactionForm();
    await refreshAll();
  });
});

$("transactionCancel").addEventListener("click", resetTransactionForm);

$("transactionRows").addEventListener("click", (e) => {
  const editId = e.target.dataset.edit;
  const delId = e.target.dataset.del;
  if(editId) {
    const t = transactions.find((x) => x._id === editId);
    $("transactionId").value = t._id;
    $("tResident").value = t.resident ? t.resident._id : "";
    $("tService").value = t.service;
    $("tAmount").value = t.amount;
    $("tPayment").value = t.paymentStatus;
    $("tDate").value = dateOnly(t.serviceDate);
    $("tNotes").value = t.notes || "";
    $("transactionFormTitle").textContent = "Edit transaction";
    $("transactionCancel").hidden = false;
    $("transactionForm").scrollIntoView({ behavior: "smooth" });
  }
  if(delId && confirm("Delete this transaction?")) {
    run(async () => {
      await api(`/api/transactions/${delId}`, { method: "DEletE" });
      showMessage("Transaction deleted.");
      await refreshAll();
    });
  }
});

$("transactionRows").addEventListener("change", (e) => {
  const id = e.target.dataset.pay;
  if(!id) return;
  run(async () => {
    await api(`/api/transactions/${id}`, { method: "PUT", body: JSON.stringify({ paymentStatus: e.target.value }) });
    showMessage(`Marked as ${e.target.value}.`);
    await refreshAll();
  });
});

async function refreshAll() {
  await Promise.all([loadResidents(), loadtransactions(), loadSummary()]);
}

run(async () => {
  await loadServices();
  resetTransactionForm();
  await refreshAll();
});