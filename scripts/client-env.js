// Vite configuration helpers: no private configuration is passed to browser code.
export function clientEnvironment(env) {
  const key = env.VITE_SUPABASE_ANON_KEY || "";
  let privateKey = key.startsWith("sb_secret_");
  if (key.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url"));
      privateKey ||= payload.role !== "anon";
    } catch {
      throw new Error(
        "VITE_SUPABASE_ANON_KEY must be a valid public Supabase key.",
      );
    }
  }
  if (privateKey)
    throw new Error(
      "Private Supabase credentials cannot be used as the frontend public key.",
    );
  return {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      env.VITE_SUPABASE_URL || "",
    ),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(key),
  };
}

export function preventPrivateCredentials(env) {
  const values = Object.entries(env)
    .filter(
      ([name, value]) =>
        /SUPABASE_(SECRET_KEY|SERVICE_KEY|SERVICE_ROLE_KEY|ACCESS_TOKEN|DB_URL)$/.test(
          name,
        ) &&
        value &&
        value !== env.VITE_SUPABASE_ANON_KEY,
    )
    .map(([, value]) => value);
  return {
    name: "prevent-private-credentials",
    generateBundle(_options, bundle) {
      for (const item of Object.values(bundle)) {
        const contents =
          item.type === "chunk" ? item.code : String(item.source);
        if (values.some((value) => contents.includes(value))) {
          this.error(
            "Build blocked: a private Supabase credential appeared in a browser asset.",
          );
        }
      }
    },
  };
}
