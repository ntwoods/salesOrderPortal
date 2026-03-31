const API_URL = (import.meta.env.VITE_APPS_SCRIPT_URL || "").trim();
const API_META = parseApiMeta(API_URL);
let apiLogPrinted = false;

function parseApiMeta(urlText) {
  try {
    const parsed = new URL(urlText);
    return { valid: true, host: parsed.host, href: parsed.href };
  } catch {
    return { valid: false, host: "", href: urlText };
  }
}

function ensureApiUrl() {
  if (!API_URL) {
    throw new Error("Missing VITE_APPS_SCRIPT_URL.");
  }
  if (!API_META.valid) {
    throw new Error("VITE_APPS_SCRIPT_URL is not a valid URL.");
  }
  if (API_META.host === "script.googleusercontent.com") {
    throw new Error(
      "VITE_APPS_SCRIPT_URL must be the original Apps Script /exec URL (script.google.com), not a redirected script.googleusercontent.com URL."
    );
  }
}

function logApiMetaOnce() {
  if (apiLogPrinted) return;
  apiLogPrinted = true;
  console.info("[api] Endpoint:", API_META.href || "(missing)");
}

function buildFetchFailureError(context, error) {
  const reason = error?.message ? String(error.message) : "Unknown network error";
  return new Error(
    `${context} failed to reach the backend. Check Apps Script deployment access and URL. Original error: ${reason}`
  );
}

async function parseJsonResponse(response, context) {
  const rawText = await response.text();
  let payload = null;

  try {
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    const preview = rawText ? rawText.slice(0, 140).replace(/\s+/g, " ") : "";
    throw new Error(
      `${context} returned non-JSON response (status ${response.status}). ` +
        (preview ? `Response preview: ${preview}` : "Response body is empty.")
    );
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || `${context} failed (status ${response.status}).`);
  }

  return payload;
}

function buildFetchUrl(action, auth) {
  const params = new URLSearchParams({ action });
  if (auth?.email) params.set("email", String(auth.email));
  if (auth?.idToken) params.set("idToken", String(auth.idToken));
  return `${API_URL}?${params.toString()}`;
}

export async function fetchAccountsOrders(auth) {
  ensureApiUrl();
  logApiMetaOnce();

  if (!auth?.email || !auth?.idToken) {
    throw new Error("Missing login auth (email/idToken).");
  }

  const url = buildFetchUrl("FETCH_ACCOUNTS_ORDERS", auth);
  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      cache: "no-store"
    });
  } catch (error) {
    throw buildFetchFailureError("FETCH_ACCOUNTS_ORDERS", error);
  }

  return (await parseJsonResponse(response, "FETCH_ACCOUNTS_ORDERS")).data || [];
}

export async function postAction(body) {
  ensureApiUrl();
  logApiMetaOnce();

  const context = String(body?.action || "POST_ACTION");
  let response;

  try {
    response = await fetch(API_URL, {
      method: "POST",
      // text/plain keeps the request simple and avoids browser preflight/CORS issues with Apps Script.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body)
    });
  } catch (error) {
    throw buildFetchFailureError(context, error);
  }

  return parseJsonResponse(response, context);
}

export async function uploadFinal({ orderId, files, auth }) {
  return postAction({
    action: "UPLOAD_FINAL",
    orderId,
    files,
    auth
  });
}

export async function uploadAdditional({ orderId, additionalUrl, files, auth }) {
  return postAction({
    action: "UPLOAD_ADDITIONAL",
    orderId,
    additionalUrl,
    files,
    auth
  });
}
