import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import usePageTitle from "../hooks/usePageTitle.js";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function CandidateAssessment() {
  usePageTitle("Assessment");
  const { token } = useParams();

  const [phase, setPhase] = useState("loading"); // loading | welcome | coding | submitted | error
  const [assessment, setAssessment] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [code, setCode] = useState("");
  const [testResults, setTestResults] = useState([]);
  const [runningTests, setRunningTests] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [startedAt, setStartedAt] = useState(null);

  // Anti-cheat state
  const antiCheat = useRef({
    tabSwitches: 0,
    pasteEvents: 0,
    copyEvents: 0,
    idleTime: 0,
    keystrokes: 0,
    startTime: 0,
    lastKeystroke: Date.now(),
  });

  // Load assessment
  useEffect(() => {
    axios
      .get(`${API}/assess/${token}`)
      .then((res) => {
        setAssessment(res.data.assessment);
        setCandidate(res.data.candidate);
        setCode(res.data.assessment.problems?.[0]?.starterCode || "// Write your solution here\n");
        if (res.data.status === "in_progress" && res.data.startedAt) {
          setStartedAt(new Date(res.data.startedAt));
          setPhase("coding");
        } else {
          setPhase("welcome");
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Failed to load assessment";
        const submitted = err.response?.data?.submitted;
        if (submitted) {
          setPhase("submitted");
        } else {
          setError(msg);
          setPhase("error");
        }
      });
  }, [token]);

  // Timer
  useEffect(() => {
    if (phase !== "coding" || !startedAt || !assessment) return;
    const timeLimitMs = assessment.timeLimit * 60 * 1000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - new Date(startedAt).getTime();
      const remaining = Math.max(0, timeLimitMs - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleSubmit(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, startedAt, assessment]);

  // Anti-cheat: tab visibility
  useEffect(() => {
    if (phase !== "coding") return;
    const handleVisibility = () => {
      if (document.hidden) {
        antiCheat.current.tabSwitches += 1;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [phase]);

  // Anti-cheat: paste + copy
  useEffect(() => {
    if (phase !== "coding") return;
    const handlePaste = () => { antiCheat.current.pasteEvents += 1; };
    const handleCopy = () => { antiCheat.current.copyEvents += 1; };
    document.addEventListener("paste", handlePaste);
    document.addEventListener("copy", handleCopy);
    return () => {
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("copy", handleCopy);
    };
  }, [phase]);

  // Anti-cheat: keystrokes + idle
  useEffect(() => {
    if (phase !== "coding") return;
    const handleKey = () => {
      antiCheat.current.keystrokes += 1;
      antiCheat.current.lastKeystroke = Date.now();
    };
    document.addEventListener("keydown", handleKey);

    const idleChecker = setInterval(() => {
      const idleSince = Date.now() - antiCheat.current.lastKeystroke;
      if (idleSince > 30000) {
        antiCheat.current.idleTime += 30;
      }
    }, 30000);

    return () => {
      document.removeEventListener("keydown", handleKey);
      clearInterval(idleChecker);
    };
  }, [phase]);

  const handleStart = async () => {
    try {
      const res = await axios.post(`${API}/assess/${token}/start`);
      setStartedAt(new Date(res.data.startedAt));
      antiCheat.current.startTime = Date.now();
      setPhase("coding");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start");
    }
  };

  const handleRunTests = useCallback(() => {
    if (!assessment?.problems?.[0] || runningTests) return;
    setRunningTests(true);
    setTestResults([]);

    const problem = assessment.problems[0];
    const worker = new Worker(
      new URL("../workers/codeRunner.worker.js", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (e) => {
      setTestResults(e.data.results);
      setRunningTests(false);
      worker.terminate();
    };

    worker.onerror = () => {
      setTestResults([{ passed: false, input: "", expected: "", actual: "", error: "Worker error" }]);
      setRunningTests(false);
      worker.terminate();
    };

    worker.postMessage({ code, testCases: problem.testCases });
  }, [code, assessment, runningTests]);

  const handleSubmit = async (autoSubmit = false) => {
    if (submitting) return;
    if (!autoSubmit && !window.confirm("Are you sure you want to submit? You cannot change your code after submission.")) return;

    setSubmitting(true);
    const elapsed = antiCheat.current.startTime
      ? (Date.now() - antiCheat.current.startTime) / 1000
      : 0;
    const typingSpeed = elapsed > 0
      ? Math.round((antiCheat.current.keystrokes / elapsed) * 60)
      : 0;

    try {
      await axios.post(`${API}/assess/${token}/submit`, {
        code,
        testResults,
        antiCheat: {
          tabSwitches: antiCheat.current.tabSwitches,
          pasteEvents: antiCheat.current.pasteEvents,
          copyEvents: antiCheat.current.copyEvents,
          idleTime: antiCheat.current.idleTime,
          typingSpeed,
        },
      });
      setPhase("submitted");
    } catch (err) {
      setError(err.response?.data?.message || "Submit failed");
      setSubmitting(false);
    }
  };

  const formatTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isLowTime = timeLeft > 0 && timeLeft < 5 * 60 * 1000;

  // ─── Loading ───
  if (phase === "loading") {
    return (
      <div className="assess-page">
        <div className="assess-center">
          <div className="assess-loader">Loading assessment…</div>
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (phase === "error") {
    return (
      <div className="assess-page">
        <div className="assess-center">
          <div className="assess-error-card">
            <div className="assess-error-icon">⚠️</div>
            <h2>Assessment Unavailable</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Already Submitted ───
  if (phase === "submitted") {
    return (
      <div className="assess-page">
        <div className="assess-center">
          <div className="assess-success-card">
            <div className="assess-success-icon">✅</div>
            <h2>Assessment Submitted!</h2>
            <p>Your code has been received and is being evaluated by our AI system. The hiring team will review your results shortly.</p>
            <div className="assess-success-note">You can safely close this tab now.</div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Welcome ───
  if (phase === "welcome") {
    return (
      <div className="assess-page">
        <div className="assess-center">
          <div className="assess-welcome-card">
            <div className="assess-welcome-brand">CodeHire</div>
            <h1 className="assess-welcome-title">{assessment?.title}</h1>
            {assessment?.description && (
              <p className="assess-welcome-desc">{assessment.description}</p>
            )}
            <div className="assess-welcome-meta">
              <div className="assess-meta-item">
                <span className="assess-meta-icon">⏱</span>
                <div>
                  <span className="assess-meta-label">Time Limit</span>
                  <span className="assess-meta-value">{assessment?.timeLimit} minutes</span>
                </div>
              </div>
              <div className="assess-meta-item">
                <span className="assess-meta-icon">💻</span>
                <div>
                  <span className="assess-meta-label">Language</span>
                  <span className="assess-meta-value">{assessment?.language}</span>
                </div>
              </div>
              <div className="assess-meta-item">
                <span className="assess-meta-icon">📊</span>
                <div>
                  <span className="assess-meta-label">Difficulty</span>
                  <span className="assess-meta-value">{assessment?.difficulty}</span>
                </div>
              </div>
              <div className="assess-meta-item">
                <span className="assess-meta-icon">📝</span>
                <div>
                  <span className="assess-meta-label">Problems</span>
                  <span className="assess-meta-value">{assessment?.problems?.length || 0}</span>
                </div>
              </div>
            </div>
            <div className="assess-welcome-rules">
              <h3>Before You Begin</h3>
              <ul>
                <li>The timer starts when you click "Begin Assessment"</li>
                <li>Your code will be evaluated by AI for correctness, quality, and originality</li>
                <li>Tab switching and paste events are monitored</li>
                <li>You can run test cases before submitting</li>
                <li>Your submission is final — you cannot edit after submitting</li>
              </ul>
            </div>
            {candidate?.name && (
              <p className="assess-welcome-candidate">
                Welcome, <strong>{candidate.name}</strong>
              </p>
            )}
            <button className="btn btn-primary btn-lg" onClick={handleStart}>
              Begin Assessment →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Coding Phase ───
  const problem = assessment?.problems?.[0];
  const passedCount = testResults.filter((t) => t.passed === true).length;
  const totalVisible = testResults.filter((t) => t.passed !== null).length;

  return (
    <div className="assess-page assess-coding">
      {/* Top bar */}
      <div className="assess-topbar">
        <div className="assess-topbar-brand">CodeHire</div>
        <div className="assess-topbar-title">{assessment?.title}</div>
        <div className={`assess-topbar-timer ${isLowTime ? "danger" : ""}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
        <div className="assess-topbar-cheat">
          {antiCheat.current.tabSwitches > 0 && (
            <span className="cheat-badge warn">⚠ {antiCheat.current.tabSwitches} tab switch{antiCheat.current.tabSwitches > 1 ? "es" : ""}</span>
          )}
        </div>
        <button
          className="btn btn-primary"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
        >
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </div>

      <div className="assess-layout">
        {/* Problem panel */}
        <div className="assess-problem-panel">
          <div className="assess-problem-header">
            <span className={`assess-diff-badge diff-${assessment?.difficulty}`}>
              {assessment?.difficulty}
            </span>
            <span className="assess-lang-badge">{assessment?.language}</span>
          </div>
          <h2 className="assess-problem-title">{problem?.title}</h2>
          <div className="assess-problem-desc">{problem?.description}</div>

          {/* Test cases */}
          <div className="assess-tests-section">
            <h3 className="assess-section-title">Test Cases</h3>
            {problem?.testCases?.map((tc, i) => (
              <div key={tc._id || i} className="assess-test-case">
                <div className="assess-test-header">
                  <span className="assess-test-label">Test {i + 1}</span>
                  {testResults[i] && testResults[i].passed !== null && (
                    <span className={`assess-test-result ${testResults[i].passed ? "pass" : "fail"}`}>
                      {testResults[i].passed ? "✓ Pass" : "✗ Fail"}
                    </span>
                  )}
                </div>
                <div className="assess-test-io">
                  <div><span className="assess-io-label">Input:</span> <code>{tc.input}</code></div>
                  <div><span className="assess-io-label">Expected:</span> <code>{tc.expectedOutput}</code></div>
                  {testResults[i] && testResults[i].actual && testResults[i].passed !== null && (
                    <div><span className="assess-io-label">Got:</span> <code className={testResults[i].passed ? "good" : "bad"}>{testResults[i].actual}</code></div>
                  )}
                  {testResults[i]?.error && (
                    <div className="assess-test-error">Error: {testResults[i].error}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="assess-test-actions">
            <button
              className="btn btn-outline"
              onClick={handleRunTests}
              disabled={runningTests}
            >
              {runningTests ? "Running…" : `▶ Run Tests`}
            </button>
            {totalVisible > 0 && (
              <span className="assess-test-summary">
                {passedCount}/{totalVisible} passed
              </span>
            )}
          </div>
        </div>

        {/* Editor panel */}
        <div className="assess-editor-panel">
          <div className="assess-editor-bar">
            <span className="assess-editor-dot red" />
            <span className="assess-editor-dot yellow" />
            <span className="assess-editor-dot green" />
            <span className="assess-editor-filename">solution.{assessment?.language === "python" ? "py" : assessment?.language === "typescript" ? "ts" : "js"}</span>
          </div>
          <Editor
            height="calc(100vh - 120px)"
            language={assessment?.language || "javascript"}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || "")}
            options={{
              fontSize: 14,
              fontFamily: "'Space Mono', 'Fira Code', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              wordWrap: "on",
              padding: { top: 16 },
              automaticLayout: true,
              tabSize: 2,
            }}
          />
        </div>
      </div>

      {error && <div className="assess-error-toast">{error}</div>}
    </div>
  );
}
