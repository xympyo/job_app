import { createClient } from "@supabase/supabase-js";
import { CORE_TABLES, TABLES } from "./constants";
import { emptyData, seedCVs } from "./domain";
import { schemas } from "./schema";

const configUrl = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
let client = null;
if (configUrl && key) {
  try {
    if (!["https:", "http:"].includes(new URL(configUrl).protocol))
      throw new Error("Invalid Supabase URL");
    client = createClient(configUrl, key);
  } catch {
    /* Invalid public configuration is shown on the sign-in screen. */
  }
}
export const supabase = client;
export const configured = Boolean(client);
export const configurationError = Boolean(configUrl || key) && !configured;
export const localAllowed =
  import.meta.env.DEV && !configured && !configurationError;
const STORAGE_KEY = "career-command-center:v1";
export function changesBetween(before, after) {
  const changes = [];
  for (const table of [...TABLES].reverse())
    for (const row of before[table])
      if (!after[table].some((r) => r.id === row.id))
        changes.push({
          table,
          operation: "delete",
          row: { id: row.id },
          expected_updated_at: row.updated_at,
        });
  for (const table of TABLES)
    for (const row of after[table]) {
      const old = before[table].find((r) => r.id === row.id);
      if (JSON.stringify(row) !== JSON.stringify(old))
        changes.push({
          table,
          operation: "upsert",
          row,
          expected_updated_at: old?.updated_at || null,
        });
    }
  return changes;
}
function hydrate(table, row) {
  const value = Object.fromEntries(
    Object.entries(row).filter(([, v]) => v !== null),
  );
  return {
    ...schemas[table].parse(value),
    id: row.id,
    user_id: row.user_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
export function createLocalRepository(storage = localStorage) {
  return {
    async load(userId) {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw) {
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch {
          throw new Error(
            "Local data could not be read. Do not clear browser storage; recover from your JSON backup.",
          );
        }
        if (
          parsed.version !== 1 ||
          !CORE_TABLES.every((t) => Array.isArray(parsed.data?.[t]))
        )
          throw new Error(
            "Unsupported local data format. Your stored data has been left intact.",
          );
        return Object.fromEntries(
          TABLES.map((t) => [t, (parsed.data[t] || []).map((r) => hydrate(t, r))]),
        );
      }
      const data = emptyData();
      seedCVs(data, userId);
      storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, data }));
      return data;
    },
    async commit(before, after) {
      const raw = storage.getItem(STORAGE_KEY);
      if (
        raw &&
        JSON.stringify(JSON.parse(raw).data) !== JSON.stringify(before)
      )
        throw new Error(
          "This workspace changed in another tab. Reload before saving; your input is still here.",
        );
      storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, data: after }));
      return after;
    },
  };
}
const nullableColumns = new Set([
  "company_id",
  "recommended_cv_id",
  "research_run_id",
  "cv_version_id",
  "deadline",
  "published_at",
  "found_at",
  "last_verified_at",
  "verified_at",
  "applied_at",
  "next_action_at",
  "scheduled_at",
  "started_at",
  "completed_at",
  "researched_at",
  "accessed_at",
]);
export function createCloudRepository(client) {
  const repository = {
    async load(userId) {
      const results = await Promise.all(
        TABLES.map(async (table) => {
          let rows = [],
            from = 0;
          while (true) {
            const { data, error } = await client
              .from(table)
              .select("*")
              .eq("user_id", userId)
              .order("id")
              .range(from, from + 999);
            if (error) throw error;
            rows = rows.concat(data);
            if (data.length < 1000) break;
            from += 1000;
          }
          return [table, rows.map((r) => hydrate(table, r))];
        }),
      );
      const data = Object.fromEntries(results);
      return data;
    },
    async commit(before, after, _userId) {
      const changes = changesBetween(before, after).map((change) => ({
        ...change,
        row: Object.fromEntries(
          Object.entries(change.row).map(([k, v]) => [
            k,
            nullableColumns.has(k) && v === "" ? null : v,
          ]),
        ),
      }));
      if (!changes.length) return before;
      const { data, error } = await client.rpc("apply_changes", { changes });
      if (error) throw error;
      // Server returns committed rows and timestamps, so a follow-up network read cannot
      // turn a successful write into an ambiguous retry that duplicates the operation.
      const result = structuredClone(before);
      for (const change of data) {
        result[change.table] = result[change.table].filter(
          (r) => r.id !== change.row.id,
        );
        if (change.operation !== "delete")
          result[change.table].push(hydrate(change.table, change.row));
      }
      return result;
    },
  };
  return repository;
}
