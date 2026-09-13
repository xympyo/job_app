import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useWorkspace } from "../context";
import {
  FIT_LABELS,
  POSTING_STATES,
  RECOMMENDATIONS,
  REVIEW_STATES,
  ROLE_FAMILIES,
  WORK_MODES,
} from "../lib/constants";
import { saveJob } from "../lib/domain";
import { findDuplicates } from "../lib/import";
import {
  AsyncForm,
  Button,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
  toLocalInput,
  toTimestamp,
} from "./ui";

export default function JobForm({ job, onClose, onSaved }) {
  const { data, mutate } = useWorkspace();
  const [value, setValue] = useState(() => ({
    ...job,
    company_name:
      data.companies.find((c) => c.id === job?.company_id)?.name || "",
    title: job?.title || "",
    sources: data.job_sources.filter((s) => s.job_id === job?.id),
  }));
  const [duplicateAccepted, setDuplicateAccepted] = useState(false);
  const set = (key, v) => {
    setValue((old) => ({ ...old, [key]: v }));
    setDuplicateAccepted(false);
  };
  const input = (label, key, props = {}) => (
    <Input
      label={label}
      value={value[key] ?? ""}
      onChange={(e) => set(key, e.target.value)}
      {...props}
    />
  );
  const area = (label, key) => (
    <Textarea
      label={label}
      value={value[key] || ""}
      onChange={(e) => set(key, e.target.value)}
    />
  );
  const list = (label, key) => (
    <Textarea
      label={label}
      hint="One item per line"
      value={(value[key] || []).join("\n")}
      onChange={(e) => set(key, e.target.value.split("\n"))}
    />
  );
  const select = (label, key, options, fallback = "") => (
    <Select
      label={label}
      options={options}
      empty={fallback ? undefined : "Unknown / not assessed"}
      value={value[key] || fallback}
      onChange={(e) => set(key, e.target.value)}
    />
  );
  const duplicates = findDuplicates(data, {
    ...value,
    company: value.company_name,
  }).filter((d) => d.job.id !== job?.id);
  return (
    <Modal
      title={job ? "Edit vacancy" : "Add a vacancy"}
      onClose={onClose}
      wide
    >
      <AsyncForm
        onSubmit={async () => {
          if (duplicates.length && !duplicateAccepted)
            throw new Error(
              "Review the possible duplicate and confirm keeping a separate vacancy.",
            );
          const saved = await mutate(
            (next, uid) => saveJob(next, value, uid),
            job ? "Vacancy updated" : "Vacancy added to your inbox",
          );
          onSaved?.(saved);
          onClose();
        }}
      >
        <p className="form-intro">
          Capture what you know. You can add research and fit details later.
        </p>
        <div className="form-grid">
          {input("Company *", "company_name", {
            required: true,
            list: "company-names",
          })}
          <datalist id="company-names">
            {data.companies.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
          {input("Job title *", "title", { required: true })}
          {input("Location", "location_text", {
            placeholder: "e.g. Jakarta, Indonesia",
          })}
          {select("Work mode", "work_mode", WORK_MODES, "Unknown")}
          {select("Role family", "role_family", ROLE_FAMILIES)}
          {select("Review status", "review_status", REVIEW_STATES, "Found")}
          {input("Deadline", "deadline", { type: "date" })}
          {input("Employment type", "employment_type", {
            placeholder: "Full-time, internship, contract…",
          })}
        </div>
        {duplicates.length > 0 && (
          <div className="warning-box">
            <strong>Possible duplicate</strong>
            {duplicates.map((d) => (
              <p key={d.job.id}>
                {d.job.title} — {d.reason}
              </p>
            ))}
            <label className="check">
              <input
                type="checkbox"
                checked={duplicateAccepted}
                onChange={(e) => setDuplicateAccepted(e.target.checked)}
              />
              Keep this as a separate vacancy
            </label>
          </div>
        )}
        <section className="form-section">
          <div className="section-heading">
            <h3>Sources</h3>
            <Button
              type="button"
              onClick={() =>
                set("sources", [
                  ...value.sources,
                  {
                    source_name: "",
                    source_url: "",
                    apply_url: "",
                    source_type: "Unknown",
                    is_primary: value.sources.length === 0,
                  },
                ])
              }
            >
              <Plus size={15} />
              Add source
            </Button>
          </div>
          {!value.sources.length && (
            <p className="muted">
              No source yet. Add a link so you can return to the original
              posting.
            </p>
          )}
          {value.sources.map((source, i) => {
            const change = (key, v) =>
              set(
                "sources",
                value.sources.map((s, index) =>
                  index === i ? { ...s, [key]: v } : s,
                ),
              );
            return (
              <div className="source-edit" key={source.id || i}>
                <div className="form-grid">
                  <Input
                    label="Source name *"
                    required
                    value={source.source_name}
                    onChange={(e) => change("source_name", e.target.value)}
                  />
                  <Select
                    label="Source confidence"
                    options={[
                      "Official careers",
                      "Official posting",
                      "Job platform",
                      "Secondary",
                      "Unknown",
                    ]}
                    value={source.source_type || "Unknown"}
                    onChange={(e) => change("source_type", e.target.value)}
                  />
                  <Input
                    label="Original posting URL"
                    type="url"
                    value={source.source_url}
                    onChange={(e) => change("source_url", e.target.value)}
                  />
                  <Input
                    label="Application URL"
                    type="url"
                    value={source.apply_url}
                    onChange={(e) => change("apply_url", e.target.value)}
                  />
                  <Input
                    label="Requisition / external ID"
                    value={source.external_job_id || ""}
                    onChange={(e) => change("external_job_id", e.target.value)}
                  />
                  <Input
                    label="Source verified at"
                    type="datetime-local"
                    value={toLocalInput(source.verified_at)}
                    onChange={(e) =>
                      change("verified_at", toTimestamp(e.target.value))
                    }
                  />
                </div>
                <div className="section-heading">
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={source.is_primary || false}
                      onChange={(e) =>
                        set(
                          "sources",
                          value.sources.map((s, index) => ({
                            ...s,
                            is_primary: index === i ? e.target.checked : false,
                          })),
                        )
                      }
                    />
                    Primary source
                  </label>
                  <Button
                    type="button"
                    variant="text danger-text"
                    onClick={() =>
                      set(
                        "sources",
                        value.sources.filter((_, index) => index !== i),
                      )
                    }
                  >
                    <Trash2 size={15} />
                    Remove source
                  </Button>
                </div>
              </div>
            );
          })}
        </section>
        <details open={Boolean(job)} className="form-section">
          <summary>Fit & CV recommendation</summary>
          <p className="muted">
            Explain your assessment. A score is optional and always needs a
            reason.
          </p>
          <div className="form-grid">
            {select("Fit label", "fit_label", FIT_LABELS)}
            <Input
              label="Fit score (0–100)"
              type="number"
              min="0"
              max="100"
              step="1"
              value={value.fit_score ?? ""}
              onChange={(e) =>
                set(
                  "fit_score",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
            {select("Recommendation", "recommendation", RECOMMENDATIONS)}
            {select(
              "Recommended CV",
              "recommended_cv_id",
              data.cv_versions.map((c) => ({ label: c.name, value: c.id })),
            )}
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={value.custom_tailoring || false}
              onChange={(e) => set("custom_tailoring", e.target.checked)}
            />
            Custom tailoring recommended
          </label>
          {area("Why this fits", "fit_reason")}
          <div className="form-grid">
            {list("Candidate strengths", "strengths")}
            {list("Gaps / unknown requirements", "gaps")}
          </div>
          {list("Red flags", "red_flags")}
        </details>
        <details className="form-section" open={Boolean(job)}>
          <summary>Description & requirements</summary>
          {area("Job description", "description")}
          {area("Responsibilities", "responsibilities")}
          {area("Requirements", "requirements")}
          {area("Preferred requirements", "preferred_requirements")}
          <div className="form-grid">
            {input("Seniority", "seniority")}
            {input("City", "city")}
            {input("Country", "country")}
            {input("Published date", "published_at", { type: "date" })}
            {input("Date found", "found_at", { type: "date" })}
          </div>
        </details>
        <details className="form-section">
          <summary>Compensation & verification</summary>
          <div className="form-grid">
            {["salary_min", "salary_max"].map((k, i) => (
              <Input
                key={k}
                label={i ? "Maximum salary" : "Minimum salary"}
                type="number"
                min="0"
                value={value[k] ?? ""}
                onChange={(e) =>
                  set(k, e.target.value === "" ? null : Number(e.target.value))
                }
              />
            ))}
            {input("Currency", "salary_currency", { placeholder: "IDR" })}
            {input("Salary period", "salary_period", {
              placeholder: "Monthly",
            })}
            {select(
              "Posting status",
              "posting_status",
              POSTING_STATES,
              "Unknown",
            )}
            <Input
              label="Last verified"
              type="datetime-local"
              value={toLocalInput(value.last_verified_at)}
              onChange={(e) =>
                set("last_verified_at", toTimestamp(e.target.value))
              }
            />
            {input("Overall source confidence / evidence", "source_confidence")}
          </div>
        </details>
        <section className="form-section">
          {area("Your notes", "notes")}
          {area("Research notes / evidence", "research_notes")}
        </section>
        <div className="form-actions">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {job ? "Save changes" : "Add to inbox"}
          </Button>
        </div>
      </AsyncForm>
    </Modal>
  );
}
