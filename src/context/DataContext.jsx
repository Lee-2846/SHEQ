import { createContext, useContext, useState, useMemo, useEffect } from "react";
import {
  reports as initialReports,
  alerts as initialAlerts,
  savedPlaces as initialSavedPlaces,
  initialContacts,
  initialHotspots,
  initialIssues,
  initialEscalations
} from "../data/mockData";
import { calculateHotspotCandidates } from "../utils/hotspotScoring";
import {
  createReport as createReportApi,
  getReports as getReportsApi,
  confirmReportApi,
  addReportCommentApi,
  disputeReportApi,
  updateReportStatusApi
} from "../services/reportService";
import {
  fetchSavedPlacesApi,
  addSavedPlaceApi,
  removeSavedPlaceApi,
  fetchDesignatedHotspotsApi,
  saveAndDesignateHotspotApi,
  reviewHotspotStateApi,
  fetchEscalationsApi,
  createEscalationApi,
  fetchInfrastructureLayerApi
} from "../services/dataServices";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [reports, setReports] = useState(() => 
    initialReports.map(r => ({ ...r, isDemo: true, isLive: false, source: "demo_curated" }))
  );
  const [hotspots, setHotspots] = useState(initialHotspots);
  const [issues, setIssues] = useState(initialIssues);
  const [escalations, setEscalations] = useState(initialEscalations);
  const [savedPlaces, setSavedPlaces] = useState(initialSavedPlaces);
  const [contacts, setContacts] = useState(initialContacts);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [backendLoaded, setBackendLoaded] = useState(false);
  const [infrastructureLayers, setInfrastructureLayers] = useState({
    policeStations: null,
    busStops: null,
    streetlights: null
  });

  async function loadInfrastructureLayer(layerKey) {
    const slugMap = {
      policeStations: "police-stations",
      busStops: "bus-stops",
      streetlights: "streetlights"
    };
    const slug = slugMap[layerKey] || layerKey;
    if (infrastructureLayers[layerKey]) return infrastructureLayers[layerKey];

    const data = await fetchInfrastructureLayerApi(slug);
    if (data && data.features) {
      setInfrastructureLayers(prev => ({ ...prev, [layerKey]: data.features }));
      return data.features;
    }
    return [];
  }

  // Synchronize backend data on initial load
  useEffect(() => {
    let isMounted = true;

    async function syncBackendData() {
      // 1. Fetch live community reports from MongoDB
      try {
        const backendReports = await getReportsApi();
        if (isMounted && Array.isArray(backendReports) && backendReports.length > 0) {
          setReports(prev => {
            const backendIds = new Set(backendReports.map(r => String(r.id)));
            const remainingDemo = prev
              .filter(r => !backendIds.has(String(r.id)))
              .map(r => ({ ...r, isDemo: true, isLive: false, source: "demo_curated" }));
            return [...backendReports, ...remainingDemo];
          });
        }
      } catch {
        // Fall back gracefully to existing reports
      }

      // 2. Fetch saved places from backend if user session is active
      try {
        const backendPlaces = await fetchSavedPlacesApi();
        if (isMounted && Array.isArray(backendPlaces) && backendPlaces.length > 0) {
          setSavedPlaces(backendPlaces);
        }
      } catch {
        // Fall back gracefully
      }

      // 3. Fetch designated hotspots from backend
      try {
        const backendHotspots = await fetchDesignatedHotspotsApi();
        if (isMounted && Array.isArray(backendHotspots) && backendHotspots.length > 0) {
          setHotspots(prev => {
            const backendIds = new Set(backendHotspots.map(h => String(h.id)));
            const remaining = prev.filter(h => !backendIds.has(String(h.id)));
            return [...backendHotspots, ...remaining];
          });
        }
      } catch {
        // Fall back gracefully
      }

      // 4. Fetch escalation records
      try {
        const backendEscalations = await fetchEscalationsApi();
        if (isMounted && Array.isArray(backendEscalations) && backendEscalations.length > 0) {
          setEscalations(backendEscalations);
        }
      } catch {
        // Fall back gracefully
      }

      if (isMounted) setBackendLoaded(true);
    }

    syncBackendData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute provisional hotspot candidates from the current reports
  const hotspotCandidates = useMemo(() => {
    return calculateHotspotCandidates(reports);
  }, [reports]);

  // Dashboard statistics
  const stats = useMemo(() => {
    const totalReports = reports.length;
    const verifiedReports = reports.filter(
      r => r.status === "Verified"
    ).length;
    const totalConfirmations = reports.reduce(
      (sum, r) => sum + (r.confirmations || 0),
      0
    );
    const activeHotspotsCount = hotspots.filter(h => h.active).length;
    const resolvedIssuesCount = issues.filter(
      i => i.status === "Resolved"
    ).length;
    const totalAlerts = alerts.length;

    return {
      totalReports,
      verifiedReports,
      totalConfirmations,
      activeHotspotsCount,
      resolvedIssuesCount,
      totalAlerts
    };
  }, [reports, hotspots, issues, alerts]);

  // Save the report to the backend before updating the frontend
  async function addReport(reportData) {
    if (
      reportData.lat == null ||
      reportData.lng == null ||
      !Number.isFinite(Number(reportData.lat)) ||
      !Number.isFinite(Number(reportData.lng)) ||
      Number(reportData.lat) < -90 ||
      Number(reportData.lat) > 90 ||
      Number(reportData.lng) < -180 ||
      Number(reportData.lng) > 180
    ) {
      throw new Error(
        "Cannot submit incident without valid coordinates. Please select a recognized location."
      );
    }

    const savedReport = await createReportApi(reportData);

    const newReport = {
      ...savedReport,
      signal: "Context note",
      authorName: reportData.anonymous
        ? "SHEQ Member (Anonymous)"
        : (reportData.authorName || "SHEQ Member"),
      photoPreview: reportData.photoPreview || null,
      comments: [],
      disputeNotes: []
    };

    setReports(prev => [newReport, ...prev]);
    return newReport;
  }

  async function confirmReport(reportId) {
    // Optimistic UI update
    setReports(prev =>
      prev.map(r =>
        r.id === reportId
          ? { ...r, confirmations: (r.confirmations || 0) + 1 }
          : r
      )
    );

    try {
      await confirmReportApi(reportId);
    } catch {
      // Retain optimistic update for demonstration
    }
  }

  async function addReportComment(
    reportId,
    commentText,
    author = "SHEQ Member"
  ) {
    if (!commentText || !commentText.trim()) return;

    const newComment = {
      id: Date.now(),
      author,
      text: commentText.trim(),
      time: "Just now"
    };

    setReports(prev =>
      prev.map(r =>
        r.id === reportId
          ? {
              ...r,
              comments: [...(r.comments || []), newComment]
            }
          : r
      )
    );

    try {
      await addReportCommentApi(reportId, commentText.trim());
    } catch {
      // Local fallback
    }
  }

  async function disputeReport(reportId, disputeData) {
    const newDispute = {
      id: Date.now(),
      reason: disputeData.reason,
      details: disputeData.details,
      time: "Just now"
    };

    setReports(prev =>
      prev.map(r =>
        r.id === reportId
          ? {
              ...r,
              disputes: (r.disputes || 0) + 1,
              disputeNotes: [...(r.disputeNotes || []), newDispute]
            }
          : r
      )
    );

    try {
      await disputeReportApi(reportId, disputeData.reason, disputeData.details);
    } catch {
      // Local fallback
    }
  }

  async function updateReportStatus(reportId, newStatus) {
    setReports(prev =>
      prev.map(r =>
        r.id === reportId ? { ...r, status: newStatus } : r
      )
    );

    try {
      await updateReportStatusApi(reportId, newStatus);
    } catch {
      // Local fallback
    }
  }

  async function promoteHotspotCandidate(candidate, metadata = {}) {
    const newHotspot = {
      id: `hotspot-${Date.now()}`,
      place: candidate.place,
      city: candidate.city || "Pune",
      lat: candidate.lat,
      lng: candidate.lng,
      active: true,
      designatedDate: "Today",
      reason:
        metadata.reason ||
        `Designated by SHEQ admin review based on ${candidate.reportCount} reports.`,
      supportingReportsCount: candidate.reportCount,
      adminNotes:
        metadata.adminNotes ||
        "Official SHEQ Hotspot designation applied."
    };

    setHotspots(prev => [newHotspot, ...prev]);

    try {
      const persisted = await saveAndDesignateHotspotApi(candidate, metadata);
      if (persisted && persisted._id) {
        newHotspot.id = String(persisted._id);
      }
    } catch {
      // Local fallback
    }

    return newHotspot;
  }

  async function toggleHotspotActive(hotspotId) {
    let nextActiveState = false;
    setHotspots(prev =>
      prev.map(h => {
        if (h.id === hotspotId) {
          nextActiveState = !h.active;
          return { ...h, active: nextActiveState };
        }
        return h;
      })
    );

    try {
      await reviewHotspotStateApi(
        hotspotId,
        nextActiveState ? "designated" : "inactive"
      );
    } catch {
      // Local fallback
    }
  }

  function createIssue(issueData) {
    const newIssue = {
      id: `issue-${Date.now().toString().slice(-4)}`,
      title: issueData.title,
      area: issueData.area,
      category: issueData.category || "General",
      severity: issueData.severity || "Medium",
      status: "Open",
      createdDate: "Today",
      adminNotes: issueData.adminNotes || ""
    };

    setIssues(prev => [newIssue, ...prev]);
    return newIssue;
  }

  function updateIssueStatus(issueId, newStatus) {
    setIssues(prev =>
      prev.map(i =>
        i.id === issueId ? { ...i, status: newStatus } : i
      )
    );
  }

  async function createEscalation(escData) {
    const newEsc = {
      id: `esc-${Date.now().toString().slice(-4)}`,
      title: escData.title,
      area: escData.area,
      supportingReportsCount: escData.supportingReportsCount || 1,
      severity: escData.severity || "High",
      potentialAuthority:
        escData.potentialAuthority || "Local Safety Authority",
      createdDate: "Today",
      adminNotes: escData.adminNotes || "",
      disclaimer:
        "Creating an escalation record is an internal SHEQ tracking mechanism. No direct police API integration is claimed or performed."
    };

    setEscalations(prev => [newEsc, ...prev]);

    try {
      await createEscalationApi(escData);
    } catch {
      // Local fallback
    }

    return newEsc;
  }

  async function addSavedPlace(place) {
    const newPlace = {
      id: `place-${Date.now()}`,
      type: place.type || "Other",
      name: place.name,
      address: place.address || place.name,
      lat: place.lat || 18.5204,
      lng: place.lng || 73.8567
    };

    setSavedPlaces(prev => [...prev, newPlace]);

    try {
      const persisted = await addSavedPlaceApi(newPlace);
      if (persisted?._id) {
        newPlace.id = String(persisted._id);
      }
    } catch {
      // Local fallback
    }
  }

  async function removeSavedPlace(placeId) {
    setSavedPlaces(prev => prev.filter(p => p.id !== placeId));

    try {
      await removeSavedPlaceApi(placeId);
    } catch {
      // Local fallback
    }
  }

  function updateContacts(newContacts) {
    setContacts(prev => ({ ...prev, ...newContacts }));
  }

  return (
    <DataContext.Provider
      value={{
        reports,
        hotspots,
        hotspotCandidates,
        issues,
        escalations,
        savedPlaces,
        contacts,
        alerts,
        stats,
        backendLoaded,
        addReport,
        confirmReport,
        addReportComment,
        disputeReport,
        updateReportStatus,
        promoteHotspotCandidate,
        toggleHotspotActive,
        createIssue,
        updateIssueStatus,
        createEscalation,
        addSavedPlace,
        removeSavedPlace,
        updateContacts,
        infrastructureLayers,
        loadInfrastructureLayer
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }

  return context;
}
