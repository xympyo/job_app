import { useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
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
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Upload,
  X,
} from "lucide-react";
import { useWorkspace } from "./context";
import { supabase } from "./lib/repository";
import { AsyncForm, Button, Empty, ErrorBox, Input } from "./components/ui";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";
import Research from "./pages/Research";
import Library from "./pages/Library";

export function Login() {
  const {
    user,
    authLoading,
    configured,
    configurationError,
    localAllowed,
    enterLocal,
    error,
  } = useWorkspace();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  if (authLoading) return <Loading label="Checking your session…" />;
  if (user) return <Navigate to="/" replace />;
  return (
    <div className="login-page">
      <section className="login-story">
        <div className="brand">
          <span className="brand-icon">
            <ArrowUpRight size={22} />
          </span>
          <span>
            Career<span className="brand-sub">COMMAND CENTER</span>
          </span>
        </div>
        <div>
          <div className="eyebrow">A LITTLE CLARITY GOES A LONG WAY.</div>
          <h1>
            Your next chapter.
            <br />
            With a sense
            <br />
            of direction.
          </h1>
          <p>
            One place for the opportunities, decisions and conversations that
            move your career forward.
          </p>
        </div>
        <span className="login-footer">FIND · EVALUATE · APPLY · PROGRESS</span>
      </section>
      <section className="login-form">
        <div className="login-card">
          <span className="eyebrow">PERSONAL CAREER WORKSPACE</span>
          <h2>
            {configured
              ? "Welcome back."
              : localAllowed
                ? "Start with a clear view."
                : "Connect your workspace."}
          </h2>
          <p>
            {configured
              ? "Sign in to pick up where you left off."
              : localAllowed
                ? "Your private career command center is ready for local use."
                : "Add your Supabase connection to enable private sign-in."}
          </p>
          <ErrorBox message={error} />
          {configured ? (
            <AsyncForm
              onSubmit={async () => {
                const { error } = await supabase.auth.signInWithPassword({
                  email,
                  password,
                });
                if (error) throw error;
              }}
            >
              <Input
                label="Email address"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button className="full-width" variant="primary">
                Sign in
                <ArrowUpRight size={17} />
              </Button>
              <p className="small muted">
                Private workspace. Use the account provisioned in your Supabase
                project.
              </p>
            </AsyncForm>
          ) : localAllowed ? (
            <>
              <Button
                variant="primary"
                className="full-width"
                onClick={enterLocal}
              >
                Open local workspace
                <ArrowUpRight size={17} />
              </Button>
              <div className="local-explanation">
                <strong>Saved in this browser</strong>
                <p>
                  Local records persist here between visits. Export backups from
                  your toolkit. Connect Supabase for protected sign-in and
                  access across devices.
                </p>
              </div>
            </>
          ) : (
            <ErrorBox
              message={
                configurationError
                  ? "Supabase configuration is incomplete or invalid. Check the project URL and public key."
                  : "Supabase is not connected. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before using this hosted app."
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}
function Loading({ label = "Loading your workspace…" }) {
  return (
    <div role="status" className="loading-screen">
      <span className="loading-dot" />
      {label}
    </div>
  );
}
export function ProtectedRoute() {
  const { user, authLoading } = useWorkspace();
  if (authLoading) return <Loading label="Checking your session…" />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
const navigation = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/applications", label: "Applications", icon: BriefcaseBusiness },
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
              {to === "/inbox" && (
                <span className="nav-count">
                  {
                    data.jobs.filter(
                      (j) =>
                        j.review_status === "Found" &&
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
            <span className="avatar">MD</span>
            <div>
              <strong>Moshe Dayan</strong>
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
              MD
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
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="attention" element={<Dashboard attentionOnly />} />
          {["inbox", "applications", "history"].map((area) => (
            <Route
              key={area}
              path={`${area}/:id?`}
              element={<Workspace key={area} area={area} />}
            />
          ))}
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
