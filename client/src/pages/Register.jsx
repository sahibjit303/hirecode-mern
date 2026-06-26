import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import usePageTitle from "../hooks/usePageTitle.js";

function PasswordStrength({ password }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/]
    .filter((r) => r.test(password)).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#DC2626", "#D97706", "#2563EB", "#16A34A"];
  if (!password) return null;
  return (
    <div className="pw-strength">
      <div className="pw-strength-bars">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="pw-strength-bar" style={{ background: i <= score ? colors[score] : "var(--line)" }} />
        ))}
      </div>
      <span className="pw-strength-label" style={{ color: colors[score] }}>{labels[score]}</span>
    </div>
  );
}

export default function Register() {
  usePageTitle("Create Account");
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) return setError("Password must be at least 8 characters");
    setLoading(true);
    try {
      await register(form);
      showToast("Account created! Welcome to CodeHire 🎉", "success");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark" style={{ marginBottom: 0 }}>HC</div>
          <span>CodeHire</span>
        </div>
        <div className="eyebrow" style={{ marginTop: 24 }}>Get started free</div>
        <h2>Create your account</h2>
        <p className="sub">Set up your CodeHire workspace in seconds</p>

        {error && (
          <div className="error-box error-box-icon">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Full name *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Ada Lovelace" autoFocus required />
          </div>
          <div className="field">
            <label>Work email *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@startup.com" required />
          </div>
          <div className="field">
            <label>Company name</label>
            <input name="company" value={form.company} onChange={handleChange} placeholder="Acme Inc." />
          </div>
          <div className="field">
            <label>Password *</label>
            <div className="input-pw-wrap">
              <input
                name="password" type={showPw ? "text" : "password"}
                value={form.password} onChange={handleChange}
                placeholder="Min. 8 characters" required
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)} tabIndex={-1}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
            <PasswordStrength password={form.password} />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <><span className="btn-spinner" /> Creating account…</> : "Create Account →"}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <div className="auth-foot">
          Already have an account? <Link to="/login">Log in →</Link>
        </div>
      </div>
    </div>
  );
}
