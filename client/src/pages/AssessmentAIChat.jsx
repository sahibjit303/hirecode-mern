import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle.js";
import { useToast } from "../context/ToastContext.jsx";
import api from "../api/axios.js";

const STARTER_MSG = {
  role: "ai",
  content: `👋 Hi! I'm your AI assessment builder. I'll help you create a professional coding assessment in minutes.

Tell me:
- **What role are you hiring for?** (e.g., "Senior React Developer")
- **What topics should it cover?** (e.g., "React hooks, async patterns")
- **Difficulty?** (easy / medium / hard)

Once I generate it, I'll **automatically save it** so you can instantly send it to a candidate — no copy-paste needed!`,
};

const QUICK_PROMPTS = [
  "Senior React developer, 2 problems, medium difficulty",
  "Junior Python dev, arrays and strings, easy",
  "Backend Node.js engineer with async/await, hard",
  "Full stack JavaScript, APIs and data structures",
];

/* ── Typing dots ──────────────────────────── */
function TypingDots() {
  return (
    <div className="chat-typing">
      <span className="chat-typing-dot" />
      <span className="chat-typing-dot" />
      <span className="chat-typing-dot" />
    </div>
  );
}

/* ── Markdown-like text renderer ────────────── */
function FormattedText({ text }) {
  return (
    <div className="chat-text">
      {text.split("\n").map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**")
                ? <strong key={j}>{part.slice(2, -2)}</strong>
                : part
            )}
            <br />
          </span>
        );
      })}
    </div>
  );
}

/* ── Single message bubble ───────────────── */
function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`chat-msg ${isUser ? "chat-msg-user" : "chat-msg-ai"}`}>
      {!isUser && <div className="chat-msg-avatar"><span>✨</span></div>}
      <div className={`chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-ai"}`}>
        <FormattedText text={msg.content} />
      </div>
      {isUser && <div className="chat-msg-avatar chat-msg-avatar-user"><span>You</span></div>}
    </div>
  );
}

/* ── Send to Candidate Panel ─────────────── */
function SendPanel({ savedId, candidates, loadingCandidates }) {
  const { showToast } = useToast();
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [sending, setSending] = useState(false);
  const [link, setLink] = useState(null);

  const handleSend = async () => {
    if (!selectedCandidate || !savedId) return;
    setSending(true);
    try {
      const res = await api.post(`/assessments/${savedId}/send`, { candidateId: selectedCandidate });
      setLink(res.data.link);
      showToast("✅ Assessment link generated!", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to send assessment", "error");
    } finally {
      setSending(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    showToast("Link copied to clipboard!", "success");
  };

  if (link) {
    return (
      <div className="ai-send-panel ai-send-success">
        <div className="ai-send-success-icon">🎉</div>
        <div className="ai-send-success-text">Assessment link ready!</div>
        <div className="ai-send-link-row">
          <input value={link} readOnly className="ai-send-link-input" />
          <button className="btn btn-primary" onClick={copyLink}>Copy</button>
        </div>
        <p className="ai-send-hint">Share this link with your candidate. It expires in 7 days.</p>
        <button className="ai-send-again" onClick={() => setLink(null)}>Send to another candidate →</button>
      </div>
    );
  }

  return (
    <div className="ai-send-panel">
      <div className="ai-send-panel-title">
        <span>📤</span> Send to Candidate
      </div>
      <p className="ai-send-panel-sub">
        Assessment is saved. Select a candidate and generate their assessment link instantly.
      </p>
      <div className="field" style={{ marginBottom: 12 }}>
        <label>Choose candidate</label>
        <select
          value={selectedCandidate}
          onChange={(e) => setSelectedCandidate(e.target.value)}
          disabled={loadingCandidates}
        >
          <option value="">{loadingCandidates ? "Loading…" : "Select a candidate…"}</option>
          {candidates.map((c) => (
            <option key={c._id} value={c._id}>{c.name} — {c.role}</option>
          ))}
        </select>
      </div>
      <button
        className="btn btn-primary btn-block"
        onClick={handleSend}
        disabled={!selectedCandidate || sending || !savedId}
      >
        {sending ? <><span className="btn-spinner" /> Generating link…</> : "⚡ Generate & Send Link"}
      </button>
    </div>
  );
}

/* ── Assessment preview panel ────────────── */
function AssessmentPreview({ assessment, savedId, saveStatus, candidates, loadingCandidates, onOpenBuilder }) {
  const diffColor = { easy: "#16A34A", medium: "#D97706", hard: "#DC2626" };
  const langIcon  = { javascript: "JS", python: "PY", typescript: "TS" };

  if (!assessment) {
    return (
      <div className="ai-preview-empty">
        <div className="ai-preview-empty-icon">🎯</div>
        <h3>Assessment preview</h3>
        <p>Your generated assessment will appear here as you chat. It's auto-saved so you can send it to candidates immediately.</p>
        <div className="ai-preview-tips">
          <div className="ai-preview-tip">💬 Describe what you need</div>
          <div className="ai-preview-tip">✨ AI generates instantly</div>
          <div className="ai-preview-tip">💾 Auto-saved to your account</div>
          <div className="ai-preview-tip">📤 Send directly to candidates</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-preview">
      {/* Status bar */}
      <div className={`ai-save-status ${saveStatus}`}>
        {saveStatus === "saving"  && <><span className="ai-save-dot saving" />  Saving…</>}
        {saveStatus === "saved"   && <><span className="ai-save-dot saved"  />  ✓ Saved automatically</>}
        {saveStatus === "updated" && <><span className="ai-save-dot saved"  />  ✓ Updated automatically</>}
        {saveStatus === "error"   && <><span className="ai-save-dot error"  />  ✗ Save failed — retry below</>}
      </div>

      {/* Header */}
      <div className="ai-preview-header">
        <div className="ai-preview-header-left">
          <div className="ai-preview-badge"><span>✨</span> AI Generated</div>
          <h2 className="ai-preview-title">{assessment.title}</h2>
          <div className="ai-preview-meta">
            <span className="ai-preview-tag" style={{ color: diffColor[assessment.difficulty] }}>{assessment.difficulty}</span>
            <span className="ai-preview-tag">{langIcon[assessment.language] || assessment.language}</span>
            <span className="ai-preview-tag">⏱ {assessment.timeLimit}min</span>
            <span className="ai-preview-tag">📝 {assessment.problems?.length || 0} problems</span>
          </div>
        </div>
        {savedId && (
          <button className="btn btn-outline" onClick={onOpenBuilder} style={{ fontSize: 13, padding: "9px 18px" }}>
            ✏️ Open in Builder
          </button>
        )}
      </div>

      {assessment.description && <p className="ai-preview-desc">{assessment.description}</p>}

      {/* Problems */}
      <div className="ai-problems-list">
        {(assessment.problems || []).map((p, i) => (
          <div key={i} className="ai-problem-card">
            <div className="ai-problem-num">Problem {i + 1}</div>
            <h3 className="ai-problem-title">{p.title}</h3>
            <p className="ai-problem-desc">{p.description}</p>

            {p.starterCode && (
              <div className="ai-starter-code">
                <div className="ai-starter-code-bar">
                  <span className="code-dot red" /><span className="code-dot yellow" /><span className="code-dot green" />
                  <span className="ai-starter-code-label">starter code</span>
                </div>
                <pre className="ai-starter-code-body">{p.starterCode}</pre>
              </div>
            )}

            <div className="ai-test-cases">
              <div className="ai-tc-header">
                Test Cases
                <span className="ai-tc-count">
                  {p.testCases?.length || 0} total · {p.testCases?.filter(t => t.isHidden).length || 0} hidden
                </span>
              </div>
              <div className="ai-tc-grid">
                {(p.testCases || []).slice(0, 4).map((tc, j) => (
                  <div key={j} className={`ai-tc ${tc.isHidden ? "ai-tc-hidden" : ""}`}>
                    <span className="ai-tc-label">{tc.isHidden ? "🔒 Hidden" : `Test ${j + 1}`}</span>
                    <div className="ai-tc-io">
                      <span>In: <code>{tc.input || "—"}</code></span>
                      {!tc.isHidden && <span>Out: <code>{tc.expectedOutput || "—"}</code></span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {p.hints?.length > 0 && (
              <div className="ai-hints">
                <span className="ai-hints-label">💡 {p.hints.length} hint{p.hints.length > 1 ? "s" : ""} available to candidates</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Send to Candidate — only show when saved */}
      {savedId && (
        <div style={{ marginTop: 24 }}>
          <SendPanel
            savedId={savedId}
            candidates={candidates}
            loadingCandidates={loadingCandidates}
          />
        </div>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────── */
export default function AssessmentAIChat() {
  usePageTitle("AI Assessment Builder");
  const { showToast } = useToast();

  const [messages, setMessages]           = useState([STARTER_MSG]);
  const [input, setInput]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [assessment, setAssessment]       = useState(null);
  const [savedId, setSavedId]             = useState(null);   // DB id once saved
  const [saveStatus, setSaveStatus]       = useState("idle"); // idle|saving|saved|updated|error
  const [candidates, setCandidates]       = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Fetch candidates once for the Send panel
  useEffect(() => {
    setLoadingCandidates(true);
    api.get("/candidates")
      .then(res => setCandidates(res.data.candidates || []))
      .catch(() => {})
      .finally(() => setLoadingCandidates(false));
  }, []);

  // AUTO-SAVE: whenever `assessment` changes, create or update in DB
  useEffect(() => {
    if (!assessment) return;

    const payload = {
      title:       assessment.title,
      description: assessment.description,
      language:    assessment.language,
      difficulty:  assessment.difficulty,
      timeLimit:   assessment.timeLimit,
      problems:    assessment.problems,
    };

    setSaveStatus("saving");

    const doSave = savedId
      ? api.put(`/assessments/${savedId}`, payload)
      : api.post("/assessments", payload);

    doSave
      .then(res => {
        const id = res.data.assessment._id;
        setSavedId(id);
        setSaveStatus(savedId ? "updated" : "saved");
        if (!savedId) showToast("✅ Assessment auto-saved!", "success");
      })
      .catch(() => {
        setSaveStatus("error");
        showToast("Auto-save failed", "error");
      });
  }, [assessment]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg    = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = newMessages
        .filter(m => m !== STARTER_MSG)
        .map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));

      const res = await api.post("/ai/chat", {
        messages: apiMessages,
        currentAssessment: assessment,
      });

      setMessages(prev => [...prev, { role: "ai", content: res.data.reply }]);

      if (res.data.assessment) {
        setAssessment(res.data.assessment); // triggers auto-save
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Something went wrong. Please try again.";
      setMessages(prev => [...prev, { role: "ai", content: `⚠️ ${errMsg}` }]);
      showToast(errMsg, "error");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleReset = () => {
    setMessages([STARTER_MSG]);
    setAssessment(null);
    setSavedId(null);
    setSaveStatus("idle");
    setInput("");
  };

  const handleOpenBuilder = () => {
    if (savedId) window.open(`/dashboard/assessments/${savedId}`, "_blank");
  };

  return (
    <div className="ai-chat-page">
      {/* Top bar */}
      <div className="ai-chat-topbar">
        <Link to="/dashboard/assessments" className="ai-chat-back">← Back to Assessments</Link>
        <div className="ai-chat-topbar-center">
          <span className="ai-chat-topbar-icon">✨</span>
          <span className="ai-chat-topbar-title">AI Assessment Builder</span>
          <span className="ai-chat-topbar-badge">Powered by Gemini</span>
        </div>
        <button className="btn btn-outline ai-chat-reset" onClick={handleReset} title="Start over">↺ Reset</button>
      </div>

      <div className="ai-chat-layout">
        {/* Left: Chat */}
        <div className="ai-chat-panel">
          <div className="ai-chat-messages">
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            {loading && (
              <div className="chat-msg chat-msg-ai">
                <div className="chat-msg-avatar"><span>✨</span></div>
                <div className="chat-bubble chat-bubble-ai"><TypingDots /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length === 1 && !loading && (
            <div className="ai-quick-prompts">
              <div className="ai-quick-label">Quick start →</div>
              {QUICK_PROMPTS.map(p => (
                <button key={p} className="ai-quick-chip" onClick={() => sendMessage(p)}>{p}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="ai-chat-input-area">
            <div className="ai-chat-input-wrap">
              <textarea
                ref={inputRef}
                className="ai-chat-input"
                placeholder="Describe what you need… (Enter to send, Shift+Enter for new line)"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                disabled={loading}
              />
              <button
                className="ai-chat-send"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                aria-label="Send"
              >
                {loading
                  ? <span className="btn-spinner" style={{ borderTopColor: "#7C3AED" }} />
                  : "↑"}
              </button>
            </div>
            <div className="ai-chat-hint">
              💡 Try: "Make it harder", "Add a dynamic programming problem", "Change to Python"
            </div>
          </div>
        </div>

        {/* Right: Preview + Auto-send */}
        <div className="ai-preview-panel">
          <AssessmentPreview
            assessment={assessment}
            savedId={savedId}
            saveStatus={saveStatus}
            candidates={candidates}
            loadingCandidates={loadingCandidates}
            onOpenBuilder={handleOpenBuilder}
          />
        </div>
      </div>
    </div>
  );
}
