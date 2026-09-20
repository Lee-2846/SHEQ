import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, MapPin, ShieldCheck, Camera, X, Info } from "lucide-react";
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
    city: "Pune",
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
              See it on the Safety Map
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
                  city: "Pune",
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

      <form className="report-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* 9 Standardized Categories Dropdown */}
          <label htmlFor="report-category">
            What kind of concern?
            <select
              id="report-category"
              value={form.category}
              onChange={e => update("category", e.target.value)}
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
            {errors.category && <small className="field-error">{errors.category}</small>}
          </label>

          {/* Location / Area selection with verified coordinate assignment */}
          <label htmlFor="report-location">
            Location / Area
            <div className="input-with-icon">
              <MapPin size={17} />
              <select
                id="report-location"
                value={form.place}
                onChange={handleSelectKnownLocation}
                className="location-select-input"
              >
                <option value="">Select recognized location...</option>
                {knownLocations.map(loc => (
                  <option key={loc.place} value={loc.place}>
                    {loc.place} ({loc.city})
                  </option>
                ))}
              </select>
            </div>
            {errors.place && <small className="field-error">{errors.place}</small>}
          </label>

          {/* Standardized Date */}
          <label htmlFor="report-date">
            Date
            <input
              id="report-date"
              type="date"
              value={form.date}
              onChange={e => update("date", e.target.value)}
            />
          </label>

          {/* Standardized Time */}
          <label htmlFor="report-time">
            Approx. time
            <input
              id="report-time"
              type="time"
              value={form.time}
              onChange={e => update("time", e.target.value)}
            />
          </label>
        </div>

        {/* Description */}
        <label htmlFor="report-description">
          Description & Context
          <textarea
            id="report-description"
            rows="5"
            value={form.description}
            onChange={e => update("description", e.target.value)}
            placeholder="What did you notice? What context might help someone else make an informed decision?"
          />
          {errors.description && <small className="field-error">{errors.description}</small>}
        </label>

        {/* Optional Photo Upload Preview (Client File API) */}
        <div className="photo-upload-section">
          <label className="photo-upload-label">
            <span className="field-label-text">Optional Photo Evidence (Client preview only)</span>
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
          </label>
        </div>

        {/* Anonymous Reporting Toggle */}
        <div className="anonymous-row">
          <div>
            <strong>Submit anonymously</strong>
            <p>
              Your name will not appear publicly on this report. SHEQ internally associates the report with your
              verified account for accountability.
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
          {sending ? "Submitting..." : "Submit community report →"}
        </button>
      </form>
    </div>
  );
}
