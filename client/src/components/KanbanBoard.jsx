import { useState, useRef } from "react";

const STAGES = ["screen", "assess", "interview", "offer", "hired", "rejected"];
const STAGE_LABELS = {
  screen: "Screen",
  assess: "Assess",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};
const STAGE_COLORS = {
  screen: { bg: "var(--sage-soft)", border: "var(--sage)", text: "var(--sage)" },
  assess: { bg: "#E6EEF7", border: "#2563EB", text: "#2563EB" },
  interview: { bg: "#F1E6D2", border: "#D97706", text: "#D97706" },
  offer: { bg: "var(--rust-soft)", border: "var(--rust)", text: "var(--rust)" },
  hired: { bg: "#DCFCE7", border: "#16A34A", text: "#16A34A" },
  rejected: { bg: "var(--danger-soft)", border: "var(--danger)", text: "var(--danger)" },
};

function scoreColor(score) {
  if (score >= 80) return "#16A34A";
  if (score >= 60) return "#D97706";
  return "#DC2626";
}

function KanbanCard({ candidate, onDragStart, onClick }) {
  const initials = candidate.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div
      className="kanban-card"
      draggable
      onDragStart={(e) => onDragStart(e, candidate._id)}
      onClick={() => onClick(candidate)}
    >
      <div className="kanban-card-header">
        <div className="kanban-card-avatar">{initials}</div>
        <div className="kanban-card-info">
          <div className="kanban-card-name">{candidate.name}</div>
          <div className="kanban-card-role">{candidate.role}</div>
        </div>
        {candidate.score != null && (
          <div
            className="kanban-card-score"
            style={{ color: scoreColor(candidate.score) }}
          >
            {candidate.score}
          </div>
        )}
      </div>
      {(candidate.stack || []).length > 0 && (
        <div className="kanban-card-stack">
          {candidate.stack.slice(0, 3).map((s) => (
            <span key={s} className="stack-tag">
              {s}
            </span>
          ))}
        </div>
      )}
      {(candidate.tags || []).length > 0 && (
        <div className="kanban-card-tags">
          {candidate.tags.slice(0, 3).map((t) => (
            <span key={t} className="candidate-tag">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function KanbanBoard({ candidates, onStageChange, onCardClick }) {
  const [dragOverStage, setDragOverStage] = useState(null);
  const dragIdRef = useRef(null);

  const handleDragStart = (e, id) => {
    dragIdRef.current = id;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e, stage) => {
    e.preventDefault();
    setDragOverStage(null);
    const id = dragIdRef.current;
    if (!id) return;
    const candidate = candidates.find((c) => c._id === id);
    if (candidate && candidate.stage !== stage) {
      onStageChange(id, stage);
    }
    dragIdRef.current = null;
  };

  return (
    <div className="kanban-board">
      {STAGES.map((stage) => {
        const stageCandidates = candidates.filter((c) => c.stage === stage);
        const colors = STAGE_COLORS[stage];
        return (
          <div
            key={stage}
            className={`kanban-column ${dragOverStage === stage ? "kanban-column-over" : ""}`}
            onDragOver={(e) => handleDragOver(e, stage)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className="kanban-column-header">
              <span
                className="kanban-column-dot"
                style={{ background: colors.border }}
              />
              <span className="kanban-column-title">
                {STAGE_LABELS[stage]}
              </span>
              <span className="kanban-column-count">
                {stageCandidates.length}
              </span>
            </div>
            <div className="kanban-column-body">
              {stageCandidates.map((c) => (
                <KanbanCard
                  key={c._id}
                  candidate={c}
                  onDragStart={handleDragStart}
                  onClick={onCardClick}
                />
              ))}
              {stageCandidates.length === 0 && (
                <div className="kanban-empty">Drop here</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
