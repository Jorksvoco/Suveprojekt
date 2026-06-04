const COMPONENTS = [
  "CPU",
  "CPU Cooler",
  "Motherboard",
  "Memory",
  "Storage",
  "Video Card",
  "Case",
  "Power Supply"
];

let PARTS = {
  "CPU": [],
  "CPU Cooler": [],
  "Motherboard": [],
  "Memory": [],
  "Storage": [],
  "Video Card": [],
  "Case": [],
  "Power Supply": []
};

const state = {
  buildName: "",
  selectedParts: {
    "CPU": null,
    "CPU Cooler": null,
    "Motherboard": null,
    "Memory": null,
    "Storage": null,
    "Video Card": null,
    "Case": null,
    "Power Supply": null
  },
  modalCategory: null,
  modalParts: []
};

const partsTableBody = document.getElementById("partsTableBody");
const totalPriceEl = document.getElementById("totalPrice");
const totalWattageEl = document.getElementById("totalWattage");
const psuHeadroomEl = document.getElementById("psuHeadroom");
const selectedCountEl = document.getElementById("selectedCount");
const issuesListEl = document.getElementById("issuesList");
const compatibilityBanner = document.getElementById("compatibilityBanner");
const buildNameInput = document.getElementById("buildName");
const savedBuildsList = document.getElementById("savedBuildsList");

const partModal = document.getElementById("partModal");
const modalTitle = document.getElementById("modalTitle");
const modalSubtitle = document.getElementById("modalSubtitle");
const modalResults = document.getElementById("modalResults");
const searchInput = document.getElementById("searchInput");
const brandFilter = document.getElementById("brandFilter");
const sortSelect = document.getElementById("sortSelect");

document.getElementById("closeModalBtn").addEventListener("click", closeModal);
document.getElementById("modalBackdrop").addEventListener("click", closeModal);
document.getElementById("saveBuildBtn").addEventListener("click", saveBuild);
document.getElementById("loadBuildBtn").addEventListener("click", renderSavedBuilds);
document.getElementById("resetBuildBtn").addEventListener("click", resetBuild);
buildNameInput.addEventListener("input", (e) => {
  state.buildName = e.target.value.trim();
});
searchInput.addEventListener("input", renderModalParts);
brandFilter.addEventListener("change", renderModalParts);
sortSelect.addEventListener("change", renderModalParts);

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function getSelectedCount() {
  return Object.values(state.selectedParts).filter(Boolean).length;
}

function getTotalPrice() {
  return Object.values(state.selectedParts)
    .filter(Boolean)
    .reduce((sum, part) => sum + Number(part.price || 0), 0);
}

function getEstimatedWattage() {
  return Object.values(state.selectedParts)
    .filter(Boolean)
    .reduce((sum, part) => sum + Number(part.wattage || 0), 0);
}

function getPSUHeadroom() {
  const psu = state.selectedParts["Power Supply"];
  if (!psu) return null;
  return Number(psu.psuWattage || 0) - getEstimatedWattage();
}

function getCompatibilityReport() {
  const issues = [];
  const warnings = [];

  const cpu = state.selectedParts["CPU"];
  const cooler = state.selectedParts["CPU Cooler"];
  const motherboard = state.selectedParts["Motherboard"];
  const memory = state.selectedParts["Memory"];
  const gpu = state.selectedParts["Video Card"];
  const pcCase = state.selectedParts["Case"];
  const psu = state.selectedParts["Power Supply"];

  if (cpu && motherboard && cpu.socket !== motherboard.socket) {
    issues.push(`CPU socket (${cpu.socket}) does not match motherboard socket (${motherboard.socket}).`);
  }

  if (cpu && cooler && !(cooler.socketSupport || []).includes(cpu.socket)) {
    issues.push(`CPU cooler does not support socket ${cpu.socket}.`);
  }

  if (motherboard && memory && motherboard.ramType !== memory.ramType) {
    issues.push(`Memory type (${memory.ramType}) does not match motherboard RAM type (${motherboard.ramType}).`);
  }

  if (motherboard && pcCase && !(pcCase.supportedFormFactors || []).includes(motherboard.formFactor)) {
    issues.push(`Case does not support motherboard form factor ${motherboard.formFactor}.`);
  }

  if (gpu && pcCase && Number(gpu.gpuLength || 0) > Number(pcCase.maxGpuLength || 0)) {
    issues.push(`GPU length (${gpu.gpuLength}mm) exceeds case max GPU length (${pcCase.maxGpuLength}mm).`);
  }

  const estimatedWattage = getEstimatedWattage();
  if (psu) {
    if (Number(psu.psuWattage || 0) < estimatedWattage) {
      issues.push(`PSU wattage (${psu.psuWattage}W) is below estimated draw (${estimatedWattage}W).`);
    } else if (Number(psu.psuWattage || 0) < estimatedWattage + 150) {
      warnings.push(`PSU headroom is tight.`);
    }
  } else if (estimatedWattage > 0) {
    warnings.push("No power supply selected.");
  }

  if (cpu && !cooler) warnings.push("No CPU cooler selected.");
  if (cpu && !motherboard) warnings.push("No motherboard selected.");
  if (cpu && !memory) warnings.push("No memory selected.");

  return { issues, warnings };
}

function getBannerState() {
  const { issues, warnings } = getCompatibilityReport();

  if (issues.length) {
    return {
      className: "danger",
      text: `Compatibility issues found: ${issues.length}`
    };
  }

  if (warnings.length) {
    return {
      className: "warning",
      text: `Build has ${warnings.length} warning(s)`
    };
  }

  if (getSelectedCount() === 0) {
    return {
      className: "neutral",
      text: "No parts selected yet."
    };
  }

  return {
    className: "success",
    text: "All current selections look compatible."
  };
}

function createDetailsMarkup(part) {
  if (!part) return `<span class="muted">No part selected</span>`;
  return (part.details || []).map(detail => `<span class="details-chip">${detail}</span>`).join("");
}

function renderPartsTable() {
  partsTableBody.innerHTML = "";

  COMPONENTS.forEach(category => {
    const part = state.selectedParts[category];
    const row = document.createElement("tr");

    row.innerHTML = `
      <td><strong>${category}</strong></td>
      <td>
        <div>${part ? part.name : "No part selected"}</div>
        <div class="muted">${part ? part.brand : "Choose a component"}</div>
      </td>
      <td>${createDetailsMarkup(part)}</td>
      <td>${part ? formatCurrency(part.price) : "—"}</td>
      <td>${part ? `${part.wattage || 0} W` : "—"}</td>
      <td></td>
    `;

    const actionCell = row.querySelector("td:last-child");

    const pickBtn = document.createElement("button");
    pickBtn.className = "pick-btn";
    pickBtn.textContent = part ? "Change" : "Choose";
    pickBtn.addEventListener("click", () => openModal(category));
    actionCell.appendChild(pickBtn);

    if (part) {
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-btn";
      removeBtn.textContent = "Remove";
      removeBtn.style.marginLeft = "8px";
      removeBtn.addEventListener("click", () => {
        state.selectedParts[category] = null;
        updateUI();
      });
      actionCell.appendChild(removeBtn);
    }

    partsTableBody.appendChild(row);
  });
}

function renderSummary() {
  totalPriceEl.textContent = formatCurrency(getTotalPrice());
  totalWattageEl.textContent = `${getEstimatedWattage()} W`;
  selectedCountEl.textContent = getSelectedCount();

  const headroom = getPSUHeadroom();
  psuHeadroomEl.textContent = headroom === null ? "—" : `${headroom} W`;

  const report = getCompatibilityReport();
  const notes = [
    ...report.issues.map(x => `Issue: ${x}`),
    ...report.warnings.map(x => `Warning: ${x}`)
  ];

  issuesListEl.innerHTML = "";
  if (!notes.length) {
    const li = document.createElement("li");
    li.textContent = getSelectedCount() ? "No compatibility problems detected." : "No checks yet.";
    issuesListEl.appendChild(li);
  } else {
    notes.forEach(note => {
      const li = document.createElement("li");
      li.textContent = note;
      issuesListEl.appendChild(li);
    });
  }

  const banner = getBannerState();
  compatibilityBanner.className = `compatibility-banner ${banner.className}`;
  compatibilityBanner.textContent = banner.text;
}

function openModal(category) {
  state.modalCategory = category;
  state.modalParts = PARTS[category] || [];

  modalTitle.textContent = `Choose ${category}`;
  modalSubtitle.textContent = `${state.modalParts.length} options available`;

  searchInput.value = "";
  brandFilter.innerHTML = `<option value="all">All Brands</option>`;

  const brands = [...new Set(state.modalParts.map(part => part.brand))].sort();
  brands.forEach(brand => {
    const option = document.createElement("option");
    option.value = brand;
    option.textContent = brand;
    brandFilter.appendChild(option);
  });

  partModal.classList.remove("hidden");
  renderModalParts();
}

function closeModal() {
  partModal.classList.add("hidden");
}

function isPartCompatibleForPreview(category, part) {
  const current = state.selectedParts;
  const cpu = category === "CPU" ? part : current["CPU"];
  const cooler = category === "CPU Cooler" ? part : current["CPU Cooler"];
  const motherboard = category === "Motherboard" ? part : current["Motherboard"];
  const memory = category === "Memory" ? part : current["Memory"];
  const gpu = category === "Video Card" ? part : current["Video Card"];
  const pcCase = category === "Case" ? part : current["Case"];
  const psu = category === "Power Supply" ? part : current["Power Supply"];

  if (cpu && motherboard && cpu.socket !== motherboard.socket) return false;
  if (cpu && cooler && !(cooler.socketSupport || []).includes(cpu.socket)) return false;
  if (motherboard && memory && motherboard.ramType !== memory.ramType) return false;
  if (motherboard && pcCase && !(pcCase.supportedFormFactors || []).includes(motherboard.formFactor)) return false;
  if (gpu && pcCase && Number(gpu.gpuLength || 0) > Number(pcCase.maxGpuLength || 0)) return false;

  const fakeSelected = { ...current, [category]: part };
  const wattage = Object.values(fakeSelected)
    .filter(Boolean)
    .reduce((sum, p) => sum + Number(p.wattage || 0), 0);

  if (psu && Number(psu.psuWattage || 0) < wattage) return false;

  return true;
}

function renderModalParts() {
  const query = searchInput.value.toLowerCase().trim();
  const brand = brandFilter.value;
  const sort = sortSelect.value;

  let filtered = [...state.modalParts];

  if (query) {
    filtered = filtered.filter(part =>
      `${part.brand} ${part.name} ${(part.details || []).join(" ")}`
        .toLowerCase()
        .includes(query)
    );
  }

  if (brand !== "all") {
    filtered = filtered.filter(part => part.brand === brand);
  }

  filtered.sort((a, b) => {
    switch (sort) {
      case "price-desc":
        return Number(b.price || 0) - Number(a.price || 0);
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "wattage-desc":
        return Number(b.wattage || 0) - Number(a.wattage || 0);
      case "price-asc":
      default:
        return Number(a.price || 0) - Number(b.price || 0);
    }
  });

  modalResults.innerHTML = "";

  if (!filtered.length) {
    modalResults.innerHTML = `<div class="muted">No parts matched your filters.</div>`;
    return;
  }

  filtered.forEach(part => {
    const compatible = isPartCompatibleForPreview(state.modalCategory, part);

    const card = document.createElement("div");
    card.className = "part-card";
    card.innerHTML = `
      <div>
        <h4>${part.brand} ${part.name}</h4>
        <p class="muted">${(part.details || []).join(" • ")}</p>
        <span class="compat-badge ${compatible ? "good" : "bad"}">
          ${compatible ? "Compatible" : "Conflict"}
        </span>
      </div>
      <div>
        <strong>${formatCurrency(part.price)}</strong>
        <p class="muted">Power: ${part.wattage || 0} W</p>
      </div>
    `;

    const actionWrap = document.createElement("div");
    const selectBtn = document.createElement("button");
    selectBtn.className = "btn btn-primary";
    selectBtn.textContent = "Select";
    selectBtn.addEventListener("click", () => {
      state.selectedParts[state.modalCategory] = part;
      closeModal();
      updateUI();
    });

    actionWrap.appendChild(selectBtn);
    card.appendChild(actionWrap);
    modalResults.appendChild(card);
  });
}

function saveBuild() {
  const name = state.buildName || buildNameInput.value.trim() || `Build ${new Date().toLocaleString()}`;
  const builds = JSON.parse(localStorage.getItem("pc-builder-builds") || "[]");

  builds.unshift({
    id: Date.now(),
    name,
    createdAt: new Date().toISOString(),
    selectedParts: state.selectedParts
  });

  localStorage.setItem("pc-builder-builds", JSON.stringify(builds));
  renderSavedBuilds();
  alert(`Saved "${name}"`);
}

function renderSavedBuilds() {
  const builds = JSON.parse(localStorage.getItem("pc-builder-builds") || "[]");
  savedBuildsList.innerHTML = "";

  if (!builds.length) {
    savedBuildsList.innerHTML = `<p class="muted">No saved builds yet.</p>`;
    return;
  }

  builds.forEach(build => {
    const item = document.createElement("div");
    item.className = "saved-build-item";

    const meta = document.createElement("div");
    meta.innerHTML = `
      <strong>${build.name}</strong>
      <div class="muted">${new Date(build.createdAt).toLocaleString()}</div>
    `;

    const actions = document.createElement("div");
    actions.className = "saved-actions";

    const loadBtn = document.createElement("button");
    loadBtn.className = "btn btn-secondary";
    loadBtn.textContent = "Load";
    loadBtn.addEventListener("click", () => {
      state.buildName = build.name;
      buildNameInput.value = build.name;
      state.selectedParts = build.selectedParts;
      updateUI();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      const next = builds.filter(x => x.id !== build.id);
      localStorage.setItem("pc-builder-builds", JSON.stringify(next));
      renderSavedBuilds();
    });

    actions.appendChild(loadBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(meta);
    item.appendChild(actions);
    savedBuildsList.appendChild(item);
  });
}

function resetBuild() {
  state.buildName = "";
  buildNameInput.value = "";
  COMPONENTS.forEach(category => {
    state.selectedParts[category] = null;
  });
  updateUI();
}

async function loadPartsFromBackend() {
  const res = await fetch("/api/parts");
  const data = await res.json();

  PARTS["CPU"] = (data.cpus || []).map(cpu => ({
    ...cpu,
    wattage: Number(cpu.tdp || 0),
    integratedGraphics: Boolean(cpu.integrated_graphics),
    ramType: cpu.memory_type,
    details: [
      `${cpu.cores}C/${cpu.threads}T`,
      cpu.socket,
      `${cpu.tdp}W`,
      cpu.memory_type
    ].filter(Boolean)
  }));

  PARTS["CPU Cooler"] = (data.coolers || []).map(cooler => ({
    ...cooler,
    coolerType: cooler.type,
    socketSupport: cooler.socket_support || [],
    wattage: 5,
    details: [
      cooler.type,
      ...(cooler.socket_support || []),
      cooler.height_mm ? `${cooler.height_mm}mm height` : null,
      cooler.radiator_size_mm ? `${cooler.radiator_size_mm}mm radiator` : null
    ].filter(Boolean)
  }));

  PARTS["Motherboard"] = (data.motherboards || []).map(mb => ({
    ...mb,
    formFactor: mb.form_factor,
    ramType: mb.memory_type,
    wattage: 45,
    details: [
      mb.socket,
      mb.chipset,
      mb.form_factor,
      mb.memory_type,
      mb.wifi ? "Wi-Fi" : "No Wi-Fi"
    ].filter(Boolean)
  }));

  PARTS["Memory"] = (data.memory || []).map(ram => ({
    ...ram,
    ramType: ram.type,
    wattage: 8,
    details: [
      `${ram.capacity_gb}GB`,
      `${ram.modules} module(s)`,
      ram.type,
      `${ram.speed_mt}MT/s`,
      `CL${ram.cas_latency}`
    ].filter(Boolean)
  }));

  PARTS["Storage"] = (data.storage || []).map(drive => ({
    ...drive,
    storageType: drive.type,
    wattage: 6,
    details: [
      `${drive.capacity_gb}GB`,
      drive.type,
      drive.interface,
      drive.form_factor,
      `${drive.read_speed}/${drive.write_speed} MB/s`
    ].filter(Boolean)
  }));

  PARTS["Video Card"] = (data.gpus || []).map(gpu => ({
    ...gpu,
    gpuLength: gpu.length_mm,
    wattage: Number(gpu.board_power || 0),
    details: [
      gpu.chipset,
      `${gpu.vram}GB`,
      gpu.memory_type,
      `${gpu.board_power}W`,
      gpu.length_mm ? `${gpu.length_mm}mm` : null
    ].filter(Boolean)
  }));

  PARTS["Case"] = (data.cases || []).map(pcCase => ({
    ...pcCase,
    supportedFormFactors: pcCase.form_factor_support || [],
    maxGpuLength: pcCase.max_gpu_length_mm,
    wattage: 3,
    details: [
      ...(pcCase.form_factor_support || []),
      pcCase.max_gpu_length_mm ? `${pcCase.max_gpu_length_mm}mm GPU max` : null,
      pcCase.max_cooler_height_mm ? `${pcCase.max_cooler_height_mm}mm cooler max` : null
    ].filter(Boolean)
  }));

  PARTS["Power Supply"] = (data.psus || []).map(psu => ({
    ...psu,
    psuWattage: psu.wattage,
    wattage: 0,
    details: [
      `${psu.wattage}W`,
      psu.efficiency,
      psu.modular ? "Modular" : "Non-Modular",
      psu.form_factor
    ].filter(Boolean)
  }));
}

async function init() {
  try {
    await loadPartsFromBackend();
    updateUI();
    renderSavedBuilds();
  } catch (err) {
    console.error(err);
    compatibilityBanner.className = "compatibility-banner danger";
    compatibilityBanner.textContent = "Failed to load parts from backend.";
  }
}

function updateUI() {
  renderPartsTable();
  renderSummary();
}

init();
