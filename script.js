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
const state = {
  choices: { ...defaultChoices }
};
const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  buildFoldControls();
  bindControls();
  renderAll();
});

function cacheElements() {
  elements.foldControls = document.getElementById("foldControls");
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
}

function applyChoice(foldId, optionId) {
  if (state.choices[foldId] === optionId) {
    return;
  }
  state.choices[foldId] = optionId;
  renderAll();
}

function renderAll() {
  renderControls();
}

function renderControls() {
  document.querySelectorAll(".choice-button").forEach(button => {
    button.classList.toggle("active", state.choices[button.dataset.fold] === button.dataset.option);
  });
}

function definitionById(id) {
  return foldDefinitions.find(definition => definition.id === id) || foldDefinitions[0];
}

function optionById(foldId, optionId) {
  const definition = definitionById(foldId);
  return definition.options.find(option => option.id === optionId) || definition.options[0];
}
