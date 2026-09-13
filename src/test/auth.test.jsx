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
