import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle.js";

const DEMO_PROBLEM = {
  title: "Filter Active Orders",
  difficulty: "Medium",
  timeLimit: "20 min",
  description: `Given a list of orders, return only the orders with status 'active'. 
Each order is an object with at least: { id, status, amount }.
Optimize for readability and correctness.`,
  stub: `def filter_active_orders(orders):
    """
    Args:
        orders: List of order dicts with 'status' key
    Returns:
        List of active orders only
    """
    # Your code here
    pass`,
  testCases: [
    { input: "[{id:1, status:'active'}, {id:2, status:'closed'}]", expected: "[{id:1, status:'active'}]", pass: true },
    { input: "[{id:3, status:'active'}, {id:4, status:'active'}]", expected: "[{id:3,...}, {id:4,...}]", pass: true },
    { input: "[]", expected: "[]", pass: true },
  ],
};

const TYPING_SOLUTION = `def filter_active_orders(orders):
    return [o for o in orders if o['status'] == 'active']`;

function useTypingEffect(text, speed = 40, start = false) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idx = useRef(0);
  const timer = useRef(null);

  useEffect(() => {
    if (!start) return;
    idx.current = 0;
    setDisplayed("");
    setDone(false);
    timer.current = setInterval(() => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(timer.current);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer.current);
  }, [start, text, speed]);

  return { displayed, done };
}

function SyntaxLine({ line }) {
  return (
    <div>
      {line.startsWith("def ") ? (
        <>
          <span className="tok-keyword">def </span>
          <span className="tok-fn">{line.slice(4).split("(")[0]}</span>
          <span className="tok-default">({line.slice(4).split("(")[1]}</span>
        </>
      ) : line.includes("return") ? (
        <>
          <span className="tok-keyword">    return </span>
          <span className="tok-default">{line.replace("    return ", "")}</span>
        </>
      ) : line.includes("'status'") ? (
        <span className="tok-default" style={{ paddingLeft: 8 }}>
          {line.replace("'status'", "").replace("== 'active'", "")
            .replace("if o[", "if o[")}
          <span className="tok-string">'status'</span>
          {"] == "}
          <span className="tok-string">'active'</span>
          {"]"}
        </span>
      ) : (
        <span className="tok-muted" style={{ paddingLeft: line.startsWith("    ") ? 16 : 0 }}>{line.trim()}</span>
      )}
    </div>
  );
}

/* ── Anti-AI Detection Meter ─── */
function DetectionMeter({ typing }) {
  const signals = [
    { label: "Paste events", value: 0, max: 10, good: true },
    { label: "Edit pattern", value: typing ? "Organic ✓" : "Waiting…", isText: true, good: typing },
    { label: "Backspace ratio", value: typing ? "12%" : "—", isText: true, good: typing },
    { label: "Authorship score", value: typing ? "97%" : "—", isText: true, good: typing },
  ];
  return (
    <div className="demo-meter">
      <div className="demo-meter-title">Anti-AI Detection</div>
      {signals.map((s) => (
        <div key={s.label} className="demo-meter-row">
          <span className="demo-meter-label">{s.label}</span>
          <span className={`demo-meter-value ${s.good ? "good" : ""}`}>
            {s.isText ? s.value : s.value === 0 ? "0 flagged ✓" : `${s.value} flagged`}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Score Report ─── */
function ScoreReport({ show }) {
  const scores = [
    { label: "Correctness", score: 95, color: "#16A34A" },
    { label: "Code quality", score: 88, color: "#16A34A" },
    { label: "Originality", score: 97, color: "#16A34A" },
    { label: "Speed", score: 74, color: "#D97706" },
  ];
  const overall = 89;
  return (
    <div className={`demo-report${show ? " visible" : ""}`}>
      <div className="demo-report-head">
        <span className="demo-report-title">AI Score Report</span>
        <span className="demo-report-score">{overall}</span>
      </div>
      {scores.map((s) => (
        <div key={s.label} className="demo-report-row">
          <span className="demo-report-label">{s.label}</span>
          <div className="demo-report-bar-track">
            <div
              className="demo-bar-anim"
              style={{ height: "100%", width: show ? `${s.score}%` : "0%", background: s.color, borderRadius: 3, transition: "width 1s ease" }}
            />
          </div>
          <span className="demo-report-value" style={{ color: s.color }}>{s.score}</span>
        </div>
      ))}
      <div className="demo-recommendation">
        <span className="demo-rec-label">AI Recommendation</span>
        <span className="demo-rec-value">✓ Advance to Interview</span>
      </div>
    </div>
  );
}

/* ── Main Demo Page ─── */
export default function Demo() {
  usePageTitle("Interactive Demo");
  const [step, setStep] = useState(0);
  const [typingStarted, setTypingStarted] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const { displayed, done } = useTypingEffect(TYPING_SOLUTION, 35, typingStarted);

  const startDemo = () => {
    setStep(1);
    setTimeout(() => setTypingStarted(true), 600);
  };

  useEffect(() => {
    if (done) {
      setTimeout(() => setStep(2), 800);
      setTimeout(() => setShowReport(true), 1200);
    }
  }, [done]);

  const codeLines = (typingStarted ? displayed : DEMO_PROBLEM.stub).split("\n");

  return (
    <div className="demo-page">
      <div className="container">
        {/* Header */}
        <div className="demo-header">
          <div className="eyebrow">Interactive Demo</div>
          <h1 className="demo-heading">
            See What a Candidate<br />
            <span className="demo-heading-accent">Actually Experiences</span>
          </h1>
          <p className="demo-intro">
            Watch a real CodeHire assessment in action — unique problem, live anti-AI detection, and an instant AI score report.
          </p>
          {step === 0 && (
            <button className="btn btn-primary btn-lg" onClick={startDemo}>
              ▶ Run Demo Assessment
            </button>
          )}
        </div>

        {step > 0 && (
          <div className="demo-grid">
            {/* Left: Problem + Editor */}
            <div>
              {/* Problem card */}
              <div className="demo-problem-card">
                <div className="demo-problem-head">
                  <span className="demo-badge">{DEMO_PROBLEM.difficulty}</span>
                  <span className="demo-timer">⏱ {DEMO_PROBLEM.timeLimit}</span>
                </div>
                <h3 className="demo-problem-title">{DEMO_PROBLEM.title}</h3>
                <p className="demo-problem-desc">{DEMO_PROBLEM.description}</p>
              </div>

              {/* Code editor */}
              <div className="demo-editor">
                <div className="demo-editor-bar">
                  <div className="demo-dot" style={{ background: "#FF5F57" }} />
                  <div className="demo-dot" style={{ background: "#FFBD2E" }} />
                  <div className="demo-dot" style={{ background: "#28C840" }} />
                  <span className="demo-filename">
                    {typingStarted ? "assessment_4821.py" : "assessment_4821.py — read only"}
                  </span>
                </div>
                <div className="demo-code">
                  {codeLines.map((line, i) => (
                    <div key={i} className="demo-line">
                      <span className="demo-lineno">{i + 1}</span>
                      {typingStarted ? <SyntaxLine line={line} /> : (
                        <span className="tok-muted">{line}</span>
                      )}
                    </div>
                  ))}
                  {step === 1 && !done && (
                    <span className="demo-cursor" />
                  )}
                </div>

                {/* Test cases */}
                {step >= 1 && (
                  <div className="demo-tests">
                    {DEMO_PROBLEM.testCases.map((tc, i) => (
                      <div key={i} className="demo-test-row">
                        <span className={`demo-test-icon${done ? " pass" : ""}`}>{done ? "✓" : "○"}</span>
                        <span className="demo-test-text">
                          Test {i + 1}: {tc.input.slice(0, 30)}…
                        </span>
                        {done && <span className="demo-test-pass">PASS</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Detection + Score */}
            <div>
              <DetectionMeter typing={typingStarted} />
              <ScoreReport show={showReport} />

              {showReport && (
                <div className="demo-cta-box">
                  <div className="eyebrow">Ready to hire like this?</div>
                  <h3 className="demo-cta-heading">
                    This is what every candidate assessment looks like.
                  </h3>
                  <p className="demo-cta-text">
                    Unique problems. Real-time detection. Instant AI reports. Apply now to get CodeHire for your team.
                  </p>
                  <Link to="/apply" className="btn btn-primary btn-block">Apply For Early Access →</Link>
                  <button
                    onClick={() => { setStep(0); setTypingStarted(false); setShowReport(false); }}
                    className="btn btn-outline btn-block demo-replay-btn"
                  >
                    ↺ Replay Demo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
