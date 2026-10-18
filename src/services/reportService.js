import { apiRequest } from "./api";

function getToken() {
  try {
    const saved =
      localStorage.getItem("sheq_auth_session") ||
      sessionStorage.getItem("sheq_auth_session");

    return saved ? JSON.parse(saved).token : null;
  } catch {
    return null;
  }
}

function authHeaders() {
  const token = getToken();

  if (!token) {
    throw new Error("Please log in again before proceeding.");
  }

  return {
    Authorization: `Bearer ${token}`
  };
}

export function toFrontendReport(report) {
  const rawLabel = report.location?.label || "";
  const parts = rawLabel ? rawLabel.split(",").map(p => p.trim()) : [];
  const place = parts[0] || "Selected location";
  const city = parts[1] || (parts[0] ? parts[0] : "Pune");

  return {
    ...report,
    id: String(report._id || report.id),
    place,
    city,
    lat: report.location?.coordinates?.[1] ?? report.lat,
    lng: report.location?.coordinates?.[0] ?? report.lng,
    date: report.incidentAt
      ? new Date(report.incidentAt).toLocaleDateString()
      : report.createdAt
      ? new Date(report.createdAt).toLocaleDateString()
      : "Recent",
    time: report.incidentAt
      ? new Date(report.incidentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : report.createdAt
      ? new Date(report.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "",
    anonymous: !!report.isAnonymousPublicly,
    isLive: true,
    source: "live_community",
    status: report.status || "Submitted",
    confirmations: report.confirmations || 0,
    disputes: report.disputes || 0,
    authorName: report.isAnonymousPublicly
      ? "SHEQ Member (Anonymous)"
      : "Verified SHEQ Member",
    comments: report.comments || [],
    disputeNotes: report.disputeNotes || []
  };
}

export async function getReports() {
  const token = getToken();
  const options = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  const result = await apiRequest("/reports", options);

  return (result.reports || []).map(toFrontendReport);
}

export async function createReport(report) {
  const incidentAt = report.date && report.time
    ? new Date(`${report.date}T${report.time}`).toISOString()
    : undefined;

  const result = await apiRequest("/reports", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      category: report.category,
      description: report.description,
      longitude: Number(report.lng),
      latitude: Number(report.lat),
      locationLabel: [report.place, report.city]
        .filter(Boolean)
        .join(", "),
      ...(incidentAt ? { incidentAt } : {}),
      isAnonymousPublicly: !!report.anonymous
    })
  });

  return toFrontendReport(result.report);
}

export async function confirmReportApi(id) {
  const result = await apiRequest(`/reports/${id}/confirm`, {
    method: "POST",
    headers: authHeaders()
  });

  return result.report ? toFrontendReport(result.report) : null;
}

export async function fetchReportComments(id) {
  const result = await apiRequest(`/reports/${id}/comments`, {
    headers: authHeaders()
  });

  return result.comments || [];
}

export async function addReportCommentApi(id, text) {
  const result = await apiRequest(`/reports/${id}/comments`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ text })
  });

  return result.comment;
}

export async function disputeReportApi(id, reason, details) {
  const result = await apiRequest(`/reports/${id}/dispute`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ reason, details })
  });

  return result.report ? toFrontendReport(result.report) : null;
}

export async function updateReportStatusApi(id, status, moderationNote = "") {
  const result = await apiRequest(`/reports/${id}/moderation`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status, moderationNote })
  });

  return result.report ? toFrontendReport(result.report) : null;
}

export async function verifyReport(id) {
  return confirmReportApi(id);
}
