const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000/api";

function getStoredToken() {
  try {
    const raw =
      localStorage.getItem("sheq_auth_session") ||
      sessionStorage.getItem("sheq_auth_session");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

export async function apiRequest(path, options = {}) {
  const token = options.token || getStoredToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });
  } catch (netErr) {
    throw new Error(
      `Unable to connect to SHEQ server at ${API_BASE_URL}. Please verify the backend is running on port 4000.`
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.details = data.details;
    throw err;
  }

  return data;
}

export { API_BASE_URL };
