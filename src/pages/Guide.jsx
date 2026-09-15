import { useState } from "react";
import { ArrowRight, CheckCircle2, Clipboard, Flag, Search, Target, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useWorkspace } from "../context";
import { attentionItems } from "../lib/domain";
import { TERMINAL } from "../lib/constants";
import { PROMPTS } from "../lib/prompts";
import { Badge, Button } from "../components/ui";
import { download } from "./Research";
import { triageExport } from "../lib/triage";

function CopyPrompt({ prompt }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.text);
    } catch {
      const area = document.createElement("textarea");
      area.value = prompt.text; document.body.appendChild(area); area.select();
      document.execCommand("copy"); area.remove();
    }
    setCopied(true); setTimeout(() => setCopied(false), 2200);
  };
  return <div className="prompt-card"><div className="prompt-card-head"><div><h3>{prompt.title}</h3><p>{prompt.when}</p></div><Button onClick={copy} aria-label={`Copy ${prompt.title} prompt`}><Clipboard size={15} />{copied ? "Copied" : "Copy prompt"}</Button></div><p className="small muted">{prompt.provide}</p><pre>{prompt.text}</pre></div>;
}
function WorkflowCard({ icon: Icon, title, description, count, action, to, children }) {
  const [open, setOpen] = useState(false);
  return <section className="guide-card"><div className="guide-card-icon"><Icon size={20} /></div><div className="guide-card-main"><h2>{title}</h2><p>{description}</p>{count && <Badge>{count}</Badge>}<div className="guide-actions"><Link className="btn primary" to={to}>{action}<ArrowRight size={15} /></Link><Button onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Hide steps" : "Show steps"}</Button></div>{open && <div className="guide-steps">{children}</div>}</div></section>;
}
export default function Guide() {
  const { data } = useWorkspace();
  const apps = data.applications;
  const preparing = apps.filter((a) => a.status === "Preparing").length;
  const activeApps = apps.filter((a) => !TERMINAL.includes(a.status)).length;
  const ready = data.jobs.filter((j) => !apps.some((a) => a.job_id === j.id) && j.review_status === "Ready to Apply").length;
  const review = data.jobs.filter((j) => !apps.some((a) => a.job_id === j.id) && ["Found", "Reviewing", "Saved"].includes(j.review_status)).length;
  const attention = attentionItems(data).length;
  const next = preparing ? { title: "Continue your application preparation.", to: "/jobs?lifecycle=Preparing", label: "Continue preparing" } : ready ? { title: "You have jobs ready to submit.", to: "/jobs?status=Ready%20to%20Apply", label: "See ready jobs" } : review ? { title: "Triage your current opportunities.", to: "/jobs?lifecycle=To%20Review", label: "Start triage" } : attention ? { title: "Handle the next item needing attention.", to: "/attention", label: "Open Attention" } : { title: "Research a new batch of opportunities.", to: "/research", label: "Start research" };
  return <div className="standard-page guide-page"><header className="page-heading"><div><div className="eyebrow">YOUR CAREER PLAYBOOK</div><h1>Start Here</h1><p>Find opportunities, decide what matters, apply, and keep moving.</p></div></header><section className="panel recommended-step"><div><span className="eyebrow">RECOMMENDED NEXT STEP</span><h2>{next.title}</h2><p>The page chooses one clear next move from your current workspace.</p></div><Link className="btn primary" to={next.to}>{next.label}<ArrowRight size={16} /></Link></section><h2 className="guide-question">What do you want to do?</h2><div className="guide-grid"><WorkflowCard icon={Search} title="Find jobs" description="Find a fresh batch of realistic opportunities." count={data.jobs.length ? `${data.jobs.length} tracked jobs` : "Start with your first batch"} action="Start research workflow" to="/research"><ol><li>Copy the research prompt below.</li><li>Ask Astra for verified opportunities.</li><li>Import the returned JSON and review the preview.</li></ol></WorkflowCard><WorkflowCard icon={Target} title="Triage jobs" description="Turn researched opportunities into a ranked action queue." count={`${review} jobs need a decision`} action="Start triage" to="/research"><ol><li>Export jobs for triage.</li><li>Attach the file to the triage prompt.</li><li>Import and review every decision.</li></ol></WorkflowCard><WorkflowCard icon={CheckCircle2} title="Apply today" description="The goal here is submission, not more research." count={`${ready} Ready to Apply · ${preparing} Preparing`} action="See what to apply to" to="/jobs?status=Ready%20to%20Apply"><p>Ready to Apply means you chose the opportunity. Preparing means its application workspace exists but it is not submitted yet.</p></WorkflowCard><WorkflowCard icon={TrendingUp} title="Track progress" description="Record submitted applications, interviews, assessments and outcomes." count={`${activeApps} active applications`} action="Open active applications" to="/jobs?application=active"><p>After submitting externally, mark Applied, record the date and add the next action. PyoLoker records the process; it does not submit applications.</p></WorkflowCard></div><section className="panel guide-section"><div className="panel-heading"><div><h2>Copy a prompt</h2><p>Each prompt tells Astra which documented workflow to follow and what to provide.</p></div></div><div className="prompt-list">{Object.values(PROMPTS).map((p) => <CopyPrompt key={p.title} prompt={p} />)}</div></section><section className="panel guide-section"><div className="panel-heading"><div><h2>Useful actions</h2><p>Open the exact workspace when you are ready.</p></div></div><div className="guide-links"><Link className="btn" to="/jobs?triage=Apply%20ASAP">Apply ASAP jobs</Link><Link className="btn" to="/attention"><Flag size={15} /> Attention</Link><Link className="btn" to="/history">History</Link><Button onClick={() => download("jobs-for-triage.json", JSON.stringify(triageExport(data), null, 2))}>Export jobs for triage</Button></div></section></div>;
}
