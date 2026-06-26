import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import usePageTitle from "../hooks/usePageTitle.js";
import { useToast } from "../context/ToastContext.jsx";
import api from "../api/axios.js";

function DeleteAssessmentModal({ title, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card modal-card-sm" onClick={(e) => e.stopPropagation()}>
        <div className="delete-icon">🗑️</div>
        <h3 className="modal-title" style={{ textAlign: "center" }}>Delete Assessment?</h3>
        <p className="delete-text">
          "<strong>{title}</strong>" and all its submissions will be permanently deleted.
        </p>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

const diffColors = {
  easy: { bg: "#DCFCE7", color: "#16A34A" },
  medium: { bg: "#FEF3C7", color: "#D97706" },
  hard: { bg: "#FEF2F2", color: "#DC2626" },
};

export default function Assessments() {
  usePageTitle("Assessments");
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", language: "javascript", difficulty: "medium", timeLimit: 45 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/assessments")
      .then((res) => setAssessments(res.data.assessments))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await api.post("/assessments", form);
      navigate(`/dashboard/assessments/${res.data.assessment._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create assessment");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/assessments/${deleteTarget._id}`);
      setAssessments((prev) => prev.filter((a) => a._id !== deleteTarget._id));
      showToast(`"${deleteTarget.title}" deleted`, "success");
      setDeleteTarget(null);
    } catch (err) {
      showToast("Failed to delete assessment", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="assess-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="assess-list-card">
                <div className="skeleton skeleton-title" style={{ marginBottom: 12 }} />
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line short" style={{ marginTop: 8 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dash-header">
          <div>
            <Link to="/dashboard" className="profile-back">← Back to Dashboard</Link>
            <h1 style={{ marginTop: 12 }}>Assessments</h1>
            <div className="dash-header-sub">Create coding challenges and send them to candidates</div>
          </div>
          <div className="dash-header-actions">
            <Link to="/ai-builder" className="btn btn-ai-gen">
              ✨ Generate with AI
            </Link>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Assessment</button>
          </div>
        </div>

        {assessments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No assessments yet</h3>
            <p>Create your first coding challenge to send to candidates</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
              <Link to="/ai-builder" className="btn btn-ai-gen">✨ Generate with AI</Link>
              <button className="btn btn-outline" onClick={() => setShowCreate(true)}>+ Manual Create</button>
            </div>
          </div>
        ) : (
          <div className="assess-grid">
            {assessments.map((a) => (
              <div key={a._id} className="assess-list-card">
                <div className="assess-list-header">
                  <h3 className="assess-list-title">{a.title}</h3>
                  <span className="assess-diff-pill" style={{ background: diffColors[a.difficulty]?.bg, color: diffColors[a.difficulty]?.color }}>
                    {a.difficulty}
                  </span>
                </div>
                {a.description && <p className="assess-list-desc">{a.description}</p>}
                <div className="assess-list-meta">
                  <span>💻 {a.language}</span>
                  <span>⏱ {a.timeLimit}min</span>
                  <span>📝 {a.problems?.length || 0} problems</span>
                  <span>📊 {a.submissionCount || 0} submissions</span>
                  {a.avgScore > 0 && <span>⭐ Avg: {a.avgScore}/100</span>}
                </div>
                <div className="assess-list-actions">
                  <Link to={`/dashboard/assessments/${a._id}`} className="btn btn-outline">Edit / View</Link>
                  <button
                    className="btn btn-outline"
                    style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                    onClick={() => setDeleteTarget(a)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Create Modal */}
        {showCreate && (
          <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">New Assessment</h3>
                <button onClick={() => setShowCreate(false)} className="icon-close">✕</button>
              </div>
              {error && <div className="error-box">{error}</div>}
              <form onSubmit={handleCreate}>
                <div className="field"><label>Title *</label><input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Senior React Assessment" required autoFocus /></div>
                <div className="field"><label>Description</label><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Assessment overview for the candidate…" rows={3} /></div>
                <div className="modal-grid-2">
                  <div className="field">
                    <label>Language</label>
                    <select value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}>
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="typescript">TypeScript</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Difficulty</label>
                    <select value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
                <div className="field"><label>Time Limit (minutes)</label><input type="number" value={form.timeLimit} onChange={(e) => setForm((f) => ({ ...f, timeLimit: Number(e.target.value) }))} min={5} max={180} /></div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Creating…" : "Create & Add Problems"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <DeleteAssessmentModal
            title={deleteTarget.title}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={deleteLoading}
          />
        )}
      </div>
    </div>
  );
}
