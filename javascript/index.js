
const formWB = document.getElementById("formWaybill");
const errorMsg = document.getElementById("errorMsg");
const tableBody = document.querySelector("#wbList tbody");

const countPending = document.getElementById("countPending");
const countTransit = document.getElementById("countTransit");
const countDelivered = document.getElementById("countDelivered");


const STATUS_FLOW = [
  { value: "pending", label: "Pendiente" },
  { value: "awaiting", label: "En tránsito" },
  { value: "delivered", label: "Entregada" }
];


let data = JSON.parse(localStorage.getItem("formData")) || [];


formWB.addEventListener("submit", function (e) {
  e.preventDefault();

  const wbNumberValue = document.getElementById("wbNumber").value.trim();
  const origin = document.getElementById("origin").value.trim();
  const destiny = document.getElementById("destiny").value.trim();
  const createDate = document.getElementById("createDate").value;
  const pkStatus = document.getElementById("pkStatus").value;

  if (!wbNumberValue || !origin || !destiny || !createDate || !pkStatus) {
    showError("Todos los campos son obligatorios.");
    return;
  }

  const wbNumber = Number(wbNumberValue);

  const exists = data.some(g => g.wbNumber === wbNumber);
  if (exists) {
    showError("El número de guía ya existe.");
    return;
  }

  errorMsg.textContent = "";

  const now = new Date().toLocaleString();

  const register = {
    wbNumber,
    origin,
    destiny,
    status: pkStatus,
    updatedAt: now,
    history: [
      {
        status: pkStatus,
        date: now
      }
    ]
  };

  data.push(register);
  saveToLocalStorage();
  renderTable();
  formWB.reset();
});


function showError(message) {
  errorMsg.textContent = message;
}

function saveToLocalStorage() {
  localStorage.setItem("formData", JSON.stringify(data));
}

function getStatusLabel(value) {
  return STATUS_FLOW.find(s => s.value === value)?.label || value;
}

function renderNextStatusSelect(currentStatus, index) {
  const currentIndex = STATUS_FLOW.findIndex(s => s.value === currentStatus);
  const next = STATUS_FLOW[currentIndex + 1];

  if (!next) {
    return `<span class="text-success">Finalizado</span>`;
  }

  return `
    <select class="form-select form-select-sm"
      onchange="updateStatus(${index}, this.value)">
      <option selected disabled>Cambiar a...</option>
      <option value="${next.value}">${next.label}</option>
    </select>
  `;
}

function renderTable() {
  tableBody.innerHTML = "";

  data.forEach((guide, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${guide.wbNumber}</td>
      <td>${getStatusLabel(guide.status)}</td>
      <td>${guide.origin}</td>
      <td>${guide.destiny}</td>
      <td>${guide.updatedAt}</td>
      <td>${renderNextStatusSelect(guide.status, index)}</td>
      <td>
        <button class="btn btn-sm btn-info"
          onclick="showHistory(${index})">
          Historial
        </button>
      </td>
    `;

    tableBody.appendChild(tr);
  });

  updateDashboard();
}

function updateStatus(index, newStatus) {
  const guide = data[index];
  const now = new Date().toLocaleString();

  guide.status = newStatus;
  guide.updatedAt = now;

  guide.history.push({
    status: newStatus,
    date: now
  });

  saveToLocalStorage();
  renderTable();
}

function updateDashboard() {
  countPending.textContent =
    data.filter(g => g.status === "pending").length;

  countTransit.textContent =
    data.filter(g => g.status === "awaiting").length;

  countDelivered.textContent =
    data.filter(g => g.status === "delivered").length;
}


function showHistory(index) {
  const historyList = document.getElementById("historyList");
  const modal = document.getElementById("historyModal");

  historyList.innerHTML = "";

  data[index].history.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${getStatusLabel(item.status)} — ${item.date}`;
    historyList.appendChild(li);
  });

  modal.hidden = false;
}

function closeHistory() {
  document.getElementById("historyModal").hidden = true;
}


document.addEventListener("DOMContentLoaded", renderTable);


const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("wbSearchNumber");
const searchResult = document.getElementById("searchResult");
const searchError = document.getElementById("searchError");

searchBtn.addEventListener("click", () => {
  const value = searchInput.value.trim();

  if (!value) {
    searchError.textContent = "Ingresa un número de guía.";
    searchResult.innerHTML = "";
    return;
  }

  const wbNumber = Number(value);
  const guide = data.find(g => g.wbNumber === wbNumber);

  if (!guide) {
    searchError.textContent = "Guía no encontrada.";
    searchResult.innerHTML = "";
    return;
  }

  searchError.textContent = "";
  renderSearchResult(guide);
});

function renderSearchResult(guide) {
  const historyItems = guide.history
    .map(
      h => `<li>${getStatusLabel(h.status)} — ${h.date}</li>`
    )
    .join("");

  searchResult.innerHTML = `
    <div class="card mt-3">
      <div class="card-body">
        <h5 class="card-title">
          Guía #${guide.wbNumber}
        </h5>

        <p><strong>Origen:</strong> ${guide.origin}</p>
        <p><strong>Destino:</strong> ${guide.destiny}</p>
        <p><strong>Estado actual:</strong> ${getStatusLabel(guide.status)}</p>
        <p><strong>Última actualización:</strong> ${guide.updatedAt}</p>

        <hr>
        <h6>Historial</h6>
        <ul>
          ${historyItems}
        </ul>
      </div>
    </div>
    `;
}
