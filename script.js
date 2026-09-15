const foldDefinitions = [
  {
    id: "nose",
    label: "Nose fold",
    options: [
      { id: "sharp", label: "Sharp", drag: -0.04, mass: 0.01, cg: 0.09, lift: -0.03, stability: 0.03, silhouette: 1 },
      { id: "blunt", label: "Blunt", drag: 0.05, mass: 0.005, cg: 0.02, lift: 0.02, stability: 0.08, silhouette: -1 }
    ]
  },
  {
    id: "wingAngle",
    label: "Wing angle",
    options: [
      { id: "wide", label: "Wide", lift: 0.22, drag: 0.06, stability: 0.13, area: 0.12, silhouette: -1 },
      { id: "swept", label: "Swept", lift: -0.04, drag: -0.035, stability: -0.03, area: -0.03, cg: 0.03, silhouette: 1 }
    ]
  },
  {
    id: "wingspan",
    label: "Wingspan",
    options: [
      { id: "long", label: "Long", lift: 0.16, drag: 0.035, stability: 0.08, area: 0.16, silhouette: -1 },
      { id: "short", label: "Short", lift: -0.08, drag: -0.035, stability: -0.05, area: -0.1, silhouette: 1 }
    ]
  },
  {
    id: "crease",
    label: "Body crease",
    options: [
      { id: "deep", label: "Deep", drag: 0.02, stability: 0.18, lift: -0.01, cg: 0.02, silhouette: 1 },
      { id: "shallow", label: "Shallow", drag: -0.01, stability: -0.1, lift: 0.04, cg: -0.02, silhouette: -1 }
    ]
  },
  {
    id: "tail",
    label: "Tail winglets",
    options: [
      { id: "on", label: "On", drag: 0.035, stability: 0.2, lift: 0.03, area: 0.03, silhouette: 1 },
      { id: "off", label: "Off", drag: -0.015, stability: -0.11, lift: 0, area: -0.02, silhouette: -1 }
    ]
  },
  {
    id: "paper",
    label: "Paper weight",
    options: [
      { id: "light", label: "Light", mass: -0.045, drag: 0.015, lift: 0.04, stability: -0.02, momentum: -0.08, silhouette: -1 },
      { id: "medium", label: "Medium", mass: 0, drag: 0, lift: 0.01, stability: 0.03, momentum: 0, silhouette: 0 },
      { id: "heavy", label: "Heavy", mass: 0.06, drag: -0.005, lift: -0.04, stability: 0.07, momentum: 0.12, silhouette: 1 }
    ]
  }
];
const defaultChoices = { nose: "sharp", wingAngle: "wide", wingspan: "long", crease: "deep", tail: "on", paper: "medium" };
const defaultOrder = ["nose", "wingAngle", "wingspan", "crease", "tail", "paper"];
const state = {
  choices: { ...defaultChoices },
  order: [...defaultOrder],
  history: []
};
const elements = {};
let previewContext;

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  buildFoldControls();
  bindControls();
  renderAll();
  requestAnimationFrame(animationLoop);
});

function cacheElements() {
  elements.previewCanvas = document.getElementById("previewCanvas");
  elements.foldControls = document.getElementById("foldControls");
  elements.statsGrid = document.getElementById("statsGrid");
  elements.undoFold = document.getElementById("undoFold");
  elements.resetDesign = document.getElementById("resetDesign");
  previewContext = elements.previewCanvas.getContext("2d");
}

function buildFoldControls() {
  elements.foldControls.innerHTML = "";
  foldDefinitions.forEach(definition => {
    const card = document.createElement("section");
    card.className = "fold-card";
    const title = document.createElement("h3");
    title.textContent = definition.label;
    const choices = document.createElement("div");
    choices.className = definition.options.length === 3 ? "choice-row triple" : "choice-row";
    definition.options.forEach(option => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-button";
      button.textContent = option.label;
      button.dataset.fold = definition.id;
      button.dataset.option = option.id;
      choices.appendChild(button);
    });
    card.append(title, choices);
    elements.foldControls.appendChild(card);
  });
}

function bindControls() {
  elements.foldControls.addEventListener("click", event => {
    const button = event.target.closest(".choice-button");
    if (!button) {
      return;
    }
    applyChoice(button.dataset.fold, button.dataset.option);
  });
  elements.undoFold.addEventListener("click", undoChange);
  elements.resetDesign.addEventListener("click", resetDesign);
  window.addEventListener("resize", () => {
    renderPreview();
  });
}

function recordSnapshot() {
  state.history.push({ choices: { ...state.choices }, order: [...state.order] });
  if (state.history.length > 30) {
    state.history.shift();
  }
}

function applyChoice(foldId, optionId) {
  if (state.choices[foldId] === optionId) {
    return;
  }
  recordSnapshot();
  state.choices[foldId] = optionId;
  renderAll();
}

function undoChange() {
  const previous = state.history.pop();
  if (!previous) {
    return;
  }
  state.choices = previous.choices;
  state.order = previous.order;
  renderAll();
}

function resetDesign() {
  recordSnapshot();
  state.choices = { ...defaultChoices };
  state.order = [...defaultOrder];
  renderAll();
}

function renderAll() {
  renderControls();
  renderStats();
  renderPreview();
}

function renderControls() {
  document.querySelectorAll(".choice-button").forEach(button => {
    button.classList.toggle("active", state.choices[button.dataset.fold] === button.dataset.option);
  });
}

function renderStats() {
  const stats = calculateAerodynamics(state.choices, state.order);
  const values = [
    ["Lift coefficient", stats.liftCoefficient.toFixed(2)],
    ["Drag coefficient", stats.dragCoefficient.toFixed(2)],
    ["Mass", `${(stats.mass * 1000).toFixed(0)} g`],
    ["Center of gravity", `${Math.round(stats.centerOfGravity * 100)}%`],
    ["Stability", `${Math.round(stats.stability * 100)}%`],
    ["Wing area", `${stats.wingArea.toFixed(2)} m2`]
  ];
  elements.statsGrid.innerHTML = "";
  values.forEach(([label, value]) => {
    const node = document.createElement("div");
    node.className = "stat";
    node.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
    elements.statsGrid.appendChild(node);
  });
}

function calculateAerodynamics(choices, order) {
  const stats = {
    liftCoefficient: 0.68,
    dragCoefficient: 0.18,
    mass: 0.09,
    centerOfGravity: 0.47,
    stability: 0.52,
    wingArea: 0.18,
    momentum: 1,
    silhouette: 0
  };
  order.forEach((id, index) => {
    const option = optionById(id, choices[id]);
    stats.liftCoefficient += option.lift || 0;
    stats.dragCoefficient += option.drag || 0;
    stats.mass += option.mass || 0;
    stats.centerOfGravity += option.cg || 0;
    stats.stability += option.stability || 0;
    stats.wingArea += option.area || 0;
    stats.momentum += option.momentum || 0;
    stats.silhouette += (option.silhouette || 0) * (1 + index * 0.04);
  });
  const orderScore = sequenceScore(order);
  stats.stability += orderScore * 0.11;
  stats.dragCoefficient -= orderScore * 0.018;
  stats.centerOfGravity += orderScore * 0.015;
  stats.liftCoefficient = clamp(stats.liftCoefficient, 0.28, 1.18);
  stats.dragCoefficient = clamp(stats.dragCoefficient, 0.08, 0.42);
  stats.mass = clamp(stats.mass, 0.045, 0.17);
  stats.centerOfGravity = clamp(stats.centerOfGravity, 0.31, 0.66);
  stats.stability = clamp(stats.stability, 0.08, 0.98);
  stats.wingArea = clamp(stats.wingArea, 0.09, 0.34);
  stats.momentum = clamp(stats.momentum, 0.78, 1.22);
  return stats;
}

function sequenceScore(order) {
  let score = 0;
  const position = id => order.indexOf(id);
  if (position("nose") < position("wingAngle")) {
    score += 0.35;
  }
  if (position("crease") < position("tail")) {
    score += 0.3;
  }
  if (position("wingspan") < position("tail")) {
    score += 0.22;
  }
  if (position("paper") < 2) {
    score -= 0.28;
  }
  if (position("tail") < position("wingAngle")) {
    score -= 0.22;
  }
  return clamp(score, -0.55, 0.75);
}

function renderPreview() {
  const canvas = elements.previewCanvas;
  const context = previewContext;
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || canvas.width;
  const height = Math.max(240, Math.round(width * 0.58));
  resizeCanvas(canvas, width, height, ratio);
  drawPreview(context, canvas.width / ratio, canvas.height / ratio, state.choices, state.order, 0);
}

function drawPreview(context, width, height, choices, order, pulse) {
  const stats = calculateAerodynamics(choices, order);
  const colors = getCanvasColors();
  context.clearRect(0, 0, width, height);
  context.fillStyle = colors.canvas;
  context.fillRect(0, 0, width, height);
  drawBlueprintGrid(context, width, height, colors);
  const centerX = width * 0.5;
  const centerY = height * 0.52;
  const length = Math.min(width * 0.72, height * 1.05);
  const spanBase = length * (choices.wingspan === "long" ? 0.52 : 0.4);
  const sweep = choices.wingAngle === "swept" ? 0.72 : 0.52;
  const noseSharp = choices.nose === "sharp" ? 0 : length * 0.055;
  const tailInset = choices.crease === "deep" ? length * 0.1 : length * 0.05;
  const winglet = choices.tail === "on" ? spanBase * 0.16 : 0;
  const nose = { x: centerX + length * 0.46, y: centerY };
  const tailTop = { x: centerX - length * 0.45, y: centerY - spanBase * 0.18 };
  const tailBottom = { x: centerX - length * 0.45, y: centerY + spanBase * 0.18 };
  const leftWing = { x: centerX - length * sweep, y: centerY - spanBase };
  const rightWing = { x: centerX - length * sweep, y: centerY + spanBase };
  context.save();
  context.translate(0, Math.sin(performance.now() / 500) * pulse * 1.5);
  context.lineJoin = "round";
  context.lineCap = "round";
  context.fillStyle = colors.paper;
  context.strokeStyle = colors.ink;
  context.lineWidth = 2;
  context.beginPath();
  if (noseSharp > 0) {
    context.moveTo(nose.x - noseSharp, nose.y - 8);
    context.lineTo(nose.x, nose.y);
    context.lineTo(nose.x - noseSharp, nose.y + 8);
  } else {
    context.moveTo(nose.x, nose.y);
  }
  context.lineTo(rightWing.x, rightWing.y);
  if (winglet) {
    context.lineTo(rightWing.x + winglet * 0.5, rightWing.y - winglet);
  }
  context.lineTo(tailBottom.x + tailInset, tailBottom.y);
  context.lineTo(tailTop.x + tailInset, tailTop.y);
  if (winglet) {
    context.lineTo(leftWing.x + winglet * 0.5, leftWing.y + winglet);
  }
  context.lineTo(leftWing.x, leftWing.y);
  context.closePath();
  context.fill();
  context.stroke();
  context.strokeStyle = colors.crease;
  context.lineWidth = 1.15;
  drawLine(context, nose.x - noseSharp * 0.6, nose.y, tailTop.x + tailInset, tailTop.y);
  drawLine(context, nose.x - noseSharp * 0.6, nose.y, tailBottom.x + tailInset, tailBottom.y);
  drawLine(context, nose.x - noseSharp * 0.6, nose.y, centerX - length * 0.42, centerY);
  drawLine(context, centerX - length * 0.18, centerY, leftWing.x + length * 0.08, leftWing.y * 0.92 + centerY * 0.08);
  drawLine(context, centerX - length * 0.18, centerY, rightWing.x + length * 0.08, rightWing.y * 0.92 + centerY * 0.08);
  if (choices.crease === "deep") {
    context.strokeStyle = colors.accent;
    context.lineWidth = 2;
    drawLine(context, centerX - length * 0.39, centerY, nose.x - noseSharp * 0.4, nose.y);
  }
  if (choices.paper === "heavy") {
    context.fillStyle = colors.accent;
    context.beginPath();
    context.arc(centerX + length * (0.02 + (stats.centerOfGravity - 0.47) * 0.8), centerY, 4.5, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = colors.muted;
  context.font = "12px ui-monospace, monospace";
  context.fillText(`CG ${Math.round(stats.centerOfGravity * 100)}%`, 18, height - 18);
  context.fillText(`S ${Math.round(stats.stability * 100)}%`, width - 76, height - 18);
  context.restore();
}

function drawBlueprintGrid(context, width, height, colors) {
  context.save();
  context.strokeStyle = colors.grid;
  context.lineWidth = 1;
  for (let x = 0; x <= width; x += 40) {
    drawLine(context, x, 0, x, height);
  }
  for (let y = 0; y <= height; y += 40) {
    drawLine(context, 0, y, width, y);
  }
  context.restore();
}

function animationLoop(now) {
  requestAnimationFrame(animationLoop);
}

function definitionById(id) {
  return foldDefinitions.find(definition => definition.id === id) || foldDefinitions[0];
}

function optionById(foldId, optionId) {
  const definition = definitionById(foldId);
  return definition.options.find(option => option.id === optionId) || definition.options[0];
}

function resizeCanvas(canvas, width, height, ratio) {
  const targetWidth = Math.max(1, Math.round(width * ratio));
  const targetHeight = Math.max(1, Math.round(height * ratio));
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }
  canvas.style.height = `${height}px`;
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function getCanvasColors() {
  const styles = getComputedStyle(document.body);
  return {
    canvas: styles.getPropertyValue("--canvas").trim(),
    paper: styles.getPropertyValue("--panel-strong").trim(),
    ink: styles.getPropertyValue("--ink").trim(),
    muted: styles.getPropertyValue("--muted").trim(),
    accent: styles.getPropertyValue("--accent").trim(),
    crease: styles.getPropertyValue("--muted").trim(),
    grid: styles.getPropertyValue("--line").trim(),
    ground: styles.getPropertyValue("--ink").trim(),
    trail: styles.getPropertyValue("--accent").trim(),
    wind: styles.getPropertyValue("--danger").trim()
  };
}

function drawLine(context, x1, y1, x2, y2) {
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}
