import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import usePageTitle from "../hooks/usePageTitle.js";
import api from "../api/axios.js";

function RadarChart({ scores }) {
  const categories = [
    { key: "correctness", label: "Correctness" },
    { key: "codeQuality", label: "Quality" },
    { key: "efficiency", label: "Efficiency" },
    { key: "originality", label: "Originality" },
  ];
  const cx = 120, cy = 120, r = 90;
  const n = categories.length;
  const getPoint = (i, value) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const dist = (value / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };
  const dataPoints = categories.map((c, i) => getPoint(i, scores[c.key] || 0));
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <div className="radar-chart">
      <svg viewBox="0 0 240 240" width="240" height="240">
        {[25, 50, 75, 100].map((level) => (
          <polygon key={level}
            points={categories.map((_, i) => { const p = getPoint(i, level); return `${p.x},${p.y}`; }).join(" ")}
            fill="none" stroke="var(--line-strong)" strokeWidth="0.5" />
        ))}
        {categories.map((_, i) => {
          const p = getPoint(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--line)" strokeWidth="0.5" />;
        })}
        <polygon points={polygon} fill="rgba(79,70,229,0.15)" stroke="var(--rust)" strokeWidth="2" />
        {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--rust)" />)}
        {categories.map((c, i) => {
          const p = getPoint(i, 115);
          return (
            <text key={c.key} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
              fontSize="10" fontFamily="'Space Mono', monospace" fill="var(--ink-soft)">
              {c.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function SubmissionReview() {
  usePageTitle("Submission Review");
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef(null);

  const fetchSubmission = async () => {
    try {
      const res = await api.get(`/submissions/${id}`);
      const sub = res.data.submission;
      setSubmission(sub);
      // If still being evaluated, set up polling
      if (sub.status === "submitted") {
        setPolling(true);
      } else {
        setPolling(false);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    api.get(`/submissions/${id}`)
      .then((res) => {
        setSubmission(res.data.submission);
        if (res.data.submission.status === "submitted") {
          setPolling(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Auto-poll every 5s when AI is evaluating
  useEffect(() => {
    if (!polling) return;
    pollRef.current = setInterval(fetchSubmission, 5000);
    return () => clearInterval(pollRef.current);
  }, [polling, id]);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="skeleton-review">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-block" />
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="error-box" style={{ maxWidth: 400, marginTop: 40 }}>
            ⚠ Submission not found or you don't have access to it.
          </div>
          <Link to="/dashboard/assessments" className="btn btn-outline" style={{ marginTop: 16 }}>
            ← Back to Assessments
          </Link>
        </div>
      </div>
    );
  }

  const { aiEvaluation: ai, antiCheat: ac, candidate, assessment } = submission;
  const scoreColor = (s) => s >= 80 ? "#16A34A" : s >= 60 ? "#D97706" : "#DC2626";

  return (
    <div className="dashboard-page">
      <div className="container">
        <Link to={`/dashboard/assessments/${assessment?._id}`} className="profile-back">
          ← Back to Assessment
        </Link>

        <div className="review-header" style={{ marginTop: 12 }}>
          <div>
            <h1>{candidate?.name || "Unknown"}</h1>
            <div className="dash-header-sub">{assessment?.title} · {candidate?.role}</div>
          </div>
          <div className="review-score-big" style={{ color: scoreColor(ai?.overallScore || 0) }}>
            {ai?.overallScore || "—"}<span className="review-score-max">/100</span>
          </div>
        </div>

        <div className="review-grid">
          {/* Left: Code + Test Results + AI Feedback */}
          <div className="review-main">
            <div className="profile-card">
              <h3 className="profile-card-title">Submitted Code</h3>
              <div style={{ border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
                <Editor
                  height="400px"
                  language={assessment?.language || "javascript"}
                  theme="vs-dark"
                  value={submission.code || "// No code submitted"}
                  options={{ readOnly: true, fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, lineNumbers: "on", padding: { top: 12 } }}
                />
              </div>
            </div>

            <div className="profile-card" style={{ marginTop: 16 }}>
              <h3 className="profile-card-title">Test Results</h3>
              {submission.testResults?.length > 0 ? (
                <div className="review-tests">
                  {submission.testResults.map((t, i) => (
                    <div key={i} className={`review-test ${t.passed ? "pass" : "fail"}`}>
                      <span className="review-test-icon">{t.passed ? "✓" : "✗"}</span>
                      <div className="review-test-detail">
                        <div><span className="assess-io-label">Input:</span> <code>{t.input}</code></div>
                        <div><span className="assess-io-label">Expected:</span> <code>{t.expected}</code></div>
                        <div><span className="assess-io-label">Got:</span> <code className={t.passed ? "good" : "bad"}>{t.actual}</code></div>
                        {t.error && <div className="assess-test-error">{t.error}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="notes-empty">No test results recorded</p>
              )}
            </div>

            {ai?.feedback && (
              <div className="profile-card" style={{ marginTop: 16 }}>
                <h3 className="profile-card-title">AI Feedback</h3>
                <div className="review-feedback">{ai.feedback}</div>
              </div>
            )}
          </div>

          {/* Right: AI Scores + Anti-cheat + Timing */}
          <div className="review-sidebar">
            <div className="profile-card">
              <h3 className="profile-card-title">AI Evaluation</h3>
              {polling ? (
                <div className="review-evaluating">
                  <div className="review-eval-spinner" />
                  <p>AI is evaluating this submission…</p>
                  <span className="review-eval-note">This usually takes 10–30 seconds. Page will update automatically.</span>
                </div>
              ) : ai?.overallScore > 0 ? (
                <>
                  <RadarChart scores={ai} />
                  <div className="review-scores">
                    {[
                      { label: "Correctness", key: "correctness" },
                      { label: "Code Quality", key: "codeQuality" },
                      { label: "Efficiency", key: "efficiency" },
                      { label: "Originality", key: "originality" },
                    ].map(({ label, key }) => (
                      <div key={key} className="review-score-row">
                        <span>{label}</span>
                        <span style={{ color: scoreColor(ai[key]) }}>{ai[key]}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="notes-empty">Not yet evaluated</p>
              )}
            </div>

            <div className="profile-card">
              <h3 className="profile-card-title">Anti-Cheat Report</h3>
              <div className="review-cheat-grid">
                {[
                  { num: ac?.tabSwitches || 0, label: "Tab Switches", warn: (ac?.tabSwitches || 0) > 3 },
                  { num: ac?.pasteEvents || 0, label: "Paste Events", warn: (ac?.pasteEvents || 0) > 2 },
                  { num: ac?.copyEvents || 0, label: "Copy Events", warn: false },
                  { num: ac?.typingSpeed || 0, label: "Chars/min", warn: false },
                ].map(({ num, label, warn }) => (
                  <div key={label} className={`review-cheat-item ${warn ? "warn" : "ok"}`}>
                    <span className="review-cheat-num">{num}</span>
                    <span className="review-cheat-label">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="profile-card">
              <h3 className="profile-card-title">Timing</h3>
              <div className="profile-detail-rows">
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Status</span>
                  <span className={`pill ${submission.status === "evaluated" ? "pill-hired" : "pill-assess"}`}>
                    {submission.status}
                  </span>
                </div>
                {submission.startedAt && (
                  <div className="profile-detail-row">
                    <span className="profile-detail-label">Started</span>
                    <span className="profile-detail-value">{new Date(submission.startedAt).toLocaleString()}</span>
                  </div>
                )}
                {submission.submittedAt && (
                  <div className="profile-detail-row">
                    <span className="profile-detail-label">Submitted</span>
                    <span className="profile-detail-value">{new Date(submission.submittedAt).toLocaleString()}</span>
                  </div>
                )}
                {submission.startedAt && submission.submittedAt && (
                  <div className="profile-detail-row">
                    <span className="profile-detail-label">Duration</span>
                    <span className="profile-detail-value">
                      {Math.round((new Date(submission.submittedAt) - new Date(submission.startedAt)) / 60000)} min
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
