import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import NotificationBell from "./NotificationBell.jsx";

function useHashScroll() {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(
    (e, hash) => {
      e.preventDefault();
      const id = hash.replace("#", "");
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100);
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }
    },
    [navigate, location.pathname]
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollTo = useHashScroll();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <>
      <nav className={`nav${scrolled ? " nav-scrolled" : ""}`}>
        <div className="container">
          <div className="nav-inner">
            <Link to="/" className="brand">
              <div className="brand-mark">HC</div>
              CodeHire
            </Link>

            <div className="nav-links">
              <a href="#features" onClick={(e) => scrollTo(e, "#features")} className="nav-link">Products</a>
              <a href="#how" onClick={(e) => scrollTo(e, "#how")} className="nav-link">How It Works</a>
              <a href="#why" onClick={(e) => scrollTo(e, "#why")} className="nav-link">Why Us</a>
              <Link to="/demo" className="nav-link">Demo</Link>
              <Link to="/apply" className="nav-link">Apply</Link>
            </div>

            <div className="nav-actions">
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                aria-label="Toggle theme"
              >
                {theme === "light" ? "☾" : "☀"}
              </button>
              {user ? (
                <>
                  <Link to="/dashboard" className={`btn btn-outline btn-nav ${isActive("/dashboard") ? "nav-btn-active" : ""}`}>
                    Dashboard
                  </Link>
                  <Link to="/dashboard/assessments" className={`nav-link ${isActive("/dashboard/assessments") ? "nav-link-active" : ""}`}>
                    Assessments
                  </Link>
                  <Link to="/dashboard/compare" className={`nav-link ${isActive("/dashboard/compare") ? "nav-link-active" : ""}`}>
                    Compare
                  </Link>
                  <NotificationBell />
                  <Link to="/settings" className={`nav-link ${isActive("/settings") ? "nav-link-active" : ""}`} title="Settings">
                    ⚙
                  </Link>
                  <button onClick={handleLogout} className="btn btn-primary btn-nav">Log out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className={`nav-link ${isActive("/login") ? "nav-link-active" : ""}`}>Log in</Link>
                  <Link to="/apply" className="btn btn-primary btn-nav">Apply For Access</Link>
                </>
              )}
            </div>

            <button
              className={`hamburger${menuOpen ? " open" : ""}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer${menuOpen ? " open" : ""}`} aria-hidden={!menuOpen}>
        <div className="mobile-drawer-inner">
          <a href="#features" onClick={(e) => scrollTo(e, "#features")} className="mobile-link">Products</a>
          <a href="#how" onClick={(e) => scrollTo(e, "#how")} className="mobile-link">How It Works</a>
          <a href="#why" onClick={(e) => scrollTo(e, "#why")} className="mobile-link">Why Us</a>
          <Link to="/demo" className="mobile-link">Demo</Link>
          <Link to="/apply" className="mobile-link">Apply</Link>
          <div className="mobile-divider" />
          {user ? (
            <>
              <Link to="/dashboard" className={`mobile-link ${isActive("/dashboard") ? "mobile-link-active" : ""}`}>Dashboard</Link>
              <Link to="/dashboard/assessments" className={`mobile-link ${isActive("/dashboard/assessments") ? "mobile-link-active" : ""}`}>Assessments</Link>
              <Link to="/dashboard/compare" className={`mobile-link ${isActive("/dashboard/compare") ? "mobile-link-active" : ""}`}>Compare</Link>
              <Link to="/settings" className={`mobile-link ${isActive("/settings") ? "mobile-link-active" : ""}`}>Settings</Link>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                <span className="mobile-link" style={{ border: "none", margin: 0, padding: 0 }}>Notifications</span>
                <NotificationBell />
              </div>
              <button onClick={handleLogout} className="btn btn-primary btn-block" style={{ marginTop: 8 }}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-link">Log in</Link>
              <Link to="/apply" className="btn btn-primary btn-block" style={{ marginTop: 8 }}>Apply For Access</Link>
            </>
          )}
        </div>
      </div>

      {menuOpen && <div className="drawer-overlay" onClick={() => setMenuOpen(false)} />}
    </>
  );
}
