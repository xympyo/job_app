import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {
  clientEnvironment,
  preventPrivateCredentials,
} from "./scripts/client-env.js";
export default defineConfig(({ mode }) => {
  const env = mode === "test" ? {} : loadEnv(mode, process.cwd(), "");
  return {
    // No wildcard VITE_ exposure, including when legacy variables remain on Vercel.
    envPrefix: [],
    define: clientEnvironment(env),
    plugins: [react(), tailwindcss(), preventPrivateCredentials(env)],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            supabase: ["@supabase/supabase-js"],
            validation: ["zod"],
            react: ["react", "react-dom", "react-router-dom"],
          },
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.js",
      exclude: ["node_modules/**", "dist/**"],
    },
  };
});
