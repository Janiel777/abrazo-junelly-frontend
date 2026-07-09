import {
  buildPublicQrImageUrl,
  getTokenFromInput,
  lookupPublicPickupPass,
} from "./pickup-api.js";
import { PICKUP_MOCK_MODE, PICKUP_MOCK_WARNING } from "./pickup-config.js";

const passCard = document.querySelector("#pass-card");
const allowedSources = new Set(["email", "qr", "direct"]);
let currentToken = "";
let currentSource = "direct";

init();

async function init() {
  const params = new URLSearchParams(window.location.search);
  currentSource = normalizeSource(params.get("src"));
  const validation = getTokenFromInput(params.get("t"));

  if (!validation.ok) {
    renderInvalid("Pase no valido.");
    return;
  }

  currentToken = validation.token;
  renderLoading();

  try {
    const result = await lookupPublicPickupPass(currentToken, currentSource);
    renderPassResult(result);
  } catch {
    renderInvalid("No pudimos verificar este pase en este momento.");
  }
}

function renderPassResult(result) {
  if (!result || result.ok === false || result.status === "INVALID_TOKEN") {
    renderInvalid("Pase no valido.");
    return;
  }

  if (result.pass && (result.status === "VALID" || result.status === "ALREADY_PICKED_UP")) {
    renderValidPass(result.pass);
    return;
  }

  renderInvalid("Pase no valido.");
}

function renderLoading() {
  passCard.replaceChildren();
  appendText("p", "pickup-eyebrow", "Pase de corredor");
  appendText("h1", "", "Verificando pase...");
  appendText("p", "", "Un momento mientras validamos la informacion del pase.");

  if (PICKUP_MOCK_MODE) {
    const warning = appendText("p", "mock-inline", PICKUP_MOCK_WARNING);
    warning.setAttribute("role", "status");
  }
}

function renderValidPass(pass) {
  const runners = normalizeRunners(pass);

  if (!runners.length) {
    renderInvalid("Pase no valido.");
    return;
  }

  passCard.className = "pass-card public-pass-card";
  passCard.replaceChildren();
  appendText("p", "pickup-eyebrow", "5K Abrazo Solidario para Junelly");
  appendText("h1", "public-pass-title", "Tu pase digital");

  const qrWrap = document.createElement("div");
  qrWrap.className = "public-qr";

  const qrImage = document.createElement("img");
  qrImage.src = buildPublicQrImageUrl(currentToken);
  qrImage.alt = "Código QR del pase digital";
  qrImage.width = 320;
  qrImage.height = 320;
  qrImage.loading = "eager";
  qrImage.addEventListener("error", () => {
    qrImage.replaceWith(createText("p", "public-qr-error", "No pudimos cargar el QR."));
  });

  qrWrap.append(qrImage);
  passCard.append(qrWrap);

  appendText("p", "public-pass-instruction", "Muestra esta pantalla en la mesa de entrega.");

  const runnerList = document.createElement("div");
  runnerList.className = "public-runner-list";
  runners.forEach((runner) => {
    runnerList.append(createRunnerBlock(runner));
  });
  passCard.append(runnerList);

  passCard.append(createPickupLogistics());
  passCard.append(createFundraisingLink());
}

function renderInvalid(message) {
  passCard.className = "pass-card invalid";
  passCard.replaceChildren();
  appendText("p", "pickup-eyebrow", "Pase de corredor");
  appendText("h1", "", "Pase no valido");
  appendText("p", "", message);
}

function normalizeSource(value) {
  const source = String(value || "").trim().toLowerCase();
  return allowedSources.has(source) ? source : "direct";
}

function normalizeRunners(pass) {
  if (Array.isArray(pass.runners)) {
    return pass.runners.filter(Boolean);
  }

  if (
    pass.runnerNumber ||
    pass.displayName ||
    pass.pickupCode ||
    typeof pass.numberPickedUp === "boolean"
  ) {
    return [
      {
        runnerNumber: pass.runnerNumber,
        displayName: pass.displayName,
        pickupCode: pass.pickupCode,
        numberPickedUp: pass.numberPickedUp,
      },
    ];
  }

  return [];
}

function createRunnerBlock(runner) {
  const block = document.createElement("article");
  block.className = `public-runner-block${runner.numberPickedUp ? " picked-up" : ""}`;

  appendTextTo(block, "strong", "public-runner-number", `#${runner.runnerNumber || "--"}`);
  appendTextTo(block, "h2", "public-runner-name", runner.displayName || "Participante");
  appendTextTo(block, "p", "public-code", `Código de recogido: ${runner.pickupCode || "No disponible"}`);

  if (runner.numberPickedUp) {
    appendTextTo(block, "p", "public-picked-up-status", "Número ya entregado");
  }

  return block;
}

function createPickupLogistics() {
  const logistics = document.createElement("section");
  logistics.className = "public-pickup-logistics";
  logistics.setAttribute("aria-label", "Información de entrega");

  appendTextTo(logistics, "h2", "", "Entrega de números");
  appendTextTo(logistics, "p", "", "Sábado 11 de julio");
  appendTextTo(logistics, "strong", "", "5:00 p. m. - 7:00 p. m.");
  appendTextTo(logistics, "p", "", "Domingo 12 de julio");
  appendTextTo(logistics, "strong", "", "5:00 a. m. - 6:25 a. m.");
  appendTextTo(logistics, "p", "public-pickup-place", "Centro Agropecuario de San Sebastián");

  return logistics;
}

function createFundraisingLink() {
  const link = document.createElement("a");
  link.className = "fundraising-link";
  link.href = "https://abrazojunelly.org/";
  link.textContent = "Ver progreso de la recaudación";
  return link;
}

function createText(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  node.textContent = text;
  return node;
}

function appendText(tag, className, text) {
  const node = createText(tag, className, text);
  passCard.append(node);
  return node;
}

function appendTextTo(parent, tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  node.textContent = text;
  parent.append(node);
  return node;
}
