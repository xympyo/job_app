import { useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  FileText,
  MapPin,
  Pencil,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useWorkspace } from "../context";
import {
  createApplication,
  deleteRow,
  postingLabel,
  put,
  verificationLabel,
} from "../lib/domain";
import { POSTING_STATES, REVIEW_STATES, STATUS_HELP } from "../lib/constants";
import { Badge, Button, Confirm, ExternalLink, Select, formatDate } from "./ui";
import JobForm from "./JobForm";
import ApplicationPanel from "./ApplicationPanel";

export default function JobDetail({ job, area = "inbox" }) {
  const { data, mutate, saving } = useWorkspace();
  const location = useLocation();
  const application = data.applications.find((a) => a.job_id === job.id);
  const [editing, setEditing] = useState(false),
    [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState(
    ["applications", "jobs"].includes(area) && application ? "application" : "overview",
  );
  const navigate = useNavigate();
  const company = data.companies.find((c) => c.id === job.company_id);
  const cv = data.cv_versions.find((c) => c.id === job.recommended_cv_id);
  const sources = data.job_sources
    .filter((s) => s.job_id === job.id)
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  const patch = (values) =>
    mutate((d, uid) => put(d, "jobs", { ...job, ...values }, uid)).catch(
      () => {},
    );
  const prepare = async () => {
    try {
      await mutate(
        (d, uid) => createApplication(d, job.id, uid),
        "Application workspace created. Record submission when you apply.",
      );
      setTab("application");
      navigate(`/jobs/${job.id}`);
    } catch {
      /* Context displays error */
    }
  };
  return (
    <article className="job-detail">
      <div className="detail-topline">
        <Link className="back-link" to={`/jobs${location.search}`}>
          <ArrowLeft size={15} />
          Back to list
        </Link>
        <div className="row-actions">
          <button
            className="icon-btn"
            onClick={() => setEditing(true)}
            aria-label="Edit vacancy"
          >
            <Pencil size={17} />
          </button>
          {!application && (
            <button
              className="icon-btn"
              onClick={() => setDeleting(true)}
              aria-label="Delete vacancy"
            >
              <Trash2 size={17} />
            </button>
          )}
        </div>
      </div>
      <header className="detail-header">
        <div className="company-eyebrow">
          {company?.name || "Unknown company"}
        </div>
        <h2>{job.title}</h2>
        <p className="detail-location">
          <MapPin size={15} />
          {job.location_text || "Location unknown"}
          <span>·</span>
          {job.work_mode}
        </p>
        <div className="badge-row">
          <Badge>{job.role_family || "Role family not set"}</Badge>
          {job.deadline && <Badge>Deadline {formatDate(job.deadline)}</Badge>}
          <Badge>Posting: {postingLabel(job.posting_status)}</Badge>
          <Badge
            tone={verificationLabel(job) === "Verified recently" ? "green" : "amber"}
            title={STATUS_HELP["Not timestamped"]}
          >
            Verification: {verificationLabel(job)}
          </Badge>
        </div>
        <div className="primary-actions">
          {application ? (
            <Button variant="primary" onClick={() => setTab("application")}>
              <FileText size={16} />
              Application workspace
            </Button>
          ) : (
            <Button variant="primary" onClick={prepare} disabled={saving}>
              <FileText size={16} />
              Prepare application
            </Button>
          )}
          {!application && (
            <Button
              onClick={() => patch({ review_status: "Saved" })}
              disabled={saving}
            >
              <Bookmark size={16} />
              Save
            </Button>
          )}
          {sources[0] && (
            <ExternalLink href={sources[0].apply_url || sources[0].source_url}>
              Open posting
            </ExternalLink>
          )}
        </div>
      </header>
      <div className="detail-tabs">
        <button
          className={tab === "overview" ? "active" : ""}
          onClick={() => setTab("overview")}
        >
          Opportunity
        </button>
        {application && (
          <button
            className={tab === "application" ? "active" : ""}
            onClick={() => setTab("application")}
          >
            Application <span className="tab-dot" />
          </button>
        )}
      </div>
      {tab === "application" && application ? (
        <ApplicationPanel application={application} />
      ) : (
        <>
          <section className="decision-summary" aria-labelledby="decision-summary-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">DECISION SUMMARY</span>
                <h3 id="decision-summary-title">Should this opportunity move forward?</h3>
              </div>
              <Badge tone="green">{job.recommendation || "Review needed"}</Badge>
            </div>
            <div className="fact-grid">
              <div><small>Posting</small><strong>{postingLabel(job.posting_status)}</strong></div>
              <div><small>Verification</small><strong>{verificationLabel(job)}</strong></div>
              <div><small>Deadline</small><strong>{formatDate(job.deadline)}</strong></div>
              <div><small>Fit</small><strong>{job.fit_label || "Not assessed"}{job.fit_score !== null ? ` · ${job.fit_score}/100` : ""}</strong></div>
              <div><small>Recommended CV</small><strong>{job.custom_tailoring ? "Custom tailoring" : cv?.name || "Not selected"}</strong></div>
            </div>
          </section>
          <section className="fit-section">
            <div className="section-heading">
              <span className="eyebrow">RESEARCH / AI ASSESSMENT</span>
              {job.fit_score !== null && (
                <span className="fit-score">
                  {job.fit_score}
                  <small>/100</small>
                </span>
              )}
            </div>
            <h3>{job.fit_label || "Ready for your assessment"}</h3>
            <p>
              {job.fit_reason ||
                "Add your research to understand how this opportunity fits your experience and career direction."}
            </p>
            {job.recommendation && (
              <Badge tone="green">{job.recommendation}</Badge>
            )}
            <div className="fit-columns">
              <div>
                <h4>What aligns</h4>
                {job.strengths.filter(Boolean).length ? (
                  <ul>
                    {job.strengths.filter(Boolean).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Not assessed yet</p>
                )}
              </div>
              <div>
                <h4>Gaps to consider</h4>
                {job.gaps.filter(Boolean).length ? (
                  <ul>
                    {job.gaps.filter(Boolean).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Not assessed yet</p>
                )}
              </div>
            </div>
            {job.red_flags.filter(Boolean).length > 0 && (
              <div className="warning-box">
                <strong>Potential red flags</strong>
                <ul>
                  {job.red_flags.filter(Boolean).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="cv-recommendation">
              <FileText size={20} />
              <div>
                <small>RECOMMENDED CV</small>
                <strong>
                  {job.custom_tailoring
                    ? "Custom tailoring recommended"
                    : cv?.name || "Not selected"}
                </strong>
              </div>
              <Button variant="text" onClick={() => setEditing(true)}>
                Change
              </Button>
            </div>
          </section>
          <section className="detail-section">
            <div className="form-grid">
              <Select
                label="Review status"
                options={REVIEW_STATES}
                value={job.review_status}
                disabled={saving}
                onChange={(e) => patch({ review_status: e.target.value })}
              />
              <Select
                label="Posting state"
                options={POSTING_STATES}
                value={job.posting_status}
                disabled={saving}
                onChange={(e) =>
                  patch({
                    posting_status: e.target.value,
                  })
                }
              />
            </div>
            <p className="field-help">
              {STATUS_HELP[job.review_status] || "Choose the current decision for this opportunity."}
            </p>
            <p className="field-help">
              Posting state describes the employer listing. Verification is our
              separate timestamped check.
            </p>
            <div className="fact-grid">
              <div>
                <small>Date found</small>
                <strong>{formatDate(job.found_at)}</strong>
              </div>
              <div>
                <small>Deadline</small>
                <strong>{formatDate(job.deadline)}</strong>
              </div>
              <div>
                <small>Last verified</small>
                <strong>
                  {job.last_verified_at
                    ? formatDate(job.last_verified_at)
                    : "Not timestamped"}
                </strong>
              </div>
              <div>
                <small>Employment / seniority</small>
                <strong>
                  {[job.employment_type, job.seniority]
                    .filter(Boolean)
                    .join(" · ") || "Unknown"}
                </strong>
              </div>
              <div>
                <small>Compensation</small>
                <strong>
                  {job.salary_min !== null || job.salary_max !== null
                    ? `${job.salary_currency} ${job.salary_min?.toLocaleString() || "?"} – ${job.salary_max?.toLocaleString() || "?"} ${job.salary_period}`
                    : "Not disclosed"}
                </strong>
              </div>
            </div>
          </section>
          <p className="eyebrow detail-facts-label">EMPLOYER / SOURCE FACTS</p>
                    {[
            "description",
            "responsibilities",
            "requirements",
            "preferred_requirements",
          ].map((k, i) => (
            <section key={k} className="detail-section">
              <h3>
                {
                  [
                    "About the role",
                    "Responsibilities",
                    "Requirements",
                    "Preferred requirements",
                  ][i]
                }
              </h3>
              <p className="prewrap">{job[k] || "No information added yet."}</p>
            </section>
          ))}
          <section className="detail-section">
            <h3>Sources & evidence</h3>
            {sources.length === 0 ? (
              <p className="inline-empty">
                No source recorded. Edit this vacancy to add the original
                posting.
              </p>
            ) : (
              sources.map((s) => (
                <div className="source-row" key={s.id}>
                  <ShieldCheck size={18} />
                  <div className="grow">
                    <strong>{s.source_name}</strong>
                    <p className="small muted">
                      {s.source_type}
                      {s.is_primary ? " · Primary" : ""}
                      {s.external_job_id ? ` · ${s.external_job_id}` : ""}
                    </p>
                    {s.verified_at && (
                      <p className="small muted">
                        Verified {formatDate(s.verified_at)}
                      </p>
                    )}
                    <div className="badge-row">
                      <ExternalLink href={s.source_url}>
                        Original source
                      </ExternalLink>
                      <ExternalLink href={s.apply_url}>Apply link</ExternalLink>
                    </div>
                    {!s.source_url && !s.apply_url && (
                      <p className="small muted">No URL available</p>
                    )}
                  </div>
                </div>
              ))
            )}
            {job.source_confidence && (
              <p>Confidence: {job.source_confidence}</p>
            )}
            {job.research_notes && (
              <p className="prewrap note">{job.research_notes}</p>
            )}
            <p className="small muted">
              Posting unavailable? Keep this record and update its verification
              status above.
            </p>
          </section>
          <section className="detail-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">YOUR NOTES</span>
                <h3>Your notes</h3>
              </div>
              <Button variant="text" onClick={() => setEditing(true)}>
                Edit notes
              </Button>
            </div>
            <p className="prewrap">
              {job.notes ||
                "Capture context, questions or your own assessment."}
            </p>
          </section>
        </>
      )}
      {editing && <JobForm job={job} onClose={() => setEditing(false)} />}
      {deleting && (
        <Confirm
          title="Delete this vacancy?"
          description="This removes the vacancy and its sources. Use Skipped or Closed to keep it in your history instead."
          onClose={() => setDeleting(false)}
          onConfirm={async () => {
            await mutate(
              (d) => deleteRow(d, "jobs", job.id),
              "Vacancy deleted",
            );
            navigate(`/${area}`);
          }}
        />
      )}
    </article>
  );
}
