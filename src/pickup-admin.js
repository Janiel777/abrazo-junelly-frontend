import {
  confirmManualPickup,
  confirmPickupByToken,
  getTokenFromInput,
  lookupPickupPass,
  searchPickupRunners,
} from "./pickup-api.js";
import { PICKUP_MOCK_MODE, PICKUP_MOCK_WARNING } from "./pickup-config.js";
import { createPickupAuthController } from "./pickup-auth.js";

const QR_SCAN_COOLDOWN_MS = 3500;
const SEARCH_DEBOUNCE_MS = 350;
const AUTO_RESUME_DELAY_MS = 1400;

const elements = {
  authCard: document.querySelector("#auth-card"),
  authMessage: document.querySelector("#auth-message"),
  signInButton: document.querySelector("#sign-in-button"),
  adminApp: document.querySelector("#admin-app"),
  signOutButton: document.querySelector("#sign-out-button"),
  operatorEmail: document.querySelector("#operator-email"),
  connectionStatus: document.querySelector("#connection-status"),
  mockBanner: document.querySelector("#mock-banner"),
  tabs: Array.from(document.querySelectorAll(".tab-button")),
  scannerPanel: document.querySelector("#scanner-panel"),
  manualPanel: document.querySelector("#manual-panel"),
  startScannerButton: document.querySelector("#start-scanner-button"),
  stopScannerButton: document.querySelector("#stop-scanner-button"),
  resumeScannerButton: document.querySelector("#resume-scanner-button"),
  cameraStatus: document.querySelector("#camera-status"),
  manualTokenForm: document.querySelector("#manual-token-form"),
  manualTokenInput: document.querySelector("#manual-token-input"),
  resultRegion: document.querySelector("#result-region"),
  searchInput: document.querySelector("#runner-search-input"),
  searchResults: document.querySelector("#search-results"),
  confirmOverlay: document.querySelector("#confirm-overlay"),
  confirmMessage: document.querySelector("#confirm-message"),
  confirmYesButton: document.querySelector("#confirm-yes-button"),
  confirmCancelButton: document.querySelector("#confirm-cancel-button"),
  toastRegion: document.querySelector("#toast-region"),
};

let authController;
let authReady = false;
let lastAuthState = { status: "initializing" };
let qrScanner;
let scannerRunning = false;
let scannerPaused = false;
let busy = false;
let currentToken = "";
let pendingConfirm = null;
let lastScanValue = "";
let lastScanAt = 0;
let searchTimer;

init();

async function init() {
  elements.signInButton.disabled = true;
  elements.mockBanner.classList.toggle("is-hidden", !PICKUP_MOCK_MODE);
  if (PICKUP_MOCK_MODE) {
    elements.mockBanner.textContent = PICKUP_MOCK_WARNING;
  }

  bindEvents();
  authController = await createPickupAuthController(handleAuthState);
  authReady = true;
  handleAuthState(lastAuthState);
}

function bindEvents() {
  elements.signInButton.addEventListener("click", () => {
    if (!authController) {
      return;
    }

    authController.signIn().catch(() => {
      setAuthMessage("No se pudo iniciar sesion. Intenta nuevamente.");
    });
  });

  elements.signOutButton.addEventListener("click", () => {
    stopScanner();
    clearResult();
    authController.signOut();
  });

  elements.tabs.forEach((button) => {
    button.addEventListener("click", () => setActiveTab(button.dataset.tab));
  });

  elements.startScannerButton.addEventListener("click", startScanner);
  elements.resumeScannerButton.addEventListener("click", resumeScanner);
  elements.stopScannerButton.addEventListener("click", stopScanner);

  elements.manualTokenForm.addEventListener("submit", (event) => {
    event.preventDefault();
    verifyTokenInput(elements.manualTokenInput.value);
  });

  elements.searchInput.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(runManualSearch, SEARCH_DEBOUNCE_MS);
  });

  elements.confirmCancelButton.addEventListener("click", () => {
    closeConfirmDialog();
    resumeScanner();
  });
  elements.confirmYesButton.addEventListener("click", runPendingConfirm);
}

function handleAuthState(state) {
  lastAuthState = state;

  if (state.status === "authenticated") {
    elements.authCard.classList.add("is-hidden");
    elements.adminApp.classList.remove("is-hidden");
    elements.operatorEmail.textContent = state.user.email || "";
    setConnectionStatus("Listo", "ok");
    setAuthMessage("");
    elements.signInButton.disabled = !authReady;
    renderEmptyState();
    return;
  }

  elements.adminApp.classList.add("is-hidden");
  elements.authCard.classList.remove("is-hidden");
  elements.operatorEmail.textContent = "";
  stopScanner();

  if (state.status === "authenticating") {
    setAuthMessage("Autenticando...");
    elements.signInButton.disabled = true;
    return;
  }

  elements.signInButton.disabled = !authReady || state.status === "configMissing";
  setAuthMessage(state.message || "Inicia sesion con una cuenta autorizada para continuar.");
}

function setAuthMessage(message) {
  elements.authMessage.textContent = message;
}

function setConnectionStatus(message, tone = "neutral") {
  elements.connectionStatus.textContent = message;
  elements.connectionStatus.dataset.tone = tone;
}

function setActiveTab(tab) {
  const isManual = tab === "manual";

  elements.tabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });

  elements.manualPanel.classList.toggle("is-hidden", !isManual);
  elements.scannerPanel.classList.toggle("is-hidden", isManual);

  if (isManual) {
    stopScanner();
    elements.searchInput.focus();
  }
}

async function startScanner() {
  if ((scannerRunning && !scannerPaused) || busy) {
    return;
  }

  if (scannerRunning && scannerPaused) {
    await resumeScannerAnalysis();
    return;
  }

  if (!window.Html5Qrcode) {
    setCameraStatus("Este navegador no pudo cargar el lector QR.", "error");
    return;
  }

  try {
    if (!qrScanner) {
      qrScanner = new window.Html5Qrcode("qr-reader");
    }

    setCameraStatus("Solicitando permiso de camara...", "busy");
    await qrScanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1,
      },
      handleQrScan,
    );
    scannerRunning = true;
    scannerPaused = false;
    setCameraStatus("Camara activa. Escanea un pase.", "ok");
  } catch {
    scannerRunning = false;
    scannerPaused = false;
    setCameraStatus("No se pudo iniciar la camara. Usa la entrada manual.", "error");
  }
}

async function pauseScannerAnalysis() {
  if (!qrScanner || !scannerRunning || scannerPaused) {
    return;
  }

  try {
    if (typeof qrScanner.pause === "function") {
      qrScanner.pause(true);
      scannerPaused = true;
      setCameraStatus("Escaner pausado.", "busy");
      return;
    }
  } catch {
    // Fall back to stopping the camera below.
  }

  await stopScanner();
}

async function resumeScannerAnalysis() {
  if (!qrScanner || !scannerRunning || !scannerPaused) {
    await startScanner();
    return;
  }

  try {
    if (typeof qrScanner.resume === "function") {
      qrScanner.resume();
      scannerPaused = false;
      setCameraStatus("Camara activa. Escanea un pase.", "ok");
      return;
    }
  } catch {
    // Fall back to a full restart below.
  }

  await stopScanner();
  await startScanner();
}

async function stopScanner() {
  if (!qrScanner || !scannerRunning) {
    scannerPaused = false;
    setCameraStatus("Camara detenida", "neutral");
    return;
  }

  try {
    await qrScanner.stop();
  } catch {
    // The camera may already be stopped by the browser.
  } finally {
    scannerRunning = false;
    scannerPaused = false;
    setCameraStatus("Camara detenida", "neutral");
  }
}

async function resumeScanner() {
  clearResult();
  currentToken = "";
  await resumeScannerAnalysis();
}

function setCameraStatus(message, tone) {
  elements.cameraStatus.textContent = message;
  elements.cameraStatus.dataset.tone = tone;
}

async function handleQrScan(decodedText) {
  const now = Date.now();

  if (busy || (decodedText === lastScanValue && now - lastScanAt < QR_SCAN_COOLDOWN_MS)) {
    return;
  }

  lastScanValue = decodedText;
  lastScanAt = now;
  await verifyTokenInput(decodedText);
}

async function verifyTokenInput(value) {
  const validation = getTokenFromInput(value);

  if (!validation.ok) {
    await pauseScannerAnalysis();
    currentToken = "";
    renderInvalidState(validation.error);
    return;
  }

  currentToken = validation.token;
  await pauseScannerAnalysis();
  await verifyCurrentToken();
}

async function verifyCurrentToken() {
  if (!currentToken || busy) {
    return;
  }

  busy = true;
  setConnectionStatus("Verificando...", "busy");
  renderLoadingState("Verificando QR...");

  try {
    const result = await lookupPickupPass(currentToken, authController);
    renderLookupResult(result);
    setConnectionStatus("Listo", "ok");
  } catch (error) {
    renderConnectionError(error.message);
    setConnectionStatus("Error de conexion", "error");
  } finally {
    busy = false;
  }
}

function renderLookupResult(result) {
  if (!result || result.ok === false || result.status === "INVALID_TOKEN") {
    currentToken = "";
    renderInvalidState("Pase no valido.");
    return;
  }

  if (result.status === "ALREADY_PICKED_UP") {
    renderAlreadyPickedUp(result.runner);
    return;
  }

  if (result.status === "VALID" && result.runner) {
    renderValidRunner(result.runner, "qr");
    return;
  }

  renderConnectionError("Respuesta inesperada de la API.");
}

function renderEmptyState() {
  elements.resultRegion.replaceChildren(
    createNoticeCard("Listo para escanear", "Inicia la camara o pega un token manualmente.", "neutral"),
  );
}

function renderLoadingState(message) {
  const card = createNoticeCard(message, "No cierres esta pantalla.", "busy");
  const spinner = document.createElement("span");
  spinner.className = "pickup-spinner";
  card.prepend(spinner);
  elements.resultRegion.replaceChildren(card);
}

function renderInvalidState(message) {
  elements.resultRegion.replaceChildren(
    createNoticeCard("Pase no valido", message || "El QR no pudo verificarse.", "invalid", [
      createActionButton("Volver a escanear", "primary", resumeScanner),
    ]),
  );
}

function renderConnectionError(message) {
  elements.resultRegion.replaceChildren(
    createNoticeCard(
      "Error de conexion",
      `${message || "No se pudo conectar con la API."} Si CORS aun no esta configurado, el navegador bloqueara la llamada.`,
      "error",
      [createActionButton("Intentar otra vez", "primary", verifyCurrentToken), createActionButton("Volver", "ghost", resumeScanner)],
    ),
  );
}

function renderValidRunner(runner, source) {
  const card = document.createElement("article");
  card.className = "runner-card valid";

  appendText(card, "p", "pickup-status", "PASE VALIDO");
  appendText(card, "strong", "runner-number", `#${safeRunnerNumber(runner)}`);
  appendText(card, "h2", "runner-name", String(runner.fullName || "Nombre no disponible"));
  appendText(card, "p", "runner-detail", `Telefono ****${runner.phoneLast4 || "----"}`);
  appendText(card, "p", "runner-detail", `Codigo ${runner.pickupCode || "No disponible"}`);

  const actions = document.createElement("div");
  actions.className = "result-actions";
  actions.append(
    createActionButton("Confirmar entrega", "primary", () => openConfirmDialog(runner, source)),
    createActionButton("Cancelar y volver a escanear", "ghost", resumeScanner),
  );
  card.append(actions);
  elements.resultRegion.replaceChildren(card);
}

function renderAlreadyPickedUp(runner) {
  const card = document.createElement("article");
  card.className = "runner-card warning";

  appendText(card, "p", "pickup-status", "NUMERO YA ENTREGADO");
  appendText(card, "strong", "runner-number", `#${safeRunnerNumber(runner)}`);
  appendText(card, "h2", "runner-name", String(runner.fullName || "Nombre no disponible"));
  appendText(card, "p", "runner-detail", `Entregado: ${formatPuertoRicoDate(runner.numberPickedUpAt)}`);

  if (runner.numberPickedUpBy) {
    appendText(card, "p", "runner-detail", `Por: ${runner.numberPickedUpBy}`);
  }

  const actions = document.createElement("div");
  actions.className = "result-actions";
  actions.append(createActionButton("Volver a escanear", "primary", resumeScanner));
  card.append(actions);
  elements.resultRegion.replaceChildren(card);
}

function openConfirmDialog(runner, source) {
  pendingConfirm = { runner, source };
  elements.confirmMessage.textContent = `Confirmar que entregaste el numero ${safeRunnerNumber(runner)} a ${
    runner.fullName || "este participante"
  }?`;
  elements.confirmOverlay.classList.remove("is-hidden");
  elements.confirmYesButton.focus();
}

function closeConfirmDialog() {
  pendingConfirm = null;
  elements.confirmOverlay.classList.add("is-hidden");
}

async function runPendingConfirm() {
  if (!pendingConfirm || busy) {
    return;
  }

  const pending = pendingConfirm;
  closeConfirmDialog();
  busy = true;
  let failed = false;
  setConnectionStatus("Confirmando...", "busy");
  renderLoadingState("Confirmando entrega...");

  try {
    const result =
      pending.source === "manual"
        ? await confirmManualPickup(pending.runner, authController)
        : await confirmPickupByToken(currentToken, authController);

    if (result?.ok === true && result.status === "ALREADY_PICKED_UP") {
      renderAlreadyPickedUp(result.runner || pending.runner);
      return;
    }

    if (result?.ok !== true || result.status !== "PICKUP_CONFIRMED" || !result.runner) {
      failed = true;
      renderConnectionError("La API no confirmo la entrega. Verifica el pase e intenta nuevamente.");
      return;
    }

    const runner = result.runner || pending.runner;
    showToast(`Numero ${safeRunnerNumber(runner)} entregado`);
    currentToken = "";
    renderConfirmedState(runner);
    window.setTimeout(resumeScanner, AUTO_RESUME_DELAY_MS);
  } catch (error) {
    failed = true;
    renderConnectionError(error.message);
  } finally {
    busy = false;
    setConnectionStatus(failed ? "Error de conexion" : "Listo", failed ? "error" : "ok");
  }
}

function renderConfirmedState(runner) {
  elements.resultRegion.replaceChildren(
    createNoticeCard(
      "Numero entregado",
      `Numero ${safeRunnerNumber(runner)} confirmado correctamente.`,
      "valid",
    ),
  );
}

async function runManualSearch() {
  const query = elements.searchInput.value.trim();
  const isExactNumber = /^\d+$/.test(query);

  if (query.length < 2 && !isExactNumber) {
    elements.searchResults.replaceChildren(
      createNoticeCard("Buscar sin QR", "Escribe al menos dos caracteres o un numero exacto.", "neutral"),
    );
    return;
  }

  elements.searchResults.replaceChildren(createNoticeCard("Buscando...", "Consultando coincidencias.", "busy"));

  try {
    const result = await searchPickupRunners(query, authController);
    renderSearchResults(Array.isArray(result.results) ? result.results : []);
  } catch (error) {
    elements.searchResults.replaceChildren(createNoticeCard("Error de busqueda", error.message, "error"));
  }
}

function renderSearchResults(results) {
  if (!results.length) {
    elements.searchResults.replaceChildren(
      createNoticeCard("Sin resultados", "No encontramos coincidencias con esa busqueda.", "neutral"),
    );
    return;
  }

  const list = document.createElement("div");
  list.className = "manual-results-list";

  results.forEach((runner) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "manual-result-item";
    item.addEventListener("click", () => renderManualRunner(runner));

    appendText(item, "strong", "", `#${safeRunnerNumber(runner)} ${runner.fullName || "Nombre no disponible"}`);
    appendText(
      item,
      "span",
      "",
      `${runner.phoneLast4 ? `****${runner.phoneLast4}` : "Telefono no disponible"} - ${
        runner.numberPickedUp ? "Ya entregado" : "Pendiente"
      }`,
    );
    list.append(item);
  });

  elements.searchResults.replaceChildren(list);
}

function renderManualRunner(runner) {
  setActiveTab("scanner");

  if (runner.numberPickedUp) {
    renderAlreadyPickedUp(runner);
    return;
  }

  renderValidRunner(runner, "manual");
}

function clearResult() {
  elements.resultRegion.replaceChildren();
  renderEmptyState();
}

function createNoticeCard(title, message, tone, actions = []) {
  const card = document.createElement("article");
  card.className = `notice-card ${tone}`;
  appendText(card, "h2", "", title);
  appendText(card, "p", "", message);

  if (actions.length) {
    const actionRow = document.createElement("div");
    actionRow.className = "result-actions";
    actionRow.append(...actions);
    card.append(actionRow);
  }

  return card;
}

function createActionButton(label, variant, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `pickup-button ${variant}`;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function appendText(parent, tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  node.textContent = text;
  parent.append(node);
  return node;
}

function safeRunnerNumber(runner) {
  return runner?.runnerNumber ?? "--";
}

function formatPuertoRicoDate(value) {
  if (!value) {
    return "Fecha no disponible";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-PR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Puerto_Rico",
  }).format(date);
}

function showToast(message) {
  elements.toastRegion.textContent = message;
  elements.toastRegion.classList.add("visible");
  window.setTimeout(() => {
    elements.toastRegion.classList.remove("visible");
  }, 1800);
}
