import { Link } from "react-router-dom";

const SOCIAL = [
  { label: "𝕏", href: "#", ariaLabel: "Twitter / X" },
  { label: "in", href: "#", ariaLabel: "LinkedIn" },
  { label: "gh", href: "#", ariaLabel: "GitHub" },
];

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand footer-brand-link">
              <div className="brand-mark">HC</div>
              CodeHire
            </div>
            <p>AI-powered technical hiring built for the modern engineering era. Stop hiring vibecoders.</p>
            <div className="footer-social">
              {SOCIAL.map((s) => (
                <a key={s.label} href={s.href} className="social-icon" aria-label={s.ariaLabel}>
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <div className="footer-col">
            <h4>Products</h4>
            <Link to="/#features">Screen</Link>
            <Link to="/#features">Assess</Link>
            <Link to="/#features">Interview</Link>
            <Link to="/#features">Workflow</Link>
            <Link to="/#features">Integrations</Link>
          </div>

          <div className="footer-col">
            <h4>Solutions</h4>
            <Link to="/apply">For Startups</Link>
            <Link to="/apply">For Enterprises</Link>
            <Link to="/demo">Anti-AI Detection</Link>
            <Link to="/demo">Smarter Hiring</Link>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <Link to="/apply">Apply For Access</Link>
            <Link to="/demo">Demo</Link>
            <Link to="/login">Log In</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 CodeHire. All rights reserved.</span>
          <span className="mono footer-tagline">// Built for the AI hiring era</span>
        </div>
      </div>
    </footer>
  );
}
