const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise;

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

export function initializeGoogleSignIn({ clientId, onCredential, onError }) {
  if (!window.google?.accounts?.id) {
    throw new Error("Google Identity Services is not available.");
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (!response?.credential) {
        onError?.(new Error("Missing credential from Google Sign-In."));
        return;
      }
      onCredential(response.credential);
    },
    auto_select: false,
    cancel_on_tap_outside: true
  });
}

export function renderGoogleButton(target, theme = "filled_blue") {
  if (!window.google?.accounts?.id) return;
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
