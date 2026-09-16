import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { WorkspaceProvider } from "../context";
import { createLocalRepository } from "../lib/repository";
import { createLocalProfileRepository } from "../v2/profile-repository.js";

const user = { id: "99999999-9999-4999-8999-999999999999", email: "new@example.test" };
const renderApp = (path = "/") => render(<MemoryRouter initialEntries={[path]}><WorkspaceProvider initialUser={user} repository={createLocalRepository()}><App /></WorkspaceProvider></MemoryRouter>);

describe("Gate 2B manual career profile UX", () => {
  it("guides a new account to a useful profile and publishes explicitly", async () => {
    window.confirm = () => true;
    const u = userEvent.setup();
    renderApp("/");
    expect(await screen.findByRole("heading", { name: "Build your career profile" })).toBeVisible();
    await u.click(screen.getByRole("link", { name: "Set up my profile" }));
    await u.click(await screen.findByRole("button", { name: /Career direction/ }));
    await u.type(await screen.findByLabelText("Target roles or directions"), "Product, Analyst");
    await u.click(screen.getByRole("button", { name: /Experience/ }));
    await u.click(screen.getByRole("button", { name: "Add experience" }));
    await u.click(screen.getByRole("button", { name: /Review/ }));
    await u.click(screen.getByRole("button", { name: "Publish profile" }));
    expect(await screen.findByRole("heading", { name: "Your career profile" })).toBeVisible();
    expect(await screen.findByText("Product · Analyst")).toBeVisible();
    const stored = createLocalProfileRepository().state;
    expect(stored.profiles).toHaveLength(1);
    expect(stored.revisions.filter((revision) => revision.status === "published")).toHaveLength(1);
  });

  it("keeps published data safe while editing and supports discard", async () => {
    window.confirm = () => true;
    const u = userEvent.setup();
    renderApp("/career");
    await u.click(await screen.findByRole("button", { name: "Set up my profile" }));
    await u.click(await screen.findByRole("button", { name: /Career direction/ }));
    await u.type(await screen.findByLabelText("Target roles or directions"), "Consulting");
    await u.click(screen.getByRole("button", { name: /Experience/ }));
    await u.click(screen.getByRole("button", { name: "Add experience" }));
    await u.click(screen.getByRole("button", { name: /Review/ }));
    await u.click(screen.getByRole("button", { name: "Publish profile" }));
    await u.click(await screen.findByRole("button", { name: "Edit profile" }));
    await u.click(screen.getByRole("button", { name: /Career direction/ }));
    const roles = screen.getByLabelText("Target roles or directions");
    await u.clear(roles);
    await u.type(roles, "Different direction");
    await u.click(screen.getByRole("button", { name: /Review/ }));
    expect(screen.getByText("Changed")).toBeVisible();
    await u.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(await screen.findByText(/Consulting/)).toBeVisible();
    await waitFor(() => expect(createLocalProfileRepository().state.revisions.filter((revision) => revision.status === "draft")).toHaveLength(0));
  });

  it("offers a safe skip path and remains accessible before setup", async () => {
    const u = userEvent.setup();
    renderApp("/career");
    expect(await screen.findByRole("heading", { name: "Build your career profile" })).toBeVisible();
    await u.click(screen.getByRole("button", { name: "I’ll do this later" }));
    expect(await screen.findByRole("heading", { name: "Build your career profile" })).toBeVisible();
    document.documentElement.lang = "en";
    document.title = "Career Command Center";
    expect((await axe.run(document)).violations).toEqual([]);
  });
});
