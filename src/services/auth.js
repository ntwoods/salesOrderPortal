const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_PROMPT_TIMEOUT_MS = 20000;

let scriptPromise;
let gisInitialized = false;
let activeCredentialHandler = null;
let activeErrorHandler = null;
let lastClientId = "";

export function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity script."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function decodeJwt(credential) {
  const parts = String(credential || "").split(".");
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function ensureGoogleIdentityLoaded() {
  if (!window.google?.accounts?.id) {
    throw new Error("Google Identity Services is not available.");
  }
}

function applyGoogleConfig({ clientId, autoSelect = false, loginHint = "" }) {
  ensureGoogleIdentityLoaded();

  if (!clientId) {
    throw new Error("Missing VITE_GOOGLE_CLIENT_ID.");
  }

  lastClientId = clientId;

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (!response?.credential) {
        activeErrorHandler?.(new Error("Missing credential from Google Sign-In."));
        return;
      }
      activeCredentialHandler?.(response.credential);
    },
    auto_select: autoSelect,
    cancel_on_tap_outside: true,
    login_hint: loginHint || undefined
  });

  gisInitialized = true;
}

export function buildGoogleSession(credential) {
  const payload = decodeJwt(credential);
  if (!payload?.email) {
    throw new Error("Could not extract email from Google credential.");
  }

  return {
    email: payload.email.toLowerCase(),
    idToken: credential,
    name: payload.name || payload.email,
    sub: payload.sub || "",
    tokenExpiresAt: typeof payload.exp === "number" ? payload.exp * 1000 : 0
  };
}

export function initializeGoogleSignIn({ clientId, onCredential, onError, autoSelect = false, loginHint = "" }) {
  ensureGoogleIdentityLoaded();

  activeCredentialHandler = onCredential;
  activeErrorHandler = onError;

  if (!gisInitialized || lastClientId !== clientId || autoSelect || loginHint) {
    applyGoogleConfig({ clientId, autoSelect, loginHint });
  }
}

export function renderGoogleButton(target, theme = "filled_blue") {
  if (!window.google?.accounts?.id) return;
  if (!target) return;
  target.replaceChildren();
  window.google.accounts.id.renderButton(target, {
    type: "standard",
    shape: "pill",
    theme,
    text: "signin_with",
    size: "large"
  });
}

export function disableGoogleAutoSelect() {
  if (window.google?.accounts?.id) {
    window.google.accounts.id.disableAutoSelect();
  }
}

export async function requestGoogleCredential({ clientId = "", loginHint = "", timeoutMs = GOOGLE_PROMPT_TIMEOUT_MS } = {}) {
  ensureGoogleIdentityLoaded();

  const resolvedClientId = clientId || lastClientId;
  if (!resolvedClientId) {
    throw new Error("Google Sign-In is not initialized.");
  }

  return new Promise((resolve, reject) => {
    const previousCredentialHandler = activeCredentialHandler;
    const previousErrorHandler = activeErrorHandler;
    let settled = false;
    let timeoutId = 0;

    const cleanup = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      activeCredentialHandler = previousCredentialHandler;
      activeErrorHandler = previousErrorHandler;
    };

    const settle = (callback, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback(value);
    };

    activeCredentialHandler = (credential) => {
      settle(resolve, credential);
    };

    activeErrorHandler = (error) => {
      settle(reject, error instanceof Error ? error : new Error("Google sign-in failed."));
    };

    applyGoogleConfig({
      clientId: resolvedClientId,
      autoSelect: true,
      loginHint
    });

    window.google.accounts.id.prompt((notification) => {
      if (settled) return;
      if (notification?.isNotDisplayed?.()) {
        settle(reject, new Error("Google sign-in prompt could not be displayed."));
        return;
      }
      if (notification?.isSkippedMoment?.()) {
        settle(reject, new Error("Google sign-in was skipped."));
      }
    });

    timeoutId = window.setTimeout(() => {
      settle(reject, new Error("Timed out while waiting for Google sign-in."));
    }, timeoutMs);
  });
}
