const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL || "";

function ensureApiUrl() {
  if (!API_URL) {
    throw new Error("Missing VITE_APPS_SCRIPT_URL.");
  }
}

async function readJson(response) {
  const payload = await response.json();
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }
  return payload;
}

function toAuthQuery(auth) {
  return JSON.stringify({
    email: auth.email,
    idToken: auth.idToken
  });
}

export async function fetchAccountsOrders(auth) {
  ensureApiUrl();
  const params = new URLSearchParams({
    action: "FETCH_ACCOUNTS_ORDERS",
    auth: toAuthQuery(auth)
  });

  const response = await fetch(`${API_URL}?${params.toString()}`, {
    method: "GET"
  });
  const payload = await readJson(response);
  return payload.data || [];
}

export async function postAction(body) {
  ensureApiUrl();
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return readJson(response);
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
