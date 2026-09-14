import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useWorkspace } from "../context";
import { supabase } from "../lib/repository";
import { authError, validateSignup, verificationURL } from "../lib/auth";
import { AsyncForm, Button, ErrorBox, Input } from "../components/ui";

function AuthShell({ title, description, children }) {
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
          <h2>{title}</h2>
          <p>{description}</p>
          {children}
        </div>
      </section>
    </div>
  );
}

function Password({ label = "Password", value, onChange, signup = false }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Input
        label={label}
        type={visible ? "text" : "password"}
        autoComplete={signup ? "new-password" : "current-password"}
        required
        minLength={signup ? 12 : undefined}
        maxLength={signup ? 72 : undefined}
        value={value}
        onChange={onChange}
        hint={
          signup
            ? "At least 12 characters. Use a password unique to this account."
            : undefined
        }
      />
      <label className="check">
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
        />
        Show password
      </label>
    </>
  );
}

function Email({ value, setValue }) {
  return (
    <Input
      label="Email address"
      type="email"
      autoComplete="email"
      maxLength={254}
      required
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  if (authLoading)
    return (
      <div role="status" className="loading-screen">
        Checking your session…
      </div>
    );
  if (user) return <Navigate to="/" replace />;
  return (
    <AuthShell
      title={
        configured
          ? "Welcome back."
          : localAllowed
            ? "Start with a clear view."
            : "Connect your workspace."
      }
      description={
        configured
          ? "Sign in to pick up where you left off."
          : localAllowed
            ? "Your private career command center is ready for local use."
            : "Add your Supabase connection to enable private sign-in."
      }
    >
      <ErrorBox message={error} />
      {configured ? (
        <>
          <AsyncForm
            onSubmit={async () => {
              const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
              });
              if (error) throw new Error(authError(error));
            }}
          >
            <Email value={email} setValue={setEmail} />
            <Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button className="full-width" variant="primary">
              Sign in
              <ArrowUpRight size={17} />
            </Button>
          </AsyncForm>
          <p className="small">
            <Link to="/signup">Create an account</Link>
          </p>
          <p className="small">
            <Link to="/verify-email" state={{ email: email.trim() }}>
              Need a new verification email?
            </Link>
          </p>
        </>
      ) : localAllowed ? (
        <>
          <Button variant="primary" className="full-width" onClick={enterLocal}>
            Open local workspace
            <ArrowUpRight size={17} />
          </Button>
          <div className="local-explanation">
            <strong>Saved in this browser</strong>
            <p>
              Local records persist here between visits. Export backups from
              your toolkit. Connect Supabase for protected sign-in and access
              across devices.
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
    </AuthShell>
  );
}

export function Signup() {
  const { user, configured, authLoading } = useWorkspace();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  if (!configured) return <Navigate to="/login" replace />;
  if (authLoading)
    return (
      <div role="status" className="loading-screen">
        Checking your session…
      </div>
    );
  if (user) return <Navigate to="/" replace />;
  if (submitted)
    return (
      <Navigate
        to="/verify-email"
        state={{ email: email.trim(), requested: true }}
        replace
      />
    );
  return (
    <AuthShell
      title="Create your workspace."
      description="Verify your email to start your own private career workspace."
    >
      <AsyncForm
        onSubmit={async () => {
          validateSignup(password, confirmation);
          if (!name.trim()) throw new Error("Enter your name.");
          const { error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo: verificationURL(),
              data: { display_name: name.trim() },
            },
          });
          if (error) throw new Error(authError(error));
          setPassword("");
          setConfirmation("");
          setSubmitted(true);
        }}
      >
        <Input
          label="Your name"
          autoComplete="name"
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Email value={email} setValue={setEmail} />
        <Password
          signup
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          maxLength={72}
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
        <Button variant="primary" className="full-width">
          Create account
        </Button>
        <p className="small muted">
          Your records are visible only to your account. You must verify your
          email before you can sign in.
        </p>
      </AsyncForm>
      <p className="small">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </AuthShell>
  );
}

export function VerifyEmail() {
  const { configured } = useWorkspace();
  const { state } = useLocation();
  const [email, setEmail] = useState(state?.email || "");
  const [seconds, setSeconds] = useState(state?.requested ? 60 : 0);
  const [requested, setRequested] = useState(Boolean(state?.requested));
  useEffect(() => {
    const timer = setInterval(
      () => setSeconds((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);
  if (!configured) return <Navigate to="/login" replace />;
  return (
    <AuthShell
      title="Check your email."
      description="Open the verification email and follow its link. You can open it on another device."
    >
      {requested && (
        <p role="status">
          If this address needs verification, an email has been requested. Check
          your inbox and spam folder. Already verified? Sign in below.
        </p>
      )}
      <AsyncForm
        onSubmit={async () => {
          if (seconds > 0) return;
          const { error } = await supabase.auth.resend({
            type: "signup",
            email: email.trim(),
            options: { emailRedirectTo: verificationURL() },
          });
          setSeconds(60);
          if (error) throw new Error(authError(error));
          setRequested(true);
        }}
      >
        <Email value={email} setValue={setEmail} />
        <Button className="full-width" disabled={seconds > 0}>
          {seconds > 0
            ? `Resend available in ${seconds}s`
            : "Resend verification email"}
        </Button>
      </AsyncForm>
      <p className="small">
        Use the most recent email. If a link has expired or was already used,
        request a new one.
      </p>
      <p>
        <Link to="/login">Back to sign in</Link>
      </p>
      <p className="small">
        <Link to="/signup">Create an account with a different email</Link>
      </p>
    </AuthShell>
  );
}

export function ConfirmEmail() {
  const { configured, user, authLoading } = useWorkspace();
  const location = useLocation();
  const [token] = useState(() =>
    new URLSearchParams(location.search).get("token_hash"),
  );
  const [code] = useState(() =>
    new URLSearchParams(location.search).get("code"),
  );
  const [hashConfirmation] = useState(() =>
    window.location.hash.includes("access_token="),
  );
  const [type] = useState(() =>
    new URLSearchParams(location.search).get("type"),
  );
  const consumed = useRef(false);
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    if (!authLoading && user && hashConfirmation) setComplete(true);
    // Supabase consumes hash credentials while the page is loading. Remove them only after that.
    if (!authLoading && window.location.pathname === "/auth/confirm")
      window.history.replaceState(window.history.state, "", "/auth/confirm");
  }, [authLoading, hashConfirmation, user]);
  if (!configured) return <Navigate to="/login" replace />;
  if (authLoading)
    return (
      <div role="status" className="loading-screen">
        Confirming your email…
      </div>
    );
  return (
    <AuthShell
      title={complete ? "Email verified." : "Verify your email."}
      description={
        complete
          ? "Your private workspace is ready."
          : "Confirm below to finish creating your account."
      }
    >
      {complete ? (
        <Link className="btn primary full-width" to="/">
          Open your workspace
        </Link>
      ) : (token && type === "signup") || code ? (
        <AsyncForm
          onSubmit={async () => {
            if (consumed.current) return;
            consumed.current = true;
            try {
              const { error } = code
                ? await supabase.auth.exchangeCodeForSession(code)
                : await supabase.auth.verifyOtp({
                    token_hash: token,
                    type: "signup",
                  });
              if (error)
                throw new Error(
                  "This verification link has expired or was already used. Sign in if you already verified, or request a new email.",
                );
              setComplete(true);
            } finally {
              consumed.current = false;
            }
          }}
        >
          <Button variant="primary" className="full-width">
            Verify email
          </Button>
        </AsyncForm>
      ) : hashConfirmation ? (
        <p role="status">
          Your verification link is being processed. If this page does not
          update, return to sign in.
        </p>
      ) : (
        <ErrorBox message="This verification link is incomplete. Request a new verification email." />
      )}
      {!complete && (
        <>
          <p>
            <Link to="/verify-email">Request a new verification email</Link>
          </p>
          <p>
            <Link to="/login">Back to sign in</Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
