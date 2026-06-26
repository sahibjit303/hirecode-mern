import { useState } from "react";
import { Link } from "react-router-dom";
import FadeUp from "../components/FadeUp.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { TABS, WHY, STEPS, TESTIMONIALS, HERO_CANDIDATES, BETA_CARDS } from "../data/homeData.js";

/* ── Tab visual components ─────────────────────────── */

function MiniCandRow({ name, sub, score, bg, color, pct }) {
  return (
    <div className="mini-cand-row">
      <div className="mini-cand-avatar" style={{ background: bg, color }}>{name.slice(0, 2)}</div>
      <div className="mini-cand-info">
        <div className="mini-cand-name">{name}</div>
        <div className="mini-cand-sub">{sub}</div>
        <div className="mini-cand-bar">
          <div className="mini-cand-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="mini-cand-score">{score}</div>
    </div>
  );
}

function ScreenVisual() {
  return (
    <div className="tab-visual">
      <div className="tab-visual-label">Live Candidate Ranking</div>
      <MiniCandRow name="Arjun K." sub="Go · Kubernetes · Postgres" score={92} pct={92} bg="#E6EEF7" color="#2563EB" />
      <MiniCandRow name="Sofia R." sub="React · Node · TypeScript" score={87} pct={87} bg="#F1E6D2" color="#D97706" />
      <MiniCandRow name="Marcus L." sub="Rust · Distributed Systems" score={81} pct={81} bg="#ECFDF5" color="#059669" />
    </div>
  );
}

function AssessVisual() {
  return (
    <div className="tab-visual">
      <div className="tab-visual-label">Assessment Environment</div>
      <div className="code-preview">
        <div className="code-preview-bar">assessment_2847.py</div>
        <div className="code-preview-body">
          <div><span className="tok-keyword">def </span><span className="tok-fn">process_orders</span>(orders):</div>
          <div className="code-indent-1">result = []</div>
          <div className="code-indent-1"><span className="tok-keyword">for</span> o in orders:</div>
          <div className="code-indent-2"><span className="tok-keyword">if</span> o[<span className="tok-string">'status'</span>] == <span className="tok-string">'active'</span>:</div>
          <div className="code-indent-3">result.append(o)</div>
          <div className="code-indent-1"><span className="tok-keyword">return</span> result</div>
        </div>
      </div>
      <div className="assess-metrics">
        {[["Paste events", "0 flagged"], ["Edit pattern", "✓ organic"]].map(([l, v]) => (
          <div key={l} className="assess-metric-card">
            <div className="assess-metric-label">{l}</div>
            <div className="assess-metric-value">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InterviewVisual() {
  return (
    <div className="tab-visual">
      <div className="tab-visual-label">Interview Session</div>
      {[["System Design", "Design a rate limiter for a REST API handling 10k req/s."], ["Algorithms", "Optimize a function to find duplicates in a 1M-row dataset."]].map(([type, q]) => (
        <div key={type} className="interview-question-card">
          <div className="interview-question-type">{type}</div>
          <div className="interview-question-text">{q}</div>
        </div>
      ))}
      <div className="interview-score-card">
        <span className="interview-score-label">Candidate score</span>
        <span className="interview-score-value">88 / 100</span>
      </div>
    </div>
  );
}

function WorkflowVisual() {
  const stages = [
    ["Screen", "248 applicants", "#ECFDF5", "#059669", "✓"],
    ["Assess", "42 candidates", "#E6EEF7", "#2563EB", "→"],
    ["Interview", "8 finalists", "#F1E6D2", "#D97706", "◎"],
  ];
  return (
    <div className="tab-visual">
      <div className="tab-visual-label">Pipeline Stages</div>
      {stages.map(([label, sub, bg, color, icon]) => (
        <div key={label} className="workflow-stage-row">
          <div className="workflow-stage-icon" style={{ background: bg, color }}>{icon}</div>
          <div className="workflow-stage-label">
            <span className="workflow-stage-name">{label}</span> — <span className="workflow-stage-sub">{sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function IntegrationsVisual() {
  const tools = [
    ["🌿", "Greenhouse", "Connected", true],
    ["📅", "Google Cal", "Connected", true],
    ["💬", "Slack", "Connected", true],
    ["🔗", "Webhooks", "Configure", false],
  ];
  return (
    <div className="tab-visual">
      <div className="tab-visual-label">Connected Tools</div>
      <div className="integrations-grid">
        {tools.map(([icon, name, status, active]) => (
          <div key={name} className="integration-card">
            <div className="integration-icon">{icon}</div>
            <div className="integration-name">{name}</div>
            <div className={`integration-status ${active ? "active" : ""}`}>
              {active ? "● " : "○ "}{status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TAB_VISUALS = {
  screen: ScreenVisual,
  assess: AssessVisual,
  interview: InterviewVisual,
  workflow: WorkflowVisual,
  integrations: IntegrationsVisual,
};

/* ── Hero Card ─────────────────────────────────────── */

function HeroCard() {
  return (
    <div className="hero-card">
      <div className="hero-card-head">
        <span className="hero-card-title">Top Candidates</span>
        <span className="tag">12 ranked</span>
      </div>
      {HERO_CANDIDATES.map((c) => (
        <div key={c.initials} className="cand-row">
          <div className="cand-avatar" style={{ background: c.bg, color: c.color }}>{c.initials}</div>
          <div className="cand-info">
            <div className="cand-name">{c.name}</div>
            <div className="cand-role">{c.role}</div>
          </div>
          <div className="cand-score">{c.score}</div>
        </div>
      ))}
      <div className="hero-card-footer">
        <span className="mono">avg.score</span>
        <span className="mono hero-card-avg">86.7</span>
      </div>
    </div>
  );
}

/* ── Home page ─────────────────────────────────────────── */

export default function Home() {
  usePageTitle(null); // Use default title for homepage
  const [activeTab, setActiveTab] = useState("screen");
  const [tabKey, setTabKey] = useState(0);
  const current = TABS.find((t) => t.key === activeTab);
  const Visual = TAB_VISUALS[activeTab];

  const switchTab = (key) => {
    setActiveTab(key);
    setTabKey((k) => k + 1);
  };

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero" id="home">
        <div className="container">
          <div className="hero-grid">
            <FadeUp>
              <div className="eyebrow">Now in private beta</div>
              <h1>Stop Hiring <span className="italic">Vibecoders.</span><br />Start Hiring Engineers.</h1>
              <p className="hero-sub">Technical hiring broke in the AI era. CodeHire helps startups identify engineers who can actually think and build — not just prompt GPT.</p>
              <div className="hero-ctas">
                <Link to="/apply" className="btn btn-primary">
                  Apply For Access
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <a href="#how" className="btn btn-outline">How it works</a>
              </div>
              <p className="hero-note mono">// Limited to 50 YC startups — apply now</p>
            </FadeUp>
            <FadeUp delay={0.15}>
              <HeroCard />
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="trust-bar">
        <div className="container">
          <p className="mono trust-text">
            TRUSTED BY YC-BACKED TEAMS · W24 · S24 · W25 · S25
          </p>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="section-alt" id="features">
        <div className="container">
          <FadeUp>
            <div className="section-head">
              <div className="eyebrow">Platform</div>
              <h2>Everything You Need to Hire Engineers Who Can Actually Build</h2>
              <p>One platform. From job posting to the final hire — no stitching tools together.</p>
            </div>
          </FadeUp>

          <div className="tabs">
            {TABS.map((t) => (
              <button key={t.key} className={`tab${activeTab === t.key ? " active" : ""}`} onClick={() => switchTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          <div key={tabKey} className="tab-panel active tab-panel-anim">
            <div>
              <div className="eyebrow">{current.num} — {current.label}</div>
              <h3>{current.heading}</h3>
              <p>{current.body}</p>
              <ul className="point-list">
                {current.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
            <Visual />
          </div>
        </div>
      </section>

      {/* ── WHY ── */}
      <section id="why">
        <div className="container">
          <FadeUp>
            <div className="section-head">
              <div className="eyebrow">Why CodeHire</div>
              <h2>Why Modern Teams Hire With CodeHire AI</h2>
            </div>
          </FadeUp>
          <div className="why-grid">
            {WHY.map((w, i) => (
              <FadeUp key={w.num} delay={i * 0.1}>
                <div className="why-card">
                  <div className="why-num">{w.num}</div>
                  <h3>{w.title}</h3>
                  <p>{w.body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section-alt" id="how">
        <div className="container">
          <FadeUp>
            <div className="section-head">
              <div className="eyebrow">How It Works</div>
              <h2>From Assessment to Hire in Three Steps</h2>
              <p>Simple process. Powerful signal. Fast decisions.</p>
            </div>
          </FadeUp>
          <div className="steps">
            {STEPS.map((s, i) => (
              <FadeUp key={s.num} delay={i * 0.15}>
                <div className="step">
                  <div className="step-num">{s.num}</div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials">
        <div className="container">
          <FadeUp>
            <div className="section-head">
              <div className="eyebrow">Founders Say</div>
              <h2>Trusted by YC Engineers Who Care About Quality</h2>
            </div>
          </FadeUp>
          <div className="testimonial-grid">
            {TESTIMONIALS.map((t, i) => (
              <FadeUp key={t.name} delay={i * 0.12}>
                <div className="testimonial-card">
                  <div className="testimonial-quote">❝</div>
                  <p className="testimonial-body">{t.quote}</p>
                  <div className="testimonial-author">
                    <div className="cand-avatar" style={{ background: t.bg, color: t.color, width: 40, height: 40, fontSize: 14 }}>{t.initials}</div>
                    <div>
                      <div className="testimonial-name">{t.name}</div>
                      <div className="testimonial-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── BETA CTA ── */}
      <section id="beta">
        <div className="container">
          <FadeUp>
            <div className="beta-box">
              <div className="eyebrow">Private Beta</div>
              <h2>Built for YC Startups.<br />Not for everyone. Yet.</h2>
              <p>This isn't "Buy our SaaS." This is a private beta for selected YC startups who care about real engineering quality.</p>
              <div className="beta-ctas">
                <Link to="/apply" className="btn btn-primary">Apply for Early Access</Link>
                <a href="#how" className="btn btn-outline">See How It Works</a>
              </div>
              <div className="beta-grid">
                {BETA_CARDS.map(({ icon, title, body }) => (
                  <div key={title} className="beta-card">
                    <div className="beta-card-icon">{icon}</div>
                    <h4>{title}</h4>
                    <p>{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="final-cta section-alt">
        <div className="container">
          <FadeUp>
            <div className="eyebrow">Limited Access</div>
            <h2>Join The First 50<br /><span className="final-cta-highlight">YC Startups</span></h2>
            <p>Empowering YC startups to hire exceptional engineering talent in the AI era.</p>
            <div className="final-ctas">
              <Link to="/apply" className="btn btn-primary">
                Apply for Access
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link to="/login" className="btn btn-outline">Log In</Link>
            </div>
            <p className="mono final-cta-note">// Limited early access for YC-backed teams</p>
          </FadeUp>
        </div>
      </section>
    </>
  );
}
