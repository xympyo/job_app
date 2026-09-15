import { useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle2, CalendarDays } from "lucide-react";
import { useWorkspace } from "../context";
import {
  POST_SUBMISSION_STAGES,
  QUESTION_TYPES,
  REJECTION_STAGES,
  STAGES,
  STATUS_HELP,
} from "../lib/constants";
import { deleteRow, put, saveApplication, today } from "../lib/domain";
import {
  AsyncForm,
  Badge,
  Button,
  Confirm,
  Input,
  Modal,
  Select,
  Textarea,
  formatDate,
  formatDateTime,
  toLocalInput,
  toTimestamp,
} from "./ui";

function QuestionForm({ question, applicationId, onClose }) {
  const { mutate } = useWorkspace();
  const [v, setV] = useState(
    question || {
      application_id: applicationId,
      question_text: "",
      question_type: "free_text",
      status: "Draft",
      draft_answer: "",
      final_answer: "",
      reasoning_notes: "",
      required: false,
      character_limit: null,
    },
  );
  const [validation, setValidation] = useState("");
  const set = (k, value) => setV((old) => ({ ...old, [k]: value }));
  return (
    <Modal
      title={
        question ? "Edit application question" : "Add application question"
      }
      onClose={onClose}
      wide
    >
      <AsyncForm
        onSubmit={async () => {
          if (v.status === "Completed" && v.required && !v.final_answer.trim()) {
            setValidation("A completed required question needs a final answer.");
            return;
          }
          if (
            v.status !== "Draft" &&
            v.character_limit &&
            v.final_answer.length > v.character_limit
          ) {
            setValidation(
              `Final answer is ${v.final_answer.length} characters; the limit is ${v.character_limit}.`,
            );
            return;
          }
          setValidation("");
          await mutate(
            (d, uid) => put(d, "application_questions", v, uid),
            "Question and answers saved",
          );
          onClose();
        }}
      >
        <Textarea
          label="Question *"
          required
          value={v.question_text}
          onChange={(e) => set("question_text", e.target.value)}
        />
        <div className="form-grid">
          <Select
            label="Question type"
            options={QUESTION_TYPES}
            value={v.question_type}
            onChange={(e) => set("question_type", e.target.value)}
          />
          <Input
            label="Character limit"
            type="number"
            min="1"
            max="100000"
            value={v.character_limit ?? ""}
            onChange={(e) =>
              set(
                "character_limit",
                e.target.value ? Number(e.target.value) : null,
              )
            }
          />
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={v.required}
            onChange={(e) => set("required", e.target.checked)}
          />
          Required by employer
        </label>
        <div className="answer-draft">
          <Textarea
            label="Draft answer"
            hint={`${v.draft_answer.length} characters · working copy`}
            value={v.draft_answer}
            onChange={(e) => set("draft_answer", e.target.value)}
          />
        </div>
        <div className="answer-final">
          <Textarea
            label="Final / submitted answer"
            hint={`${v.final_answer.length}${v.character_limit ? ` / ${v.character_limit}` : ""} characters · saved separately from your draft`}
            aria-invalid={Boolean(validation)}
            value={v.final_answer}
            onChange={(e) => set("final_answer", e.target.value)}
          />
          {validation && <p className="field-error">{validation}</p>}
        </div>
        <Textarea
          label="Answer strategy / reasoning notes"
          value={v.reasoning_notes}
          onChange={(e) => set("reasoning_notes", e.target.value)}
        />
        <Select
          label="Answer status"
          options={["Draft", "Ready", "Completed"]}
          value={v.status}
          onChange={(e) => set("status", e.target.value)}
        />
        <div className="form-actions">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary">Save question</Button>
        </div>
      </AsyncForm>
    </Modal>
  );
}
function EventForm({ event, applicationId, onClose }) {
  const { mutate } = useWorkspace();
  const [v, setV] = useState(
    event || {
      application_id: applicationId,
      kind: "Assessment",
      title: "",
      scheduled_at: "",
      status: "Planned",
      notes: "",
    },
  );
  const set = (k, value) => setV((old) => ({ ...old, [k]: value }));
  return (
    <Modal
      title={
        event ? "Edit stage record" : "Add assessment, interview or contact"
      }
      onClose={onClose}
    >
      <AsyncForm
        onSubmit={async () => {
          await mutate((d, uid) => put(d, "application_events", v, uid));
          onClose();
        }}
      >
        <Input
          label="Title *"
          required
          value={v.title}
          onChange={(e) => set("title", e.target.value)}
        />
        <Select
          label="Type"
          options={[
            "Assessment",
            "HR interview",
            "Hiring manager interview",
            "Technical / case interview",
            "Final interview",
            "Recruiter contact",
            "Other",
          ]}
          value={v.kind}
          onChange={(e) => set("kind", e.target.value)}
        />
        <Input
          label="Scheduled for"
          type="datetime-local"
          value={toLocalInput(v.scheduled_at)}
          onChange={(e) => set("scheduled_at", toTimestamp(e.target.value))}
        />
        <Select
          label="Record status"
          options={["Planned", "Completed", "Cancelled"]}
          value={v.status}
          onChange={(e) => set("status", e.target.value)}
        />
        <Textarea
          label="Preparation / results / conversation notes"
          value={v.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
        <div className="form-actions">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary">Save record</Button>
        </div>
      </AsyncForm>
    </Modal>
  );
}
function ApplicationForm({ application, onClose }) {
  const { data, mutate } = useWorkspace();
  const [v, setV] = useState(application);
  const [validation, setValidation] = useState("");
  const [confirmPreparing, setConfirmPreparing] = useState(false);
  const set = (k, value) => setV((old) => ({ ...old, [k]: value }));
  const save = async (values = v) => {
    await mutate(
      (d, uid) => saveApplication(d, values, uid),
      "Application updated",
    );
    onClose();
  };
  return (
    <Modal title="Update application" onClose={onClose} wide>
      <AsyncForm
        onSubmit={async () => {
          setValidation("");
          const values = {
            ...v,
            applied_at: v.applied_at || (v.status === "Applied" ? today() : ""),
          };
          setV(values);
          if (POST_SUBMISSION_STAGES.includes(values.status) && !values.applied_at) {
            setValidation(
              "When did you apply? Add the application date before saving this stage.",
            );
            return;
          }
          if (
            values.status === "Preparing" &&
            POST_SUBMISSION_STAGES.includes(application.status) &&
            application.applied_at
          ) {
            setConfirmPreparing(true);
            return;
          }
          await save(values);
        }}
      >
        <div className="form-grid">
          <Select
            label="Application stage"
            options={STAGES}
            value={v.status}
            onChange={(e) => {
              const status = e.target.value;
              setV((old) => ({
                ...old,
                status,
                applied_at: status === "Applied" && !old.applied_at ? today() : old.applied_at,
              }));
            }}
          />
          <Input
            label="Date applied"
            type="date"
            value={v.applied_at}
            onChange={(e) => set("applied_at", e.target.value)}
          />
          <Select
            label="CV used"
            options={data.cv_versions.map((c) => ({
              label: c.name,
              value: c.id,
            }))}
            empty="Not recorded"
            value={v.cv_version_id}
            onChange={(e) => set("cv_version_id", e.target.value)}
          />
          <Select
            label="Rejection stage"
            options={REJECTION_STAGES}
            empty="Not applicable"
            value={v.rejection_stage}
            onChange={(e) => set("rejection_stage", e.target.value)}
          />
          <Input
            label="Next action"
            value={v.next_action}
            onChange={(e) => set("next_action", e.target.value)}
          />
          <Input
            label="Next action date & time"
            type="datetime-local"
            value={toLocalInput(v.next_action_at)}
            onChange={(e) => set("next_action_at", toTimestamp(e.target.value))}
          />
          <Input
            label="Recruiter name"
            value={v.recruiter_name}
            onChange={(e) => set("recruiter_name", e.target.value)}
          />
          <Input
            label="Recruiter contact"
            value={v.recruiter_contact}
            onChange={(e) => set("recruiter_contact", e.target.value)}
          />
        </div>
        <p className="field-help">{STATUS_HELP[v.status]}</p>
        {validation && <p className="field-error">{validation}</p>}
        {confirmPreparing && (
          <div className="warning-box" role="alert">
            <strong>Mark as not yet submitted?</strong>
            <p>
              This will mark the application as not yet submitted and clear the
              applied date.
            </p>
            <div className="form-actions">
              <Button type="button" onClick={() => setConfirmPreparing(false)}>
                Keep current stage
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={async () => {
                  setV((old) => ({ ...old, applied_at: "" }));
                  setConfirmPreparing(false);
                  await mutate(
                    (d, uid) =>
                      saveApplication(d, { ...v, applied_at: "" }, uid),
                    "Application marked Preparing",
                  );
                  onClose();
                }}
              >
                Mark Preparing and clear date
              </Button>
            </div>
          </div>
        )}
        {[
          "cover_letter_used",
          "rejection_reason",
          "offer_details",
          "notes",
        ].map((k, i) => (
          <Textarea
            key={k}
            label={
              [
                "Cover letter used",
                "Rejection reason / feedback",
                "Offer details",
                "Application notes",
              ][i]
            }
            value={v[k]}
            onChange={(e) => set(k, e.target.value)}
          />
        ))}
        <div className="form-actions">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary">Save application</Button>
        </div>
      </AsyncForm>
    </Modal>
  );
}
export default function ApplicationPanel({ application }) {
  const { data, mutate } = useWorkspace();
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const questions = data.application_questions.filter(
    (q) => q.application_id === application.id,
  );
  const events = data.application_events
    .filter((q) => q.application_id === application.id)
    .sort((a, b) =>
      (a.scheduled_at || "9999").localeCompare(b.scheduled_at || "9999"),
    );
  return (
    <div className="application-panel">
      <section className="detail-section">
        <div className="section-heading">
          <h3>Application progress</h3>
          <Button onClick={() => setModal({ type: "application" })}>
            <Pencil size={14} />
            Update
          </Button>
        </div>
        <div className="application-stage">
          <Badge tone="green">{application.status}</Badge>
          <span>
            {application.applied_at
              ? `Applied ${formatDate(application.applied_at)}`
              : "Not marked as applied"}
          </span>
        </div>
        <div className="fact-grid">
          <div>
            <small>CV used</small>
            <strong>{application.cv_snapshot?.name || "Not recorded"}</strong>
          </div>
          <div>
            <small>Next action</small>
            <strong>{application.next_action || "No next action"}</strong>
            <span>
              {application.next_action_at &&
                formatDateTime(application.next_action_at)}
            </span>
          </div>
        </div>
        {application.recruiter_name && (
          <p>
            Recruiter: {application.recruiter_name} ·{" "}
            {application.recruiter_contact}
          </p>
        )}
        {application.status === "Rejected" && (
          <div className="warning-box">
            Rejected at {application.rejection_stage || "unknown stage"}
            <p>{application.rejection_reason || "No feedback recorded."}</p>
          </div>
        )}
        {application.offer_details && (
          <p className="prewrap">{application.offer_details}</p>
        )}
        {application.notes && (
          <p className="prewrap note">{application.notes}</p>
        )}
        <details>
          <summary>Stage history</summary>
          <ol className="timeline">
            {application.stage_history.map((s, i) => (
              <li key={i}>
                <strong>{s.status}</strong>
                <span>{formatDateTime(s.at)}</span>
              </li>
            ))}
          </ol>
        </details>
      </section>
      <section className="detail-section">
        <div className="section-heading">
          <div>
            <h3>Application questions</h3>
            <p className="muted">
              {questions.filter((q) => q.status === "Completed").length} of{" "}
              {questions.length} completed
            </p>
          </div>
          <Button onClick={() => setModal({ type: "question" })}>
            <Plus size={15} />
            Add question
          </Button>
        </div>
        {questions.length === 0 && (
          <p className="inline-empty">
            Paste employer questions here. Keep your working drafts and final
            answers together.
          </p>
        )}
        {questions.map((q) => (
          <article key={q.id} className="question-card">
            <div className="section-heading">
              <Badge tone={q.status === "Completed" ? "green" : ""}>
                {q.status === "Completed" && <CheckCircle2 size={12} />}{" "}
                {q.status}
              </Badge>
              <div className="row-actions">
                <button
                  className="icon-btn"
                  aria-label={`Edit question: ${q.question_text}`}
                  onClick={() => setModal({ type: "question", record: q })}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-btn"
                  aria-label={`Delete question: ${q.question_text}`}
                  onClick={() =>
                    setDeleting({ table: "application_questions", id: q.id })
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <h4>{q.question_text}</h4>
            <p className="small muted">
              {q.question_type} {q.required && "· Required"}{" "}
              {q.character_limit && `· ${q.character_limit} character limit`}
            </p>
            {q.draft_answer && (
              <div className="answer-draft">
                <small>Draft</small>
                <p className="prewrap">{q.draft_answer}</p>
              </div>
            )}
            {q.final_answer && (
              <div className="answer-final">
                <small>Final / submitted</small>
                <p className="prewrap">{q.final_answer}</p>
              </div>
            )}
            {q.reasoning_notes && (
              <details>
                <summary>Answer strategy</summary>
                <p className="prewrap">{q.reasoning_notes}</p>
              </details>
            )}
          </article>
        ))}
      </section>
      <section className="detail-section">
        <div className="section-heading">
          <h3>Assessments & conversations</h3>
          <Button onClick={() => setModal({ type: "event" })}>
            <Plus size={15} />
            Add record
          </Button>
        </div>
        {events.length === 0 && (
          <p className="inline-empty">
            Record assessments, interview preparation and recruiter
            conversations as they happen.
          </p>
        )}
        {events.map((e) => (
          <article className="event-card" key={e.id}>
            <CalendarDays size={18} />
            <div className="grow">
              <strong>{e.title}</strong>
              <p className="small muted">
                {e.kind} · {formatDateTime(e.scheduled_at)} · {e.status}
              </p>
              {e.notes && <p className="prewrap">{e.notes}</p>}
            </div>
            <button
              className="icon-btn"
              aria-label={`Edit record: ${e.title}`}
              onClick={() => setModal({ type: "event", record: e })}
            >
              <Pencil size={15} />
            </button>
            <button
              className="icon-btn"
              aria-label={`Delete record: ${e.title}`}
              onClick={() =>
                setDeleting({ table: "application_events", id: e.id })
              }
            >
              <Trash2 size={15} />
            </button>
          </article>
        ))}
      </section>
      <details className="detail-section">
        <summary>Original vacancy snapshot</summary>
        <p className="small muted">
          Captured when this application was created. Later vacancy edits do not
          change this record.
        </p>
        <h4>{application.job_snapshot.title}</h4>
        <p>
          {application.job_snapshot.company_name} ·{" "}
          {application.job_snapshot.location_text}
        </p>
        {[
          "description",
          "responsibilities",
          "requirements",
          "preferred_requirements",
        ].map(
          (k) =>
            application.job_snapshot[k] && (
              <p className="prewrap" key={k}>
                {application.job_snapshot[k]}
              </p>
            ),
        )}
        <details>
          <summary>Complete snapshot data</summary>
          <pre className="json-view">
            {JSON.stringify(application.job_snapshot, null, 2)}
          </pre>
        </details>
        {application.cover_letter_used && (
          <>
            <h4>Cover letter used</h4>
            <p className="prewrap">{application.cover_letter_used}</p>
          </>
        )}
      </details>
      {modal?.type === "application" && (
        <ApplicationForm
          application={application}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "question" && (
        <QuestionForm
          question={modal.record}
          applicationId={application.id}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "event" && (
        <EventForm
          event={modal.record}
          applicationId={application.id}
          onClose={() => setModal(null)}
        />
      )}
      {deleting && (
        <Confirm
          title="Delete this record?"
          description="This removes the record and its saved notes or answers. Export a backup first if you need to retain it."
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await mutate(
              (d) => deleteRow(d, deleting.table, deleting.id),
              "Record removed",
            );
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
