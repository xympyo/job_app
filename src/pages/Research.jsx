import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileJson,
  Upload,
} from "lucide-react";
import { useWorkspace } from "../context";
import {
  applyImport,
  importErrorMessage,
  parseImport,
  previewImport,
} from "../lib/import";
import { applyTriage, parseTriage, previewTriage, triageErrorMessage, triageExport } from "../lib/triage";
import {
  Badge,
  Button,
  Empty,
  ErrorBox,
  Select,
  Textarea,
  formatDateTime,
} from "../components/ui";
import example from "../../docs/research-import.example.json";

export function download(name, contents, type = "application/json") {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function Research() {
  const { data, mutate, saving } = useWorkspace();
  const [raw, setRaw] = useState(""),
    [preview, setPreview] = useState(null),
    [choices, setChoices] = useState({}),
    [error, setError] = useState(""),
    [result, setResult] = useState(null),
    [triageRaw, setTriageRaw] = useState(""),
    [triagePreview, setTriagePreview] = useState(null),
    [triageError, setTriageError] = useState(""),
    [triageResult, setTriageResult] = useState(null);
  const change = (text) => {
    setRaw(text);
    setPreview(null);
    setError("");
    setResult(null);
  };
  const validateTriage = () => {
    setTriageError("");
    try {
      const payload = parseTriage(triageRaw);
      setTriagePreview({ payload, rows: previewTriage(data, payload) });
    } catch (e) { setTriageError(triageErrorMessage(e, triageRaw)); }
  };
  const confirmTriage = async () => {
    setTriageError("");
    try {
      const r = await mutate((d, uid) => applyTriage(d, triagePreview.payload, {}, uid), "Triage updates saved");
      setTriageResult(r); setTriagePreview(null); setTriageRaw("");
    } catch (e) { setTriageError(triageErrorMessage(e, triageRaw)); }
  };
  const validate = () => {
    setError("");
    try {
      const payload = parseImport(raw);
      setPreview({ payload, rows: previewImport(data, payload) });
      setChoices({});
    } catch (e) {
      setError(importErrorMessage(e, raw));
    }
  };
  const confirm = async () => {
    setError("");
    try {
      const r = await mutate(
        (d, uid) => applyImport(d, preview.payload, choices, uid),
        "Research import saved",
      );
      setResult(r);
      setRaw("");
      setPreview(null);
    } catch (e) {
      setError(importErrorMessage(e, raw));
    }
  };
  return (
    <div className="standard-page">
      <header className="page-heading">
        <div>
          <div className="eyebrow">RESEARCH, WITH A PAPER TRAIL</div>
          <h1>Bring your research together.</h1>
          <p>
            Import structured findings when you choose. Review every opportunity
            before it lands.
          </p>
        </div>
        <Button
          onClick={() =>
            download("research-template.json", JSON.stringify(example, null, 2))
          }
        >
          <Download size={16} />
          JSON template
        </Button>
      </header>
      <div className="import-steps">
        <span className="active">
          01 <strong>Add research</strong>
        </span>
        <ArrowRight size={16} />
        <span className={preview ? "active" : ""}>
          02 <strong>Review & resolve</strong>
        </span>
        <ArrowRight size={16} />
        <span className={result ? "active" : ""}>
          03 <strong>Confirm import</strong>
        </span>
      </div>
      <ErrorBox message={error} />
      <ErrorBox message={triageError} />
      {result && (
        <div className="success-box">
          <CheckCircle2 size={20} />
          <div>
            <strong>{result.count} vacancies added</strong>
            <p>
              {result.total - result.count} entries skipped or merged as
              selected. Research run saved.
            </p>
          </div>
        </div>
      )}
      <section className="panel import-panel">
        <div className="section-heading">
          <div>
            <h2>Research JSON</h2>
            <p className="muted">
              Version 1 format · up to 200 jobs / 2 MB per import
            </p>
          </div>
          <label className="btn file-button">
            <Upload size={16} />
            Choose JSON file
            <input
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 2_000_000) {
                  setError("Use a file smaller than 2 MB");
                  return;
                }
                try {
                  change(await file.text());
                } catch {
                  setError("Could not read this file");
                }
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <Textarea
          label="Paste researched jobs"
          className="json-input"
          rows={12}
          value={raw}
          placeholder={
            '{\n  "version": 1,\n  "research_run": { "goal": "…" },\n  "jobs": […]\n}'
          }
          onChange={(e) => change(e.target.value)}
        />
        <div className="section-heading">
          <span className="small muted">
            Unknown facts stay unknown. Imported text is treated as untrusted
            content.
          </span>
          <Button
            variant="primary"
            disabled={!raw.trim() || saving}
            onClick={validate}
          >
            Validate & preview
            <ArrowRight size={16} />
          </Button>
        </div>
      </section>
      <section className="panel import-panel">
        <div className="section-heading">
          <div>
            <h2>Bulk triage</h2>
            <p className="muted">Export existing opportunities for ChatGPT to review, then import the decisions for one safe update.</p>
          </div>
          <Button onClick={() => download("jobs-for-triage.json", JSON.stringify(triageExport(data), null, 2))}>
            <Download size={16} /> Export for triage
          </Button>
        </div>
        <p className="small muted">The triage importer updates existing jobs by stable ID only. It never creates jobs or changes applications.</p>
        <div className="section-heading">
          <label className="btn file-button"><Upload size={16} /> Import triage results
            <input type="file" accept=".json,application/json" onChange={async (e) => { const file = e.target.files[0]; if (file) { try { setTriageRaw(await file.text()); setTriageError(""); setTriagePreview(null); } catch { setTriageError("Could not read this file"); } } e.target.value = ""; }} />
          </label>
          <Button variant="primary" disabled={!triageRaw.trim() || saving} onClick={validateTriage}>Validate triage & preview <ArrowRight size={16} /></Button>
        </div>
        <Textarea label="Paste triage-results.json" rows={8} value={triageRaw} onChange={(e) => { setTriageRaw(e.target.value); setTriagePreview(null); setTriageError(""); }} placeholder={'{\n  "version": 1,\n  "triage_run": { "goal": "…" },\n  "decisions": […]\n}'} />
      </section>
      {triageResult && <div className="success-box"><CheckCircle2 size={20} /><div><strong>{triageResult.updated} job decisions updated</strong><p>Applications and history were not changed.</p></div></div>}
      {triagePreview && <section className="panel import-panel">
        <h2>Review triage changes</h2>
        <p className="muted">Confirm updates existing jobs by ID. No new jobs will be created.</p>
        <div className="import-summary"><strong>Batch summary</strong><span>Total {triagePreview.rows.length}</span><span>Apply ASAP {triagePreview.rows.filter(r => r.decision.decision === "Apply ASAP").length}</span><span>Apply {triagePreview.rows.filter(r => r.decision.decision === "Apply").length}</span><span>Research First {triagePreview.rows.filter(r => r.decision.decision === "Research First").length}</span><span>Skip {triagePreview.rows.filter(r => r.decision.decision === "Skip").length}</span><span>Unchanged {triagePreview.rows.filter(r => !r.changed.length && !r.errors.length).length}</span><span>Invalid {triagePreview.rows.filter(r => r.errors.length).length}</span></div>
        {triagePreview.rows.map((row) => <article className="import-row" key={row.index}><div className="section-heading"><div><span className="eyebrow">{row.company}</span><h3>{row.job?.title || row.decision.job_id}</h3><p className="muted">{row.job ? `${row.job.review_status} → ${row.decision.review_status} · ${row.decision.recommended_cv || "Keep current CV"}` : "Job not found"}</p></div><Badge tone={row.errors.length ? "red" : row.changed.length ? "amber" : "green"}>{row.errors.length ? "Invalid" : row.changed.length ? "Changed" : "Unchanged"}</Badge></div>{row.errors.length ? <p className="field-error">{row.errors.join(" ")}</p> : <p>{row.decision.reason || row.decision.priority_reason || "No reason supplied."}</p>}</article>)}
        <div className="form-actions"><Button onClick={() => setTriagePreview(null)}>Back to results</Button><Button variant="primary" disabled={saving || triagePreview.rows.some(r => r.errors.length)} onClick={confirmTriage}>{saving ? "Updating…" : "Confirm triage updates"}</Button></div>
      </section>}
      {preview && (
        <section className="panel import-panel">
          <h2>
            Review {preview.rows.length} opportunit
            {preview.rows.length === 1 ? "y" : "ies"}
          </h2>
          <p className="muted">{preview.payload.research_run.goal}</p>
          <div className="import-summary" aria-label="Import summary">
            <strong>Batch summary</strong>
            <span>Total {preview.rows.length}</span>
            <span>New {preview.rows.filter((r) => !r.duplicates.length).length}</span>
            <span>Possible duplicates {preview.rows.filter((r) => r.duplicates.length).length}</span>
            <span>Invalid 0</span>
            <span>Ready to import {preview.rows.filter((r) => !r.duplicates.length || choices[r.index] === "keep" || choices[r.index]?.startsWith("merge:")).length}</span>
          </div>
          <p className="small muted">Confirm import adds new rows, merges only the duplicate sources you select, and skips unresolved duplicates.</p>
          {preview.rows.map((row) => (
            <article className="import-row" key={row.index}>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">{row.job.company}</span>
                  <h3>{row.job.title}</h3>
                  <p className="muted">
                    {row.job.location_text || "Location unknown"} ·{" "}
                    {row.job.sources.length} sources ·{" "}
                    {row.job.recommended_cv || "No CV selected"} · {row.job.recommendation || "No recommendation"}
                  </p>
                  <p className="small muted">Source: {row.job.sources.map((s) => s.source_name).filter(Boolean).join(", ") || "Not recorded"}</p>
                </div>
                <Badge tone={row.duplicates.length ? "amber" : "green"}>
                  {row.duplicates.length ? "Possible duplicate" : "New vacancy"}
                </Badge>
              </div>
              {row.job.fit_label && (
                <p>
                  <strong>
                    {row.job.fit_label}
                    {row.job.fit_score !== null
                      ? ` · ${row.job.fit_score}/100`
                      : ""}
                  </strong>{" "}
                  — {row.job.fit_reason || "No assessment explanation"}
                </p>
              )}
              <details>
                <summary>Inspect full research</summary>
                <pre className="json-view">
                  {JSON.stringify(row.job, null, 2)}
                </pre>
              </details>
              {row.duplicates.length > 0 && (
                <div className="duplicate-review">
                  <p>
                    {row.duplicates
                      .map(
                        (d) =>
                          `${d.job.title}: ${d.reason}${data.jobs.some((j) => j.id === d.job.id) ? "" : " (earlier in this import)"}`,
                      )
                      .join("; ")}
                  </p>
                  <Select
                    label={`Duplicate decision for ${row.job.title}`}
                    value={choices[row.index] || "skip"}
                    onChange={(e) =>
                      setChoices((c) => ({ ...c, [row.index]: e.target.value }))
                    }
                    options={[
                      { label: "Skip this entry", value: "skip" },
                      ...row.duplicates
                        .filter((d) => data.jobs.some((j) => j.id === d.job.id))
                        .map((d) => ({
                          label: `Merge sources into ${d.job.title}`,
                          value: `merge:${d.job.id}`,
                        })),
                      { label: "Keep as a separate vacancy", value: "keep" },
                    ]}
                  />
                </div>
              )}
            </article>
          ))}
          <div className="form-actions">
            <Button onClick={() => setPreview(null)}>Back to JSON</Button>
            <Button variant="primary" disabled={saving} onClick={confirm}>
              {saving ? "Importing…" : "Confirm import"}
            </Button>
          </div>
        </section>
      )}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Research history</h2>
            <p>Know where an opportunity came from.</p>
          </div>
          <FileJson size={20} />
        </div>
        {data.research_runs.length ? (
          [...data.research_runs]
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
            .map((r) => (
              <div className="research-run" key={r.id}>
                <strong>{r.research_goal}</strong>
                <p>
                  {formatDateTime(r.completed_at)} · {r.result_count} reviewed ·{" "}
                  {r.created_jobs_count} created
                </p>
                {r.query_summary && <p>{r.query_summary}</p>}
                {r.notes && <p>{r.notes}</p>}
              </div>
            ))
        ) : (
          <Empty
            title="No research imported yet"
            description="Download the template for your next manually requested research session."
          />
        )}
      </section>
    </div>
  );
}
