import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const parseEnv = (text) => Object.fromEntries(text.split(/\r?\n/).flatMap((line) => { const m = line.match(/^\s*([^#=]+)=(.*)$/); return m ? [[m[1].trim(), m[2].trim().replace(/^['"]|['"]$/g, "")]] : []; }));
const env = parseEnv(await fs.readFile(path.join(root, ".env"), "utf8"));
const backup = JSON.parse(await fs.readFile(path.join(root, "private/cloud-accounts.json"), "utf8"))[0];
const base = env.VITE_SUPABASE_URL.replace(/\/$/, "");
if (!env.SUPABASE_SERVICE_KEY || !base) throw new Error("New Supabase URL and service key are required.");
const headers = { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, "Content-Type": "application/json" };
const listResponse = await fetch(`${base}/auth/v1/admin/users?per_page=1000`, { headers });
const listBody = await listResponse.text();
if (!listResponse.ok) throw new Error(`Supabase admin API rejected service key (${listResponse.status}): ${listBody.slice(0, 300)}`);
const users = JSON.parse(listBody).users || [];
const existing = users.find((user) => user.email?.toLowerCase() === backup.email.toLowerCase());
if (existing) {
  console.log(JSON.stringify({ mode: "existing", id: existing.id, email: existing.email, confirmed: Boolean(existing.email_confirmed_at) }, null, 2));
} else {
  const response = await fetch(`${base}/auth/v1/admin/users`, { method: "POST", headers, body: JSON.stringify({ email: backup.email, password: backup.password, email_confirm: true, user_metadata: { display_name: "Moshe Dayan" } }) });
  const body = await response.text();
  if (!response.ok) throw new Error(`Supabase admin user creation failed (${response.status}): ${body.slice(0, 400)}`);
  const created = JSON.parse(body);
  console.log(JSON.stringify({ mode: "created", id: created.id, email: created.email, confirmed: Boolean(created.email_confirmed_at) }, null, 2));
}
