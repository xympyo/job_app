import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Flag,
  Search,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useWorkspace } from "../context";
import { attentionItems } from "../lib/domain";
import { deriveRecommendedAction } from "../lib/guidance";
import { TERMINAL } from "../lib/constants";
import { RestartTutorialButton } from "../components/Guidance";

function HelpSection({ icon: Icon, title, description, children, action, to }) {
  return (
    <section className="guide-help-section">
      <div className="guide-card-icon">
        <Icon size={20} />
      </div>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
        <ul>{children}</ul>
        {action && (
          <Link className="btn" to={to}>
            {action}
            <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </section>
  );
}

export default function Guide() {
  const { data, profile, resetTutorial } = useWorkspace();
  const next = deriveRecommendedAction({
    data,
    profile,
    attention: attentionItems(data),
  });
  const activeApps = data.applications.filter(
    (application) => !TERMINAL.includes(application.status),
  ).length;
  return (
    <div className="standard-page guide-page">
      <header className="page-heading">
        <div>
          <div className="eyebrow">HELP & PLAYBOOK</div>
          <h1>Start Here</h1>
          <p>How PyoLoker works: Find, Evaluate, Apply, then Progress.</p>
        </div>
        <RestartTutorialButton onRestart={resetTutorial} />
      </header>
      <section className="panel recommended-step">
        <div>
          <span className="eyebrow">YOUR NEXT MOVE</span>
          <h2>{next.title}</h2>
          <p>{next.description}</p>
        </div>
        <Link className="btn primary" to={next.href}>
          {next.actionLabel}
          <ArrowRight size={16} />
        </Link>
      </section>
      <div className="guide-help-grid">
        <HelpSection
          icon={Search}
          title="Find jobs"
          description="Bring one vacancy or a researched batch into Jobs."
          action="Open Jobs"
          to="/jobs"
        >
          <li>Jobs is the main place to browse opportunities.</li>
          <li>Use Research import when your AI returns a structured batch.</li>
          <li>Unknown facts stay unknown until you verify them.</li>
        </HelpSection>
        <HelpSection
          icon={CheckCircle2}
          title="Triage jobs"
          description="Decide whether an opportunity deserves your time."
          action="Review opportunities"
          to="/jobs?lifecycle=To%20Review"
        >
          <li>Read employer/source facts first.</li>
          <li>Use fit, gaps and recommendation as research assessment.</li>
          <li>
            Ready to Apply means you chose the opportunity; it is not a
            submission.
          </li>
        </HelpSection>
        <HelpSection
          icon={BriefcaseBusiness}
          title="Apply today"
          description="Prepare deliberately, then submit through the employer."
          action="See ready jobs"
          to="/jobs?status=Ready%20to%20Apply"
        >
          <li>
            Preparing creates a workspace for CV choice, questions and notes.
          </li>
          <li>Nothing is submitted automatically.</li>
          <li>Mark Applied only after you submit externally.</li>
        </HelpSection>
        <HelpSection
          icon={Flag}
          title="Track progress"
          description="Keep the next action and hiring stages visible."
          action={activeApps ? "Open active work" : "Open Attention"}
          to={activeApps ? "/jobs?application=active" : "/attention"}
        >
          <li>
            Attention is the action queue for deadlines, questions, interviews
            and next actions.
          </li>
          <li>
            Jobs shows the full lifecycle; History keeps terminal records.
          </li>
          <li>
            Record assessments, interviews, offers and outcomes as they happen.
          </li>
        </HelpSection>
        <HelpSection
          icon={UserRound}
          title="Career"
          description="Maintain the trusted context behind your decisions."
          action="Open Career"
          to="/career"
        >
          <li>Your structured facts are yours to review and update.</li>
          <li>
            Your AI is optional. PyoLoker can prepare context for the AI you
            already use.
          </li>
          <li>Publish only facts you can stand behind.</li>
        </HelpSection>
      </div>
      <section className="panel guide-glossary">
        <h2 className="spacey">Quick glossary</h2>
        <dl>
          <div className="spacey">
            <dt>Found</dt>
            <dd>New opportunity waiting for review.</dd>
          </div>
          <div className="spacey">
            <dt>Reviewing</dt>
            <dd>You are checking fit and eligibility.</dd>
          </div>
          <div className="spacey">
            <dt>Saved</dt>
            <dd>Worth keeping in your shortlist.</dd>
          </div>
          <div className="spacey">
            <dt>Ready to Apply</dt>
            <dd>Your decision that the opportunity is worth pursuing.</dd>
          </div>
          <div className="spacey">
            <dt>Preparing</dt>
            <dd>
              An application workspace exists, but nothing has been submitted.
            </dd>
          </div>
          <div className="spacey">
            <dt>Applied</dt>
            <dd>You submitted externally and recorded the date.</dd>
          </div>
        </dl>
        <div className="guide-links spacey">
          <Link className="btn" to="/research">
            Import research
          </Link>
        </div>
      </section>
    </div>
  );
}
