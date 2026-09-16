import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { WorkspaceProvider } from "../context";
import { createLocalRepository } from "../lib/repository";
import { LOCAL_USER } from "../lib/constants";

const renderApp = (path = "/", props = {}) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <WorkspaceProvider {...props}>
        <App />
      </WorkspaceProvider>
    </MemoryRouter>,
  );
describe("private workspace UI", () => {
  it("shows the concise Help playbook and reset control", async () => {
    renderApp("/guide", {
      initialUser: { id: LOCAL_USER, email: "Local" },
      repository: createLocalRepository(),
    });
    expect(await screen.findByRole("heading", { name: "Start Here" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Find jobs" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Triage jobs" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Apply today" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Track progress" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Restart Getting Started" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Copy a prompt" })).not.toBeInTheDocument();
  });
  it("teaches a new user the workflow and lets them defer the welcome", async () => {
    const u = userEvent.setup();
    renderApp("/", {
      initialUser: { id: LOCAL_USER, email: "Local" },
      repository: createLocalRepository(),
    });
    expect(await screen.findByRole("heading", { name: "Build your career profile" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Getting started" })).toBeVisible();
    await u.click(screen.getByRole("button", { name: "I'll do this later" }));
    expect(screen.queryByRole("heading", { name: "Build your career profile" })).not.toBeInTheDocument();
  });
  it("starts from the dashboard and moves a reviewed card through Jobs", async () => {
    const u = userEvent.setup();
    renderApp("/", {
      initialUser: { id: LOCAL_USER, email: "Local" },
      repository: createLocalRepository(),
    });
    await u.click(await screen.findByRole("button", { name: "Add vacancy" }));
    await u.type(screen.getByLabelText("Company *"), "Workflow Example");
    await u.type(
      screen.getByLabelText("Job title *"),
      "Transformation Analyst",
    );
    await u.click(screen.getByRole("button", { name: "Add to inbox" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await u.click(screen.getByRole("link", { name: "Review jobs" }));
    await u.click(screen.getByRole("button", { name: "Review", exact: true }));
    expect(await screen.findByText("Marked Reviewing")).toBeVisible();
    await u.click(
      screen.getByRole("button", { name: "Ready to Apply", exact: true }),
    );
    expect(
      await screen.findByText("Ready to Apply — continue in Jobs"),
    ).toBeVisible();
    await u.click(
      within(
        screen.getByRole("navigation", { name: "Main navigation" }),
      ).getByRole("link", { name: "Overview" }),
    );
    await u.click(
      await screen.findByRole("link", {
        name: /Ready to apply Transformation Analyst/,
      }),
    );
    expect(
      await screen.findByRole("button", { name: "Prepare application" }),
    ).toBeVisible();
  });
  it("guards private routes and allows deliberate local entry", async () => {
    const user = userEvent.setup();
    renderApp("/applications");
    expect(
      await screen.findByRole("button", { name: /Open local workspace/ }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Your applications" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Open local workspace/ }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Make your next move count.",
      }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(
      await screen.findByRole("button", { name: /Open local workspace/ }),
    ).toBeVisible();
  });
  it("creates, edits, prepares, changes stage and persists an application question through the UI", async () => {
    const user = userEvent.setup();
    renderApp("/jobs", {
      initialUser: { id: LOCAL_USER, email: "Local" },
      repository: createLocalRepository(),
    });
    await user.click(
      await screen.findByRole("button", { name: "Add vacancy" }),
    );
    await user.type(screen.getByLabelText("Company *"), "Example Company");
    await user.type(screen.getByLabelText("Job title *"), "Business Analyst");
    await user.click(screen.getByRole("button", { name: "Add to inbox" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await user.click(
      screen.getByRole("link", { name: /Example Company Business Analyst/ }),
    );
    await user.click(screen.getByRole("button", { name: "Edit vacancy" }));
    const input = screen.getByLabelText("Job title *");
    await user.clear(input);
    await user.type(input, "IT Business Analyst");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await user.click(
      screen.getByRole("button", { name: "Prepare application" }),
    );
    await user.click(await screen.findByRole("button", { name: "Update" }));
    await user.selectOptions(
      screen.getByLabelText("Application stage"),
      "Applied",
    );
    await user.type(screen.getByLabelText("Date applied"), "2026-09-14");
    await user.click(screen.getByRole("button", { name: "Save application" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Add question" }));
    await user.type(screen.getByLabelText("Question *"), "Why this role?");
    await user.type(screen.getByLabelText("Draft answer"), "Working draft");
    await user.type(
      screen.getByLabelText("Final / submitted answer"),
      "Final answer",
    );
    await user.click(screen.getByRole("button", { name: "Save question" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Working draft")).toBeVisible();
    expect(screen.getByText("Final answer")).toBeVisible();
    const persisted = await createLocalRepository().load(LOCAL_USER);
    expect(persisted.jobs[0].title).toBe("IT Business Analyst");
    expect(persisted.applications[0].status).toBe("Applied");
    expect(persisted.application_questions[0].final_answer).toBe(
      "Final answer",
    );
  }, 20000);
  it("shows a recoverable load error without displaying a blank workspace", async () => {
    renderApp("/", {
      initialUser: { id: LOCAL_USER },
      repository: {
        load: async () => {
          throw new Error("Database request failed");
        },
      },
    });
    expect(
      await screen.findByRole("heading", {
        name: "Your workspace couldn't load",
      }),
    ).toBeVisible();
    expect(
      within(screen.getByRole("alert")).getByText("Database request failed"),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });
  it("previews an import, warns about within-batch duplicates and saves only after confirmation", async () => {
    const user = userEvent.setup();
    renderApp("/research", {
      initialUser: { id: LOCAL_USER },
      repository: createLocalRepository(),
    });
    const input = await screen.findByLabelText("Paste researched jobs");
    await user.click(input);
    await user.paste(
      JSON.stringify({
        version: 1,
        research_run: { goal: "QA research" },
        jobs: [
          { company: "QA", title: "Analyst" },
          { company: "QA", title: "Analyst" },
        ],
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "Validate & preview" }),
    );
    expect(screen.getByText("Possible duplicate")).toBeVisible();
    expect((await createLocalRepository().load(LOCAL_USER)).jobs).toHaveLength(
      0,
    );
    await user.click(screen.getByRole("button", { name: "Confirm import" }));
    expect(await screen.findByText("1 vacancies added")).toBeVisible();
    expect((await createLocalRepository().load(LOCAL_USER)).jobs).toHaveLength(
      1,
    );
  });
});
