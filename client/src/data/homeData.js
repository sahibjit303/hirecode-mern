/* Static data for the home page — extracted for maintainability */

export const TABS = [
  {
    key: "screen",
    label: "Screen",
    num: "01",
    heading: "AI ranks every applicant instantly",
    body: "Define your role and stack. CodeHire's AI reads every resume and ranks candidates by actual engineering fit — not keyword matching.",
    points: [
      "Semantic stack matching beyond keyword filters",
      "Automated scoring on 20+ engineering signals",
      "Bias-free ranking with explainable scores",
      "One-click sync with your ATS",
    ],
  },
  {
    key: "assess",
    label: "Assess",
    num: "02",
    heading: "Unique tests. Every time.",
    body: "No two candidates see the same test. CodeHire generates adaptive challenges tailored to your specific stack and role requirements.",
    points: [
      "AI-generated assessments per candidate",
      "Anti-AI detection — captures paste & edit patterns",
      "Time-boxed, real-world problem scenarios",
      "Autograded with human-readable reports",
    ],
  },
  {
    key: "interview",
    label: "Interview",
    num: "03",
    heading: "Structured technical interviews",
    body: "Run consistent, bias-free interviews with AI-generated question banks tuned to your role and seniority level.",
    points: [
      "Role-tailored question guides",
      "Live coding environment included",
      "Automated scoring rubrics",
      "Interviewer calibration reports",
    ],
  },
  {
    key: "workflow",
    label: "Workflow",
    num: "04",
    heading: "Automate your hiring pipeline",
    body: "Build custom workflows that route candidates automatically — from application to offer — without manual work.",
    points: [
      "Visual pipeline builder",
      "Auto-advance rules by score threshold",
      "Bulk email & calendar scheduling",
      "Full audit trail for compliance",
    ],
  },
  {
    key: "integrations",
    label: "Integrations",
    num: "05",
    heading: "Plugs into your existing stack",
    body: "Connect CodeHire to your ATS, calendar, Slack, and more. Everything stays in sync.",
    points: [
      "Greenhouse, Lever, Ashby connectors",
      "Google & Outlook calendar sync",
      "Slack notifications & approvals",
      "Open API + webhooks for custom flows",
    ],
  },
];

export const WHY = [
  { num: "01", title: "AI Generated Assessments", body: "Unique coding assessments generated for every candidate and role. No two tests are ever the same." },
  { num: "02", title: "Anti-AI Coding Tests", body: "We detect paste behavior, edit patterns, and authorship signals in real time to ensure authentic evaluation." },
  { num: "03", title: "Unified Hiring Workflow", body: "Screen, assess, interview, and manage your entire pipeline from one place — no tool-hopping." },
  { num: "04", title: "Built For The AI Era", body: "Modern infrastructure designed to identify engineers who can think independently — not just prompt an AI." },
];

export const STEPS = [
  { num: "01", title: "Generate AI-powered assessments", body: "Define the role. CodeHire generates a unique assessment around your stack. No two candidates see the same test." },
  { num: "02", title: "Evaluate technical candidates", body: "Candidates take an anti-AI coding test. We capture edit patterns, paste behavior, and authorship signals in real time." },
  { num: "03", title: "Hire engineers faster", body: "Get an AI behaviour report with a score and a clear hire signal. Move the right engineer forward with evidence." },
];

export const TESTIMONIALS = [
  {
    quote: "CodeHire cut our screening time by 70%. We stopped interviewing candidates who couldn't write a real function — and hired our best engineer in 3 weeks.",
    name: "Priya Mehta",
    role: "CTO, Stacklane (W24)",
    initials: "PM",
    bg: "#E6EEF7", color: "#2563EB",
  },
  {
    quote: "The anti-AI detection is the real deal. We caught two candidates whose 'skills' evaporated the moment they couldn't paste from ChatGPT.",
    name: "Jordan Wu",
    role: "Founder, Relaybase (S25)",
    initials: "JW",
    bg: "#F1E6D2", color: "#D97706",
  },
  {
    quote: "I was skeptical about AI hiring tools, but CodeHire actually explains the scores. My team trusts the rankings because we can see exactly why.",
    name: "Ade Okonkwo",
    role: "Engineering Lead, Klippa (W25)",
    initials: "AO",
    bg: "#ECFDF5", color: "#059669",
  },
];

export const HERO_CANDIDATES = [
  { initials: "AK", name: "Arjun Kapoor", role: "Senior Backend Engineer", score: 92, bg: "#E6EEF7", color: "#2563EB" },
  { initials: "SR", name: "Sofia Ruiz", role: "Full Stack Engineer", score: 87, bg: "#F1E6D2", color: "#D97706" },
  { initials: "ML", name: "Marcus Lee", role: "Systems Engineer", score: 81, bg: "#ECFDF5", color: "#059669" },
];

export const BETA_CARDS = [
  { icon: "🏆", title: "YC-Exclusive", body: "We're in private beta for Y Combinator startups only. Quality over quantity — hand-picked cohort." },
  { icon: "📊", title: "Real Engineering Signal", body: "Stop hiring vibecoders. Our AI evaluates how engineers think, build, and explain their own code." },
  { icon: "🤝", title: "Founder-First Onboarding", body: "Hands-on setup with our team. We tailor assessments to your stack and standards personally." },
];
