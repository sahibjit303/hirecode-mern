import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import api from "../api/axios.js";

const STAGES = ["screen", "assess", "interview", "offer", "hired", "rejected"];
const STAGE_COLORS = {
  screen: "pill-screen", assess: "pill-assess", interview: "pill-interview",
  offer: "pill-offer", hired: "pill-hired", rejected: "pill-rejected",
};

function scoreColor(score) {
  if (score >= 80) return { bg: "#DCFCE7", color: "#16A34A" };
  if (score >= 60) return { bg: "#FEF3C7", color: "#D97706" };
  return { bg: "#FEF2F2", color: "#DC2626" };
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function CandidateProfile() {
  usePageTitle("Candidate Profile");
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [candidate, setCandidate] = useState(null);
  const [notes, setNotes] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [editingStage, setEditingStage] = useState(false);
  const [editingScore, setEditingScore] = useState(false);
  const [tempScore, setTempScore] = useState("");
  const [stageSaving, setStageSaving] = useState(false);
  const [scoreSaving, setScoreSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // FIX: Fetch single candidate by ID directly instead of all candidates
        const [candRes, notesRes, subsRes] = await Promise.all([
          api.get(`/candidates/${id}`),
          api.get(`/candidates/${id}/notes`),
          api.get("/submissions"),
        ]);
        setCandidate(candRes.data.candidate);
        setTempScore(String(candRes.data.candidate.score ?? ""));
        setNotes(notesRes.data.notes);
        // Filter submissions for this candidate
        const candidateSubs = subsRes.data.submissions.filter(
          (s) => s.candidate?._id === id || s.candidate === id
        );
        setSubmissions(candidateSubs);
      } catch (err) {
        console.error(err);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleStageChange = async (stage) => {
    setStageSaving(true);
    try {
      const res = await api.put(`/candidates/${id}`, { stage });
      setCandidate(res.data.candidate);
      setEditingStage(false);
      showToast(`Stage updated to ${stage}`, "success");
    } catch (e) {
      showToast("Failed to update stage", "error");
    } finally {
      setStageSaving(false);
    }
  };

  const handleScoreSave = async () => {
    setScoreSaving(true);
    try {
      const res = await api.put(`/candidates/${id}`, { score: Number(tempScore) });
      setCandidate(res.data.candidate);
      setEditingScore(false);
      showToast("Score updated", "success");
    } catch (e) {
      showToast("Failed to update score", "error");
    } finally {
      setScoreSaving(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNoteLoading(true);
    try {
      const res = await api.post(`/candidates/${id}/notes`, { text: noteText });
      setNotes((prev) => [res.data.note, ...prev]);
      setNoteText("");
      showToast("Note added", "success");
    } catch (err) {
      showToast("Failed to add note", "error");
    } finally {
      setNoteLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await api.delete(`/candidates/${id}/notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
      showToast("Note deleted", "success");
    } catch (err) {
      showToast("Failed to delete note", "error");
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="skeleton-profile">
            <div className="skeleton skeleton-avatar-lg" />
            <div className="skeleton-lines">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line short" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!candidate) return null;

  const sc = scoreColor(candidate.score ?? 0);
  const initials = candidate.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="profile-page">
      <div className="container">
        <Link to="/dashboard" className="profile-back">← Back to Dashboard</Link>

        <div className="profile-grid">
          {/* Main content */}
          <div className="profile-main">
            {/* Header card */}
            <div className="profile-header-card">
              <div className="profile-header-top">
                <div className="profile-avatar-lg">{initials}</div>
                <div className="profile-header-info">
                  <h1 className="profile-name">{candidate.name}</h1>
                  <p className="profile-role">{candidate.role}</p>
                  {candidate.email && (
                    <a href={`mailto:${candidate.email}`} className="profile-email">
                      ✉ {candidate.email}
                    </a>
                  )}
                  <div className="profile-stack">
                    {(candidate.stack || []).map((s) => (
                      <span key={s} className="stack-tag">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
              {(candidate.tags || []).length > 0 && (
                <div className="profile-tags">
                  {candidate.tags.map((t) => (
                    <span key={t} className="candidate-tag">{t}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Anti-AI Detection */}
            {candidate.flags && (
              <div className="profile-card">
                <h3 className="profile-card-title">Anti-AI Detection</h3>
                <div className="profile-flags-grid">
                  <div className="profile-flag">
                    <span className="profile-flag-label">Paste Events</span>
                    <span className={`profile-flag-value ${candidate.flags.pasteEvents === 0 ? "good" : "warn"}`}>
                      {candidate.flags.pasteEvents === 0 ? "✓ Clean" : `⚠ ${candidate.flags.pasteEvents} flagged`}
                    </span>
                  </div>
                  <div className="profile-flag">
                    <span className="profile-flag-label">Edit Pattern</span>
                    <span className={`profile-flag-value ${candidate.flags.editPattern === "organic" ? "good" : "warn"}`}>
                      {candidate.flags.editPattern === "organic" ? "✓ Organic" : "⚠ Suspicious"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Assessment Submissions */}
            <div className="profile-card">
              <h3 className="profile-card-title">Assessment History
                <span className="profile-card-count">{submissions.length}</span>
              </h3>
              {submissions.length === 0 ? (
                <p className="notes-empty">No assessments taken yet. <Link to="/dashboard/assessments" className="inline-link">Send an assessment →</Link></p>
              ) : (
                <div className="submissions-list">
                  {submissions.map((sub) => (
                    <Link key={sub._id} to={`/dashboard/submissions/${sub._id}`} className="submission-row">
                      <div className="submission-row-info">
                        <span className="submission-row-title">{sub.assessment?.title || "Assessment"}</span>
                        <span className="submission-row-meta">
                          {sub.assessment?.language} · {timeAgo(sub.createdAt)}
                        </span>
                      </div>
                      <div className="submission-row-right">
                        <span className={`pill ${sub.status === "evaluated" ? "pill-hired" : "pill-assess"}`}>
                          {sub.status}
                        </span>
                        {sub.aiEvaluation?.overallScore > 0 && (
                          <span className="submission-row-score" style={{ color: scoreColor(sub.aiEvaluation.overallScore).color }}>
                            {sub.aiEvaluation.overallScore}/100
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="profile-card">
              <h3 className="profile-card-title">Notes & Activity
                <span className="profile-card-count">{notes.length}</span>
              </h3>
              <form className="note-form" onSubmit={handleAddNote}>
                <textarea
                  className="note-input"
                  placeholder="Add a note about this candidate…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                />
                <button type="submit" className="btn btn-primary" disabled={noteLoading || !noteText.trim()}>
                  {noteLoading ? "Adding…" : "Add Note"}
                </button>
              </form>
              <div className="notes-list">
                {notes.length === 0 ? (
                  <p className="notes-empty">No notes yet. Add one above to start tracking this candidate.</p>
                ) : (
                  notes.map((note) => (
                    <div key={note._id} className="note-item">
                      <div className="note-item-header">
                        <div className="note-author">
                          <div className="note-author-avatar">
                            {(note.author?.name || "U").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="note-author-name">{note.author?.name || "Unknown"}</span>
                            <span className="note-time">{timeAgo(note.createdAt)}</span>
                          </div>
                        </div>
                        {note.author?._id === user?.id && (
                          <button className="note-delete" onClick={() => handleDeleteNote(note._id)} title="Delete note">✕</button>
                        )}
                      </div>
                      <p className="note-text">{note.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="profile-sidebar">
            {/* Score card */}
            <div className="profile-card profile-score-card">
              <h3 className="profile-card-title">Score</h3>
              {editingScore ? (
                <div className="profile-edit-inline">
                  <input
                    type="number" min={0} max={100} value={tempScore}
                    onChange={(e) => setTempScore(e.target.value)}
                    className="profile-score-input" autoFocus
                  />
                  <div className="profile-edit-actions">
                    <button className="btn btn-primary" onClick={handleScoreSave} disabled={scoreSaving}>
                      {scoreSaving ? "Saving…" : "Save"}
                    </button>
                    <button className="btn btn-outline" onClick={() => setEditingScore(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="profile-score-display" onClick={() => setEditingScore(true)} title="Click to edit score">
                  <span className="profile-score-num" style={{ color: sc.color }}>
                    {candidate.score ?? "—"}
                  </span>
                  <span className="profile-score-max">/ 100</span>
                  <div className="profile-score-bar">
                    <div className="profile-score-bar-fill" style={{ width: `${candidate.score ?? 0}%`, background: sc.color }} />
                  </div>
                  <span className="profile-edit-hint">✏ Click to edit</span>
                </div>
              )}
            </div>

            {/* Stage card */}
            <div className="profile-card">
              <h3 className="profile-card-title">Pipeline Stage</h3>
              {editingStage ? (
                <div className="profile-stage-options">
                  {STAGES.map((s) => (
                    <button
                      key={s}
                      className={`pill ${STAGE_COLORS[s]} profile-stage-btn ${candidate.stage === s ? "active-stage" : ""}`}
                      onClick={() => handleStageChange(s)}
                      disabled={stageSaving}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                      {candidate.stage === s && " ✓"}
                    </button>
                  ))}
                  <button className="btn btn-outline" onClick={() => setEditingStage(false)} style={{ marginTop: 8 }}>Cancel</button>
                </div>
              ) : (
                <div className="profile-stage-current" onClick={() => setEditingStage(true)} title="Click to change stage">
                  <span className={`pill ${STAGE_COLORS[candidate.stage]}`}>
                    {candidate.stage.charAt(0).toUpperCase() + candidate.stage.slice(1)}
                  </span>
                  <span className="profile-edit-hint">✏ Click to change</span>
                </div>
              )}
            </div>

            {/* Details card */}
            <div className="profile-card">
              <h3 className="profile-card-title">Details</h3>
              <div className="profile-detail-rows">
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Added</span>
                  <span className="profile-detail-value">{new Date(candidate.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Updated</span>
                  <span className="profile-detail-value">{timeAgo(candidate.updatedAt)}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Assessments</span>
                  <span className="profile-detail-value">{submissions.length}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Notes</span>
                  <span className="profile-detail-value">{notes.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
