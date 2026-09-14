import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axe from "axe-core";
import App from "../App";
import { WorkspaceProvider } from "../context";
import { createLocalRepository } from "../lib/repository";
import { LOCAL_USER } from "../lib/constants";

describe("accessibility smoke checks", () => {
  it("has no automated axe violations on the empty dashboard", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <WorkspaceProvider
          initialUser={{ id: LOCAL_USER, email: "Local" }}
          repository={createLocalRepository()}
        >
          <App />
        </WorkspaceProvider>
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: "Make your next move count." }),
    ).toBeVisible();
    document.documentElement.lang = "en";
    document.title = "Career Command Center";
    const results = await axe.run(document);
    expect(results.violations).toEqual([]);
  });
});
