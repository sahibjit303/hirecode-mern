import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import api from "../api/axios.js";

const TRIGGER_LABELS = {
  assessment_completed: "Assessment Completed",
  score_above: "Score Above Threshold",
  score_below: "Score Below Threshold",
  stage_change: "Stage Changed",
};

const ACTION_LABELS = {
  move_stage: "Move to Stage",
  send_email: "Send Email",
  add_tag: "Add Tag",
};

const STAGES = ["screen", "assess", "interview", "offer", "hired", "rejected"];

function AutomationRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    trigger: "score_above",
    condition: { field: "score", operator: "gt", value: 80 },
    action: { type: "move_stage", params: { stage: "interview" } },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/automations")
      .then((res) => setRules(res.data.rules))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await api.post("/automations", form);
      setRules((prev) => [res.data.rule, ...prev]);
      setShowForm(false);
      setForm({
        name: "",
        trigger: "score_above",
        condition: { field: "score", operator: "gt", value: 80 },
        action: { type: "move_stage", params: { stage: "interview" } },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (rule) => {
    try {
      const res = await api.put(`/automations/${rule._id}`, { enabled: !rule.enabled });
      setRules((prev) => prev.map((r) => (r._id === rule._id ? res.data.rule : r)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this automation rule?")) return;
    try {
      await api.delete(`/automations/${id}`);
      setRules((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="settings-card" style={{ gridColumn: "1 / -1" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h3 className="settings-card-title" style={{ margin: 0 }}>Pipeline Automation</h3>
          <p className="settings-card-desc" style={{ margin: "4px 0 0" }}>
            Automate candidate pipeline actions based on scores and assessments
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Rule</button>
      </div>

      {loading ? (
        <div className="loading-state">Loading rules…</div>
      ) : rules.length === 0 ? (
        <div className="notes-empty" style={{ textAlign: "center", padding: 32 }}>
          No automation rules yet. Create one to automate your pipeline!
        </div>
      ) : (
        <div className="automation-rules-list">
          {rules.map((rule) => (
            <div key={rule._id} className={`automation-rule-card ${rule.enabled ? "" : "disabled"}`}>
              <div className="automation-rule-header">
                <div className="automation-rule-name">{rule.name}</div>
                <div className="automation-rule-actions">
                  <label className="automation-toggle">
                    <input type="checkbox" checked={rule.enabled} onChange={() => toggleEnabled(rule)} />
                    <span className="automation-toggle-slider" />
                  </label>
                  <button className="btn btn-outline" style={{ padding: "4px 10px", fontSize: 11, color: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => handleDelete(rule._id)}>Delete</button>
                </div>
              </div>
              <div className="automation-rule-flow">
                <span className="automation-chip trigger">{TRIGGER_LABELS[rule.trigger] || rule.trigger}</span>
                {rule.condition?.value !== undefined && (
                  <>
                    <span className="automation-arrow">→</span>
                    <span className="automation-chip condition">
                      {rule.condition.field} {rule.condition.operator} {String(rule.condition.value)}
                    </span>
                  </>
                )}
                <span className="automation-arrow">→</span>
                <span className="automation-chip action">
                  {ACTION_LABELS[rule.action?.type] || rule.action?.type}
                  {rule.action?.params?.stage ? `: ${rule.action.params.stage}` : ""}
                  {rule.action?.params?.tag ? `: ${rule.action.params.tag}` : ""}
                </span>
              </div>
              <div className="automation-rule-meta">
                Executed {rule.executionCount || 0} times
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Automation Rule</h3>
              <button onClick={() => setShowForm(false)} className="icon-close">✕</button>
            </div>
            {error && <div className="error-box">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="field"><label>Rule Name</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g., Auto-advance top scorers" required /></div>

              <div className="field">
                <label>Trigger</label>
                <select value={form.trigger} onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}>
                  {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {(form.trigger === "score_above" || form.trigger === "score_below") && (
                <div className="modal-grid-2">
                  <div className="field">
                    <label>Operator</label>
                    <select value={form.condition.operator} onChange={(e) => setForm((f) => ({ ...f, condition: { ...f.condition, operator: e.target.value } }))}>
                      <option value="gt">Greater than</option>
                      <option value="gte">Greater or equal</option>
                      <option value="lt">Less than</option>
                      <option value="lte">Less or equal</option>
                      <option value="eq">Equal to</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Score Value</label>
                    <input type="number" value={form.condition.value} onChange={(e) => setForm((f) => ({ ...f, condition: { ...f.condition, value: Number(e.target.value) } }))} min={0} max={100} />
                  </div>
                </div>
              )}

              <div className="field">
                <label>Action</label>
                <select value={form.action.type} onChange={(e) => setForm((f) => ({ ...f, action: { ...f.action, type: e.target.value, params: {} } }))}>
                  {Object.entries(ACTION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {form.action.type === "move_stage" && (
                <div className="field">
                  <label>Target Stage</label>
                  <select value={form.action.params?.stage || ""} onChange={(e) => setForm((f) => ({ ...f, action: { ...f.action, params: { stage: e.target.value } } }))}>
                    <option value="">Select stage…</option>
                    {STAGES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              )}

              {form.action.type === "add_tag" && (
                <div className="field">
                  <label>Tag Name</label>
                  <input value={form.action.params?.tag || ""} onChange={(e) => setForm((f) => ({ ...f, action: { ...f.action, params: { tag: e.target.value } } }))} placeholder="e.g., top-performer" />
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Creating…" : "Create Rule"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  usePageTitle("Settings");
  const { user, updateUser } = useAuth();

  // Profile form
  const [profile, setProfile] = useState({
    name: user?.name || "",
    company: user?.company || "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // Password form
  const [pw, setPw] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });

  const handleProfileChange = (e) =>
    setProfile((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });
    setProfileLoading(true);
    try {
      const res = await api.put("/auth/profile", profile);
      updateUser(res.data.user);
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePwChange = (e) =>
    setPw((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwMsg({ type: "", text: "" });
    if (pw.newPassword !== pw.confirmPassword) {
      return setPwMsg({ type: "error", text: "New passwords do not match." });
    }
    if (pw.newPassword.length < 8) {
      return setPwMsg({
        type: "error",
        text: "New password must be at least 8 characters.",
      });
    }
    setPwLoading(true);
    try {
      await api.put("/auth/password", {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      setPwMsg({ type: "success", text: "Password changed successfully." });
      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to change password",
      });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="container">
        <div className="settings-header">
          <div className="eyebrow">Settings</div>
          <h1>Account Settings</h1>
          <p className="settings-sub">Manage your profile, security, and pipeline automation</p>
        </div>

        <div className="settings-grid">
          {/* Account Info */}
          <div className="settings-card settings-info-card">
            <div className="settings-info-avatar">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2) || "U"}
            </div>
            <div className="settings-info-details">
              <h3>{user?.name}</h3>
              <p className="settings-info-email">{user?.email}</p>
              <div className="settings-info-meta">
                <span className="settings-info-badge">
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </span>
                {user?.company && (
                  <span className="settings-info-company">{user.company}</span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="settings-card">
            <h3 className="settings-card-title">Profile Information</h3>
            <p className="settings-card-desc">
              Update your name and company details
            </p>

            {profileMsg.text && (
              <div
                className={
                  profileMsg.type === "success" ? "success-box" : "error-box"
                }
              >
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleProfileSubmit}>
              <div className="field">
                <label>Full name</label>
                <input
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="field">
                <label>Company</label>
                <input
                  name="company"
                  value={profile.company}
                  onChange={handleProfileChange}
                  placeholder="Company name"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={profileLoading}
              >
                {profileLoading ? "Saving…" : "Save Changes"}
              </button>
            </form>
          </div>

          {/* Password Form */}
          <div className="settings-card">
            <h3 className="settings-card-title">Change Password</h3>
            <p className="settings-card-desc">
              Update your password to keep your account secure
            </p>

            {pwMsg.text && (
              <div
                className={
                  pwMsg.type === "success" ? "success-box" : "error-box"
                }
              >
                {pwMsg.text}
              </div>
            )}

            <form onSubmit={handlePwSubmit}>
              <div className="field">
                <label>Current password</label>
                <input
                  name="currentPassword"
                  type="password"
                  value={pw.currentPassword}
                  onChange={handlePwChange}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="field">
                <label>New password</label>
                <input
                  name="newPassword"
                  type="password"
                  value={pw.newPassword}
                  onChange={handlePwChange}
                  placeholder="Min. 8 characters"
                  required
                />
              </div>
              <div className="field">
                <label>Confirm new password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={pw.confirmPassword}
                  onChange={handlePwChange}
                  placeholder="Repeat new password"
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={pwLoading}
              >
                {pwLoading ? "Changing…" : "Change Password"}
              </button>
            </form>
          </div>

          {/* Automation Rules */}
          <AutomationRules />
        </div>
      </div>
    </div>
  );
}
