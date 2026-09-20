import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, MapPin, ShieldCheck, Camera, X, ArrowRight } from "lucide-react";
import { categories, knownLocations } from "../data/mockData";
import { validateReport } from "../utils/validation";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

export default function ReportIncident() {
  const todayDate = new Date().toISOString().split("T")[0];
  const currentTime = new Date().toTimeString().slice(0, 5);

  const { addReport } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    category: "",
    place: "",
    lat: null,
    lng: null,
    city: "Mumbai",
    date: todayDate,
    time: currentTime,
    description: "",
    anonymous: true,
    photoPreview: null
  });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  function handleSelectKnownLocation(e) {
    const selectedPlaceName = e.target.value;
    const found = knownLocations.find(l => l.place === selectedPlaceName);
    if (found) {
      setForm(prev => ({
        ...prev,
        place: found.place,
        lat: found.lat,
        lng: found.lng,
        city: found.city
      }));
      setErrors(prev => ({ ...prev, place: undefined }));
    } else {
      setForm(prev => ({
        ...prev,
        place: "",
        lat: null,
        lng: null
      }));
    }
  }

  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        update("photoPreview", reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleRemovePhoto() {
    update("photoPreview", null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validateReport(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSending(true);
    await new Promise(r => setTimeout(r, 450));

    try {
      addReport({
        ...form,
        authorName: user?.name || "SHEQ Member"
      });
      setSending(false);
      setDone(true);
    } catch (err) {
      setErrors({ form: err.message });
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="container page-container narrow">
        <div className="success-card">
          <div className="success-icon">
            <CheckCircle2 size={36} />
          </div>
          <div className="eyebrow">REPORT RECEIVED</div>
          <h1>Thank you for sharing.</h1>
          <p>
            Your community report has been recorded and added to the review flow. Nearby members can now view, confirm, or
            add context on the Safety Map.
          </p>
          <div className="success-actions">
            <button className="btn btn-berry" onClick={() => navigate("/map")}>
              See it on the Safety Map →
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                setDone(false);
                setForm({
                  category: "",
                  place: "",
                  lat: null,
                  lng: null,
                  city: "Mumbai",
                  date: todayDate,
                  time: currentTime,
                  description: "",
                  anonymous: true,
                  photoPreview: null
                });
              }}
            >
              Submit another report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-container narrow">
      <div className="form-header">
        <div>
          <div className="eyebrow">COMMUNITY REPORT</div>
          <h1>What happened?</h1>
          <p>
            Give enough context for someone else to understand the situation. You can choose to submit anonymously.
          </p>
        </div>
        <div className="privacy-note">
          <ShieldCheck size={20} />
          <span>
            Privacy-first
            <br />
            <small>Public anonymity enabled</small>
          </span>
        </div>
      </div>

      <form className="report-form" onSubmit={handleSubmit} noValidate>
        {/* FIX 11: Clean 2-Column Form Grid */}
        <div className="form-grid-2col">
          {/* Column 1: Category */}
          <div className="form-group">
            <label className="form-label" htmlFor="report-category">
              What kind of concern?
            </label>
            <select
              id="report-category"
              value={form.category}
              onChange={e => update("category", e.target.value)}
              className="form-select-control"
            >
              <option value="">Select a category</option>
              {categories
                .filter(x => x !== "All")
                .map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
            {errors.category && <small className="field-error-text">{errors.category}</small>}
          </div>

          {/* Column 2: Location / Area */}
          <div className="form-group">
            <label className="form-label" htmlFor="report-location">
              Location / Area
            </label>
            <div className="input-with-icon-wrapper">
              <MapPin size={17} className="input-inner-icon" />
              <select
                id="report-location"
                value={form.place}
                onChange={handleSelectKnownLocation}
                className="form-select-control with-icon"
              >
                <option value="">Select recognized location...</option>
                {knownLocations.map(loc => (
                  <option key={loc.place} value={loc.place}>
                    {loc.place} ({loc.city})
                  </option>
                ))}
              </select>
            </div>
            {errors.place && <small className="field-error-text">{errors.place}</small>}
          </div>

          {/* Column 1: Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="report-date">
              Date of Observation
            </label>
            <input
              id="report-date"
              type="date"
              value={form.date}
              onChange={e => update("date", e.target.value)}
              className="form-input-control"
            />
          </div>

          {/* Column 2: Time */}
          <div className="form-group">
            <label className="form-label" htmlFor="report-time">
              Approx. Time
            </label>
            <input
              id="report-time"
              type="time"
              value={form.time}
              onChange={e => update("time", e.target.value)}
              className="form-input-control"
            />
          </div>
        </div>

        {/* Full Width: Description */}
        <div className="full-width-group">
          <label className="form-label" htmlFor="report-description">
            Description & Context
          </label>
          <textarea
            id="report-description"
            rows="5"
            value={form.description}
            onChange={e => update("description", e.target.value)}
            placeholder="What did you notice? What details or landmarks might help someone else navigate safely?"
            className="form-textarea-control"
          />
          {errors.description && <small className="field-error-text">{errors.description}</small>}
        </div>

        {/* Optional Photo Upload Preview (Client File API) */}
        <div className="full-width-group">
          <span className="form-label">Optional Photo Evidence (Client preview only)</span>
          {!form.photoPreview ? (
            <label htmlFor="photo-input" className="photo-dropzone">
              <Camera size={22} className="text-berry" />
              <span>Click to select an image from your device</span>
              <small>Image stays in your browser memory for preview. No external upload.</small>
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: "none" }}
              />
            </label>
          ) : (
            <div className="photo-preview-container">
              <img src={form.photoPreview} alt="Evidence preview" className="photo-preview-img" />
              <button
                type="button"
                className="btn btn-outline btn-sm remove-photo-btn"
                onClick={handleRemovePhoto}
              >
                <X size={14} /> Remove photo
              </button>
            </div>
          )}
        </div>

        {/* Anonymous Reporting Toggle */}
        <div className="anonymous-row">
          <div>
            <strong>Submit anonymously</strong>
            <p>
              Your name will not appear publicly on this report. SHEQ internally associates the report with your
              verified account for authenticity.
            </p>
          </div>
          <label className="switch" htmlFor="report-anonymous">
            <input
              id="report-anonymous"
              type="checkbox"
              role="switch"
              aria-checked={form.anonymous}
              checked={form.anonymous}
              onChange={e => update("anonymous", e.target.checked)}
            />
            <span />
          </label>
        </div>

        {errors.form && <div className="form-error">{errors.form}</div>}

        <button disabled={sending} className="btn btn-berry btn-lg" type="submit">
          {sending ? "Submitting..." : "Submit Community Report"} <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
}
