import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle.js";
import api from "../api/axios.js";

const STAGES = ["screen", "assess", "interview", "offer", "hired", "rejected"];
const STAGE_LABELS = { screen: "Screen", assess: "Assess", interview: "Interview", offer: "Offer", hired: "Hired", rejected: "Rejected" };
const STAGE_COLORS_HEX = {
  screen: "#059669",
  assess: "#2563EB",
  interview: "#D97706",
  offer: "#4F46E5",
  hired: "#16A34A",
  rejected: "#DC2626",
};

function scoreColor(score) {
  if (score >= 80) return "#16A34A";
  if (score >= 60) return "#D97706";
  return "#DC2626";
}

/* ── Conversion Funnel ─── */
function ConversionFunnel({ candidates }) {
  const counts = STAGES.reduce((acc, s) => {
    acc[s] = candidates.filter((c) => c.stage === s).length;
    return acc;
  }, {});
  // Calculate pipeline flow (cumulative from left)
  const pipeline = STAGES.filter((s) => s !== "rejected");
  const total = candidates.length || 1;

  return (
    <div className="analytics-card">
      <h3 className="analytics-card-title">Pipeline Conversion</h3>
      <div className="conversion-funnel">
        {pipeline.map((stage, i) => {
          const count = counts[stage];
          const cumulative = pipeline.slice(i).reduce((sum, s) => sum + counts[s], 0);
          const pct = Math.round((cumulative / total) * 100);
          return (
            <div key={stage} className="conversion-stage">
              <div className="conversion-bar-container">
                <div
                  className="conversion-bar"
                  style={{
                    height: `${Math.max(pct, 8)}%`,
                    background: STAGE_COLORS_HEX[stage],
                  }}
                />
              </div>
              <div className="conversion-label">{STAGE_LABELS[stage]}</div>
              <div className="conversion-value" style={{ color: STAGE_COLORS_HEX[stage] }}>
                {count}
              </div>
              <div className="conversion-pct">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Score Distribution ─── */
function ScoreDistribution({ candidates }) {
  const ranges = [
    { label: "0–20", min: 0, max: 20 },
    { label: "21–40", min: 21, max: 40 },
    { label: "41–60", min: 41, max: 60 },
    { label: "61–80", min: 61, max: 80 },
    { label: "81–100", min: 81, max: 100 },
  ];
  const counts = ranges.map((r) => ({
    ...r,
    count: candidates.filter((c) => (c.score ?? 0) >= r.min && (c.score ?? 0) <= r.max).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="analytics-card">
      <h3 className="analytics-card-title">Score Distribution</h3>
      <div className="score-dist">
        {counts.map((r) => (
          <div key={r.label} className="score-dist-row">
            <span className="score-dist-label">{r.label}</span>
            <div className="score-dist-bar-track">
              <div
                className="score-dist-bar-fill"
                style={{
                  width: `${(r.count / max) * 100}%`,
                  background: scoreColor(r.min),
                }}
              />
            </div>
            <span className="score-dist-count" style={{ color: scoreColor(r.min) }}>
              {r.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Stage Breakdown (donut-style with CSS) ─── */
function StageBreakdown({ candidates }) {
  const total = candidates.length || 1;
  const counts = STAGES.map((s) => ({
    stage: s,
    count: candidates.filter((c) => c.stage === s).length,
  }));

  return (
    <div className="analytics-card">
      <h3 className="analytics-card-title">Stage Breakdown</h3>
      <div className="stage-breakdown">
        {counts.map(({ stage, count }) => (
          <div key={stage} className="stage-breakdown-row">
            <span
              className="stage-breakdown-dot"
              style={{ background: STAGE_COLORS_HEX[stage] }}
            />
            <span className="stage-breakdown-label">{STAGE_LABELS[stage]}</span>
            <span className="stage-breakdown-bar-track">
              <span
                className="stage-breakdown-bar-fill"
                style={{
                  width: `${(count / total) * 100}%`,
                  background: STAGE_COLORS_HEX[stage],
                }}
              />
            </span>
            <span className="stage-breakdown-count">{count}</span>
            <span className="stage-breakdown-pct">
              {Math.round((count / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Top Stacks ─── */
function TopStacks({ candidates }) {
  const stackMap = {};
  candidates.forEach((c) => {
    (c.stack || []).forEach((s) => {
      stackMap[s] = (stackMap[s] || 0) + 1;
    });
  });
  const sorted = Object.entries(stackMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const max = sorted.length ? sorted[0][1] : 1;

  return (
    <div className="analytics-card">
      <h3 className="analytics-card-title">Top Technologies</h3>
      {sorted.length === 0 ? (
        <p className="analytics-empty">No stack data available</p>
      ) : (
        <div className="top-stacks">
          {sorted.map(([tech, count]) => (
            <div key={tech} className="top-stack-row">
              <span className="top-stack-name">{tech}</span>
              <div className="top-stack-bar-track">
                <div
                  className="top-stack-bar-fill"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
              <span className="top-stack-count">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Stat Card ─── */
function AnalyticsStat({ label, value, accent, sub }) {
  return (
    <div className="analytics-stat">
      <div className="analytics-stat-label">{label}</div>
      <div className="analytics-stat-value" style={accent ? { color: accent } : {}}>
        {value}
      </div>
      {sub && <div className="analytics-stat-sub">{sub}</div>}
    </div>
  );
}

/* ── Main Analytics Page ─── */
export default function Analytics() {
  usePageTitle("Analytics");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/candidates")
      .then((res) => setCandidates(res.data.candidates))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="container">
          <div className="loading-state">Loading analytics…</div>
        </div>
      </div>
    );
  }

  const total = candidates.length;
  const avgScore = total ? Math.round(candidates.reduce((a, c) => a + (c.score || 0), 0) / total) : 0;
  const hired = candidates.filter((c) => c.stage === "hired").length;
  const rejected = candidates.filter((c) => c.stage === "rejected").length;
  const inPipeline = total - hired - rejected;
  const hireRate = total ? Math.round((hired / total) * 100) : 0;

  return (
    <div className="analytics-page">
      <div className="container">
        <div className="analytics-header">
          <div>
            <Link to="/dashboard" className="profile-back">← Back to Dashboard</Link>
            <div className="eyebrow" style={{ marginTop: 16 }}>Analytics</div>
            <h1>Pipeline Analytics</h1>
            <p className="analytics-sub">Data-driven insights into your hiring pipeline</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="analytics-stats-grid">
          <AnalyticsStat label="Total Candidates" value={total} sub="all time" />
          <AnalyticsStat label="Avg. Score" value={avgScore} accent={scoreColor(avgScore)} sub="out of 100" />
          <AnalyticsStat label="In Pipeline" value={inPipeline} accent="#2563EB" sub="active" />
          <AnalyticsStat label="Hire Rate" value={`${hireRate}%`} accent="#16A34A" sub={`${hired} hired`} />
        </div>

        {/* Charts grid */}
        <div className="analytics-grid">
          <ConversionFunnel candidates={candidates} />
          <ScoreDistribution candidates={candidates} />
          <StageBreakdown candidates={candidates} />
          <TopStacks candidates={candidates} />
        </div>
      </div>
    </div>
  );
}
