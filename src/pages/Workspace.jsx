import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowUpRight,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  FileText,
} from "lucide-react";
import { useWorkspace } from "../context";
import { filterJobs, freshness } from "../lib/domain";
import {
  FIT_LABELS,
  REVIEW_STATES,
  ROLE_FAMILIES,
  STAGES,
  WORK_MODES,
} from "../lib/constants";
import {
  Badge,
  Button,
  Empty,
  Input,
  Select,
  formatDate,
} from "../components/ui";
import JobForm from "../components/JobForm";
import JobDetail from "../components/JobDetail";

export function JobCard({ job, area, selected }) {
  const { data } = useWorkspace();
  const company = data.companies.find((c) => c.id === job.company_id);
  const application = data.applications.find((a) => a.job_id === job.id);
  const cv = data.cv_versions.find((c) => c.id === job.recommended_cv_id);
  return (
    <Link
      to={`/${area}/${job.id}`}
      className={`job-card ${selected ? "selected" : ""}`}
    >
      <div className="job-card-top">
        <div className="company-mark">
          {(company?.name || "?")
            .replace(/^PT /i, "")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <span className="company-name">{company?.name}</span>
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
        <span className="small muted">{freshness(job)}</span>
      </div>
      <div className="job-card-bottom">
        <span>
          <FileText size={13} />
          {job.custom_tailoring ? "Custom CV" : cv?.name || "CV not selected"}
        </span>
        <span>{application?.status || job.review_status}</span>
      </div>
      {job.deadline && (
        <p className="deadline-label">Deadline {formatDate(job.deadline)}</p>
      )}
    </Link>
  );
}
export default function Workspace({ area }) {
  const { data } = useWorkspace(),
    { id } = useParams();
  const [filters, setFilters] = useState({}),
    [expanded, setExpanded] = useState(false),
    [adding, setAdding] = useState(false);
  const set = (key, v) => setFilters((f) => ({ ...f, [key]: v }));
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
                  "Unverified",
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
              <Button onClick={() => setFilters({})}>Clear filters</Button>
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
                      : "Add a vacancy or import research to start building your shortlist."
                }
              >
                {Object.values(filters).some(Boolean) ? (
                  <Button onClick={() => setFilters({})}>Clear filters</Button>
                ) : (
                  <Button onClick={() => setAdding(true)}>
                    <Plus size={16} />
                    Add your first vacancy
                  </Button>
                )}
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
              <h2>A considered next step.</h2>
              <p>
                Select an opportunity to explore the role,
                <br />
                understand the fit and plan your next move.
              </p>
              <div className="placeholder-line" />
              <span>YOUR DIRECTION. YOUR DECISION.</span>
            </div>
          )}
        </div>
      </div>
      {adding && <JobForm onClose={() => setAdding(false)} />}
    </div>
  );
}
