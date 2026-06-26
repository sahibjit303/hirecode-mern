import { useState } from "react";
import api from "../api/axios.js";
import usePageTitle from "../hooks/usePageTitle.js";

export default function Apply() {
  usePageTitle("Apply for Early Access");
  const [form, setForm] = useState({
    founderName: "", email: "", company: "", ycBatch: "", teamSize: "", stack: "", message: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/applications", { ...form, teamSize: Number(form.teamSize) || 1 });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-wrap">
        <div className="auth-card apply-success">
          <div className="apply-success-icon">🎉</div>
          <div className="eyebrow">Application received</div>
          <h2>You're on the list!</h2>
          <p className="apply-success-text">
            We'll review your application and reach out within a few days. We're onboarding YC startups in batches of 10.
          </p>
          <div className="apply-next-steps">
            // what happens next<br />
            01. We review your application<br />
            02. Founder call (30 min)<br />
            03. Custom onboarding for your stack<br />
            04. First assessment live in 24h
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap apply-wrap">
      <div className="apply-container">
        <div className="apply-header">
          <div className="eyebrow">Private Beta</div>
          <h2 className="apply-title">
            Apply for Early Access
          </h2>
          <p className="apply-subtitle">
            We're opening CodeHire to 50 YC-backed startups. Tell us about your team and we'll be in touch within 48 hours.
          </p>
        </div>

        <div className="apply-form-card">
          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="apply-grid">
              <div className="field">
                <label>Founder name *</label>
                <input name="founderName" value={form.founderName} onChange={handleChange} placeholder="Your name" required />
              </div>
              <div className="field">
                <label>Work email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@startup.com" required />
              </div>
              <div className="field">
                <label>Company *</label>
                <input name="company" value={form.company} onChange={handleChange} placeholder="Acme Inc." required />
              </div>
              <div className="field">
                <label>YC Batch</label>
                <input name="ycBatch" value={form.ycBatch} onChange={handleChange} placeholder="e.g. W25, S25" />
              </div>
              <div className="field">
                <label>Engineering team size</label>
                <input name="teamSize" type="number" value={form.teamSize} onChange={handleChange} placeholder="e.g. 8" min={1} />
              </div>
              <div className="field">
                <label>Primary tech stack</label>
                <input name="stack" value={form.stack} onChange={handleChange} placeholder="e.g. Go, React, Postgres" />
              </div>
            </div>
            <div className="field">
              <label>What's your biggest hiring pain point?</label>
              <textarea name="message" value={form.message} onChange={handleChange} placeholder="Tell us what's broken about your current hiring process…" rows={4} />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? "Submitting…" : "Submit Application →"}
            </button>
            <p className="apply-disclaimer">
              // No spam. We'll only reach out about your application.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
