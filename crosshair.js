const crosshair = document.getElementById("crosshair");
const dot = document.getElementById("dot");
const output = document.getElementById("output");
const copyBtn = document.getElementById("copyBtn");
const resetBtn = document.getElementById("resetBtn");

const fields = {
  color: document.getElementById("color"),
  intensity: document.getElementById("intensity"),
  pureColor: document.getElementById("pureColor"),
  thickness: document.getElementById("thickness"),
  length: document.getElementById("length"),
  gap: document.getElementById("gap"),
  dotSize: document.getElementById("dotSize"),
  opacity: document.getElementById("opacity"),
  outline: document.getElementById("outline"),
  outlineOpacity: document.getElementById("outlineOpacity"),
  rotation: document.getElementById("rotation"),
};

const defaults = {
  color: "#3f88c5",
  intensity: "0",
  pureColor: true,
  thickness: "4",
  length: "18",
  gap: "8",
  dotSize: "4",
  opacity: "0.9",
  outline: "2",
  outlineOpacity: "0.65",
  rotation: "0",
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const formatDecimal = (value) => Number(value).toFixed(2);

const hexToRgb = (hex) => {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();

const applyIntensity = (hex, intensity) => {
  const { r, g, b } = hexToRgb(hex);
  const amount = clamp(intensity, -1, 1);
  if (amount >= 0) {
    return rgbToHex({
      r: Math.round(r + (255 - r) * amount),
      g: Math.round(g + (255 - g) * amount),
      b: Math.round(b + (255 - b) * amount),
    });
  }
  return rgbToHex({
    r: Math.round(r * (1 + amount)),
    g: Math.round(g * (1 + amount)),
    b: Math.round(b * (1 + amount)),
  });
};

const toValorantCode = (state) => {
  const entries = [];
  const add = (path, value, priority) => {
    entries.push({ path, value, priority });
  };

  const hex = state.color.replace("#", "").toUpperCase();

  // Use custom hex color (6-digit) for Valorant crosshair color.
  add("c", 8, 4);
  add("u", hex, 5);

  if (state.outline > 0) {
    add("h", 1, 6);
    add("t", clamp(state.outline, 1, 6), 7);
    add("o", formatDecimal(state.opacity), 8);
  } else {
    add("h", 0, 6);
  }

  if (state.dotSize > 0) {
    add("d", 1, 9);
    const dotThickness = clamp(Math.round(state.dotSize / 3), 1, 6);
    add("z", dotThickness, 11);
    add("a", formatDecimal(state.opacity), 12);
  } else {
    add("d", 0, 9);
  }

  add("b", 1, 10);
  add("f", 0, 13);

  add("0b", 1, 16);
  add("0t", clamp(Math.round(state.thickness), 0, 10), 17);
  add("0l", clamp(Math.round(state.length), 0, 20), 18);
  add("0v", clamp(Math.round(state.length), 0, 20), 19);
  add("0o", clamp(Math.round(state.gap), 0, 20), 21);
  add("0a", formatDecimal(state.opacity), 22);
  add("0f", 0, 24);

  entries.sort((a, b) => a.priority - b.priority);

  const payload = entries.flatMap((entry) => [entry.path, entry.value]);
  return `0;P;${payload.join(";")}`;
};

const updateOutput = (state) => {
  output.textContent = toValorantCode(state);
};

const applyState = () => {
  const state = {
    color: fields.color.value,
    intensity: Number(fields.intensity.value),
    pureColor: fields.pureColor.checked,
    thickness: Number(fields.thickness.value),
    length: Number(fields.length.value),
    gap: Number(fields.gap.value),
    dotSize: Number(fields.dotSize.value),
    opacity: Number(fields.opacity.value),
    outline: Number(fields.outline.value),
    outlineOpacity: Number(fields.outlineOpacity.value),
    rotation: Number(fields.rotation.value),
  };

  const displayColor = state.pureColor
    ? state.color
    : applyIntensity(state.color, state.intensity);
  crosshair.style.setProperty("--color", displayColor);
  crosshair.style.setProperty("--thickness", `${state.thickness}px`);
  crosshair.style.setProperty("--length", `${state.length}px`);
  crosshair.style.setProperty("--gap", `${state.gap}px`);
  crosshair.style.setProperty("--dot", `${state.dotSize}px`);
  crosshair.style.setProperty("--opacity", state.pureColor ? 1 : state.opacity);
  crosshair.style.setProperty("--outline", `${state.pureColor ? 0 : state.outline}px`);
  crosshair.style.setProperty("--outline-opacity", state.outlineOpacity);
  crosshair.style.setProperty("--rotation", `${state.rotation}deg`);

  dot.style.display = state.dotSize === 0 ? "none" : "block";
  updateOutput(state);
};

const resetAll = () => {
  Object.entries(defaults).forEach(([key, value]) => {
    if (typeof fields[key].checked === "boolean") {
      fields[key].checked = value;
    } else {
      fields[key].value = value;
    }
  });
  applyState();
};

Object.values(fields).forEach((input) => {
  input.addEventListener("input", applyState);
});

fields.intensity.addEventListener("input", () => {
  if (fields.pureColor.checked) {
    fields.pureColor.checked = false;
  }
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(output.textContent);
    copyBtn.textContent = "복사됨";
    setTimeout(() => {
      copyBtn.textContent = "코드 복사";
    }, 1200);
  } catch (error) {
    copyBtn.textContent = "복사 실패";
    setTimeout(() => {
      copyBtn.textContent = "코드 복사";
    }, 1200);
  }
});

resetBtn.addEventListener("click", resetAll);

resetAll();
