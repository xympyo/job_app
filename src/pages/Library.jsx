import { useState } from "react";
import {
  Building2,
  Download,
  FileText,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useWorkspace } from "../context";
import { csv, deleteRow, normalize, put } from "../lib/domain";
import {
  AsyncForm,
  Badge,
  Button,
  Confirm,
  Empty,
  ExternalLink,
  Input,
  Modal,
  Textarea,
} from "../components/ui";
import { download } from "./Research";
import EmployerDiligence, { EmployerDiligenceBadge } from "../components/EmployerDiligence";

function RecordForm({ table, record, onClose }) {
  const { mutate } = useWorkspace();
  const [v, setV] = useState(
    record ||
      (table === "companies" ? { name: "" } : { name: "", active: true }),
  );
  const set = (k, value) => setV((old) => ({ ...old, [k]: value }));
  const fields =
    table === "companies"
      ? [
          ["name", "Company name"],
          ["website", "Website"],
          ["careers_url", "Careers URL"],
          ["industry", "Industry"],
          ["size", "Company size"],
          ["headquarters", "Headquarters"],
        ]
      : [
          ["name", "CV name"],
          ["slug", "Stable identifier"],
          ["file_reference", "File reference (local path or private link)"],
        ];
  return (
    <Modal
      title={`${record ? "Edit" : "Add"} ${table === "companies" ? "company" : "CV version"}`}
      onClose={onClose}
    >
      <AsyncForm
        onSubmit={async () => {
          await mutate((d, uid) =>
            put(
              d,
              table,
              {
                ...v,
                ...(table === "companies"
                  ? { normalized_name: normalize(v.name) }
                  : {}),
              },
              uid,
            ),
          );
          onClose();
        }}
      >
        {fields.map(([k, label]) => (
          <Input
            key={k}
            label={label}
            required={["name", "slug"].includes(k)}
            type={["website", "careers_url"].includes(k) ? "url" : "text"}
            value={v[k] || ""}
            onChange={(e) => set(k, e.target.value)}
          />
        ))}
        {table === "cv_versions" && (
          <>
            <Textarea
              label="Positioning / description"
              value={v.description || ""}
              onChange={(e) => set("description", e.target.value)}
            />
            <Textarea
              label="Target roles (one per line)"
              value={(v.target_roles || []).join("\n")}
              onChange={(e) => set("target_roles", e.target.value.split("\n"))}
            />
            <label className="check">
              <input
                type="checkbox"
                checked={v.active}
                onChange={(e) => set("active", e.target.checked)}
              />
              Active CV version
            </label>
          </>
        )}
        <Textarea
          label="Notes"
          value={v.notes || ""}
          onChange={(e) => set("notes", e.target.value)}
        />
        <div className="form-actions">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary">
            Save {table === "companies" ? "company" : "CV"}
          </Button>
        </div>
      </AsyncForm>
    </Modal>
  );
}
export default function Library({ companiesOnly = false }) {
  const { data, mutate } = useWorkspace();
  const [editing, setEditing] = useState(null),
    [deleting, setDeleting] = useState(null);
  const edit = (table, record) => setEditing({ table, record });
  return (
    <div className="standard-page">
      <header className="page-heading">
        <div>
          <div className="eyebrow">
            {companiesOnly
              ? "COMPANY CONTEXT"
              : "YOUR EXPERIENCE, WELL POSITIONED"}
          </div>
          <h1>{companiesOnly ? "Companies" : "Your career toolkit"}</h1>
          <p>
            {companiesOnly
              ? "Reusable company records, connected to every opportunity."
              : "Choose the right emphasis for the opportunity in front of you."}
          </p>
        </div>
        <Button
          onClick={() => edit(companiesOnly ? "companies" : "cv_versions")}
        >
          <Plus size={16} />
          {companiesOnly ? "Add company" : "Add CV version"}
        </Button>
      </header>
      {companiesOnly ? (
        <div className="company-grid">
          {data.companies.map((c) => (
            <article key={c.id} className="panel company-panel">
              <div className="section-heading">
                <Building2 size={22} />
                <div className="row-actions">
                  <Button
                    onClick={() => edit("companies", c)}
                    aria-label={`Edit ${c.name}`}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    disabled={data.jobs.some((j) => j.company_id === c.id)}
                    title={
                      data.jobs.some((j) => j.company_id === c.id)
                        ? "This company is retained because vacancies use it."
                        : "Delete unused company"
                    }
                    onClick={() =>
                      setDeleting({ table: "companies", id: c.id })
                    }
                    aria-label={`Delete ${c.name}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              <h2>{c.name}</h2>
              <p className="muted">
                {[c.industry, c.size, c.headquarters]
                  .filter(Boolean)
                  .join(" · ") || "Details not added yet"}
              </p>
              <div className="badge-row">
                <EmployerDiligenceBadge companyId={c.id} />
                <ExternalLink href={c.website}>Website</ExternalLink>
                <ExternalLink href={c.careers_url}>Careers</ExternalLink>
              </div>
              <EmployerDiligence companyId={c.id} compact />
              <p className="prewrap">{c.notes}</p>
              <Badge>
                {data.jobs.filter((j) => j.company_id === c.id).length}{" "}
                opportunities
              </Badge>
            </article>
          ))}
          {!data.companies.length && (
            <Empty
              title="Company context starts here"
              description="Companies are created automatically when you add a vacancy. You can also add one here."
            />
          )}
        </div>
      ) : (
        <>
          <div className="cv-grid">
            {!data.cv_versions.length && (
              <Empty
                title="Add your first CV"
                description="Create a CV version to record its positioning and select it for your applications."
              />
            )}
            {data.cv_versions.map((cv, i) => (
              <article className="cv-card" key={cv.id}>
                <div className="section-heading">
                  <div className="cv-icon">
                    <FileText size={25} />
                  </div>
                  <Badge tone={cv.active ? "green" : ""}>
                    {cv.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <span className="cv-number">0{i + 1}</span>
                <h2>{cv.name}</h2>
                <p>{cv.description}</p>
                <div className="cv-targets">
                  {cv.target_roles.map((r, i) => (
                    <Badge key={i}>{r}</Badge>
                  ))}
                </div>
                <details>
                  <summary>File reference & notes</summary>
                  <p className="small break-all">
                    {cv.file_reference || "No file reference"}
                  </p>
                  <ExternalLink href={cv.file_reference}>
                    Open private CV link
                  </ExternalLink>
                  <p className="small muted">
                    Local file paths are references for this computer. PDFs stay
                    outside the app and are not uploaded or published.
                  </p>
                  <p className="prewrap small">{cv.notes}</p>
                </details>
                <Button onClick={() => edit("cv_versions", cv)}>
                  <Pencil size={15} />
                  Edit CV details
                </Button>
              </article>
            ))}
          </div>
          <section className="panel export-panel">
            <div>
              <div className="eyebrow">YOUR DATA BELONGS TO YOU</div>
              <h2>Keep a copy of your career history.</h2>
              <p>
                Export vacancies, sources, applications, answers, notes, CV
                references and research history.
              </p>
            </div>
            <div className="export-buttons">
              <Button
                variant="primary"
                onClick={() =>
                  download(
                    `career-workspace-${new Date().toISOString().slice(0, 10)}.json`,
                    JSON.stringify(
                      {
                        format: "career-command-center-backup",
                        version: 1,
                        exported_at: new Date().toISOString(),
                        data,
                      },
                      null,
                      2,
                    ),
                  )
                }
              >
                <Download size={16} />
                Export full JSON
              </Button>
              {["jobs", "applications", "application_questions"].map(
                (table) => (
                  <Button
                    key={table}
                    onClick={() =>
                      download(
                        `${table}.csv`,
                        csv(data[table]),
                        "text/csv;charset=utf-8",
                      )
                    }
                  >
                    Export {table.replaceAll("_", " ")} CSV
                  </Button>
                ),
              )}
            </div>
            <p className="small muted">
              Backups contain your personal career records. Keep them somewhere
              private. Research import accepts researched-job JSON, not full
              backups.
            </p>
          </section>
        </>
      )}
      {editing && <RecordForm {...editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <Confirm
          title="Delete company?"
          description="Only unused companies can be deleted. Companies linked to vacancies are preserved."
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await mutate((d) => deleteRow(d, deleting.table, deleting.id));
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
