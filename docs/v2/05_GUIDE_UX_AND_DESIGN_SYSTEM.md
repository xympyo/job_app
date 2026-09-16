# `/guide` audit, future information architecture, and design primitives

## 1. Audit method and evidence

I ran the current V1 locally on 2026-09-15 with the repository’s development build, entered the explicit local workspace, navigated to `/guide`, captured full-page screenshots at 1440, 1024, 768, 390, and 320 CSS pixels, and checked the page for horizontal overflow and console errors.

Screenshots retained for review:

- [1440px guide audit](../../output/playwright/guide-audit-1440.png)
- [1024px guide audit](../../output/playwright/guide-audit-1024.png)
- [768px guide audit](../../output/playwright/guide-audit-768.png)
- [390px guide audit](../../output/playwright/guide-audit-390.png)
- [320px guide audit](../../output/playwright/guide-audit-320.png)

Observed checks:

- At 320px, `document.documentElement.scrollWidth` equalled the 320px viewport width; no horizontal overflow was observed.
- The page had no browser console errors during the audit.
- The guide is very long: the 320px local run produced approximately 6,137px of document height before the full prompt list and action footer ended.
- At 320px, the seven prompt blocks measured roughly 290–431px tall each. They remain readable, but the amount of scrolling and repeated structure makes the page feel like a reference document rather than a next-action tool.

This was a local visual audit, not a production claim. It does not cover physical devices, assistive technology, clipboard permissions in every browser, or authenticated production data.

## 2. Current strengths

- The first fold has a clear title, one recommended next step, and a useful four-part Find/Triage/Apply/Track model.
- The green action treatment and restrained surface hierarchy are consistent with the existing Career Command Center tone.
- The workflow cards explain the purpose before presenting an action.
- The current mobile layout collapses the workflow grid and avoids measured horizontal overflow.
- The copy buttons and `pre` blocks expose the actual handoff text, which is better than hiding instructions behind an opaque action.
- The page is safe as a V1 internal guide because it points a repository-aware operator to documented workflows.

## 3. Current problems that matter for V2

### The page optimises for documentation, not task completion

The recommended next step is helpful, but seven long prompt cards follow. A user who only wants to prepare one application must scroll through research, triage, apply, analysis, preparation, interview, and progress instructions. A future guide should show one task at a time with progressive disclosure.

### The handoff is not portable

The visible prompts instruct an AI to read `docs/README.md`, rely on repository documents, and refer to “Astra,” Moshe, Mattel, and Homize. That is correct for the current local workflow but fails for a new user and for any external AI that cannot access this repository. V2 must generate context, not point to hidden context.

### The guide lacks a sharing decision

There is no preview of which profile, job, application, document, or private field will leave PyoLoker. A future guide needs a visible “what will be shared” step and an explicit pack-size recommendation.

### Mobile density is acceptable but not comfortable

The 390px/320px layouts work, but the same seven full prompt blocks create a long, repetitive scroll. Copy actions are repeated on every card instead of being anchored to a selected task. The mobile experience should prioritise one task, one context preview, and one copy/download action.

### Provider language is too specific

“Astra” suggests a first-party integration and makes the workflow less portable. The V2 default should be “your AI,” with optional user-configured display language.

## 4. Recommended V2 guide

The future `/guide` should become a short task launcher:

```text
Start here
  ├── Recommended next move (one)
  ├── Choose a task
  │     Research · Triage · Prepare · Interview · Progress · Build profile
  ├── Review context
  │     included facts · excluded records · private fields · as-of dates
  ├── Ask your AI
  │     Copy context · Download pack · Copy JSON · Continue without AI
  └── Review result
        paste/import · stale check · accept to named target
```

Recommended layout:

1. A compact hero with `where you are`, `what is next`, and `why`.
2. A task grid with six cards, grouped into Find, Evaluate, Apply, and Progress; cards show readiness and do not contain full prompts.
3. A selected-task drawer/page with context preview, redaction controls, and the single Ask your AI primitive.
4. A compact recent handoffs area that shows pack date and stale status, not the full prompt text.
5. A Career area for full export, revision history, and private-document controls.

The existing seven workflows should remain available, but the guide should not make every workflow equally prominent or require reading all of them.

## 5. Design primitives for V2 planning

These primitives are recommendations for a future implementation and do not change current CSS.

### Tokens

| Token group | Proposed rule |
| --- | --- |
| Color | Keep a deep green action color, warm off-white page background, white cards, muted sage surfaces, and high-contrast ink. Add explicit success/warning/danger/info tokens with text contrast tested. |
| Spacing | Use a 4px base with 8/12/16/24/32/48px semantic steps. Keep a 16px minimum mobile card padding and 44px minimum touch target. |
| Type | Use one display scale for page titles, a compact task-title scale, readable 15–16px body text, and a legible monospace only for exported snippets/JSON. Do not use monospace as the primary mobile reading style. |
| Radius | Use a small consistent radius for controls and a larger radius for primary panels; avoid mixing many card shapes. |
| Surface | Use border + subtle background before shadow. Reserve stronger emphasis for one recommended action. |
| Motion | Short, optional transitions; all essential state changes work with reduced motion and keyboard focus. |

### Components

- `NextAction`: one title, reason, readiness state, and action; used on Home and task launchers.
- `TaskCard`: purpose, eligibility/readiness, estimated effort, and route; no long prompt body.
- `ContextPreview`: included/excluded sections, as-of dates, redactions, and pack size.
- `AskYourAI`: copy/download controls, provider-neutral instructions, success/error feedback, and fallback.
- `SourceBadge`: source type, verified date, freshness, and link safety.
- `RevisionBadge`: profile/application/pack revision and stale state.
- `ProposalReview`: fact/inference/unknown grouping, changed fields, source map, accept/reject.
- `AttentionItem`: one action, one owner, one due/status field, one underlying record link.
- `EmptyState`: one sentence of orientation, one primary next action, one optional secondary path.

### Accessibility requirements

- Every icon-only control has an accessible name.
- The selected task, sharing scope, stale status, and copy result are announced to assistive technology.
- Keyboard focus is visible and never hidden under sticky navigation.
- Color is not the sole signal for freshness, risk, competition, or stale state.
- The full context preview is usable at 320px without horizontal scrolling.
- Clipboard failure has a deterministic text/download fallback.
- Large packs use headings, landmarks, and collapsible sections rather than one giant preformatted block.

## 6. Home/Attention design test

Before implementation, test five scenarios:

1. New user with no profile sees setup, not a zero-filled dashboard.
2. User with one urgent deadline sees it in Attention and a summary link on Home, not two competing cards.
3. User with stale job verification sees a source-freshness task, not a generic “research more” recommendation.
4. User with a ready application sees Prepare/Submit as the next move, not a fresh research prompt.
5. User returning from an AI session sees the pack/result review action, with revision and stale context visible.

## Gate 2B UX boundary — 2026-09-16

Career is now a primary workspace destination for manual profile setup and review. `/guide` remains secondary help/orientation; normal profile editing does not require repeatedly visiting it. The Gate 2B editor follows the V2 design direction with progressive sections, explicit save status, review-before-publish, contextual explanations and mobile responsive layouts. Career Pack and “Ask your AI” controls remain deferred.
