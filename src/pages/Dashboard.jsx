import { Link } from "react-router-dom";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Inbox,
  BriefcaseBusiness,
  Flag,
  Plus,
} from "lucide-react";
import { useWorkspace } from "../context";
import { attentionItems, today, triageDecisionMatches } from "../lib/domain";
import { TERMINAL } from "../lib/constants";
import { deriveGettingStarted, deriveRecommendedAction } from "../lib/guidance";
import { Badge, Button, Empty, formatDateTime } from "../components/ui";
import JobForm from "../components/JobForm";
import { ContextualGuidance, GettingStarted } from "../components/Guidance";

export function AttentionList({ items, limit }) {
  const hrefFor = (item) => {
    if (item.type === "Deadline" && !item.application_id)
      return `/jobs/${item.job_id}`;
    return `/jobs/${item.job_id}`;
  };
  return (
    <div className="attention-list">
      {items.slice(0, limit || items.length).map((item) => (
        <Link
          key={item.id}
          to={hrefFor(item)}
          className="attention-item"
        >
          <div className="attention-icon">
            <CalendarDays size={18} />
          </div>
          <div className="grow">
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
          </div>
          <div className="attention-date">
            <Badge
              tone={item.at && item.at.slice(0, 10) < today() ? "amber" : ""}
            >
              {item.type}
            </Badge>
            <small>{formatDateTime(item.at)}</small>
          </div>
          <ArrowUpRight size={16} />
        </Link>
      ))}
    </div>
  );
}
export default function Dashboard({ attentionOnly = false }) {
  const { data, profile, tutorial, resetTutorial, dismissGettingStarted, markTutorialSeen } = useWorkspace();
  const [adding, setAdding] = useState(false);
  if (!attentionOnly && profile.loading) return <div className="standard-page"><div className="loading-screen">Preparing your workspace…</div></div>;
  const attention = attentionItems(data);
  const next = deriveRecommendedAction({ data, profile, attention });
  const gettingStarted = deriveGettingStarted(data, profile);
  const isFreshWorkspace = !profile.current && !data.jobs.length && !data.applications.length;
  const review = data.jobs.filter(
    (j) =>
      ["Found", "Reviewing"].includes(j.review_status) &&
      !data.applications.some((a) => a.job_id === j.id),
  ).length;
  const ready = data.jobs.filter(
    (j) =>
      j.review_status === "Ready to Apply" &&
      !data.applications.some((a) => a.job_id === j.id),
  ).length;
  const active = data.applications.filter(
    (a) => !TERMINAL.includes(a.status),
  ).length;
  const triageShortcuts = ["Apply ASAP", "Apply", "Research First", "Skip"].map((decision) => ({
    decision,
    count: data.jobs.filter((job) => triageDecisionMatches(job, decision, data.applications.find((a) => a.job_id === job.id))).length,
  }));
  const recent = [
    ...data.jobs.map((j) => ({
      ...j,
      label: j.title,
      type: "Vacancy",
      job_id: j.id,
    })),
    ...data.applications.map((a) => ({
      ...a,
      label: data.jobs.find((j) => j.id === a.job_id)?.title,
      type: a.status,
    })),
  ]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5);
  if (attentionOnly)
    return (
      <div className="standard-page">
        <header className="page-heading">
          <div>
            <div className="eyebrow">KEEP THINGS MOVING</div>
            <h1>Needs attention</h1>
            <p>Deadlines, unfinished answers and the next conversation.</p>
          </div>
          <Badge>{attention.length} items</Badge>
        </header>
        <ContextualGuidance milestone="attention" title="Attention is your action queue">
          Deadlines, next actions, unfinished questions and planned interviews appear here. Jobs remains the place to browse every opportunity.
        </ContextualGuidance>
        <section className="panel">
          {attention.length ? (
            <AttentionList items={attention} />
          ) : (
            <Empty
              title="You're up to date"
              description="Deadlines, next actions, unfinished questions and scheduled interviews will appear here."
            />
          )}
        </section>
      </div>
    );
  return (
    <div className="standard-page dashboard">
      <header className="page-heading">
        <div>
          <div className="eyebrow">YOUR CAREER WORKSPACE</div>
          <h1>Make your next move count.</h1>
          <p>A little clarity. A deliberate next step.</p>
        </div>
        <span className="today-label">
          {new Intl.DateTimeFormat("en", {
            weekday: "long",
            month: "short",
            day: "numeric",
          }).format(new Date())}
        </span>
      </header>
      {isFreshWorkspace && !tutorial?.state?.seen?.home && (
        <section className="panel profile-welcome first-run-welcome">
          <div className="eyebrow">WELCOME TO PYOlOKER</div>
          <h2>Build your career profile</h2>
          <p>Find → Evaluate → Apply → Progress. Keep opportunities, decisions and application progress in one private workspace. AI is optional; you stay in control.</p>
          <div className="primary-actions"><Link className="btn primary" to="/career?start=1">Set up my profile</Link><Link className="btn" to="/research">Add or import a job</Link><Button onClick={() => markTutorialSeen?.("home")}>I'll do this later</Button></div>
        </section>
      )}
      <GettingStarted items={gettingStarted} onRestart={resetTutorial} onHide={dismissGettingStarted} />
      {!isFreshWorkspace && <section className="panel recommended-step" aria-labelledby="recommended-action-title">
        <div><span className="eyebrow">ONE NEXT MOVE</span><h2 id="recommended-action-title">{next.title}</h2><p>{next.description}</p></div>
        <Link className="btn primary" to={next.href}>{next.actionLabel}<ArrowRight size={16} /></Link>
      </section>}
      <section className="panel workflow-start" aria-label="Next career step">
        <div>
          <h2>
            {data.jobs.length
              ? "Keep your shortlist moving"
              : "Start with one opportunity"}
          </h2>
            <p>
            Add a vacancy or import research. Review it in Jobs, choose a
            CV, then prepare and record your application.
          </p>
        </div>
        <div className="primary-actions">
          <Button variant="primary" onClick={() => setAdding(true)}>
            <Plus size={17} />
            Add vacancy
          </Button>
          <Link className="btn" to="/research">
            Import research
          </Link>
          {data.jobs.length > 0 && (
            <Link className="btn" to="/jobs">
              Review jobs
            </Link>
          )}
        </div>
      </section>
      <div className="stats-grid">
        {[
          {
            title: "To review",
            value: review,
            icon: Inbox,
            to: "/jobs?lifecycle=To%20Review",
            sub: "Opportunities to explore",
          },
          {
            title: "Ready to apply",
            value: ready,
            icon: CheckCircle2,
            to: "/jobs?status=Ready%20to%20Apply",
            sub: "Take the next step",
          },
          {
            title: "In progress",
            value: active,
            icon: BriefcaseBusiness,
            to: "/jobs?application=active",
            sub: "Applications moving forward",
          },
          {
            title: "Needs attention",
            value: attention.length,
            icon: Flag,
            to: "/attention",
            sub: "Keep the momentum",
          },
        ].map(({ title, value, icon: Icon, to, sub }) => (
          <Link className="stat-card" key={title} to={to}>
            <div>
              <span>{title}</span>
              <Icon size={19} />
            </div>
            <strong>{String(value)}</strong>
            <p>
              {sub}
              <ArrowUpRight size={14} />
            </p>
          </Link>
        ))}
      </div>
      <section className="panel triage-shortcuts" aria-label="Triage decisions">
            <div className="panel-heading"><div><h2>Research decisions</h2><p>Open Jobs with a triage decision already selected.</p></div></div>
        <div className="triage-shortcut-grid">
          {triageShortcuts.map(({ decision, count }) => (
            <Link key={decision} className="triage-shortcut" to={`/jobs?triage=${encodeURIComponent(decision)}`}>
              <strong>{decision}</strong><span>{count}</span><small>Open in Jobs <ArrowUpRight size={13} /></small>
            </Link>
          ))}
        </div>
      </section>
      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Your next steps</h2>
              <p>The things that keep your search moving.</p>
            </div>
            <Link to="/attention">
              View all
              <ArrowRight size={14} />
            </Link>
          </div>
          {attention.length ? (
            <AttentionList items={attention} limit={5} />
          ) : (
            <div className="quiet-empty">
              <CheckCircle2 size={24} />
              <h3>Nothing pressing right now</h3>
              <p>Add deadlines and next actions as you review opportunities.</p>
            </div>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recently updated</h2>
              <p>Your search, with context intact.</p>
            </div>
          </div>
          {recent.length ? (
            recent.map((r) => (
              <Link
                key={`${r.type}-${r.id}`}
                to={`/history/${r.job_id}`}
                className="recent-item"
              >
                <span className="timeline-dot" />
                <div>
                  <strong>{r.label}</strong>
                  <p>
                    {r.type} · {formatDateTime(r.updated_at)}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="quiet-empty">
              <Inbox size={24} />
              <h3>A fresh start</h3>
              <p>
                Your opportunities and application updates will appear here.
              </p>
            </div>
          )}
        </section>
      </div>
      <section className="direction-strip">
        <div>
          <FileIcon />
          <strong>Your experience. Ready for the next opportunity.</strong>
          <p>
            Keep your CV versions together and choose the right one for each
            opportunity.
          </p>
        </div>
        <Link to="/library">
          Explore your CVs
          <ArrowRight size={16} />
        </Link>
      </section>
      {adding && <JobForm onClose={() => setAdding(false)} />}
    </div>
  );
}
function FileIcon() {
  return (
    <div className="direction-icon">
      <BriefcaseBusiness size={21} />
    </div>
  );
}
