import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";

/* Lazy-loaded routes for better performance */
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Apply = lazy(() => import("./pages/Apply.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const CandidateProfile = lazy(() => import("./pages/CandidateProfile.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const Analytics = lazy(() => import("./pages/Analytics.jsx"));
const Demo = lazy(() => import("./pages/Demo.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));
const Assessments = lazy(() => import("./pages/Assessments.jsx"));
const AssessmentBuilder = lazy(() => import("./pages/AssessmentBuilder.jsx"));
const SubmissionReview = lazy(() => import("./pages/SubmissionReview.jsx"));
const Compare = lazy(() => import("./pages/Compare.jsx"));
const CandidateAssessment = lazy(() => import("./pages/CandidateAssessment.jsx"));
const AssessmentAIChat = lazy(() => import("./pages/AssessmentAIChat.jsx"));

function LoadingScreen() {
  return (
    <div className="app-loading-screen">
      <div className="app-loading-spinner" />
    </div>
  );
}

const NO_FOOTER = ["/dashboard", "/settings", "/assess", "/ai-builder"];
const NO_NAV = ["/assess", "/ai-builder"];

export default function App() {
  const { loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  const showFooter = !NO_FOOTER.some((p) => location.pathname.startsWith(p));
  const showNav = !NO_NAV.some((p) => location.pathname.startsWith(p));

  return (
    <ToastProvider>
      {showNav && <Navbar />}
      <main>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/demo" element={<Demo />} />

            {/* Public assessment route — no auth, no nav */}
            <Route path="/assess/:token" element={<CandidateAssessment />} />

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/candidates/:id" element={<ProtectedRoute><CandidateProfile /></ProtectedRoute>} />
            <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/dashboard/assessments" element={<ProtectedRoute><Assessments /></ProtectedRoute>} />
            <Route path="/dashboard/assessments/:id" element={<ProtectedRoute><AssessmentBuilder /></ProtectedRoute>} />
            <Route path="/dashboard/submissions/:id" element={<ProtectedRoute><SubmissionReview /></ProtectedRoute>} />
            <Route path="/dashboard/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
            <Route path="/ai-builder" element={<ProtectedRoute><AssessmentAIChat /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {showFooter && <Footer />}
    </ToastProvider>
  );
}
