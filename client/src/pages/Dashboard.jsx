import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import api from "../api/axios.js";
import KanbanBoard from "../components/KanbanBoard.jsx";

const STAGE_COLORS = {
  screen: "pill-screen",
  assess: "pill-assess",
  interview: "pill-interview",
  offer: "pill-offer",
  hired: "pill-hired",
  rejected: "pill-rejected",
};

const STAGES = ["screen", "assess", "interview", "offer", "hired", "rejected"];

function scoreColor(score) {
  if (score >= 80) return { bg: "#DCFCE7", color: "#16A34A" };
  if (score >= 60) return { bg: "#FEF3C7", color: "#D97706" };
  return { bg: "#FEF2F2", color: "#DC2626" };
}

/* ── Stat Card ──────────────────────────────────── */
function StatCard({ label, value, sub, accent }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value" style={accent ? { color: accent } : {}}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

/* ── Add / Edit Candidate Modal ─────────────────── */
function CandidateModal({ existing, onClose, onSaved }) {
  const isEdit = Boolean(existing);
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    role: existing?.role ?? "",
    email: existing?.email ?? "",
    stack: existing ? (existing.stack || []).join(", ") : "",
    score: existing?.score ?? "",
    stage: existing?.stage ?? "screen",
    tags: existing ? (existing.tags || []).join(", ") : "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const payload = {
      ...form,
      score: Number(form.score),
      stack: form.stack.split(",").map((s) => s.trim()).filter(Boolean),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    try {
      if (isEdit) {
        const res = await api.put(`/candidates/${existing._id}`, payload);
        onSaved(res.data.candidate);
      } else {
        const res = await api.post("/candidates", payload);
        onSaved(res.data.candidate);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save candidate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {isEdit ? "Edit Candidate" : "Add Candidate"}
          </h3>
          <button onClick={onClose} className="icon-close" aria-label="Close modal">✕</button>
        </div>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field"><label>Full Name *</label><input name="name" value={form.name} onChange={handleChange} placeholder="Jane Smith" required /></div>
          <div className="field"><label>Role *</label><input name="role" value={form.role} onChange={handleChange} placeholder="Senior Backend Engineer" required /></div>
          <div className="field"><label>Email</label><input name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane@example.com" /></div>
          <div className="field"><label>Tech Stack</label><input name="stack" value={form.stack} onChange={handleChange} placeholder="Go, Postgres, Kubernetes" /></div>
          <div className="field"><label>Tags</label><input name="tags" value={form.tags} onChange={handleChange} placeholder="Urgent, Referral, Senior" /></div>
          <div className="modal-grid-2">
            <div className="field"><label>Score (0–100)</label><input name="score" type="number" value={form.score} onChange={handleChange} min={0} max={100} placeholder="85" /></div>
            <div className="field">
              <label>Stage</label>
              <select name="stage" value={form.stage} onChange={handleChange}>
                {STAGES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Candidate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Delete Confirmation ─────────────────────────── */
function DeleteConfirm({ name, count, onConfirm, onCancel, loading }) {
  const isBulk = count > 0;
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card modal-card-sm" onClick={(e) => e.stopPropagation()}>
        <div className="delete-icon">🗑️</div>
        <h3 className="modal-title" style={{ textAlign: "center" }}>
          {isBulk ? `Remove ${count} Candidates?` : "Remove Candidate?"}
        </h3>
        <p className="delete-text">
          {isBulk
            ? `${count} candidates will be permanently removed from your pipeline.`
            : <><strong>{name}</strong> will be permanently removed from your pipeline.</>
          }
        </p>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Pipeline Funnel Chart ───────────────────────── */
function FunnelChart({ candidates }) {
  const counts = STAGES.reduce((acc, s) => {
    acc[s] = candidates.filter((c) => c.stage === s).length;
    return acc;
  }, {});
  const max = Math.max(...Object.values(counts), 1);
  const labels = { screen: "Screen", assess: "Assess", interview: "Interview", offer: "Offer", hired: "Hired", rejected: "Rejected" };
  const colors = { screen: "var(--sage)", assess: "#2563EB", interview: "#D97706", offer: "var(--rust)", hired: "#16A34A", rejected: "#DC2626" };

  return (
    <div className="funnel-chart">
      <div className="funnel-title">Pipeline Funnel</div>
      {STAGES.map((s) => (
        <div key={s} className="funnel-row">
          <div className="funnel-label">{labels[s]}</div>
          <div className="funnel-bar-track">
            <div
              className="funnel-bar-fill"
              style={{ width: `${(counts[s] / max) * 100}%`, background: colors[s] }}
            />
          </div>
          <div className="funnel-count" style={{ color: colors[s] }}>{counts[s]}</div>
        </div>
      ))}
    </div>
  );
}

/* ── CSV Export ──────────────────────────────────── */
function exportCSV(candidates) {
  const headers = ["Name", "Role", "Stack", "Score", "Stage", "Tags"];
  const rows = candidates.map((c) => [
    `"${c.name}"`,
    `"${c.role}"`,
    `"${(c.stack || []).join("; ")}"`,
    c.score ?? "",
    c.stage,
    `"${(c.tags || []).join("; ")}"`,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "CodeHire-candidates.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Bulk Stage Change Modal ────────────────────── */
function BulkStageModal({ count, onConfirm, onCancel }) {
  const [stage, setStage] = useState("screen");
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card modal-card-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title" style={{ textAlign: "center", marginBottom: 16 }}>
          Move {count} Candidates
        </h3>
        <div className="field">
          <label>New Stage</label>
          <select value={stage} onChange={(e) => setStage(e.target.value)}>
            {STAGES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onConfirm(stage)}>Move All</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────── */
export default function Dashboard() {
  usePageTitle("Dashboard");
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "add" | candidate object
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filterStage, setFilterStage] = useState("all");
  const [sortCol, setSortCol] = useState("score");
  const [sortDir, setSortDir] = useState("desc");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("table"); // "table" | "kanban"
  const [selected, setSelected] = useState(new Set());
  const [bulkStageModal, setBulkStageModal] = useState(false);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [scoreMin, setScoreMin] = useState("");
  const [scoreMax, setScoreMax] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    api.get("/candidates")
      .then((res) => setCandidates(res.data.candidates))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (bulkDeleteModal) {
      // Bulk delete
      setDeleteLoading(true);
      try {
        await Promise.all([...selected].map((id) => api.delete(`/candidates/${id}`)));
        setCandidates((prev) => prev.filter((c) => !selected.has(c._id)));
        setSelected(new Set());
        setBulkDeleteModal(false);
      } catch (err) {
        console.error("Bulk delete failed:", err);
      } finally {
        setDeleteLoading(false);
      }
      return;
    }
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/candidates/${deleteTarget._id}`);
      setCandidates((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      showToast(`${deleteTarget.name} removed`, "success");
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove candidate", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaved = (saved, isNew) => {
    setCandidates((prev) => {
      const idx = prev.findIndex((c) => c._id === saved._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    showToast(isNew ? `${saved.name} added to pipeline` : `${saved.name} updated`, "success");
  };

  const handleStageChange = async (id, stage) => {
    try {
      const res = await api.put(`/candidates/${id}`, { stage });
      handleSaved(res.data.candidate);
    } catch (e) { console.error(e); }
  };

  const handleBulkStageChange = async (stage) => {
    try {
      await Promise.all([...selected].map((id) => api.put(`/candidates/${id}`, { stage })));
      setCandidates((prev) =>
        prev.map((c) => (selected.has(c._id) ? { ...c, stage } : c))
      );
      setSelected(new Set());
      setBulkStageModal(false);
    } catch (err) {
      console.error("Bulk stage change failed:", err);
    }
  };

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = candidates
    .filter((c) => filterStage === "all" || c.stage === filterStage)
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.role?.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => {
      if (scoreMin !== "" && (c.score ?? 0) < Number(scoreMin)) return false;
      if (scoreMax !== "" && (c.score ?? 0) > Number(scoreMax)) return false;
      return true;
    })
    .sort((a, b) => {
      let av = a[sortCol] ?? (sortCol === "score" ? 0 : "");
      let bv = b[sortCol] ?? (sortCol === "score" ? 0 : "");
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selected.has(c._id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c._id)));
    }
  };

  const avgScore = candidates.length ? Math.round(candidates.reduce((a, c) => a + (c.score || 0), 0) / candidates.length) : 0;
  const hired = candidates.filter((c) => c.stage === "hired").length;
  const screening = candidates.filter((c) => c.stage === "screen").length;
  const sc = scoreColor(avgScore);

  const SortIcon = ({ col }) => (
    <span className={`sort-icon ${sortCol === col ? "active" : ""}`}>
      {sortCol === col ? (sortDir === "asc" ? "▲" : "▼") : "▼"}
    </span>
  );

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Header */}
        <div className="dash-header">
          <div>
            <div className="eyebrow">Dashboard</div>
            <h1>Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
            <p className="dash-header-sub">
              {user?.company ? `${user.company} · ` : ""}Hiring pipeline overview
            </p>
          </div>
          <div className="dash-header-actions">
            <Link to="/dashboard/analytics" className="btn btn-outline" title="Analytics">
              📊 Analytics
            </Link>
            <button className="btn btn-outline" onClick={() => exportCSV(candidates)} title="Export CSV">
              ↓ Export CSV
            </button>
            <button className="btn btn-primary" onClick={() => setModal("add")}>
              + Add Candidate
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="dash-stats">
          <StatCard label="Total Candidates" value={candidates.length} sub="in pipeline" />
          <StatCard label="Avg. Score" value={avgScore} sub="out of 100" accent={sc.color} />
          <StatCard label="In Screening" value={screening} sub="awaiting review" />
          <StatCard label="Hired" value={hired} sub="all time" accent="#16A34A" />
        </div>

        {/* Funnel Chart */}
        {candidates.length > 0 && view === "table" && <FunnelChart candidates={candidates} />}

        {/* Search + Filter + View Toggle */}
        <div className="dash-controls">
          <input
            className="search-input"
            type="text"
            placeholder="Search by name or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="score-filter">
            <input
              type="number"
              className="score-filter-input"
              placeholder="Min"
              value={scoreMin}
              onChange={(e) => setScoreMin(e.target.value)}
              min={0}
              max={100}
            />
            <span className="score-filter-dash">–</span>
            <input
              type="number"
              className="score-filter-input"
              placeholder="Max"
              value={scoreMax}
              onChange={(e) => setScoreMax(e.target.value)}
              min={0}
              max={100}
            />
          </div>
          <div className="filter-pills">
            {["all", ...STAGES].map((s) => (
              <button key={s} onClick={() => setFilterStage(s)} className={`filter-pill${filterStage === s ? " active" : ""}`}>
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${view === "table" ? "active" : ""}`}
              onClick={() => setView("table")}
              title="Table view"
            >
              ☰
            </button>
            <button
              className={`view-toggle-btn ${view === "kanban" ? "active" : ""}`}
              onClick={() => setView("kanban")}
              title="Board view"
            >
              ▦
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selected.size > 0 && view === "table" && (
          <div className="bulk-bar">
            <span className="bulk-bar-count">{selected.size} selected</span>
            <button className="btn btn-outline" onClick={() => setBulkStageModal(true)}>
              Move Stage
            </button>
            <button className="btn btn-outline" onClick={() => exportCSV(candidates.filter((c) => selected.has(c._id)))}>
              Export Selected
            </button>
            <button className="btn btn-danger" onClick={() => setBulkDeleteModal(true)}>
              Delete Selected
            </button>
            <button className="bulk-bar-clear" onClick={() => setSelected(new Set())}>
              Clear
            </button>
          </div>
        )}

        {/* Kanban View */}
        {view === "kanban" ? (
          loading ? (
            <div className="loading-state">Loading candidates…</div>
          ) : (
            <KanbanBoard
              candidates={filtered}
              onStageChange={handleStageChange}
              onCardClick={(c) => navigate(`/dashboard/candidates/${c._id}`)}
            />
          )
        ) : (
          /* Table View */
          <div className="table-wrap">
            {loading ? (
              <div className="loading-state">Loading candidates…</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <p>{search ? `No results for "${search}"` : filterStage === "all" ? "No candidates yet. Add your first one!" : `No candidates in "${filterStage}" stage.`}</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                        className="bulk-checkbox"
                      />
                    </th>
                    <th className="th-sortable" onClick={() => toggleSort("name")}>Candidate <SortIcon col="name" /></th>
                    <th className="th-sortable" onClick={() => toggleSort("role")}>Role <SortIcon col="role" /></th>
                    <th>Stack</th>
                    <th className="th-sortable" onClick={() => toggleSort("score")}>Score <SortIcon col="score" /></th>
                    <th>Stage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                    .map((c) => {
                    const sc = scoreColor(c.score ?? 0);
                    return (
                      <tr key={c._id} className={`table-row ${selected.has(c._id) ? "table-row-selected" : ""}`}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selected.has(c._id)}
                            onChange={() => toggleSelect(c._id)}
                            className="bulk-checkbox"
                          />
                        </td>
                        <td>
                          <div className="td-candidate">
                            <div className="td-avatar">
                              {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <Link to={`/dashboard/candidates/${c._id}`} className="td-name td-name-link">{c.name}</Link>
                              <div className="td-meta">
                                {(c.tags || []).length > 0 && (
                                  <div className="td-tags">
                                    {c.tags.slice(0, 2).map((t) => (
                                      <span key={t} className="candidate-tag">{t}</span>
                                    ))}
                                  </div>
                                )}
                                {c.interviewDate && (
                                  <span className={`td-interview-badge ${new Date(c.interviewDate) < new Date() ? "past" : ""}`}>
                                    📅 {new Date(c.interviewDate).toLocaleDateString()}
                                  </span>
                                )}
                                {c.resume?.filename && (
                                  <span className="td-resume-badge">📄</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="td-role">{c.role}</td>
                        <td>
                          <div className="td-stack">
                            {(c.stack || []).slice(0, 3).map((s) => (
                              <span key={s} className="stack-tag">{s}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="td-score-wrap">
                            <span className="td-score-badge" style={{ background: sc.bg, color: sc.color }}>
                              {c.score ?? "—"}
                            </span>
                            {c.score != null && (
                              <div className="td-score-bar">
                                <div className="td-score-bar-fill" style={{ width: `${c.score}%`, background: sc.color }} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <select
                            value={c.stage}
                            onChange={(e) => handleStageChange(c._id, e.target.value)}
                            className={`stage-select pill ${STAGE_COLORS[c.stage] || "pill-screen"}`}
                          >
                            {STAGES.map((s) => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div className="td-actions">
                            <button
                              onClick={() => setModal(c)}
                              className="action-btn edit-btn"
                              title="Edit candidate"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => setDeleteTarget(c)}
                              className="action-btn delete-btn"
                              title="Remove candidate"
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {filtered.length > ITEMS_PER_PAGE && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  ← Prev
                </button>
                <div className="pagination-pages">
                  {Array.from({ length: Math.ceil(filtered.length / ITEMS_PER_PAGE) }, (_, i) => i + 1)
                    .filter((p) => {
                      const total = Math.ceil(filtered.length / ITEMS_PER_PAGE);
                      if (total <= 7) return true;
                      if (p === 1 || p === total) return true;
                      if (Math.abs(p - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((p, i, arr) => (
                      <span key={p}>
                        {i > 0 && arr[i - 1] !== p - 1 && (
                          <span className="pagination-ellipsis">…</span>
                        )}
                        <button
                          className={`pagination-num ${currentPage === p ? "active" : ""}`}
                          onClick={() => setCurrentPage(p)}
                        >
                          {p}
                        </button>
                      </span>
                    ))}
                </div>
                <button
                  className="pagination-btn"
                  disabled={currentPage === Math.ceil(filtered.length / ITEMS_PER_PAGE)}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {modal && (
        <CandidateModal
          existing={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={(saved) => handleSaved(saved, modal === "add")}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          name={deleteTarget.name}
          count={0}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}

      {bulkDeleteModal && (
        <DeleteConfirm
          name=""
          count={selected.size}
          onConfirm={handleDelete}
          onCancel={() => setBulkDeleteModal(false)}
          loading={deleteLoading}
        />
      )}

      {bulkStageModal && (
        <BulkStageModal
          count={selected.size}
          onConfirm={handleBulkStageChange}
          onCancel={() => setBulkStageModal(false)}
        />
      )}
    </div>
  );
}
