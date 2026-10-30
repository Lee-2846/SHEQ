import { apiRequest, API_BASE_URL } from "./api";

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

/**
 * Fetches the user's current identity verification status and disclosures.
 */
export async function getMyVerificationStatus() {
  return await apiRequest("/identity/my-status");
}

/**
 * Uploads a document to the private vault for eligibility review.
 */
export async function uploadIdentityDocument(file, consent = true) {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append("document", file);
  formData.append("consent", String(consent));

  const response = await fetch(`${API_BASE_URL}/identity/upload-document`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Failed to upload identity document.");
  }

  return data;
}

/**
 * Returns authenticated download URL or triggers streaming fetch for document view.
 */
export async function fetchDocumentBlob(userId) {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/identity/document/${userId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to fetch document from private vault.");
  }

  return await response.blob();
}

/**
 * Lists pending submissions for admin review.
 */
export async function getPendingIdentityReviews() {
  return await apiRequest("/identity/pending");
}

/**
 * Submits an administrative decision on a user's verification document.
 */
export async function reviewIdentitySubmission(userId, { decision, notes, rejectionReason }) {
  return await apiRequest(`/identity/review/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({
      decision,
      notes,
      rejectionReason
    })
  });
}

/**
 * Securely deletes the user's uploaded document (Right to erasure).
 */
export async function deleteMyDocument() {
  return await apiRequest("/identity/document", {
    method: "DELETE"
  });
}

/**
 * Fetches identity audit logs for administrator review.
 */
export async function getIdentityAuditLogs() {
  return await apiRequest("/identity/audit-logs");
}
