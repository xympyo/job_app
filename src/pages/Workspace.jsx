import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  FileText,
} from "lucide-react";
import { useWorkspace } from "../context";
import {
  displayCompanyName,
  filterJobs,
  postingLabel,
  put,
  verificationLabel,
} from "../lib/domain";
import {
  FIT_LABELS,
  REVIEW_STATES,
  ROLE_FAMILIES,
  STATUS_HELP,
  STAGES,
  WORK_MODES,
} from "../lib/constants";
import {
  Badge,
  Button,
  Empty,
  Input,
  Select,
  ExternalLink,
  formatDate,
} from "../components/ui";
import JobForm from "../components/JobForm";
import JobDetail from "../components/JobDetail";

export function JobCard({ job, area, selected }) {
  const { data, mutate, saving } = useWorkspace();
  const company = data.companies.find((c) => c.id === job.company_id);
  const application = data.applications.find((a) => a.job_id === job.id);
  const cv = data.cv_versions.find((c) => c.id === job.recommended_cv_id);
  const source = data.job_sources
    .filter((s) => s.job_id === job.id)
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))[0];
  const classify = async (status) => {
    try {
      await mutate(
        (d, uid) => put(d, "jobs", { ...job, review_status: status }, uid),
        status === "Ready to Apply"
          ? "Ready to Apply — continue under Applications"
          : status === "Skipped"
            ? "Skipped — kept in History"
            : `Marked ${status}`,
      );
    } catch {
      /* Workspace context shows the save error. */
    }
  };
  return (
    <article className="job-card-shell">
      <Link
        to={`/${area}/${job.id}`}
        className={`job-card ${selected ? "selected" : ""}`}
      >
        <div className="job-card-top">
          <div className="company-mark">
            {(displayCompanyName(company?.name) || "?")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <span className="company-name">{displayCompanyName(company?.name)}</span>
          <ArrowUpRight size={16} />
        </div>
        <h3>{job.title}</h3>
        <p className="job-card-location">
          <MapPin size={13} />
          {job.location_text || "Location unknown"} · {job.work_mode}
        </p>
        <div className="badge-row">
          <Badge
            tone={
              ["Excellent Fit", "Strong Fit"].includes(job.fit_label)
                ? "green"
                : ""
            }
          >
            {job.fit_label || "Not assessed"}
          </Badge>
          <span className="small muted" title="How recently this posting was checked">
            {verificationLabel(job)}
          </span>
          {job.posting_status !== "Unknown" && (
            <span className="small muted">Posting: {postingLabel(job.posting_status)}</span>
          )}
        </div>
        <div className="job-card-bottom">
          <span>
            <FileText size={13} />
            {job.custom_tailoring ? "Custom CV" : cv?.name || "CV not selected"}
          </span>
          <span title={STATUS_HELP[application?.status || job.review_status] || "Ready to prepare this opportunity."}>
            {application?.status || (job.review_status === "Ready to Apply" ? "Ready to prepare" : job.review_status)}
          </span>
        </div>
        {job.deadline && (
          <p className="deadline-label">Deadline {formatDate(job.deadline)}</p>
        )}
      </Link>
      {area === "inbox" && !application && (
        <div
          className="card-quick-actions"
          aria-label={`Actions for ${job.title}`}
        >
          {[
            ["Review", "Reviewing"],
            ["Save", "Saved"],
            ["Ready to Apply", "Ready to Apply"],
            ["Skip", "Skipped"],
          ].map(([label, status]) => (
            <Button
              key={status}
              disabled={saving || job.review_status === status}
              onClick={() => classify(status)}
            >
              {label}
            </Button>
          ))}
          {source && (
            <ExternalLink href={source.source_url || source.apply_url}>
              Open source
            </ExternalLink>
          )}
        </div>
      )}
    </article>
  );
}
export default function Workspace({ area }) {
  const { data } = useWorkspace(),
    { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({
    triage: searchParams.get("triage") || "",
    status: searchParams.get("status") || "",
    query: searchParams.get("query") || "",
  })),
    [expanded, setExpanded] = useState(false),
    [adding, setAdding] = useState(false);
  useEffect(() => {
    setFilters((current) => ({ ...current, triage: searchParams.get("triage") || "", status: searchParams.get("status") || "", query: searchParams.get("query") || "" }));
  }, [searchParams]);
  const set = (key, v) => {
    setFilters((f) => ({ ...f, [key]: v }));
    if (["triage", "status", "query"].includes(key))
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (v) next.set(key, v); else next.delete(key);
        return next;
      });
  };
  const jobs = filterJobs(data, { ...filters, area });
  const selected = data.jobs.find((j) => j.id === id);
  const titles = {
    inbox: ["Opportunity inbox", "A clear view of what could come next."],
    applications: ["Your applications", "Keep every next step in sight."],
    history: ["Career history", "Every opportunity, decision and outcome."],
  };
  const activeFilters = Object.entries(filters).filter(
    ([k, v]) => k !== "query" && v,
  ).length;
  return (
    <div className={`workspace-page ${id ? "has-selection" : ""}`}>
      <header className="page-heading">
        <div>
          <div className="eyebrow">FIND · EVALUATE · APPLY · PROGRESS</div>
          <h1>{titles[area][0]}</h1>
          <p>{titles[area][1]}</p>
        </div>
        <Button variant="primary" onClick={() => setAdding(true)}>
          <Plus size={17} />
          Add vacancy
        </Button>
      </header>
      <div className="workspace-body">
        <div className="list-column">
          <div className="list-tools">
            <label className="search-box">
              <Search size={17} />
              <input
                aria-label="Search jobs"
                placeholder="Search roles, companies, notes…"
                value={filters.query || ""}
                onChange={(e) => set("query", e.target.value)}
              />
            </label>
            <Button
              variant={expanded ? "selected-filter" : ""}
              aria-expanded={expanded}
              onClick={() => setExpanded(!expanded)}
            >
              <SlidersHorizontal size={16} />
              Filters{activeFilters > 0 && ` (${activeFilters})`}
            </Button>
          </div>
          {expanded && (
            <div className="filters">
              {area === "inbox" && <Select
                label="Triage decision"
                options={["Apply ASAP", "Apply", "Research First", "Skip"]}
                empty="All triage decisions"
                value={filters.triage || ""}
                onChange={(e) => set("triage", e.target.value)}
              />}
                <Select
                label="Status"
                options={[...new Set([...REVIEW_STATES, ...STAGES])]}
                empty="All statuses"
                value={filters.status || ""}
                onChange={(e) => set("status", e.target.value)}
              />
              <Select
                label="Role family"
                options={ROLE_FAMILIES}
                empty="All families"
                value={filters.role_family || ""}
                onChange={(e) => set("role_family", e.target.value)}
              />
              <Select
                label="Fit"
                options={FIT_LABELS}
                empty="Any fit"
                value={filters.fit_label || ""}
                onChange={(e) => set("fit_label", e.target.value)}
              />
              <Select
                label="Work mode"
                options={WORK_MODES}
                empty="Any mode"
                value={filters.work_mode || ""}
                onChange={(e) => set("work_mode", e.target.value)}
              />
              <Select
                label="Company"
                options={data.companies.map((c) => ({
                  label: c.name,
                  value: c.id,
                }))}
                empty="All companies"
                value={filters.company_id || ""}
                onChange={(e) => set("company_id", e.target.value)}
              />
              <Select
                label="Recommended CV"
                options={data.cv_versions.map((c) => ({
                  label: c.name,
                  value: c.id,
                }))}
                empty="Any CV"
                value={filters.recommended_cv_id || ""}
                onChange={(e) => set("recommended_cv_id", e.target.value)}
              />
              <Select
                label="Freshness"
                options={[
                  "Fresh",
                  "Recent",
                  "Aging",
                  "Possibly stale",
                  "Not timestamped",
                  "Closed",
                  "Expired",
                ]}
                empty="Any freshness"
                value={filters.freshness || ""}
                onChange={(e) => set("freshness", e.target.value)}
              />
              <Input
                label="Location contains"
                value={filters.location || ""}
                onChange={(e) => set("location", e.target.value)}
              />
              <Input
                label="Source contains"
                value={filters.source || ""}
                onChange={(e) => set("source", e.target.value)}
              />
              <label className="check">
                <input
                  type="checkbox"
                  checked={filters.deadline || false}
                  onChange={(e) => set("deadline", e.target.checked)}
                />
                Deadline within 7 days
              </label>
              <Button onClick={() => { setFilters({}); setSearchParams({}); }}>Clear filters</Button>
            </div>
          )}
          <div className="list-meta">
            <span>
              {jobs.length} opportunit{jobs.length === 1 ? "y" : "ies"}
            </span>
            <span>Newest first</span>
          </div>
          <div className="job-list">
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} area={area} selected={j.id === id} />
            ))}
            {!jobs.length && (
              <Empty
                title={
                  Object.values(filters).some(Boolean)
                    ? "No matching opportunities"
                    : area === "applications"
                      ? "Your next chapter starts here"
                      : "Make room for your next move"
                }
                description={
                  Object.values(filters).some(Boolean)
                    ? "Try a broader search or clear your filters."
                    : area === "applications"
                      ? "Open a vacancy and choose Prepare application to track your answers and next steps."
                      : "Use Add vacancy above for one role, or import research for a batch to start building your shortlist."
                }
              >
                {Object.values(filters).some(Boolean) ? (
                  <Button onClick={() => setFilters({})}>Clear filters</Button>
                ) : area === "inbox" ? (
                  <Link className="btn" to="/research">
                    Import research
                  </Link>
                ) : null}
              </Empty>
            )}
          </div>
        </div>
        <div className="detail-column">
          {selected ? (
            <JobDetail key={selected.id} job={selected} area={area} />
          ) : id ? (
            <Empty
              title="Vacancy not found"
              description="It may have been removed or belongs to another workspace."
            >
              <Link className="btn" to={`/${area}`}>
                Back to list
              </Link>
            </Empty>
          ) : (
            <div className="detail-placeholder">
              <div className="outline-mark">
                <ArrowUpRight size={32} />
              </div>
              <h2>Select an opportunity</h2>
              <p>
                Explore the facts, research assessment and next action for the
                opportunity you choose.
              </p>
            </div>
          )}
        </div>
      </div>
      {adding && <JobForm onClose={() => setAdding(false)} />}
    </div>
  );
}
