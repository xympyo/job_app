import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from "lucide-react";
import { useWorkspace } from "../context";
import { emptyStructuredProfile } from "../v2/profile.js";
import { Badge, Button, Empty, ErrorBox, Input, Textarea } from "../components/ui";

const steps = [
  ["basics", "Basics"], ["direction", "Career direction"], ["education", "Education"],
  ["experience", "Experience"], ["projects", "Projects & leadership"], ["skills", "Skills & languages"],
  ["preferences", "Preferences"], ["additional", "Additional context"], ["review", "Review"],
];
const clone = (value) => JSON.parse(JSON.stringify(value));
const newItem = (type) => ({ id: `draft-${type}-${crypto.randomUUID().slice(0, 8)}`, ...(type === "experience" ? { type: "employment", evidence: [] } : { evidence: [] }) });
const asList = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);
const listText = (value = []) => value.join(", ");

function minimumError(form) {
  const hasDirection = form.targetRoles.length > 0;
  const hasEvidence = ["education", "experiences", "projects", "leadership"].some((key) => form[key].length > 0);
  if (!hasDirection && !hasEvidence) return "Add at least one career direction and one education, experience, project or leadership entry before publishing.";
  if (!hasDirection) return "Add at least one career direction before publishing.";
  if (!hasEvidence) return "Add at least one evidence entry before publishing. Education, experience, projects or leadership are all valid.";
  return "";
}
function diffProfile(before, after) {
  const rows = [];
  for (const key of ["targetRoles", "locationPreferences", "skills", "languages", "education", "experiences", "projects", "leadership", "workPreferences", "constraints"]) {
    const oldValue = before?.[key] || [];
    const newValue = after?.[key] || [];
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) continue;
    if (!oldValue.length && newValue.length) rows.push({ kind: "Added", label: key });
    else if (oldValue.length && !newValue.length) rows.push({ kind: "Removed", label: key });
    else rows.push({ kind: "Changed", label: key });
  }
  return rows;
}

export default function Career() {
  const { data, profile, profileCommand, reloadProfile } = useWorkspace();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [editing, setEditing] = useState(Boolean(profile.draft));
  const [step, setStep] = useState("basics");
  const [form, setForm] = useState(() => ({ ...emptyStructuredProfile(), freeformNotes: "" }));
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState("");
  const [formError, setFormError] = useState("");
  const [selectedRevision, setSelectedRevision] = useState(null);

  useEffect(() => {
    const source = profile.draft || profile.current;
    if (source && !dirty) setForm({ ...clone(source.structuredJson), freeformNotes: source.freeformNotes || "" });
    if (profile.draft) setEditing(true);
  }, [profile, dirty]);

  const update = useCallback((change) => {
    setForm((current) => ({ ...current, ...change }));
    setDirty(true);
    setSaveState("Saving…");
    setFormError("");
  }, []);
  const save = useCallback(async (value = form) => {
    if (!profile.draft || !profile.profile) return;
    const { freeformNotes = "", ...structuredJson } = value;
    await profileCommand((repo, userId) => repo.saveDraft(profile.profile.id, profile.draft.id, userId, {
      schemaVersion: profile.draft.schemaVersion,
      structuredJson,
      freeformNotes,
      sourceMapJson: profile.draft.sourceMapJson || {},
      createdBy: "user",
    }));
    setDirty(false);
    setSaveState("Saved");
  }, [form, profile.draft, profile.profile, profileCommand]);
  useEffect(() => {
    if (!editing || !dirty || !profile.draft) return undefined;
    const timer = setTimeout(() => save().catch((e) => { setSaveState("Couldn't save"); setFormError(e.message); }), 650);
    return () => clearTimeout(timer);
  }, [editing, dirty, profile.draft, form, save]);

  const begin = useCallback(async () => {
    if (!profile.profile) return;
    try {
      await profileCommand((repo, userId) => repo.createDraft(profile.profile.id, userId, { copyCurrent: true }));
      setEditing(true);
      setStep("basics");
      setDirty(false);
    } catch (e) { setFormError(e.message); }
  }, [profile.profile, profileCommand]);
  useEffect(() => {
    if (searchParams.get("start") === "1" && profile.profile && !profile.current && !profile.draft && !editing) begin();
  }, [searchParams, profile, editing, begin]);
  const publish = async () => {
    const issue = minimumError(form);
    if (issue) { setFormError(issue); setStep("review"); return; }
    try {
      if (dirty) await save();
      await profileCommand((repo, userId) => {
        const latest = repo.draft(profile.profile.id, userId);
        return repo.publishDraft(profile.profile.id, latest.id, userId, { expectedUpdatedAt: latest.updatedAt });
      });
      setEditing(false);
      setDirty(false);
      setFormError("");
    } catch (e) { setFormError(e.message); }
  };
  const discard = async () => {
    if (!profile.draft || !profile.profile) return;
    if (!window.confirm("Discard changes? Your published profile will stay unchanged.")) return;
    try { await profileCommand((repo, userId) => repo.discardDraft(profile.profile.id, profile.draft.id, userId)); setEditing(false); setDirty(false); } catch (e) { setFormError(e.message); }
  };
  if (profile.loading) return <div className="standard-page"><div className="loading-screen">Loading your career profile…</div></div>;
  if (!profile.available) return <div className="standard-page"><Empty title="Career setup is not available yet" description="Your current workspace is still using the existing career tools. Profile setup will appear when the V2 profile foundation is enabled." /></div>;
  if (profile.error && !profile.profile) return <div className="standard-page"><ErrorBox message={profile.error} /><Button onClick={reloadProfile}>Try again</Button></div>;
  if (!profile.profile) return null;
  if (!profile.current && !editing && !profile.draft) return <Intro onStart={begin} onSkip={() => navigate("/")} />;
  if (!editing && profile.current) return <Summary profile={profile} data={data} onEdit={begin} onHistory={setSelectedRevision} selectedRevision={selectedRevision} />;
  const currentStep = steps.findIndex(([id]) => id === step);
  const before = profile.current?.structuredJson;
  return <div className="standard-page career-page">
    <header className="page-heading"><div><div className="eyebrow">YOUR CAREER CONTEXT</div><h1>{profile.current ? "Edit your profile" : "Build your career profile"}</h1><p>Share enough context to make better career decisions. You can leave optional sections blank.</p></div><div className="career-save-status" role="status">{saveState || "Draft"}</div></header>
    <div className="career-editor">
      <nav className="career-steps" aria-label="Profile sections">{steps.map(([id, label], index) => <button key={id} className={step === id ? "active" : ""} onClick={() => setStep(id)}><span>{index + 1}</span>{label}</button>)}</nav>
      <section className="panel career-form-panel" aria-live="polite">
        <ErrorBox message={formError || profile.error} />
        {step === "basics" && <Basics form={form} update={update} />}
        {step === "direction" && <Direction form={form} update={update} />}
        {step === "education" && <Education form={form} update={update} />}
        {step === "experience" && <Experience form={form} update={update} />}
        {step === "projects" && <Projects form={form} update={update} />}
        {step === "skills" && <Skills form={form} update={update} />}
        {step === "preferences" && <Preferences form={form} update={update} />}
        {step === "additional" && <Additional form={form} update={update} />}
        {step === "review" && <Review form={form} before={before} profile={profile} />}
        <div className="form-actions career-actions">
          <Button disabled={currentStep === 0} onClick={() => setStep(steps[Math.max(0, currentStep - 1)][0])}><ArrowLeft size={16} />Back</Button>
          {step === "review" ? <><Button onClick={discard} variant="danger">Discard changes</Button><Button onClick={publish} variant="primary"><Check size={16} />Publish profile</Button></> : <Button onClick={() => setStep(steps[Math.min(steps.length - 1, currentStep + 1)][0])} variant="primary">Continue<ArrowRight size={16} /></Button>}
        </div>
      </section>
    </div>
  </div>;
}

function Intro({ onStart, onSkip }) { return <div className="standard-page career-intro"><div className="panel career-intro-panel"><div className="eyebrow">CAREER</div><h1>Build your career profile</h1><p>PyoLoker uses your career profile to evaluate opportunities, choose relevant CVs, prepare applications and build useful context for the AI you already use.</p><p className="muted">No AI is required. You can publish a partial profile and add more later.</p><div className="primary-actions"><Button variant="primary" onClick={onStart}>Set up my profile</Button><Button onClick={onSkip}>I’ll do this later</Button></div></div></div>; }
function SectionTitle({ title, description }) { return <div className="career-section-title"><h2>{title}</h2><p>{description}</p></div>; }
function Basics({ form, update }) { return <><SectionTitle title="Start with the basics" description="A name and broad career stage help PyoLoker speak to you clearly. Nothing is inferred." /><div className="form-grid"><Input label="Preferred name" value={form.identity?.displayName || ""} onChange={(e) => update({ identity: { ...(form.identity || {}), displayName: e.target.value } })} /><label className="field"><span>Career stage</span><select value={form.careerStage?.status || ""} onChange={(e) => update({ careerStage: { ...(form.careerStage || {}), status: e.target.value } })}><option value="">Choose if useful</option>{["student", "recent graduate", "employed professional", "freelancer/contractor", "career changer", "between roles", "other"].map((v) => <option key={v}>{v}</option>)}</select></label></div></>; }
function Direction({ form, update }) {
  const [roleText, setRoleText] = useState(() => listText(form.targetRoles));
  useEffect(() => { setRoleText(listText(form.targetRoles)); }, [form.targetRoles]);
  return <><SectionTitle title="What kinds of work interest you?" description="These are directions you want to explore, not claims that you already qualify." /><Textarea label="Target roles or directions" hint="Separate multiple directions with commas." value={roleText} onChange={(e) => setRoleText(e.target.value)} onBlur={() => update({ targetRoles: asList(roleText) })} /><Textarea label="Career direction note (optional)" value={form.careerStage?.directionNote || ""} onChange={(e) => update({ careerStage: { ...(form.careerStage || {}), directionNote: e.target.value } })} /></>;
}
function ListTextarea({ label, hint, values, onCommit }) {
  const [text, setText] = useState(() => listText(values));
  useEffect(() => { setText(listText(values)); }, [values]);
  return <Textarea label={label} hint={hint} value={text} onChange={(e) => setText(e.target.value)} onBlur={() => onCommit(asList(text))} />;
}
function Education({ form, update }) { const entries = form.education; const set = (index, change) => update({ education: entries.map((item, i) => i === index ? { ...item, ...change } : item) }); return <><SectionTitle title="Education" description="Optional. Add university, vocational study, bootcamps or certifications when they help explain your background." />{entries.map((item, i) => <div className="repeat-card" key={item.id}><div className="repeat-head"><strong>Education {i + 1}</strong><Button aria-label={`Remove education ${i + 1}`} onClick={() => update({ education: entries.filter((_, n) => n !== i) })}><Trash2 size={15} /></Button></div><div className="form-grid"><Input label="Institution" value={item.institution || ""} onChange={(e) => set(i, { institution: e.target.value })} /><Input label="Degree or qualification" value={item.degree || ""} onChange={(e) => set(i, { degree: e.target.value })} /><Input label="Field of study" value={item.field || ""} onChange={(e) => set(i, { field: e.target.value })} /><Input label="Expected graduation or end" value={item.expectedGraduation || ""} onChange={(e) => set(i, { expectedGraduation: e.target.value })} /><Input label="GPA or grade (optional)" value={item.gpa || ""} onChange={(e) => set(i, { gpa: e.target.value })} /><Textarea label="Notes/evidence (optional)" value={(item.evidence || []).join("\n")} onChange={(e) => set(i, { evidence: e.target.value.split("\n").filter(Boolean) })} /></div></div>)}<Button onClick={() => update({ education: [...entries, newItem("education")] })}><Plus size={15} />Add education</Button>{!entries.length && <p className="empty-hint">Education is optional. Add it if it helps explain your background.</p>}</>; }
function Experience({ form, update }) { const entries = form.experiences; const set = (index, change) => update({ experiences: entries.map((item, i) => i === index ? { ...item, ...change } : item) }); return <><SectionTitle title="Experience" description="Internships, freelance work, projects and employment all count as evidence. Keep each type accurate." />{entries.map((item, i) => <div className="repeat-card" key={item.id}><div className="repeat-head"><strong>Experience {i + 1}</strong><Button aria-label={`Remove experience ${i + 1}`} onClick={() => update({ experiences: entries.filter((_, n) => n !== i) })}><Trash2 size={15} /></Button></div><div className="form-grid"><Input label="Organisation or client" value={item.organization || ""} onChange={(e) => set(i, { organization: e.target.value })} /><Input label="Title or role" value={item.title || ""} onChange={(e) => set(i, { title: e.target.value })} /><label className="field"><span>Type</span><select value={item.type} onChange={(e) => set(i, { type: e.target.value })}>{["employment", "internship", "freelance", "contract", "project", "volunteer", "leadership", "other"].map((v) => <option key={v}>{v}</option>)}</select></label><Input label="Dates or ongoing status" value={item.dates || ""} onChange={(e) => set(i, { dates: e.target.value })} /><Textarea label="Responsibilities and evidence" hint="Use one point per line." value={(item.evidence || []).join("\n")} onChange={(e) => set(i, { evidence: e.target.value.split("\n").filter(Boolean) })} /></div></div>)}<Button onClick={() => update({ experiences: [...entries, newItem("experience")] })}><Plus size={15} />Add experience</Button>{!entries.length && <p className="empty-hint">That's okay. Projects, education and leadership can still provide strong evidence.</p>}</>; }
function Projects({ form, update }) { const projects = form.projects; const leadership = form.leadership; const set = (key, index, change) => update({ [key]: form[key].map((item, i) => i === index ? { ...item, ...change } : item) }); const editor = (key, item, i, label) => <div className="repeat-card" key={item.id}><div className="repeat-head"><strong>{label} {i + 1}</strong><Button aria-label={`Remove ${label.toLowerCase()} ${i + 1}`} onClick={() => update({ [key]: form[key].filter((_, n) => n !== i) })}><Trash2 size={15} /></Button></div><Input label={key === "projects" ? "Project name" : "Organisation or context"} value={item.name || item.organization || ""} onChange={(e) => set(key, i, key === "projects" ? { name: e.target.value } : { organization: e.target.value })} /><Textarea label="Evidence and outcomes" value={(item.evidence || []).join("\n")} onChange={(e) => set(key, i, { evidence: e.target.value.split("\n").filter(Boolean) })} /></div>; return <><SectionTitle title="Projects and leadership" description="Useful evidence can come from academic projects, communities and leadership—not only paid employment." />{projects.map((item, i) => editor("projects", item, i, "Project"))}<Button onClick={() => update({ projects: [...projects, newItem("project")] })}><Plus size={15} />Add project</Button>{leadership.map((item, i) => editor("leadership", item, i, "Leadership"))}<Button onClick={() => update({ leadership: [...leadership, newItem("leadership")] })}><Plus size={15} />Add leadership</Button></>; }
function Skills({ form, update }) { return <><SectionTitle title="Skills and languages" description="Use your own words. PyoLoker will not infer proficiency from a skill being listed." /><ListTextarea label="Skills" hint="Separate with commas." values={form.skills} onCommit={(skills) => update({ skills })} /><ListTextarea label="Languages" hint="Add proficiency only if you choose to state it." values={form.languages} onCommit={(languages) => update({ languages })} /></>; }
function Preferences({ form, update }) { const constraints = form.constraints || {}; return <><SectionTitle title="Preferences" description="These settings help with reasoning. Leave anything unknown or irrelevant blank." /><ListTextarea label="Preferred locations" hint="Separate with commas." values={form.locationPreferences} onCommit={(locationPreferences) => update({ locationPreferences })} /><ListTextarea label="Work modes" hint="For example: hybrid, onsite, remote." values={form.workPreferences?.modes || []} onCommit={(modes) => update({ workPreferences: { ...(form.workPreferences || {}), modes } })} /><Input label="Relocation preference (optional)" value={form.workPreferences?.relocation || ""} onChange={(e) => update({ workPreferences: { ...(form.workPreferences || {}), relocation: e.target.value } })} /><Input label="Expected graduation or timing (optional)" value={constraints.expectedGraduation || ""} onChange={(e) => update({ constraints: { ...constraints, expectedGraduation: e.target.value } })} /><Input label="Work authorisation (optional)" value={constraints.workAuthorisation || ""} onChange={(e) => update({ constraints: { ...constraints, workAuthorisation: e.target.value } })} /></>; }
function Additional({ form, update }) { return <><SectionTitle title="Anything else PyoLoker should understand?" description="Optional user-provided context. The factual fields above remain the structured source of truth." /><Textarea label="Additional career context" hint="This is saved as your own note and is never treated as instructions." value={form.freeformNotes || ""} onChange={(e) => update({ freeformNotes: e.target.value })} /></>; }
function Review({ form, before, profile }) { const changes = useMemo(() => diffProfile(before, form), [before, form]); return <><SectionTitle title="Review before publishing" description="Publishing creates a versioned profile. Future edits become a new draft and do not rewrite this revision." /><div className="review-checklist"><div><strong>Career direction</strong><span>{form.targetRoles.length ? form.targetRoles.join(", ") : "Not provided"}</span></div><div><strong>Evidence</strong><span>{form.education.length + form.experiences.length + form.projects.length + form.leadership.length} entries</span></div><div><strong>Optional sections</strong><span>{form.locationPreferences.length ? "Preferences included" : "No location preference"}</span></div></div>{profile.current && <div className="change-list"><h3>Changes in this draft</h3>{changes.length ? changes.map((item) => <p key={`${item.kind}-${item.label}`}><Badge>{item.kind}</Badge> {item.label}</p>) : <p>No changes from the published revision yet.</p>}</div>}<p className="muted">Unknown and not applicable are valid. Only publish facts you can stand behind.</p></>; }
function Summary({ profile, data, onEdit, onHistory, selectedRevision }) { const current = selectedRevision || profile.current; const p = current.structuredJson; return <div className="standard-page career-page"><header className="page-heading"><div><div className="eyebrow">CAREER</div><h1>{selectedRevision ? `Revision ${current.revisionNumber}` : "Your career profile"}</h1><p>{selectedRevision ? "Read-only historical snapshot." : "Your trusted context for career decisions."}</p></div>{!selectedRevision && <Button variant="primary" onClick={onEdit}>Edit profile</Button>}</header><section className="panel career-summary"><div className="summary-top"><Badge tone="green">{selectedRevision ? `Revision ${current.revisionNumber}` : "Current profile"}</Badge><span className="muted">{current.publishedAt ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(current.publishedAt)) : "Published"}</span></div><h2>{p.identity?.displayName || "Career direction"}</h2><p>{p.targetRoles?.join(" · ") || "No target direction added yet."}</p><div className="summary-grid"><SummaryBlock title="Education" values={p.education?.map((x) => x.institution || x.field).filter(Boolean)} empty="Education is optional." /><SummaryBlock title="Experience" values={p.experiences?.map((x) => `${x.organization || "Experience"} · ${x.type}`)} empty="No traditional employment is required." /><SummaryBlock title="Skills" values={p.skills} empty="No skills added yet." /><SummaryBlock title="Preferences" values={[...(p.locationPreferences || []), ...((p.workPreferences?.modes || []).map((x) => `Mode: ${x}`))]} empty="No preferences added." /></div>{current.freeformNotes && <div className="summary-note"><strong>Your additional context</strong><p>{current.freeformNotes}</p></div>}</section>{!selectedRevision && <><section className="panel cv-summary"><h2>CV variants</h2>{data.cv_versions.length ? data.cv_versions.map((cv) => <div key={cv.id} className="cv-summary-row"><strong>{cv.name}</strong><span>{cv.description}</span></div>) : <p className="muted">No CV variants yet. You can publish your profile without one.</p>}</section><section className="panel revision-history"><div className="section-heading"><div><h2>Revision history</h2><p>Published snapshots remain available for trust and comparison.</p></div></div>{profile.history.filter((r) => r.status === "published").map((revision) => <button className="history-row" key={revision.id} onClick={() => onHistory(revision)}><span>Revision {revision.revisionNumber}</span><span>{revision.id === profile.current.id ? "Current" : "Published"}</span><span>{revision.publishedAt ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(revision.publishedAt)) : ""}</span></button>)}</section></>}</div>; }
function SummaryBlock({ title, values = [], empty }) { return <div><h3>{title}</h3>{values.length ? <ul>{values.slice(0, 8).map((v) => <li key={v}>{v}</li>)}</ul> : <p className="muted">{empty}</p>}</div>; }
