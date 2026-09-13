import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import assert from "node:assert/strict";

const db = new PGlite();
const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333",
  J = "44444444-4444-4444-8444-444444444444",
  AP = "55555555-5555-4555-8555-555555555555";
await db.exec(`create role anon; create role authenticated; create schema auth;
create table auth.users(id uuid primary key);
insert into auth.users values('${A}'),('${B}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
grant usage on schema auth, public to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;`);
await db.exec(
  fs.readFileSync("supabase/migrations/202609140001_initial.sql", "utf8"),
);
let passed = 0;
const check = async (name, fn) => {
  await fn();
  passed++;
  console.log(`PASS ${name}`);
};
const asUser = async (id) =>
  db.exec(
    `reset role; set role authenticated; select set_config('request.jwt.claim.sub','${id}',false)`,
  );
const fail = async (sql, regex) => {
  await assert.rejects(() => db.exec(sql), regex);
};
const rpc = async (changes) =>
  (
    await db.query("select public.apply_changes($1::jsonb) as result", [
      JSON.stringify(changes),
    ])
  ).rows[0].result;
try {
  await asUser(A);
  await check("Owner can create normalized company and vacancy", async () => {
    await db.exec(
      `insert into public.companies(id,name,normalized_name) values('${C}','Company','company'); insert into public.jobs(id,company_id,title) values('${J}','${C}','Analyst')`,
    );
    assert.equal((await db.query("select * from public.jobs")).rows.length, 1);
  });
  await check(
    "Second user cannot read/update/delete first user records",
    async () => {
      await asUser(B);
      assert.equal(
        (await db.query("select * from public.jobs")).rows.length,
        0,
      );
      assert.equal(
        (
          await db.query(
            `update public.jobs set title='Stolen' where id='${J}' returning id`,
          )
        ).rows.length,
        0,
      );
      assert.equal(
        (await db.query(`delete from public.jobs where id='${J}' returning id`))
          .rows.length,
        0,
      );
    },
  );
  await check(
    "Cross-owner insert and foreign key linking are denied",
    async () => {
      await fail(
        `insert into public.jobs(user_id,company_id,title) values('${A}','${C}','Wrong owner')`,
        /row-level security/,
      );
      await fail(
        `insert into public.jobs(company_id,title) values('${C}','Cross owner link')`,
        /foreign key/,
      );
    },
  );
  await check(
    "Anonymous access is denied on all tables and write RPC",
    async () => {
      await db.exec("reset role; set role anon");
      for (const table of [
        "companies",
        "jobs",
        "job_sources",
        "applications",
        "application_questions",
        "application_events",
        "cv_versions",
        "research_runs",
      ])
        await fail(`select * from public.${table}`, /permission denied/);
      await fail(`select public.apply_changes('[]')`, /permission denied/);
    },
  );
  await asUser(A);
  await check(
    "Atomic batch rolls back earlier writes when later row fails validation",
    async () => {
      const id = crypto.randomUUID();
      await assert.rejects(
        () =>
          rpc([
            {
              table: "companies",
              operation: "upsert",
              row: {
                id,
                user_id: A,
                name: "Rollback",
                normalized_name: "rollback",
              },
            },
            {
              table: "jobs",
              operation: "upsert",
              row: {
                id: crypto.randomUUID(),
                user_id: A,
                company_id: id,
                title: "",
              },
            },
          ]),
        /check constraint/,
      );
      assert.equal(
        (await db.query(`select * from public.companies where id='${id}'`)).rows
          .length,
        0,
      );
    },
  );
  await check("RPC rejects arbitrary table and spoofed owner", async () => {
    await assert.rejects(
      () => rpc([{ table: "auth.users", operation: "delete", row: { id: A } }]),
      /Invalid table/,
    );
    await assert.rejects(
      () =>
        rpc([
          {
            table: "companies",
            operation: "upsert",
            row: { id: crypto.randomUUID(), user_id: B, name: "Bad" },
          },
        ]),
      /Ownership mismatch/,
    );
  });
  await check(
    "RPC returns committed rows and rejects stale writes",
    async () => {
      const row = (await db.query(`select * from public.jobs where id='${J}'`))
        .rows[0];
      const result = await rpc([
        {
          table: "jobs",
          operation: "upsert",
          expected_updated_at: row.updated_at,
          row: { ...row, title: "IT Analyst" },
        },
      ]);
      assert.equal(result[0].row.title, "IT Analyst");
      await assert.rejects(
        () =>
          rpc([
            {
              table: "jobs",
              operation: "upsert",
              expected_updated_at: row.updated_at,
              row: { ...row, title: "Old tab" },
            },
          ]),
        /changed elsewhere/,
      );
    },
  );
  await check(
    "Application snapshot survives edits and blocks job deletion",
    async () => {
      await db.exec(
        `insert into public.applications(id,job_id,job_snapshot) values('${AP}','${J}','{"title":"Original"}'); update public.applications set job_snapshot='{"title":"Changed"}' where id='${AP}'`,
      );
      assert.equal(
        (
          await db.query(
            `select job_snapshot from public.applications where id='${AP}'`,
          )
        ).rows[0].job_snapshot.title,
        "Original",
      );
      await fail(`delete from public.jobs where id='${J}'`, /foreign key/);
    },
  );
  await check(
    "Required completed answers, character limits and rejection stage enforced by database",
    async () => {
      await fail(
        `insert into public.application_questions(application_id,question_text,required,status) values('${AP}','Why?',true,'Completed')`,
        /check constraint/,
      );
      await fail(
        `insert into public.application_questions(application_id,question_text,character_limit,final_answer,status) values('${AP}','Why?',3,'Long answer','Ready')`,
        /check constraint/,
      );
      await fail(
        `update public.applications set status='Rejected' where id='${AP}'`,
        /check constraint/,
      );
    },
  );
  await check("Ownership cannot be reassigned by owner", async () => {
    await fail(
      `update public.jobs set user_id='${B}' where id='${J}'`,
      /immutable/,
    );
  });
  console.log(
    `\n${passed} PostgreSQL migration/RLS integration checks passed.`,
  );
} finally {
  await db.close();
}
