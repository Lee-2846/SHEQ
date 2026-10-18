import { apiRequest } from "./api";

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

function authHeader() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Saved Places API
export async function fetchSavedPlacesApi() {
  try {
    const res = await apiRequest("/places", { headers: authHeader() });
    return (res.places || []).map(p => ({
      id: String(p._id),
      name: p.name,
      address: p.label || p.name,
      type: "Saved",
      lat: p.location?.coordinates?.[1] || 18.5204,
      lng: p.location?.coordinates?.[0] || 73.8567
    }));
  } catch {
    return null;
  }
}

export async function addSavedPlaceApi(place) {
  try {
    const res = await apiRequest("/places", {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({
        name: place.name,
        label: place.address || place.name,
        longitude: Number(place.lng || 73.8567),
        latitude: Number(place.lat || 18.5204)
      })
    });
    return res.place;
  } catch {
    return null;
  }
}

export async function removeSavedPlaceApi(id) {
  try {
    await apiRequest(`/places/${id}`, {
      method: "DELETE",
      headers: authHeader()
    });
    return true;
  } catch {
    return false;
  }
}

// Hotspots API
export async function fetchDesignatedHotspotsApi() {
  try {
    const res = await apiRequest("/hotspots", { headers: authHeader() });
    return (res.hotspots || []).map(h => ({
      id: String(h._id),
      place: h.label || "Designated Safety Concern Area",
      city: "Pune / Mumbai",
      lat: h.center?.coordinates?.[1],
      lng: h.center?.coordinates?.[0],
      active: h.state === "designated",
      designatedDate: new Date(h.reviewedAt || h.createdAt).toLocaleDateString(),
      reason: h.rationale || "Designated by SHEQ admin review.",
      supportingReportsCount: h.factors?.reportCount || 1,
      adminNotes: "Officially verified and active on Safety Map."
    }));
  } catch {
    return null;
  }
}

export async function fetchBackendCandidatesApi() {
  try {
    const res = await apiRequest("/hotspots/candidates", { headers: authHeader() });
    return res.candidates || [];
  } catch {
    return null;
  }
}

export async function saveAndDesignateHotspotApi(candidate, metadata = {}) {
  try {
    // 1. Save candidate in Mongo
    const saveRes = await apiRequest("/hotspots/candidates/save", {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({
        label: candidate.place || "Hotspot Candidate",
        longitude: Number(candidate.lng || candidate.center?.coordinates?.[0] || 72.8777),
        latitude: Number(candidate.lat || candidate.center?.coordinates?.[1] || 19.0760),
        score: Number(candidate.provisionalScore || candidate.score || 40),
        factors: {
          reportCount: Number(candidate.reportCount || candidate.factors?.reportCount || 2),
          recentReportCount: Number(candidate.recentCount || candidate.factors?.recentReportCount || 1),
          confirmations: Number(candidate.totalConfirmations || candidate.factors?.confirmations || 0),
          categoryMix: Number(candidate.factors?.categoryMix || 1)
        },
        evidenceReportIds: (candidate.reports || []).map(r => String(r.id || r._id)).filter(id => id.length === 24),
        rationale: metadata.reason || "Designated by SHEQ admin review."
      })
    });

    const hotspotId = saveRes.hotspot?._id;
    if (hotspotId) {
      // 2. Admin review designation
      const reviewRes = await apiRequest(`/hotspots/${hotspotId}/review`, {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({
          state: "designated",
          rationale: metadata.reason || "Official SHEQ Hotspot verified."
        })
      });
      return reviewRes.hotspot;
    }
    return saveRes.hotspot;
  } catch (err) {
    console.warn("Hotspot candidate save failed:", err.message);
    return null;
  }
}

export async function reviewHotspotStateApi(hotspotId, newState, rationale = "") {
  try {
    const res = await apiRequest(`/hotspots/${hotspotId}/review`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify({ state: newState, rationale })
    });
    return res.hotspot;
  } catch {
    return null;
  }
}

// Escalations API
export async function fetchEscalationsApi() {
  try {
    const res = await apiRequest("/escalations", { headers: authHeader() });
    return (res.escalations || []).map(e => ({
      id: String(e._id),
      title: e.title,
      area: e.locationLabel || "Local Area",
      supportingReportsCount: e.reportIds?.length || 1,
      severity: e.category || "High",
      potentialAuthority: "Local Police Station / Safety Patrol",
      createdDate: new Date(e.createdAt).toLocaleDateString(),
      adminNotes: e.adminNotes || "",
      disclaimer: "Creating an escalation record is an internal SHEQ tracking mechanism. No direct police API integration is claimed or performed."
    }));
  } catch {
    return null;
  }
}

export async function createEscalationApi(data) {
  try {
    const res = await apiRequest("/escalations", {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({
        title: data.title,
        summary: data.adminNotes || data.title,
        locationLabel: data.area,
        category: data.severity,
        adminNotes: data.adminNotes
      })
    });
    return res.escalation;
  } catch {
    return null;
  }
}

// Admin Analytics API
export async function fetchAdminAnalyticsApi() {
  try {
    return await apiRequest("/analytics/admin", { headers: authHeader() });
  } catch {
    return null;
  }
}

// Identity Status API
export async function checkIdentityStatusApi() {
  try {
    return await apiRequest("/auth/identity/status", { headers: authHeader() });
  } catch (err) {
    return {
      verificationStatus: "unverified",
      providerConfigured: false,
      error: err.message
    };
  }
}

export async function runDemoVerificationApi() {
  try {
    return await apiRequest("/auth/identity/demo-verify", {
      method: "POST",
      headers: authHeader()
    });
  } catch (err) {
    return {
      status: "error",
      message: err.message
    };
  }
}

// Infrastructure Geospatial Datasets API
export async function fetchInfrastructureSummaryApi() {
  try {
    const res = await apiRequest("/infrastructure/summary");
    return res.summary;
  } catch {
    return null;
  }
}

export async function fetchInfrastructureLayerApi(layer) {
  try {
    return await apiRequest(`/infrastructure/${layer}`);
  } catch {
    return null;
  }
}

// Admin Moderation: User Verification Status
export async function updateUserVerificationStatusApi(userId, verificationStatus) {
  try {
    const res = await apiRequest(`/auth/users/${userId}/verification`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify({ verificationStatus })
    });
    return res.user;
  } catch (err) {
    throw new Error(err.message || "Failed to update verification status.");
  }
}

