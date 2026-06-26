import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle.js";
import api from "../api/axios.js";

function MiniRadar({ scores, size = 120 }) {
  const categories = ["correctness", "codeQuality", "efficiency", "originality"];
  const cx = size / 2, cy = size / 2, r = size / 2 - 15;
  const n = categories.length;
  const getPoint = (i, value) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const dist = (value / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };
  const dataPoints = categories.map((c, i) => getPoint(i, scores?.[c] || 0));
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {[25, 50, 75, 100].map((level) => (
        <polygon key={level} points={categories.map((_, i) => { const p = getPoint(i, level); return `${p.x},${p.y}`; }).join(" ")} fill="none" stroke="var(--line)" strokeWidth="0.5" />
      ))}
      <polygon points={polygon} fill="rgba(79,70,229,0.15)" stroke="var(--rust)" strokeWidth="1.5" />
      {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--rust)" />)}
    </svg>
  );
}

export default function Compare() {
  usePageTitle("Compare Candidates");
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/candidates")
      .then((res) => setCandidates(res.data.candidates))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const handleCompare = async () => {
    if (selected.length < 2) return;
    setComparing(true);
    setError("");
    setCompareData(null);
    try {
      const res = await api.post("/compare", { candidateIds: selected });
      setCompareData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "AI comparison failed. Please try again.");
    } finally {
      setComparing(false);
    }
  };

  const scoreColor = (s) => s >= 80 ? "#16A34A" : s >= 60 ? "#D97706" : "#DC2626";

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="compare-selector">
            <div className="compare-selector-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="compare-select-card skeleton-card">
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line short" style={{ marginTop: 6 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <Link to="/dashboard" className="profile-back">← Back to Dashboard</Link>
        <h1 style={{ marginTop: 12 }}>Compare Candidates</h1>
        <p className="dash-header-sub" style={{ marginBottom: 24 }}>
          Select 2–4 candidates to compare side-by-side with AI-powered insights
        </p>

        {/* Candidate selector */}
        <div className="compare-selector">
          {candidates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>No candidates yet. <Link to="/dashboard" className="inline-link">Add candidates →</Link></p>
            </div>
          ) : (
            <div className="compare-selector-grid">
              {candidates.map((c) => (
                <label key={c._id} className={`compare-select-card ${selected.includes(c._id) ? "active" : ""}`}>
                  <input type="checkbox" checked={selected.includes(c._id)} onChange={() => toggleSelect(c._id)} style={{ display: "none" }} />
                  <div className="compare-select-check">{selected.includes(c._id) ? "✓" : ""}</div>
                  <div className="compare-select-info">
                    <span className="compare-select-name">{c.name}</span>
                    <span className="compare-select-role">{c.role}</span>
                  </div>
                  <span className="compare-select-score" style={{ color: scoreColor(c.score) }}>{c.score}</span>
                </label>
              ))}
            </div>
          )}

          <div className="compare-actions">
            <button
              className="btn btn-primary"
              onClick={handleCompare}
              disabled={selected.length < 2 || comparing}
            >
              {comparing ? <><span className="btn-spinner" /> Analyzing with AI…</> : `⚡ Compare ${selected.length} Candidates`}
            </button>
            {selected.length < 2 && candidates.length > 0 && (
              <span className="compare-hint">Select at least 2 candidates</span>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="error-box error-box-icon" style={{ marginTop: 20 }}>
            <span>⚠</span> {error}
          </div>
        )}

        {/* Comparing loading state */}
        {comparing && (
          <div className="compare-loading">
            <div className="compare-loading-spinner" />
            <p>AI is analyzing candidates…</p>
            <span>This takes a few seconds</span>
          </div>
        )}

        {/* Comparison Results */}
        {compareData && !comparing && (
          <div className="compare-results">
            {/* Table */}
            <div className="profile-card" style={{ marginBottom: 20, overflowX: "auto" }}>
              <h3 className="profile-card-title">Comparison Table</h3>
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Attribute</th>
                    {compareData.candidates.map((c) => <th key={c._id}>{c.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Role</td>{compareData.candidates.map((c) => <td key={c._id}>{c.role}</td>)}</tr>
                  <tr>
                    <td>Score</td>
                    {compareData.candidates.map((c) => (
                      <td key={c._id}><span style={{ fontWeight: 700, color: scoreColor(c.score) }}>{c.score}/100</span></td>
                    ))}
                  </tr>
                  <tr>
                    <td>Stage</td>
                    {compareData.candidates.map((c) => (
                      <td key={c._id}><span className={`pill pill-${c.stage}`}>{c.stage}</span></td>
                    ))}
                  </tr>
                  <tr><td>Stack</td>{compareData.candidates.map((c) => <td key={c._id}>{(c.stack || []).join(", ") || "—"}</td>)}</tr>
                  <tr><td>Assessments</td>{compareData.candidates.map((c) => <td key={c._id}>{c.submissions?.length || 0} completed</td>)}</tr>
                </tbody>
              </table>
            </div>

            {/* Assessment Scores */}
            {compareData.candidates.some((c) => c.submissions?.length > 0) && (
              <div className="profile-card" style={{ marginBottom: 20 }}>
                <h3 className="profile-card-title">Assessment Scores</h3>
                <div className="compare-radars">
                  {compareData.candidates.map((c) => {
                    const latestSub = c.submissions?.[0];
                    return (
                      <div key={c._id} className="compare-radar-card">
                        <h4>{c.name}</h4>
                        {latestSub?.aiEvaluation?.overallScore > 0 ? (
                          <>
                            <MiniRadar scores={latestSub.aiEvaluation} />
                            <div className="compare-radar-score" style={{ color: scoreColor(latestSub.aiEvaluation.overallScore) }}>
                              {latestSub.aiEvaluation.overallScore}/100
                            </div>
                          </>
                        ) : (
                          <p className="notes-empty">No assessment data</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Summary */}
            <div className="profile-card">
              <h3 className="profile-card-title">🤖 AI Recommendation</h3>
              <div className="compare-ai-summary">{compareData.aiSummary}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
