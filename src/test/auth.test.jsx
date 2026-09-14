import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { emptyData, seedCVs } from "../lib/domain";
import { LOCAL_USER } from "../lib/constants";

const auth = vi.hoisted(() => ({
  listener: null,
  getUser: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  resend: vi.fn(),
  verifyOtp: vi.fn(),
}));
vi.mock("../lib/repository", () => ({
  configured: true,
  configurationError: false,
  localAllowed: false,
  createCloudRepository: vi.fn(),
  createLocalRepository: vi.fn(),
  supabase: {
    auth: {
      getUser: auth.getUser,
      signInWithPassword: auth.signInWithPassword,
      signOut: auth.signOut,
      signUp: auth.signUp,
      resend: auth.resend,
      verifyOtp: auth.verifyOtp,
      onAuthStateChange: (callback) => {
        auth.listener = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
  },
}));
import App from "../App";
import { WorkspaceProvider } from "../context";

afterEach(() => {
  vi.clearAllMocks();
  auth.listener = null;
});

function renderAuth(path) {
  auth.getUser.mockResolvedValue({
    data: { user: null },
    error: { name: "AuthSessionMissingError" },
  });
  const repository = { load: vi.fn(async () => emptyData()) };
  render(
    <MemoryRouter initialEntries={[path]}>
      <WorkspaceProvider repository={repository}>
        <App />
      </WorkspaceProvider>
    </MemoryRouter>,
  );
  return repository;
}

describe("verified signup", () => {
  it("rejects mismatched passwords, requests confirmation and keeps private data locked", async () => {
    const repository = renderAuth("/signup");
    const u = userEvent.setup();
    await screen.findByRole("button", { name: "Create account" });
    await u.type(screen.getByLabelText("Your name"), "Test Person");
    await u.type(screen.getByLabelText("Email address"), "new@example.test");
    await u.type(
      screen.getByLabelText("Password", { exact: true }),
      "long-test-password",
    );
    await u.type(
      screen.getByLabelText("Confirm password"),
      "different-password",
    );
    await u.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Passwords don't match.")).toBeVisible();
    expect(auth.signUp).not.toHaveBeenCalled();
    await u.clear(screen.getByLabelText("Confirm password"));
    await u.type(
      screen.getByLabelText("Confirm password"),
      "long-test-password",
    );
    auth.signUp.mockResolvedValue({
      data: { user: { id: "unconfirmed" }, session: null },
      error: null,
    });
    await u.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      await screen.findByRole("heading", { name: "Check your email." }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: /Resend available in/ }),
    ).toBeDisabled();
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "new@example.test",
      password: "long-test-password",
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: { display_name: "Test Person" },
      },
    });
    expect(repository.load).not.toHaveBeenCalled();
  });

  it("shows email delivery failure without pretending signup succeeded", async () => {
    renderAuth("/signup");
    const u = userEvent.setup();
    await screen.findByRole("button", { name: "Create account" });
    for (const [label, value] of [
      ["Your name", "Test"],
      ["Email address", "new@example.test"],
      ["Password", "long-test-password"],
      ["Confirm password", "long-test-password"],
    ])
      await u.type(screen.getByLabelText(label, { exact: true }), value);
    auth.signUp.mockResolvedValue({
      error: { code: "email_address_not_authorized" },
    });
    await u.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "couldn't send the verification email",
    );
    expect(
      screen.queryByRole("heading", { name: "Check your email." }),
    ).not.toBeInTheDocument();
  });

  it("resends confirmation with a cooldown and generic account response", async () => {
    renderAuth("/verify-email");
    const u = userEvent.setup();
    await u.type(
      screen.getByLabelText("Email address"),
      "pending@example.test",
    );
    auth.resend.mockResolvedValue({ error: null });
    await u.click(
      screen.getByRole("button", { name: "Resend verification email" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "If this address needs verification",
    );
    expect(
      screen.getByRole("button", { name: /Resend available in/ }),
    ).toBeDisabled();
    expect(auth.resend).toHaveBeenCalledWith({
      type: "signup",
      email: "pending@example.test",
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
  });

  it("requires an explicit confirmation click and supports a token on a fresh browser", async () => {
    renderAuth("/auth/confirm?token_hash=one-time-test-token&type=signup");
    expect(auth.verifyOtp).not.toHaveBeenCalled();
    auth.verifyOtp.mockResolvedValue({ error: null });
    await userEvent
      .setup()
      .click(await screen.findByRole("button", { name: "Verify email" }));
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: "one-time-test-token",
      type: "signup",
    });
    expect(
      await screen.findByRole("heading", { name: "Email verified." }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Open your workspace" }),
    ).toHaveAttribute("href", "/");
  });

  it("offers recovery for expired verification and rejects incomplete links", async () => {
    renderAuth("/auth/confirm?token_hash=expired&type=signup");
    auth.verifyOtp.mockResolvedValue({ error: { code: "otp_expired" } });
    await userEvent
      .setup()
      .click(await screen.findByRole("button", { name: "Verify email" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "expired or was already used",
    );
    expect(
      screen.getByRole("link", { name: "Request a new verification email" }),
    ).toBeVisible();
  });

  it("does not consume tokens with an unsupported verification type", async () => {
    renderAuth("/auth/confirm?token_hash=other&type=recovery");
    expect(await screen.findByRole("alert")).toHaveTextContent("incomplete");
    expect(
      screen.queryByRole("button", { name: "Verify email" }),
    ).not.toBeInTheDocument();
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });
});
describe("Supabase email/password interaction (mocked service)", () => {
  it("shows auth errors, accepts a session, loads owned records and clears UI on logout", async () => {
    auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthSessionMissingError" },
    });
    auth.signInWithPassword
      .mockResolvedValueOnce({ error: new Error("Invalid login credentials") })
      .mockImplementationOnce(async () => {
        auth.listener("SIGNED_IN", {
          user: { id: LOCAL_USER, email: "moshe@example.test" },
        });
        return { error: null };
      });
    auth.signOut.mockImplementation(async () => {
      auth.listener("SIGNED_OUT", null);
      return { error: null };
    });
    const d = emptyData();
    seedCVs(d, LOCAL_USER);
    const repository = { load: vi.fn(async () => d) };
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/inbox"]}>
        <WorkspaceProvider repository={repository}>
          <App />
        </WorkspaceProvider>
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("button", { name: "Sign in" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Open local workspace" }),
    ).not.toBeInTheDocument();
    await user.type(
      screen.getByLabelText("Email address"),
      "moshe@example.test",
    );
    await user.type(screen.getByLabelText("Password"), "test-password-only");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Invalid login credentials")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByRole("heading", {
        name: "Make your next move count.",
      }),
    ).toBeVisible();
    expect(repository.load).toHaveBeenCalledWith(LOCAL_USER);
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Sign in" })).toBeVisible(),
    );
    expect(
      screen.queryByRole("heading", { name: "Make your next move count." }),
    ).not.toBeInTheDocument();
  });
});
