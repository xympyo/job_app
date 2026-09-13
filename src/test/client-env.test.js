import { describe, expect, it } from "vitest";
import {
  clientEnvironment,
  preventPrivateCredentials,
} from "../../scripts/client-env";

describe("frontend credential boundary", () => {
  it("exposes only the URL and public key, even with old prefixed secrets present", () => {
    const result = clientEnvironment({
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_ANON_KEY: "sb_publishable_test",
      VITE_SUPABASE_SECRET_KEY: "sb_secret_test",
      SUPABASE_ACCESS_TOKEN: "management-test-only",
    });
    expect(Object.keys(result)).toEqual([
      "import.meta.env.VITE_SUPABASE_URL",
      "import.meta.env.VITE_SUPABASE_ANON_KEY",
    ]);
    expect(JSON.stringify(result)).not.toContain("sb_secret_test");
    expect(JSON.stringify(result)).not.toContain("management-test-only");
  });
  it("rejects privileged keys accidentally placed in the public-key variable", () => {
    expect(() =>
      clientEnvironment({ VITE_SUPABASE_ANON_KEY: "sb_secret_test" }),
    ).toThrow(/Private/);
    const jwt = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.test`;
    expect(() => clientEnvironment({ VITE_SUPABASE_ANON_KEY: jwt })).toThrow(
      /Private/,
    );
  });
  it("fails builds that contain a known private credential without printing it", () => {
    const plugin = preventPrivateCredentials({
      SUPABASE_SECRET_KEY: "sb_secret_test_only",
    });
    const run = () =>
      plugin.generateBundle.call(
        {
          error: (message) => {
            throw new Error(message);
          },
        },
        {},
        {
          "app.js": {
            type: "chunk",
            code: 'const secret="sb_secret_test_only"',
          },
        },
      );
    expect(run).toThrow(
      "Build blocked: a private Supabase credential appeared in a browser asset.",
    );
  });
});
