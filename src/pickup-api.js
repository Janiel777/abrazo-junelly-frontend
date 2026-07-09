import {
  PICKUP_ADMIN_CONFIRM_URL,
  PICKUP_ADMIN_LOOKUP_URL,
  PICKUP_ADMIN_SEARCH_URL,
  PICKUP_MANUAL_CONFIRM_STRATEGY,
  PICKUP_MOCK_MODE,
  PICKUP_PUBLIC_LOOKUP_URL,
  PICKUP_TOKEN_RULES,
} from "./pickup-config.js";

const mockRunner = {
  runnerNumber: 136,
  fullName: "Alex Rivera Torres",
  displayName: "Alex R.",
  phoneLast4: "3018",
  pickupCode: "J136-DEMO",
  numberPickedUp: false,
  numberPickedUpAt: null,
};

function hasConfiguredUrl(url) {
  return typeof url === "string" && url.startsWith("https://");
}

function assertConfigured(url, label) {
  if (!hasConfiguredUrl(url)) {
    throw new Error(`${label} no esta configurado todavia.`);
  }
}

function normalizeInput(value) {
  return String(value || "").trim();
}

export function extractPickupToken(input) {
  const value = normalizeInput(input);

  if (!value) {
    return "";
  }

  try {
    const parsedUrl = new URL(value);
    return normalizeInput(parsedUrl.searchParams.get("t"));
  } catch {
    return value;
  }
}

export function validatePickupToken(token) {
  const value = normalizeInput(token);
  const rules = PICKUP_TOKEN_RULES;

  if (!value) {
    return { ok: false, error: "El QR no contiene un token." };
  }

  if (value.length < rules.minLength || value.length > rules.maxLength) {
    return { ok: false, error: "El token del pase no tiene un formato valido." };
  }

  if (!rules.pattern.test(value)) {
    return { ok: false, error: "El token contiene caracteres no permitidos." };
  }

  return { ok: true, token: value };
}

export function getTokenFromInput(input) {
  return validatePickupToken(extractPickupToken(input));
}

async function parseJsonResponse(response) {
  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("La API respondio con JSON invalido.");
  }

  if (!response.ok) {
    const statusMessage =
      response.status === 401 || response.status === 403
        ? "No autorizado para realizar esta accion."
        : `La API respondio con estado ${response.status}.`;
    const error = new Error(statusMessage);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

async function postJson(url, body, idToken, label) {
  assertConfigured(url, label);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return parseJsonResponse(response);
}

export async function lookupPickupPass(token, idToken) {
  if (PICKUP_MOCK_MODE) {
    await wait(450);
    return buildMockLookup(token);
  }

  return postJson(PICKUP_ADMIN_LOOKUP_URL, { token }, idToken, "PICKUP_ADMIN_LOOKUP_URL");
}

export async function confirmPickupByToken(token, idToken) {
  if (PICKUP_MOCK_MODE) {
    await wait(450);
    return {
      ok: true,
      status: "PICKUP_CONFIRMED",
      runner: {
        ...mockRunner,
        numberPickedUp: true,
        numberPickedUpAt: new Date().toISOString(),
        numberPickedUpBy: "mock-admin@example.com",
      },
    };
  }

  return postJson(PICKUP_ADMIN_CONFIRM_URL, { token }, idToken, "PICKUP_ADMIN_CONFIRM_URL");
}

export async function searchPickupRunners(query, idToken) {
  const normalizedQuery = normalizeInput(query);

  if (PICKUP_MOCK_MODE) {
    await wait(350);
    return {
      ok: true,
      results: normalizedQuery
        ? [
            {
              registrationId: "reg_mock_136",
              runnerNumber: 136,
              fullName: "Alex Rivera Torres",
              phoneLast4: "3018",
              pickupCode: "J136-DEMO",
              numberPickedUp: false,
              numberPickedUpAt: null,
            },
            {
              registrationId: "reg_mock_208",
              runnerNumber: 208,
              fullName: "Marisol Vega Cruz",
              phoneLast4: "8844",
              pickupCode: "J208-DEMO",
              numberPickedUp: true,
              numberPickedUpAt: "2026-07-12T10:42:00.000Z",
              numberPickedUpBy: "mock-admin@example.com",
            },
          ]
        : [],
    };
  }

  return postJson(
    PICKUP_ADMIN_SEARCH_URL,
    { query: normalizedQuery },
    idToken,
    "PICKUP_ADMIN_SEARCH_URL",
  );
}

export async function confirmManualPickup(runner, idToken) {
  const body = buildManualConfirmBody(runner);

  if (PICKUP_MOCK_MODE) {
    await wait(450);
    return {
      ok: true,
      status: "PICKUP_CONFIRMED",
      runner: {
        ...runner,
        numberPickedUp: true,
        numberPickedUpAt: new Date().toISOString(),
        numberPickedUpBy: "mock-admin@example.com",
      },
    };
  }

  return postJson(PICKUP_ADMIN_CONFIRM_URL, body, idToken, "PICKUP_ADMIN_CONFIRM_URL");
}

export async function lookupPublicPickupPass(token) {
  if (PICKUP_MOCK_MODE) {
    await wait(350);
    return {
      ok: true,
      status: "VALID",
      pass: {
        runnerNumber: mockRunner.runnerNumber,
        displayName: mockRunner.displayName,
        pickupCode: mockRunner.pickupCode,
        numberPickedUp: false,
      },
    };
  }

  assertConfigured(PICKUP_PUBLIC_LOOKUP_URL, "PICKUP_PUBLIC_LOOKUP_URL");

  const url = new URL(PICKUP_PUBLIC_LOOKUP_URL);
  url.searchParams.set("t", token);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  return parseJsonResponse(response);
}

function buildManualConfirmBody(runner) {
  if (PICKUP_MANUAL_CONFIRM_STRATEGY === "runnerNumber") {
    return { runnerNumber: Number(runner.runnerNumber) };
  }

  return { registrationId: String(runner.registrationId || "") };
}

function buildMockLookup(token) {
  if (token.toLowerCase().includes("picked")) {
    return {
      ok: true,
      status: "ALREADY_PICKED_UP",
      runner: {
        ...mockRunner,
        numberPickedUp: true,
        numberPickedUpAt: "2026-07-12T10:42:00.000Z",
        numberPickedUpBy: "mock-admin@example.com",
      },
    };
  }

  if (token.toLowerCase().includes("invalid")) {
    return {
      ok: false,
      status: "INVALID_TOKEN",
      error: "INVALID_TOKEN",
    };
  }

  return {
    ok: true,
    status: "VALID",
    runner: mockRunner,
  };
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
