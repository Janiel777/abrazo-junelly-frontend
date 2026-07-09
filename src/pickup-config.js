export const PICKUP_ALLOWED_ADMIN_EMAILS = [
  "janjannunez777@gmail.com",
  "cqvkiki@gmail.com",
];

export const PICKUP_MOCK_MODE = false;

export const PICKUP_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "project-fbdd8e2e-e884-43f6-81c.firebaseapp.com",
  projectId: "project-fbdd8e2e-e884-43f6-81c",
  appId: "1:723401665439:web:138ac596d3aa0a3eaa6baa",
};

export const PICKUP_PUBLIC_LOOKUP_URL =
  "https://us-east1-project-fbdd8e2e-e884-43f6-81c.cloudfunctions.net/publicPickupPass";
export const PICKUP_ADMIN_LOOKUP_URL =
  "https://us-east1-project-fbdd8e2e-e884-43f6-81c.cloudfunctions.net/adminLookupPickupPass";
export const PICKUP_ADMIN_CONFIRM_URL =
  "https://us-east1-project-fbdd8e2e-e884-43f6-81c.cloudfunctions.net/adminConfirmPickup";
export const PICKUP_ADMIN_SEARCH_URL =
  "https://us-east1-project-fbdd8e2e-e884-43f6-81c.cloudfunctions.net/adminSearchPickupRunners";

export const PICKUP_MANUAL_CONFIRM_STRATEGY = "registrationId";

export const PICKUP_TOKEN_RULES = {
  minLength: 8,
  maxLength: 256,
  pattern: /^[A-Za-z0-9_-]+$/,
};

export const PICKUP_MOCK_WARNING =
  "MODO DE PRUEBA: datos ficticios, sin llamadas reales y no apto para produccion.";
