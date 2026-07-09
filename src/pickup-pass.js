import { getTokenFromInput, lookupPublicPickupPass } from "./pickup-api.js";
import { PICKUP_MOCK_MODE, PICKUP_MOCK_WARNING } from "./pickup-config.js";

const passCard = document.querySelector("#pass-card");

init();

async function init() {
  const params = new URLSearchParams(window.location.search);
  const validation = getTokenFromInput(params.get("t"));

  if (!validation.ok) {
    renderInvalid("Pase no valido.");
    return;
  }

  renderLoading();

  try {
    const result = await lookupPublicPickupPass(validation.token);
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

  if (result.status === "ALREADY_PICKED_UP" || result.pass?.numberPickedUp) {
    renderAlreadyPickedUp(result.pass);
    return;
  }

  if (result.status === "VALID" && result.pass) {
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
  passCard.className = "pass-card valid";
  passCard.replaceChildren();
  appendText("p", "pickup-eyebrow", "Pase de corredor");
  appendText("strong", "public-runner-number", `#${pass.runnerNumber || "--"}`);
  appendText("h1", "", pass.displayName || "Participante");
  appendText("p", "public-code", `Codigo: ${pass.pickupCode || "No disponible"}`);
  appendText("p", "", "Presente este codigo QR en la mesa de entrega.");
}

function renderAlreadyPickedUp(pass = {}) {
  passCard.className = "pass-card warning";
  passCard.replaceChildren();
  appendText("p", "pickup-eyebrow", "Pase de corredor");
  appendText("strong", "public-runner-number", `#${pass.runnerNumber || "--"}`);
  appendText("h1", "", "Numero ya entregado");
  appendText("p", "", "Este pase aparece como entregado.");
}

function renderInvalid(message) {
  passCard.className = "pass-card invalid";
  passCard.replaceChildren();
  appendText("p", "pickup-eyebrow", "Pase de corredor");
  appendText("h1", "", "Pase no valido");
  appendText("p", "", message);
}

function appendText(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  node.textContent = text;
  passCard.append(node);
  return node;
}
