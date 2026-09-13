import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
afterEach(() => {
  cleanup();
  localStorage.clear();
});
HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
HTMLDialogElement.prototype.close = function () {
  this.open = false;
};
Object.defineProperty(globalThis, "crypto", {
  value: {
    randomUUID: () =>
      `${Math.random().toString(16).slice(2, 10).padEnd(8, "0")}-0000-4000-8000-000000000001`,
  },
});
window.matchMedia = vi
  .fn()
  .mockImplementation(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
