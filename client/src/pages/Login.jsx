import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import usePageTitle from "../hooks/usePageTitle.js";

export default function Login() {
  usePageTitle("Log In");
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      showToast("Welcome back! 👋", "success");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
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
        <div className="eyebrow" style={{ marginTop: 24 }}>Welcome back</div>
        <h2>Log in to CodeHire</h2>
        <p className="sub">Access your hiring dashboard</p>

        {error && (
          <div className="error-box error-box-icon">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email address</label>
            <input
              name="email" type="email" value={form.email}
              onChange={handleChange} placeholder="you@startup.com"
              autoFocus required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <div className="input-pw-wrap">
              <input
                name="password" type={showPw ? "text" : "password"}
                value={form.password} onChange={handleChange}
                placeholder="••••••••" required
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)} tabIndex={-1}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <><span className="btn-spinner" /> Logging in…</> : "Log In →"}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <div className="auth-foot">
          Don't have an account? <Link to="/register">Create one →</Link>
        </div>

        <div className="demo-hint">
          <span className="demo-hint-label">// demo account</span><br />
          email: demo@CodeHire.live<br />
          password: demo1234
        </div>
      </div>
    </div>
  );
}
