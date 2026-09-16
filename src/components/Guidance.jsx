import { ArrowRight, CheckCircle2, CircleHelp, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { useWorkspace } from "../context";
import { Button } from "./ui";

export function ContextualGuidance({ milestone, title, children, action, href }) {
  const { tutorial, markTutorialSeen } = useWorkspace();
  if (tutorial?.state?.seen?.[milestone]) return null;
  return (
    <aside className="context-guidance" aria-label="Helpful guidance">
      <div className="context-guidance-icon"><CircleHelp size={17} /></div>
      <div className="grow"><strong>{title}</strong><p>{children}</p>{action && <Link className="context-guidance-link" to={href}>{action}<ArrowRight size={14} /></Link>}</div>
      <Button variant="text" onClick={() => markTutorialSeen(milestone)}>Got it</Button>
    </aside>
  );
}

export function GettingStarted({ items, onRestart, onHide }) {
  const complete = items.filter((item) => item.complete).length;
  const { tutorial } = useWorkspace();
  if (complete === items.length && !tutorial?.state?.reopenChecklist) return null;
  return (
    <section className="panel getting-started" aria-labelledby="getting-started-title">
      <div className="section-heading"><div><span className="eyebrow">A SIMPLE START</span><h2 id="getting-started-title">Getting started</h2><p>Find a role, evaluate it, prepare, then record what happens.</p></div><Button variant="text" onClick={onHide || onRestart}>{complete === items.length ? "Hide" : "Restart"}</Button></div>
      <ol className="getting-started-list">
        {items.map((item) => <li key={item.id} className={item.complete ? "complete" : ""}><span className="getting-started-check">{item.complete ? <CheckCircle2 size={17} /> : item.id[0].toUpperCase()}</span><div><strong>{item.label}</strong>{!item.complete && <Link to={item.href}>Open</Link>}</div></li>)}
      </ol>
    </section>
  );
}

export function RestartTutorialButton({ onRestart }) {
  return <Button onClick={onRestart}><RotateCcw size={15} /> Restart Getting Started</Button>;
}
