import { useState, useEffect } from "react";
import { Flame, CheckCircle2, Info, ShieldCheck, XCircle, ChevronDown, ChevronUp, RefreshCw, AlertTriangle, Database, Cpu } from "lucide-react";
import { useData } from "../../context/DataContext";

export default function AdminHotspots() {
  const {
    hotspotCandidates,
    hotspots,
    promoteHotspotCandidate,
    toggleHotspotActive,
    mlStatus,
    mlStatusLoading,
    fetchMLStatus,
    triggerTraining,
    backendCandidates,
    backendCandidatesLoading,
    fetchBackendCandidates,
    exportDataset,
    deployModel
  } = useData();

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [designationReason, setDesignationReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedCandidateId, setExpandedCandidateId] = useState(null);

  // Training trigger state
  const [trainingNotes, setTrainingNotes] = useState("");
  const [trainingResult, setTrainingResult] = useState(null);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [allowSyntheticOnly, setAllowSyntheticOnly] = useState(false);
  const [showTrainingPanel, setShowTrainingPanel] = useState(false);
  const [showBackendCandidates, setShowBackendCandidates] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [deployResult, setDeployResult] = useState(null);
  const [deployLoading, setDeployLoading] = useState(false);
  const [deployVersion, setDeployVersion] = useState("");
  const [selectedBackendCandidate, setSelectedBackendCandidate] = useState(null);

  // Fetch live ML status on mount
  useEffect(() => {
    fetchMLStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePromote(candidate) {
    promoteHotspotCandidate(candidate, {
      reason: designationReason || `Designated by SHEQ admin review based on ${candidate.reportCount} reports and ${candidate.totalConfirmations} confirmations.`,
      adminNotes: adminNotes || "Official SHEQ Hotspot verified."
    });
    setSelectedCandidate(null);
    setDesignationReason("");
    setAdminNotes("");
    setSuccessMessage(`"${candidate.place}" successfully designated as SHEQ Hotspot.`);
    setTimeout(() => setSuccessMessage(""), 3000);
  }

  async function handleTriggerTraining() {
    setTrainingLoading(true);
    setTrainingResult(null);
    try {
      const result = await triggerTraining({ allowSyntheticOnly, notes: trainingNotes });
      setTrainingResult(result);
    } catch (err) {
      setTrainingResult({ error: err.message || "Training request failed." });
    } finally {
      setTrainingLoading(false);
    }
  }

  
  async function handleExportDataset() {
    setExportLoading(true);
    setExportResult(null);
    try {
      const result = await exportDataset();
      setExportResult(result);
    } catch (err) {
      setExportResult({ error: err.message || "Export failed." });
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDeployModel() {
    if (!deployVersion.trim()) {
      setDeployResult({ error: "Please enter a model version tag to deploy." });
      return;
    }
    setDeployLoading(true);
    setDeployResult(null);
    try {
      const result = await deployModel({ modelVersion: deployVersion.trim() });
      setDeployResult(result);
    } catch (err) {
      setDeployResult({ error: err.message || "Deployment failed." });
    } finally {
      setDeployLoading(false);
    }
  }

  async function handlePromoteBackendCandidate(candidate) {
    const normalised = {
      place: candidate.label || "Hotspot Candidate",
      city: "Mumbai",
      lat: candidate.center?.coordinates?.[1],
      lng: candidate.center?.coordinates?.[0],
      reportCount: candidate.factors?.reportCount || 1,
      totalConfirmations: candidate.factors?.confirmations || 0,
      provisionalScore: candidate.score,
      score: candidate.score,
      factors: candidate.factors || {},
      reports: [],
      center: candidate.center,
      scoringMethod: candidate.scoringMethod,
      rawMlProbability: candidate.rawMlProbability,
      modelVersion: candidate.modelVersion
    };
    promoteHotspotCandidate(normalised, {
      reason: candidate.rationale || ("Backend ML candidate - score " + candidate.score + ". Model: " + (candidate.modelVersion || "unknown") + "."),
      adminNotes: "ML Score: " + candidate.score + " | Method: " + (candidate.scoringMethod || "modular") + " | RF Prob: " + (candidate.rawMlProbability ?? "n/a")
    });
    setSelectedBackendCandidate(null);
    setSuccessMessage('"' + normalised.place + '" designated as SHEQ Hotspot from backend ML candidates.');
    setTimeout(() => setSuccessMessage(""), 3500);
  }

  // Use live metrics if available, fall back to static benchmark
  const liveMetrics = mlStatus?.benchmarkMetrics || mlStatus?.deployedMetrics;
  const datasetStats = mlStatus?.dataset;
  const modelVersion = mlStatus?.loadedModelVersion || mlStatus?.deployedModelVersion || "rf-v1.0-synthetic-demo";
  const modelLoadStatus = mlStatus?.modelLoadStatus || "unknown";

  return (
    <div className="admin-hotspots-page">
      {/* Notice Banner */}
      <div className="provisional-scoring-banner">
        <Info size={20} className="text-berry" />
        <div>
          <strong>Modular Multi-Signal Hotspot Scoring & ML Pipeline</strong>
          <p>
            The candidate list below surfaces potential hotspot areas using a trained Random Forest model
            combined with community evidence signals (report volume, recency, confirmations, night-time concentration).
            Scores are provisional signals for administrative review, not scientifically validated risk probabilities.
          </p>
        </div>
      </div>

      {/* Live ML System Status Card */}
      <div className="detail-card" style={{ marginTop: "16px", background: "#fcf8f9", border: "1px solid rgba(108, 47, 65, 0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div className="eyebrow" style={{ color: "var(--berry)" }}>ML SYSTEM STATUS</div>
            <h4 style={{ margin: "4px 0" }}>Random Forest Classifier — Live Pipeline Status</h4>
            <p className="card-sub-copy" style={{ margin: "2px 0 10px" }}>
              Model: <code>{modelVersion}</code> &nbsp;·&nbsp;
              Status: <strong style={{ color: modelLoadStatus === "loaded" ? "var(--green, #2d7a3a)" : "var(--berry)" }}>
                {modelLoadStatus === "loaded" ? "✓ Loaded" : modelLoadStatus === "error" ? "⚠ Load Error" : "Checking..."}
              </strong>
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => fetchMLStatus()}
              disabled={mlStatusLoading}
              title="Refresh ML status from backend"
            >
              <RefreshCw size={12} style={{ marginRight: 4 }} />
              {mlStatusLoading ? "Refreshing..." : "Refresh Status"}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => setShowTrainingPanel(prev => !prev)}
              title="Show/hide training trigger panel"
            >
              <Cpu size={12} style={{ marginRight: 4 }} />
              {showTrainingPanel ? "Hide Training" : "Training Controls"}
            </button>
          </div>
        </div>

        {/* Dataset Stats */}
        {datasetStats ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px", marginTop: "10px" }}>
            <div style={{ padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <small style={{ color: "var(--muted)", display: "block" }}><Database size={10} style={{ marginRight: 3 }} />Synthetic Records</small>
              <strong style={{ fontSize: "16px", color: "var(--berry)" }}>{datasetStats.syntheticRecordCount?.toLocaleString() ?? "500"}</strong>
            </div>
            <div style={{ padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <small style={{ color: "var(--muted)", display: "block" }}>Real Reports</small>
              <strong style={{ fontSize: "16px", color: "var(--berry)" }}>{datasetStats.realSubmittedCount?.toLocaleString() ?? "0"}</strong>
            </div>
            <div style={{ padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <small style={{ color: "var(--muted)", display: "block" }}>ML Eligible</small>
              <strong style={{ fontSize: "16px", color: datasetStats.thresholdMet ? "var(--green, #2d7a3a)" : "var(--berry)" }}>
                {datasetStats.eligibleForTrainingCount ?? 0}
              </strong>
            </div>
            <div style={{ padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <small style={{ color: "var(--muted)", display: "block" }}>Pending Review</small>
              <strong style={{ fontSize: "16px", color: "var(--berry)" }}>{datasetStats.pendingVerificationCount ?? 0}</strong>
            </div>
            <div style={{ padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <small style={{ color: "var(--muted)", display: "block" }}>Excluded</small>
              <strong style={{ fontSize: "16px", color: "var(--muted)" }}>{datasetStats.excludedRecordCount ?? 0}</strong>
            </div>
            <div style={{ padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <small style={{ color: "var(--muted)", display: "block" }}>Min. Threshold</small>
              <strong style={{ fontSize: "16px", color: "var(--muted)" }}>{datasetStats.minimumTrainingThreshold ?? 10}</strong>
              <small style={{ display: "block", fontSize: "10px", color: datasetStats.thresholdMet ? "var(--green, #2d7a3a)" : "var(--muted)" }}>
                {datasetStats.thresholdMet ? "✓ Met" : "Not yet met"}
              </small>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "8px" }}>
            {mlStatusLoading ? "Loading dataset stats..." : "Dataset stats unavailable — backend may be offline."}
          </div>
        )}

        {/* Model Evaluation Metrics */}
        <div style={{ marginTop: "12px" }}>
          <div className="eyebrow" style={{ fontSize: "10px", marginBottom: "6px" }}>EVALUATION BENCHMARK: RANDOM FOREST CLASSIFIER (SYNTHETIC DATA)</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "8px" }}>
            <div style={{ padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <small style={{ color: "var(--muted)", display: "block" }}>Accuracy</small>
              <strong style={{ fontSize: "16px", color: "var(--berry)" }}>
                {liveMetrics?.accuracy ? `${(liveMetrics.accuracy * 100).toFixed(2)}%` : "74.00%"}
              </strong>
            </div>
            <div style={{ padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <small style={{ color: "var(--muted)", display: "block" }}>Precision</small>
              <strong style={{ fontSize: "16px", color: "var(--berry)" }}>
                {liveMetrics?.precision ? `${(liveMetrics.precision * 100).toFixed(2)}%` : "63.64%"}
              </strong>
            </div>
            <div style={{ padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <small style={{ color: "var(--muted)", display: "block" }}>Recall</small>
              <strong style={{ fontSize: "16px", color: "var(--berry)" }}>
                {liveMetrics?.recall ? `${(liveMetrics.recall * 100).toFixed(2)}%` : "43.75%"}
              </strong>
            </div>
            <div style={{ padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <small style={{ color: "var(--muted)", display: "block" }}>F1-Score</small>
              <strong style={{ fontSize: "16px", color: "var(--berry)" }}>
                {liveMetrics?.f1_score ? `${(liveMetrics.f1_score * 100).toFixed(2)}%` : liveMetrics?.f1Score ? `${(liveMetrics.f1Score * 100).toFixed(2)}%` : "51.85%"}
              </strong>
            </div>
            <div style={{ padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <small style={{ color: "var(--muted)", display: "block" }}>ROC-AUC</small>
              <strong style={{ fontSize: "16px", color: "var(--berry)" }}>
                {liveMetrics?.roc_auc ? liveMetrics.roc_auc.toFixed(4) : liveMetrics?.rocAuc ? liveMetrics.rocAuc.toFixed(4) : "0.7509"}
              </strong>
            </div>
            <div style={{ padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)" }}>
              <small style={{ color: "var(--muted)", display: "block" }}>5-Fold CV AUC</small>
              <strong style={{ fontSize: "16px", color: "var(--berry)" }}>
                {liveMetrics?.cv_5fold_roc_auc_mean ? liveMetrics.cv_5fold_roc_auc_mean.toFixed(4) : liveMetrics?.cvMeanAuc ? liveMetrics.cvMeanAuc.toFixed(4) : "0.6838"}
              </strong>
            </div>
          </div>
        </div>

        {/* Confusion Matrix (if available from live status) */}
        {liveMetrics?.confusion_matrix && (
          <div style={{ marginTop: "10px", padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "12px" }}>
            <strong>Confusion Matrix (Test Set):</strong>{" "}
            TN: {liveMetrics.confusion_matrix.true_negatives} &nbsp;·&nbsp;
            FP: {liveMetrics.confusion_matrix.false_positives} &nbsp;·&nbsp;
            FN: {liveMetrics.confusion_matrix.false_negatives} &nbsp;·&nbsp;
            TP: {liveMetrics.confusion_matrix.true_positives}
          </div>
        )}

        {/* Training History */}
        {mlStatus?.trainingHistory && mlStatus.trainingHistory.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            <div className="eyebrow" style={{ fontSize: "10px", marginBottom: "4px" }}>RECENT TRAINING RUNS</div>
            <div style={{ fontSize: "11px", color: "var(--muted)" }}>
              {mlStatus.trainingHistory.map((run, idx) => (
                <div key={idx} style={{ display: "flex", gap: "12px", padding: "4px 0", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
                  <span><code>{run.modelVersion}</code></span>
                  <span style={{ color: run.status === "deployed" ? "var(--green, #2d7a3a)" : run.status === "rejected" ? "var(--berry)" : "var(--muted)" }}>
                    {run.status}
                  </span>
                  <span>{run.trainedAt ? new Date(run.trainedAt).toLocaleDateString() : "—"}</span>
                  <span>Synthetic: {run.syntheticRecordCount}</span>
                  <span>Real: {run.realRecordCount}</span>
                  {run.rocAuc && <span>AUC: {run.rocAuc.toFixed(4)}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--muted)", borderTop: "1px solid var(--line)", paddingTop: "8px", lineHeight: "1.5" }}>
          <strong>Top Feature Importances:</strong> Night-time incident (19.6%) · Incident hour (18.6%) · Distance to nearest streetlight (14.3%) · Latitude (12.7%) · Longitude (12.4%) · Distance to police station (9.7%).
          <br />
          <strong>Scientific Limitations & Data Provenance:</strong> The benchmark above is trained on synthetic demo coordinates (<code>SHEQ_dataset2_SYNTHETIC_demo.csv</code>). Official NCRB Table 3B records are municipal aggregate counts without street coordinates. Operational hotspot designation requires human administrator review.
          {mlStatus?.honestLimitations && mlStatus.honestLimitations.length > 0 && (
            <ul style={{ margin: "6px 0 0 0", paddingLeft: "16px" }}>
              {mlStatus.honestLimitations.map((lim, i) => <li key={i}>{lim}</li>)}
            </ul>
          )}
        </div>
      </div>

      {/* Training Controls Panel */}
      {showTrainingPanel && (
        <div className="detail-card" style={{ marginTop: "16px", background: "#fffbf0", border: "1px solid rgba(200, 140, 0, 0.3)" }}>
          <div className="eyebrow" style={{ color: "#7a5a00" }}>TRAINING CONTROLS — ADMIN ONLY</div>
          <h4 style={{ margin: "4px 0 8px" }}>Trigger Model Retraining</h4>
          <p className="card-sub-copy">
            This initiates a training readiness check and records the training run. The actual Python pipeline
            (<code>backend/scripts/dataset_pipeline.py</code>) must be run separately in your terminal.
            The backend will continue using the currently deployed model until a new model is explicitly deployed.
          </p>

          {datasetStats && !datasetStats.thresholdMet && (
            <div style={{ padding: "10px 14px", background: "#fff8e1", borderRadius: "8px", border: "1px solid rgba(200, 140, 0, 0.4)", fontSize: "13px", marginBottom: "12px" }}>
              <AlertTriangle size={14} style={{ marginRight: 6, color: "#7a5a00" }} />
              <strong>Real-data threshold not yet met:</strong> {datasetStats.eligibleForTrainingCount} eligible records out of {datasetStats.minimumTrainingThreshold} required.
              You can enable "Synthetic-only training" to proceed on the current synthetic dataset.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "500px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={allowSyntheticOnly}
                onChange={e => setAllowSyntheticOnly(e.target.checked)}
              />
              Allow synthetic-only training (skip real-data threshold)
            </label>
            <label style={{ fontSize: "13px" }}>
              Admin Notes (optional)
              <input
                type="text"
                placeholder="e.g. Monthly scheduled retraining"
                value={trainingNotes}
                onChange={e => setTrainingNotes(e.target.value)}
                style={{ marginTop: "4px" }}
              />
            </label>
            <button
              type="button"
              className="btn btn-berry"
              onClick={handleTriggerTraining}
              disabled={trainingLoading}
              style={{ alignSelf: "flex-start" }}
            >
              {trainingLoading ? "Checking..." : "Validate & Record Training Run"}
            </button>
          </div>

          {trainingResult && (
            <div style={{ marginTop: "14px", padding: "12px 16px", background: "#fff", borderRadius: "8px", border: `1px solid ${trainingResult.error ? "var(--berry)" : "rgba(45, 122, 58, 0.4)"}`, fontSize: "13px" }}>
              {trainingResult.error ? (
                <><XCircle size={14} style={{ marginRight: 6, color: "var(--berry)" }} /><strong>Error:</strong> {trainingResult.error}</>
              ) : trainingResult.status === "training_not_ready" ? (
                <>
                  <AlertTriangle size={14} style={{ marginRight: 6, color: "#7a5a00" }} />
                  <strong>Not Ready:</strong> {trainingResult.reason}
                  <br />
                  <small>{trainingResult.suggestion}</small>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} style={{ marginRight: 6, color: "var(--green, #2d7a3a)" }} />
                  <strong>Training Run Recorded</strong> — Version: <code>{trainingResult.modelVersion}</code>
                  <br />
                  <small>{trainingResult.instruction}</small>
                  <br />
                  <small style={{ color: "var(--muted)", fontStyle: "italic" }}>{trainingResult.disclaimer}</small>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {successMessage && (
        <div className="alert-banner-success" style={{ margin: "16px 0" }}>
          <CheckCircle2 size={16} /> {successMessage}
        </div>
      )}

      {/* Export Dataset & Deploy Model Panel */}
      {showTrainingPanel && (
        <div className="detail-card" style={{ marginTop: "16px", background: "#f0f8f0", border: "1px solid rgba(45, 122, 58, 0.3)" }}>
          <div className="eyebrow" style={{ color: "#2d7a3a" }}>DATASET EXPORT &amp; MODEL DEPLOYMENT</div>
          <h4 style={{ margin: "4px 0 8px" }}>Step 1: Export Eligible Reports to CSV</h4>
          <p className="card-sub-copy">
            Exports all ML-eligible real community reports (no PII) to{" "}
            <code>datasets/geospatial-crime-data/SHEQ_real_reports_export.csv</code>.
            Then run <code>python backend/scripts/dataset_pipeline.py --include-real</code> to retrain.
          </p>
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={handleExportDataset}
            disabled={exportLoading}
            style={{ marginBottom: "8px" }}
          >
            <Database size={12} style={{ marginRight: 4 }} />
            {exportLoading ? "Exporting..." : "Export Eligible Reports to CSV"}
          </button>
          {exportResult && (
            <div style={{ padding: "10px 14px", background: "#fff", borderRadius: "8px", border: `1px solid ${exportResult.error ? "var(--berry)" : "rgba(45, 122, 58, 0.4)"}`, fontSize: "13px", marginTop: "6px" }}>
              {exportResult.error ? (
                <><XCircle size={14} style={{ marginRight: 6, color: "var(--berry)" }} /><strong>Error:</strong> {exportResult.error}</>
              ) : (
                <>
                  <CheckCircle2 size={14} style={{ marginRight: 6, color: "var(--green, #2d7a3a)" }} />
                  <strong>Exported {exportResult.recordCount} records.</strong>
                  <br />
                  <small style={{ color: "var(--muted)" }}>{exportResult.disclaimer}</small>
                  <br />
                  <small><strong>Next:</strong> {exportResult.nextStep}</small>
                </>
              )}
            </div>
          )}

          <h4 style={{ margin: "16px 0 8px" }}>Step 2: Deploy a Trained Model Version</h4>
          <p className="card-sub-copy">
            After the Python pipeline completes and writes <code>backend/docs/training_result.json</code>,
            enter the model version tag below to validate and deploy it.
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end", maxWidth: "520px" }}>
            <label style={{ fontSize: "13px", flex: 1 }}>
              Model Version Tag
              <input
                type="text"
                placeholder="e.g. rf-v20261101-real-admin"
                value={deployVersion}
                onChange={e => setDeployVersion(e.target.value)}
                style={{ marginTop: "4px", width: "100%" }}
              />
            </label>
            <button
              type="button"
              className="btn btn-berry btn-xs"
              onClick={handleDeployModel}
              disabled={deployLoading || !deployVersion.trim()}
              style={{ alignSelf: "flex-end", marginBottom: "2px" }}
            >
              {deployLoading ? "Deploying..." : "Validate & Deploy Model"}
            </button>
          </div>
          {deployResult && (
            <div style={{ padding: "10px 14px", background: "#fff", borderRadius: "8px", border: `1px solid ${deployResult.error ? "var(--berry)" : deployResult.status === "rejected" ? "rgba(200, 140, 0, 0.5)" : "rgba(45, 122, 58, 0.4)"}`, fontSize: "13px", marginTop: "8px" }}>
              {deployResult.error ? (
                <><XCircle size={14} style={{ marginRight: 6, color: "var(--berry)" }} /><strong>Error:</strong> {deployResult.error}</>
              ) : deployResult.status === "rejected" ? (
                <><AlertTriangle size={14} style={{ marginRight: 6, color: "#7a5a00" }} /><strong>Rejected:</strong> {deployResult.reason}</>
              ) : (
                <>
                  <CheckCircle2 size={14} style={{ marginRight: 6, color: "var(--green, #2d7a3a)" }} />
                  <strong>Deployed:</strong> <code>{deployResult.modelVersion}</code>
                  <br />
                  <small style={{ color: "var(--muted)" }}>{deployResult.message}</small>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Backend ML Candidates Section */}
      <div className="detail-card" style={{ marginTop: "20px", background: "#f8f9ff", border: "1px solid rgba(60, 80, 180, 0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div className="eyebrow" style={{ color: "#3c50b4" }}>BACKEND ML-SCORED CANDIDATES</div>
            <h3 style={{ margin: "4px 0 2px" }}>Candidates from MongoDB + Random Forest ({backendCandidates.length})</h3>
            <p className="card-sub-copy">
              Computed server-side using real MongoDB report clusters scored by the Random Forest model.
              Uses actual geographic clustering and ML inference, not frontend-only scoring.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={fetchBackendCandidates}
            disabled={backendCandidatesLoading}
            title="Load backend ML candidates from MongoDB"
          >
            <RefreshCw size={12} style={{ marginRight: 4 }} />
            {backendCandidatesLoading ? "Loading..." : backendCandidates.length > 0 ? "Refresh Candidates" : "Load Backend ML Candidates"}
          </button>
        </div>

        {backendCandidates.length === 0 && !backendCandidatesLoading && (
          <div style={{ marginTop: "12px", padding: "16px", background: "#fff", borderRadius: "8px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
            <Cpu size={20} style={{ marginBottom: 8, opacity: 0.4 }} />
            <div>Click <strong>Load Backend ML Candidates</strong> to fetch ML-scored candidates from the server.</div>
            <div style={{ marginTop: "4px", fontSize: "12px" }}>Requires active MongoDB reports with valid coordinates.</div>
          </div>
        )}

        {backendCandidates.length > 0 && (
          <div className="admin-table-wrapper" style={{ marginTop: "16px" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cluster Label</th>
                  <th>Coordinates</th>
                  <th>ML Score</th>
                  <th>RF Probability</th>
                  <th>Scoring Method</th>
                  <th>Reports</th>
                  <th>Model Version</th>
                  <th>Admin Action</th>
                </tr>
              </thead>
              <tbody>
                {backendCandidates.map((c, idx) => {
                  const lat = c.center?.coordinates?.[1];
                  const lng = c.center?.coordinates?.[0];
                  const alreadyDesignated = hotspots.some(h => String(h.id) === String(c._id));
                  return (
                    <tr key={c._id || idx}>
                      <td>
                        <strong>{c.label || ("Cluster " + (idx + 1))}</strong>
                        {c.rationale && (
                          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px", maxWidth: "220px" }}>{c.rationale}</div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", fontFamily: "monospace" }}>
                          {lat != null ? lat.toFixed(5) : "?"}, {lng != null ? lng.toFixed(5) : "?"}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: "16px", color: "var(--berry)" }}>{c.score}</strong>
                        <span style={{ fontSize: "11px", color: "var(--muted)" }}> / 100</span>
                      </td>
                      <td>
                        {c.rawMlProbability != null ? (c.rawMlProbability * 100).toFixed(1) + "%" : "n/a"}
                      </td>
                      <td>
                        <span className="badge badge-status-submitted" style={{ fontSize: "11px" }}>
                          {c.scoringMethod || "modular"}
                        </span>
                      </td>
                      <td>{c.factors?.reportCount ?? "?"}</td>
                      <td>
                        <code style={{ fontSize: "10px" }}>{c.modelVersion || "rf-v1.0-synthetic-demo"}</code>
                      </td>
                      <td>
                        {alreadyDesignated ? (
                          <span className="text-muted-sm">Already Designated</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-berry btn-xs"
                            onClick={() => handlePromoteBackendCandidate(c)}
                          >
                            <Flame size={12} /> Designate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

            {/* Section 1: Hotspot Candidates (Awaiting Review) */}
      <div className="detail-card" style={{ marginTop: "20px" }}>
        <div className="eyebrow">STEP 1: HOTSPOT CANDIDATES</div>
        <h3>Provisional Candidates Flagged for Admin Review</h3>
        <p className="card-sub-copy">
          The candidate workflow enforces: <code>Hotspot Candidate → Admin Review → SHEQ Hotspot</code>.
          Candidates are provisional signals and will not appear on the community Safety Map until formally designated by an administrator.
        </p>

        <div className="admin-table-wrapper" style={{ marginTop: "16px" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Location / Cluster</th>
                <th>Report Volume</th>
                <th>Community Confirmations</th>
                <th>Contributing Signals</th>
                <th>Provisional Score</th>
                <th>Review Status</th>
                <th>Admin Action</th>
              </tr>
            </thead>
            <tbody>
              {hotspotCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px" }}>
                    No areas currently meet the candidate activity threshold.
                  </td>
                </tr>
              ) : (
                hotspotCandidates.map(c => {
                  const alreadyHotspot = hotspots.some(h => h.place === c.place && h.active);
                  const isExpanded = expandedCandidateId === c.id;

                  return (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.place}</strong>
                        <small style={{ display: "block", color: "var(--muted)" }}>{c.city}</small>
                        <button
                          type="button"
                          className="text-btn-accent"
                          style={{ fontSize: "11px", marginTop: "2px", display: "inline-flex", alignItems: "center", gap: "2px" }}
                          onClick={() => setExpandedCandidateId(isExpanded ? null : c.id)}
                        >
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {isExpanded ? "Hide ML & Signals" : "View ML & Signal Breakdown"}
                        </button>

                        {isExpanded && (
                          <div style={{ margin: "8px 0", padding: "10px", background: "#f8f9fa", borderRadius: "8px", fontSize: "11px", border: "1px solid var(--line)", lineHeight: 1.5 }}>
                            {/* ML Model Engine Details */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "4px" }}>
                              <span className="badge badge-category" style={{ fontSize: "10px" }}>
                                {c.isFallback ? "Heuristic Fallback" : (c.algorithmVersion || "ml-random-forest-v1")}
                              </span>
                              {c.rawMlProbability != null && (
                                <strong style={{ color: "var(--berry)" }}>
                                  {(c.rawMlProbability * 100).toFixed(1)}% ML Priority Probability
                                </strong>
                              )}
                            </div>

                            {/* Score Breakdown (ML vs Evidence) — fixed field names */}
                            <div style={{ padding: "6px 8px", background: "#fff", borderRadius: "6px", border: "1px solid var(--line)", marginBottom: "6px" }}>
                              <div><strong>Score Formula:</strong> ML Points ({c.mlScoreContribution ?? 0}/50) + Evidence Points ({c.evidenceScoreContribution ?? 0}/50) = <strong>{c.provisionalScore || c.score}/100</strong></div>
                              {c.featuresUsed && (
                                <div style={{ color: "var(--muted)", marginTop: "2px", fontSize: "10px" }}>
                                  {/* Fixed: use correct field names from mlHotspotInference.js buildFeatureVector */}
                                  Infrastructure Haversine Proximities: Police Station ~{Math.round((c.featuresUsed.distNearestPoliceKm ?? 0) * 1000)}m · Streetlight ~{Math.round((c.featuresUsed.distNearestStreetlightKm ?? 0) * 1000)}m
                                </div>
                              )}
                            </div>

                            <div><strong>Severity Index:</strong> {c.factors?.severityIndex || "1.0"}x</div>
                            <div><strong>Night Concentration:</strong> {c.factors?.nightIncidentRatio || "0%"}</div>
                            <div><strong>Recent Activity:</strong> {c.factors?.recentReportCount || c.recentCount || 0} reports in last 7 days</div>
                            <div><strong>Category Mix:</strong> {c.factors?.categoryMix || 1} distinct categories (Top: {c.factors?.topCategory || "General"})</div>

                            <div style={{ color: "var(--ink)", marginTop: "6px", fontStyle: "italic", fontSize: "11px" }}>
                              {c.rationale}
                            </div>
                            <div style={{ color: "var(--muted)", marginTop: "4px", fontSize: "10px" }}>
                              <em>{c.disclaimer}</em>
                            </div>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-status-submitted">{c.reportCount} reports</span>
                        {c.recentCount > 0 && (
                          <small style={{ display: "block", color: "var(--berry)", fontSize: "11px", marginTop: "2px" }}>
                            {c.recentCount} recent
                          </small>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-status-verified">{c.totalConfirmations} confirmations</span>
                        {c.totalDisputes > 0 && (
                          <small style={{ display: "block", color: "var(--muted)", fontSize: "11px", marginTop: "2px" }}>
                            {c.totalDisputes} disputes
                          </small>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", display: "block" }}>
                          Night: <strong>{c.factors?.nightIncidentRatio || "Standard"}</strong>
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                          Sev: {c.factors?.severityIndex || "1.0"}x
                        </span>
                      </td>
                      <td>
                        <div className="score-cell">
                          <strong style={{ fontSize: "16px", color: "var(--berry)" }}>{c.provisionalScore}</strong>
                          <span style={{ fontSize: "11px", color: "var(--muted)" }}> / 100</span>
                        </div>
                      </td>
                      <td>
                        {alreadyHotspot ? (
                          <span className="badge badge-signal-attention">Already Designated</span>
                        ) : (
                          <span className="badge badge-status-review">Pending Review</span>
                        )}
                      </td>
                      <td>
                        {alreadyHotspot ? (
                          <span className="text-muted-sm">Designated Active</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-berry btn-xs"
                            onClick={() => setSelectedCandidate(c)}
                          >
                            <Flame size={12} /> Designate Hotspot
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Designated SHEQ Hotspots */}
      <div className="detail-card" style={{ marginTop: "24px" }}>
        <div className="eyebrow">STEP 2: ACTIVE SHEQ HOTSPOTS</div>
        <h3>Officially Designated SHEQ Hotspots ({hotspots.filter(h => h.active).length} active)</h3>
        <p className="card-sub-copy">
          Designated hotspots are displayed on the community Safety Map and highlighted in personalized safety alerts for users with saved places.
        </p>

        <div className="admin-table-wrapper" style={{ marginTop: "16px" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Hotspot Location</th>
                <th>Designated Date</th>
                <th>Reason / Focus</th>
                <th>Supporting Reports</th>
                <th>Active Status</th>
                <th>Toggle Active</th>
              </tr>
            </thead>
            <tbody>
              {hotspots.map(h => (
                <tr key={h.id}>
                  <td>
                    <strong>{h.place}</strong>
                    <small style={{ display: "block", color: "var(--muted)" }}>{h.city}</small>
                  </td>
                  <td>
                    <small>{h.designatedDate}</small>
                  </td>
                  <td>
                    <p style={{ margin: 0, fontSize: "13px" }}>{h.reason}</p>
                    {h.adminNotes && <small style={{ color: "var(--muted)" }}>Note: {h.adminNotes}</small>}
                  </td>
                  <td>
                    <span className="badge badge-status-verified">{h.supportingReportsCount || 1} reports</span>
                  </td>
                  <td>
                    <span className={`badge ${h.active ? "badge-status-verified" : "badge-status-submitted"}`}>
                      {h.active ? "Active Hotspot" : "Deactivated"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => toggleHotspotActive(h.id)}
                    >
                      {h.active ? "Deactivate" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Designation Modal */}
      {selectedCandidate && (
        <div className="modal-backdrop" onClick={() => setSelectedCandidate(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="eyebrow">ADMIN HOTSPOT DESIGNATION</div>
              <h2>Designate "{selectedCandidate.place}" as SHEQ Hotspot</h2>
              <p>
                Based on {selectedCandidate.reportCount} community reports, {selectedCandidate.totalConfirmations} confirmations, and a provisional multi-factor score of <strong>{selectedCandidate.provisionalScore}/100</strong>.
              </p>
            </div>

            <div className="modal-body">
              <label>
                Designation Reason (shown to community)
                <input
                  type="text"
                  placeholder="e.g. Concentrated late-evening concerns & lighting infrastructure defects"
                  value={designationReason}
                  onChange={e => setDesignationReason(e.target.value)}
                />
              </label>

              <label style={{ marginTop: "14px" }}>
                Admin Notes (Internal tracking & liaison)
                <textarea
                  rows="3"
                  placeholder="Internal notes regarding ward notifications, municipal coordination..."
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                />
              </label>
            </div>

            <div className="modal-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSelectedCandidate(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-berry"
                onClick={() => handlePromote(selectedCandidate)}
              >
                Confirm Hotspot Designation →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
