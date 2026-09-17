import { ShieldAlert, ShieldCheck, Search, CircleHelp } from "lucide-react";
import { useWorkspace } from "../context";
import { companyDiligence, diligenceLabel, diligenceTone } from "../lib/domain";
import { Badge, ExternalLink, formatDate } from "./ui";

const iconFor = (status) => {
  if (status === "cleared") return <ShieldCheck size={15} />;
  if (status === "avoid" || status === "caution") return <ShieldAlert size={15} />;
  return <Search size={15} />;
};

export function EmployerDiligenceBadge({ companyId }) {
  const { data } = useWorkspace();
  const record = companyDiligence(data, companyId);
  return (
    <span className={`diligence-indicator ${record ? `diligence-${record.status}` : "diligence-unknown"}`}>
      {iconFor(record?.status)}
      Employer: {diligenceLabel(record?.status)}
    </span>
  );
}

export default function EmployerDiligence({ companyId, compact = false }) {
  const { data } = useWorkspace();
  const record = companyDiligence(data, companyId);
  const sources = record
    ? data.company_diligence_sources.filter((source) => source.company_diligence_id === record.id)
    : [];
  if (!record) {
    if (compact) return <p className="small muted">Employer diligence: Not researched</p>;
    return (
      <section className="detail-section diligence-section" aria-labelledby="diligence-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">EMPLOYER QUALITY</span>
            <h3 id="diligence-title">Employer diligence</h3>
          </div>
          <Badge><CircleHelp size={14} /> Not researched</Badge>
        </div>
        <p className="muted">No employer-quality review is recorded yet. Role fit and employer quality are separate decisions.</p>
      </section>
    );
  }
  if (compact) {
    return (
      <details className={`diligence-compact diligence-panel-${record.status}`}>
        <summary><EmployerDiligenceBadge companyId={companyId} /></summary>
        <p className="small">{record.summary || "No summary recorded."}</p>
        <div className="diligence-meta"><span>Confidence: <strong>{record.confidence}</strong></span><span>Reviewed: <strong>{formatDate(record.researched_at)}</strong></span><span>Evidence: <strong>{sources.length}</strong></span></div>
        {record.concern_signals.length > 0 && <><h4>Concerns</h4><ul>{record.concern_signals.map((signal, index) => <li key={index}>{signal}</li>)}</ul></>}
        {record.verification_questions.length > 0 && <><h4>Verify in interview</h4><ul>{record.verification_questions.map((question, index) => <li key={index}>{question}</li>)}</ul></>}
        {sources.length > 0 && <div className="source-list">{sources.map((source) => <div className="source-row" key={source.id}><span className="small">{source.source_name}</span><ExternalLink href={source.source_url}>Open source</ExternalLink></div>)}</div>}
      </details>
    );
  }
  return (
    <section className={`detail-section diligence-section diligence-panel-${record.status}`} aria-labelledby="diligence-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">EMPLOYER QUALITY</span>
          <h3 id="diligence-title">Employer diligence</h3>
        </div>
        <Badge tone={diligenceTone(record.status)}>{iconFor(record.status)} {diligenceLabel(record.status)}</Badge>
      </div>
      <div className="diligence-meta">
        <span>Confidence: <strong>{record.confidence}</strong></span>
        <span>Reviewed: <strong>{formatDate(record.researched_at)}</strong></span>
        <span>Evidence: <strong>{sources.length} source{sources.length === 1 ? "" : "s"}</strong></span>
      </div>
      <p>{record.summary || "No summary recorded."}</p>
      <div className="diligence-columns">
        <div>
          <h4>Positive signals</h4>
          {record.positive_signals.length ? <ul>{record.positive_signals.map((signal, index) => <li key={index}>{signal}</li>)}</ul> : <p className="muted">None recorded.</p>}
        </div>
        <div>
          <h4>Concerns</h4>
          {record.concern_signals.length ? <ul>{record.concern_signals.map((signal, index) => <li key={index}>{signal}</li>)}</ul> : <p className="muted">None recorded.</p>}
        </div>
      </div>
      {record.verification_questions.length > 0 && (
        <details className="diligence-questions">
          <summary>Questions to verify in interview</summary>
          <ul>{record.verification_questions.map((question, index) => <li key={index}>{question}</li>)}</ul>
        </details>
      )}
      {sources.length > 0 && (
        <details className="diligence-sources">
          <summary>Evidence and sources ({sources.length})</summary>
          <div className="source-list">
            {sources.map((source) => (
              <div className="source-row" key={source.id}>
                <div className="grow">
                  <strong>{source.source_name}</strong>
                  <p className="small muted">{source.evidence_classification} · {source.scope}{source.review_sample_size ? ` · ${source.review_sample_size} reviews` : ""}{source.accessed_at ? ` · Accessed ${formatDate(source.accessed_at)}` : ""}</p>
                  {source.note && <p className="small">{source.note}</p>}
                  <ExternalLink href={source.source_url}>Open source</ExternalLink>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
