import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import usePageTitle from "../hooks/usePageTitle.js";
import api from "../api/axios.js";

export default function AssessmentBuilder() {
  usePageTitle("Assessment Builder");
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submissions, setSubmissions] = useState([]);

  // Send to candidate
  const [candidates, setCandidates] = useState([]);
  const [showSend, setShowSend] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/assessments/${id}`),
      api.get("/candidates"),
    ])
      .then(([assessRes, candRes]) => {
        setAssessment(assessRes.data.assessment);
        setSubmissions(assessRes.data.submissions || []);
        setCandidates(candRes.data.candidates);
      })
      .catch((err) => {
        setError("Assessment not found");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const updateField = (field, value) => {
    setAssessment((prev) => ({ ...prev, [field]: value }));
  };

  const updateProblem = (idx, field, value) => {
    setAssessment((prev) => {
      const problems = [...prev.problems];
      problems[idx] = { ...problems[idx], [field]: value };
      return { ...prev, problems };
    });
  };

  const addProblem = () => {
    setAssessment((prev) => ({
      ...prev,
      problems: [
        ...prev.problems,
        {
          title: `Problem ${prev.problems.length + 1}`,
          description: "Describe the problem here…",
          starterCode: "// Write your solution here\n",
          testCases: [{ input: "", expectedOutput: "", isHidden: false }],
        },
      ],
    }));
  };

  const removeProblem = (idx) => {
    setAssessment((prev) => ({
      ...prev,
      problems: prev.problems.filter((_, i) => i !== idx),
    }));
  };

  const addTestCase = (problemIdx) => {
    setAssessment((prev) => {
      const problems = [...prev.problems];
      problems[problemIdx] = {
        ...problems[problemIdx],
        testCases: [
          ...problems[problemIdx].testCases,
          { input: "", expectedOutput: "", isHidden: false },
        ],
      };
      return { ...prev, problems };
    });
  };

  const updateTestCase = (pIdx, tIdx, field, value) => {
    setAssessment((prev) => {
      const problems = [...prev.problems];
      const testCases = [...problems[pIdx].testCases];
      testCases[tIdx] = { ...testCases[tIdx], [field]: value };
      problems[pIdx] = { ...problems[pIdx], testCases };
      return { ...prev, problems };
    });
  };

  const removeTestCase = (pIdx, tIdx) => {
    setAssessment((prev) => {
      const problems = [...prev.problems];
      problems[pIdx] = {
        ...problems[pIdx],
        testCases: problems[pIdx].testCases.filter((_, i) => i !== tIdx),
      };
      return { ...prev, problems };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.put(`/assessments/${id}`, assessment);
      setAssessment(res.data.assessment);
      setSuccess("Assessment saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!selectedCandidate) return;
    try {
      const res = await api.post(`/assessments/${id}/send`, { candidateId: selectedCandidate });
      setSendResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send");
    }
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link);
    setSuccess("Link copied to clipboard!");
    setTimeout(() => setSuccess(""), 3000);
  };

  if (loading) {
    return (
      <div className="dashboard-page"><div className="container"><div className="loading-state">Loading…</div></div></div>
    );
  }

  if (!assessment) {
    return (
      <div className="dashboard-page"><div className="container"><div className="error-box">{error || "Not found"}</div></div></div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <Link to="/dashboard/assessments" className="profile-back">← Back to Assessments</Link>

        <div className="builder-header">
          <div>
            <h1 style={{ marginTop: 12 }}>{assessment.title}</h1>
            <div className="dash-header-sub">Edit problems, test cases, and send to candidates</div>
          </div>
          <div className="dash-header-actions">
            <button className="btn btn-outline" onClick={() => setShowSend(true)}>📤 Send to Candidate</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}

        {/* Settings */}
        <div className="profile-card" style={{ marginBottom: 20 }}>
          <h3 className="profile-card-title">Assessment Settings</h3>
          <div className="modal-grid-2">
            <div className="field"><label>Title</label><input value={assessment.title} onChange={(e) => updateField("title", e.target.value)} /></div>
            <div className="field"><label>Time Limit (min)</label><input type="number" value={assessment.timeLimit} onChange={(e) => updateField("timeLimit", Number(e.target.value))} min={5} max={180} /></div>
          </div>
          <div className="field"><label>Description</label><textarea value={assessment.description} onChange={(e) => updateField("description", e.target.value)} rows={2} /></div>
          <div className="modal-grid-2">
            <div className="field">
              <label>Language</label>
              <select value={assessment.language} onChange={(e) => updateField("language", e.target.value)}>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="typescript">TypeScript</option>
              </select>
            </div>
            <div className="field">
              <label>Difficulty</label>
              <select value={assessment.difficulty} onChange={(e) => updateField("difficulty", e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Problems */}
        {assessment.problems.map((problem, pIdx) => (
          <div key={pIdx} className="profile-card builder-problem" style={{ marginBottom: 20 }}>
            <div className="builder-problem-head">
              <h3 className="profile-card-title">Problem {pIdx + 1}</h3>
              {assessment.problems.length > 1 && (
                <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: 12, color: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => removeProblem(pIdx)}>Remove</button>
              )}
            </div>
            <div className="field"><label>Title</label><input value={problem.title} onChange={(e) => updateProblem(pIdx, "title", e.target.value)} /></div>
            <div className="field"><label>Description</label><textarea value={problem.description} onChange={(e) => updateProblem(pIdx, "description", e.target.value)} rows={4} /></div>
            <div className="field">
              <label>Starter Code</label>
              <div style={{ border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
                <Editor
                  height="180px"
                  language={assessment.language}
                  theme="vs-dark"
                  value={problem.starterCode}
                  onChange={(val) => updateProblem(pIdx, "starterCode", val || "")}
                  options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, lineNumbers: "on", padding: { top: 8 } }}
                />
              </div>
            </div>

            <h4 className="builder-tc-title">Test Cases</h4>
            {problem.testCases.map((tc, tIdx) => (
              <div key={tIdx} className="builder-tc">
                <div className="builder-tc-row">
                  <div className="field" style={{ flex: 1 }}>
                    <label>Input</label>
                    <input value={tc.input} onChange={(e) => updateTestCase(pIdx, tIdx, "input", e.target.value)} placeholder='e.g. [1,2,3]' />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Expected Output</label>
                    <input value={tc.expectedOutput} onChange={(e) => updateTestCase(pIdx, tIdx, "expectedOutput", e.target.value)} placeholder='e.g. 6' />
                  </div>
                  <label className="builder-tc-hidden">
                    <input type="checkbox" checked={tc.isHidden} onChange={(e) => updateTestCase(pIdx, tIdx, "isHidden", e.target.checked)} />
                    Hidden
                  </label>
                  <button className="btn btn-outline" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => removeTestCase(pIdx, tIdx)}>✕</button>
                </div>
              </div>
            ))}
            <button className="btn btn-outline" style={{ fontSize: 12 }} onClick={() => addTestCase(pIdx)}>+ Add Test Case</button>
          </div>
        ))}

        <button className="btn btn-outline" onClick={addProblem} style={{ marginBottom: 32 }}>+ Add Problem</button>

        {/* Submissions */}
        {submissions.length > 0 && (
          <div className="profile-card" style={{ marginBottom: 32 }}>
            <h3 className="profile-card-title">Submissions ({submissions.length})</h3>
            <div className="submission-list">
              {submissions.map((s) => (
                <Link key={s._id} to={`/dashboard/submissions/${s._id}`} className="submission-row">
                  <div className="submission-candidate">{s.candidate?.name || "Unknown"}</div>
                  <span className={`pill ${s.status === "evaluated" ? "pill-hired" : s.status === "submitted" ? "pill-assess" : "pill-screen"}`}>{s.status}</span>
                  {s.aiEvaluation?.overallScore > 0 && (
                    <span className="submission-score">{s.aiEvaluation.overallScore}/100</span>
                  )}
                  <span className="submission-date">{new Date(s.createdAt).toLocaleDateString()}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Send Modal */}
        {showSend && (
          <div className="modal-backdrop" onClick={() => { setShowSend(false); setSendResult(null); }}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Send Assessment</h3>
                <button onClick={() => { setShowSend(false); setSendResult(null); }} className="icon-close">✕</button>
              </div>

              {sendResult ? (
                <div>
                  <div className="success-box">
                    {sendResult.existing ? "Existing link found!" : "Assessment link generated!"}
                  </div>
                  <div className="field">
                    <label>Assessment Link</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={sendResult.link} readOnly style={{ flex: 1, fontFamily: "'Space Mono', monospace", fontSize: 12 }} />
                      <button className="btn btn-primary" onClick={() => copyLink(sendResult.link)}>Copy</button>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>
                    Share this link with the candidate. It expires in 7 days.
                  </p>
                </div>
              ) : (
                <>
                  <div className="field">
                    <label>Select Candidate</label>
                    <select value={selectedCandidate} onChange={(e) => setSelectedCandidate(e.target.value)}>
                      <option value="">Choose a candidate…</option>
                      {candidates.map((c) => (
                        <option key={c._id} value={c._id}>{c.name} — {c.role}</option>
                      ))}
                    </select>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setShowSend(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSend} disabled={!selectedCandidate}>Generate Link</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
