import { createContext, useContext, useState, useMemo } from "react";
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

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [reports, setReports] = useState(initialReports);
  const [hotspots, setHotspots] = useState(initialHotspots);
  const [issues, setIssues] = useState(initialIssues);
  const [escalations, setEscalations] = useState(initialEscalations);
  const [savedPlaces, setSavedPlaces] = useState(initialSavedPlaces);
  const [contacts, setContacts] = useState(initialContacts);
  const [alerts, setAlerts] = useState(initialAlerts);

  // Compute provisional Hotspot Candidates live from reports dataset
  const hotspotCandidates = useMemo(() => {
    return calculateHotspotCandidates(reports);
  }, [reports]);

  // Derived Dashboard Statistics (Strictly derived from mock dataset)
  const stats = useMemo(() => {
    const totalReports = reports.length;
    // Exactly count reports where status === 'Verified'
    const verifiedReports = reports.filter(r => r.status === "Verified").length;
    // Total community confirmations
    const totalConfirmations = reports.reduce((sum, r) => sum + (r.confirmations || 0), 0);
    const activeHotspotsCount = hotspots.filter(h => h.active).length;
    const resolvedIssuesCount = issues.filter(i => i.status === "Resolved").length;
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

  function addReport(reportData) {
    // Strictly require valid coordinates from the user's selected/searched place
    if (!reportData.lat || !reportData.lng || isNaN(reportData.lat) || isNaN(reportData.lng)) {
      throw new Error("Cannot submit incident without valid coordinates. Please select a recognized location.");
    }

    const newReport = {
      id: Date.now(),
      category: reportData.category || "Infrastructure Concern",
      place: reportData.place,
      city: reportData.city || "Pune",
      date: reportData.date || "Today",
      time: reportData.time || "Just now",
      signal: "Context note",
      confirmations: 0,
      disputes: 0,
      description: reportData.description,
      lat: parseFloat(reportData.lat),
      lng: parseFloat(reportData.lng),
      status: "Submitted", // 4-step lifecycle begins at "Submitted"
      anonymous: !!reportData.anonymous,
      authorName: reportData.anonymous ? "SHEQ Member (Anonymous)" : (reportData.authorName || "SHEQ Member"),
      photoPreview: reportData.photoPreview || null,
      comments: [],
      disputeNotes: []
    };

    setReports(prev => [newReport, ...prev]);
    return newReport;
  }

  function confirmReport(reportId) {
    setReports(prev =>
      prev.map(r => (r.id === reportId ? { ...r, confirmations: (r.confirmations || 0) + 1 } : r))
    );
  }

  function addReportComment(reportId, commentText, author = "SHEQ Member") {
    if (!commentText || !commentText.trim()) return;
    const newComment = {
      id: Date.now(),
      author,
      text: commentText.trim(),
      time: "Just now"
    };

    setReports(prev =>
      prev.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            comments: [...(r.comments || []), newComment]
          };
        }
        return r;
      })
    );
  }

  function disputeReport(reportId, disputeData) {
    const newDispute = {
      id: Date.now(),
      reason: disputeData.reason,
      details: disputeData.details,
      time: "Just now"
    };

    setReports(prev =>
      prev.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            disputes: (r.disputes || 0) + 1,
            disputeNotes: [...(r.disputeNotes || []), newDispute]
          };
        }
        return r;
      })
    );
  }

  function updateReportStatus(reportId, newStatus) {
    setReports(prev =>
      prev.map(r => (r.id === reportId ? { ...r, status: newStatus } : r))
    );
  }

  function promoteHotspotCandidate(candidate, metadata = {}) {
    const newHotspot = {
      id: `hotspot-${Date.now()}`,
      place: candidate.place,
      city: candidate.city || "Pune",
      lat: candidate.lat,
      lng: candidate.lng,
      active: true,
      designatedDate: "Today",
      reason: metadata.reason || `Designated by SHEQ admin review based on ${candidate.reportCount} reports.`,
      supportingReportsCount: candidate.reportCount,
      adminNotes: metadata.adminNotes || "Official SHEQ Hotspot designation applied."
    };

    setHotspots(prev => [newHotspot, ...prev]);
    return newHotspot;
  }

  function toggleHotspotActive(hotspotId) {
    setHotspots(prev =>
      prev.map(h => (h.id === hotspotId ? { ...h, active: !h.active } : h))
    );
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
      prev.map(i => (i.id === issueId ? { ...i, status: newStatus } : i))
    );
  }

  function createEscalation(escData) {
    const newEsc = {
      id: `esc-${Date.now().toString().slice(-4)}`,
      title: escData.title,
      area: escData.area,
      supportingReportsCount: escData.supportingReportsCount || 1,
      severity: escData.severity || "High",
      potentialAuthority: escData.potentialAuthority || "Local Safety Authority",
      createdDate: "Today",
      adminNotes: escData.adminNotes || "",
      disclaimer:
        "Creating an escalation record is an internal SHEQ tracking mechanism. No direct police API integration is claimed or performed."
    };
    setEscalations(prev => [newEsc, ...prev]);
    return newEsc;
  }

  function addSavedPlace(place) {
    const newPlace = {
      id: `place-${Date.now()}`,
      type: place.type || "Other",
      name: place.name,
      address: place.address || place.name,
      lat: place.lat || 18.5204,
      lng: place.lng || 73.8567
    };
    setSavedPlaces(prev => [...prev, newPlace]);
  }

  function removeSavedPlace(placeId) {
    setSavedPlaces(prev => prev.filter(p => p.id !== placeId));
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
        updateContacts
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
