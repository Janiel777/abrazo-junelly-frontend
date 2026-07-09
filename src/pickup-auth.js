import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  PICKUP_ALLOWED_ADMIN_EMAILS,
  PICKUP_FIREBASE_CONFIG,
  PICKUP_MOCK_MODE,
} from "./pickup-config.js";

function hasFirebaseConfig() {
  return Boolean(
    PICKUP_FIREBASE_CONFIG.apiKey &&
      PICKUP_FIREBASE_CONFIG.authDomain &&
      PICKUP_FIREBASE_CONFIG.projectId &&
      PICKUP_FIREBASE_CONFIG.appId,
  );
}

function isAllowedEmail(email) {
  return PICKUP_ALLOWED_ADMIN_EMAILS.includes(String(email || "").toLowerCase());
}

export function isPickupAuthConfigured() {
  return hasFirebaseConfig() || PICKUP_MOCK_MODE;
}

export async function createPickupAuthController(onStateChange) {
  if (PICKUP_MOCK_MODE) {
    const mockUser = {
      email: PICKUP_ALLOWED_ADMIN_EMAILS[0],
      getIdToken: async () => "mock-firebase-id-token",
    };

    onStateChange({
      status: "authenticated",
      user: mockUser,
      message: "MODO DE PRUEBA activo.",
    });

    return {
      signIn: async () => mockUser,
      signOut: async () => {
        onStateChange({ status: "signedOut" });
      },
      getIdToken: async () => "mock-firebase-id-token",
      getFreshIdToken: async () => "mock-firebase-id-token-refreshed",
    };
  }

  if (!hasFirebaseConfig()) {
    onStateChange({
      status: "configMissing",
      message: "Firebase Web Auth no esta configurado todavia.",
    });

    return {
      signIn: async () => {
        throw new Error("Firebase Web Auth no esta configurado todavia.");
      },
      signOut: async () => {},
      getIdToken: async () => {
        throw new Error("No hay sesion activa.");
      },
      getFreshIdToken: async () => {
        throw new Error("No hay sesion activa.");
      },
    };
  }

  const app = initializeApp(PICKUP_FIREBASE_CONFIG);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  await setPersistence(auth, browserLocalPersistence);

  getRedirectResult(auth).catch(() => {
    onStateChange({
      status: "error",
      message: "No se pudo completar el inicio de sesion con redireccion.",
    });
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onStateChange({ status: "signedOut" });
      return;
    }

    if (!isAllowedEmail(user.email)) {
      await signOut(auth);
      onStateChange({
        status: "unauthorized",
        message: "Esta cuenta no esta autorizada.",
      });
      return;
    }

    onStateChange({ status: "authenticated", user });
  });

  return {
    signIn: async () => {
      onStateChange({ status: "authenticating" });

      try {
        return await signInWithPopup(auth, provider);
      } catch (error) {
        if (shouldUseRedirect(error)) {
          await signInWithRedirect(auth, provider);
          return null;
        }

        onStateChange({
          status: "error",
          message: "No se pudo iniciar sesion con Google.",
        });
        throw error;
      }
    },
    signOut: () => signOut(auth),
    getIdToken: async () => {
      if (!auth.currentUser) {
        throw new Error("La sesion expiro. Inicia sesion nuevamente.");
      }

      return auth.currentUser.getIdToken();
    },
    getFreshIdToken: async () => {
      if (!auth.currentUser) {
        throw new Error("La sesion expiro. Inicia sesion nuevamente.");
      }

      return auth.currentUser.getIdToken(true);
    },
  };
}

function shouldUseRedirect(error) {
  return [
    "auth/popup-blocked",
    "auth/cancelled-popup-request",
    "auth/operation-not-supported-in-this-environment",
  ].includes(error?.code);
}
