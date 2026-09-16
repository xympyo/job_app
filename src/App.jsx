import { useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  Upload,
  X,
  UserRound,
} from "lucide-react";
import { useWorkspace } from "./context";
import { Login, Signup, VerifyEmail, ConfirmEmail } from "./pages/Auth";
import { Button, Empty, ErrorBox } from "./components/ui";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";
import Research from "./pages/Research";
import Library from "./pages/Library";
import Guide from "./pages/Guide";
import Career from "./pages/Career";

function Loading({ label = "Loading your workspace…" }) {
  return (
    <div role="status" className="loading-screen">
      <span className="loading-dot" />
      {label}
    </div>
  );
}
function LegacyWorkspaceRedirect({ application = false }) {
  const location = useLocation();
  const { id } = useParams();
  const search = new URLSearchParams(location.search);
  if (application && !search.has("application")) search.set("application", "active");
  return <Navigate to={`/jobs${id ? `/${id}` : ""}${search.toString() ? `?${search}` : ""}`} replace />;
}
export function ProtectedRoute() {
  const { user, authLoading } = useWorkspace();
  if (authLoading) return <Loading label="Checking your session…" />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
const navigation = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { to: "/career", label: "Career", icon: UserRound },
  { to: "/attention", label: "Attention", icon: Flag },
  { to: "/history", label: "History", icon: Clock3 },
];
function Layout() {
  const {
    user,
    configured,
    data,
    loading,
    saving,
    error,
    notice,
    setNotice,
    reload,
    signOut,
  } = useWorkspace();
  const displayName =
    user.user_metadata?.display_name || user.email || "Your workspace";
  const initials = displayName.slice(0, 2).toUpperCase();
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <Link className="brand" to="/" onClick={() => setMenu(false)}>
          <span className="brand-icon">
            <ArrowUpRight size={23} />
          </span>
          <span>
            Career<span className="brand-sub">COMMAND CENTER</span>
          </span>
        </Link>
        <button
          className="sidebar-close icon-btn"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        >
          <X size={20} />
        </button>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setMenu(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {to === "/jobs" && (
                <span className="nav-count">
                  {
                    data.jobs.filter(
                      (j) =>
                        ["Found", "Reviewing"].includes(j.review_status) &&
                        !data.applications.some((a) => a.job_id === j.id),
                    ).length
                  }
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-label">RESOURCES</div>
        <nav aria-label="Resources">
          <NavLink to="/guide" onClick={() => setMenu(false)}>
            <CircleHelp size={18} />
            Start Here
          </NavLink>
          <NavLink to="/research" onClick={() => setMenu(false)}>
            <Upload size={18} />
            Research import
          </NavLink>
          <NavLink to="/companies" onClick={() => setMenu(false)}>
            <Building2 size={18} />
            Companies
          </NavLink>
          <NavLink to="/library" onClick={() => setMenu(false)}>
            <BookOpen size={18} />
            Career toolkit
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-mode">
            <span className={configured ? "online-dot" : "local-dot"} />
            {configured ? "Private cloud workspace" : "Local workspace"}
            <small>
              {configured
                ? "Protected by Supabase Auth"
                : "Stored in this browser only"}
            </small>
          </div>
          <div className="profile-row">
            <span className="avatar">{initials}</span>
            <div>
              <strong>{displayName}</strong>
              <small>Make the next move.</small>
            </div>
            <button
              className="icon-btn"
              aria-label="Sign out"
              onClick={signOut}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      {menu && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation overlay"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-btn"
              aria-label="Open navigation"
              aria-expanded={menu}
              onClick={() => setMenu(true)}
            >
              <Menu size={21} />
            </button>
            <span>Personal workspace</span>
            <span className="crumb-slash">/</span>
            <strong>
              {[
                ...navigation,
                { to: "/guide", label: "Start Here" },
                { to: "/research", label: "Research import" },
                { to: "/companies", label: "Companies" },
                { to: "/library", label: "Career toolkit" },
              ].find((n) => n.to !== "/" && location.pathname.startsWith(n.to))
                ?.label || "Overview"}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="save-indicator">
              <CheckCircle2 size={14} />
              {saving
                ? "Saving…"
                : configured
                  ? "Cloud connected"
                  : "Browser storage"}
            </span>
            <span className="avatar small-avatar" title={user.email}>
              {initials}
            </span>
          </div>
        </header>
        <main id="main">
          {error && (
            <div className="global-error">
              <ErrorBox message={error} />
              <Button onClick={reload}>Reload data</Button>
            </div>
          )}
          {notice && (
            <div className="toast" role="status">
              <CheckCircle2 size={17} />
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <X size={15} />
              </button>
            </div>
          )}
          {loading ? (
            <Loading />
          ) : error && !data.cv_versions.length ? (
            <Empty
              title="Your workspace couldn't load"
              description="Your saved records have not been replaced. Check the connection and retry."
            >
              <Button onClick={reload}>Try again</Button>
            </Empty>
          ) : (
            <Outlet />
          )}
        </main>
        <nav className="mobile-bottom" aria-label="Quick navigation">
          {navigation.slice(0, 4).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
          <button onClick={() => setMenu(true)}>
            <Menu size={20} />
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/auth/confirm" element={<ConfirmEmail />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="guide" element={<Guide />} />
          <Route path="career" element={<Career />} />
          <Route path="attention" element={<Dashboard attentionOnly />} />
          <Route path="jobs/:id?" element={<Workspace area="jobs" />} />
          <Route path="inbox/:id?" element={<LegacyWorkspaceRedirect />} />
          <Route path="applications/:id?" element={<LegacyWorkspaceRedirect application />} />
          <Route path="history/:id?" element={<Workspace area="history" />} />
          <Route path="research" element={<Research />} />
          <Route path="companies" element={<Library companiesOnly />} />
          <Route path="library" element={<Library />} />
          <Route
            path="*"
            element={
              <Empty
                title="This page isn't here"
                description="Return to your workspace to continue."
              >
                <Link className="btn primary" to="/">
                  Back to overview
                </Link>
              </Empty>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}
