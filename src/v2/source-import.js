import { hashText } from "./compiler.js";

export const SOURCE_LIMIT_BYTES = 200_000;
export const SOURCE_TYPES = ["text", "markdown"];

export function parseSourceText(text, { label = "Pasted source", sourceType = "text" } = {}) {
  const value = String(text ?? "");
  if (!value.trim()) throw new Error("Add some source text before importing.");
  if (!SOURCE_TYPES.includes(sourceType)) throw new Error("This source format is not supported yet. Use pasted text, Markdown, .txt, or .md.");
  if (String(label).length > 200) throw new Error("The source label is too long.");
  const bytes = new TextEncoder().encode(value).byteLength;
  if (bytes > SOURCE_LIMIT_BYTES) throw new Error(`Source is too large. Keep it under ${Math.round(SOURCE_LIMIT_BYTES / 1000)} KB.`);
  return { source_id: `source-${hashText(value).slice(-12)}`, label, source_type: sourceType, content: value, content_hash: hashText(value), bytes };
}

const clean = (value) => value.replace(/^[-*#>\s]+/, "").trim();
const listAfter = (line, label) => line.slice(label.length).split(",").map((item) => item.trim()).filter(Boolean);

/** Conservative, deterministic suggestions. These are suggestions only and never mutate a profile. */
export function suggestProfileClaims(source) {
  const text = typeof source === "string" ? source : source?.content || "";
  const lines = text.replaceAll("\r", "").split("\n").map(clean).filter(Boolean);
  const suggestion = { identity: {}, careerStage: {}, education: [], experiences: [], projects: [], leadership: [], skills: [], languages: [], targetRoles: [], locationPreferences: [], workPreferences: {}, constraints: {}, evidence: [], freeformNotes: "" };
  for (const line of lines) {
    if (/^(name|preferred name)\s*:/i.test(line)) suggestion.identity.displayName = line.replace(/^[^:]+:/, "").trim();
    else if (/^target roles?\s*:/i.test(line)) suggestion.targetRoles = listAfter(line, line.slice(0, line.indexOf(":") + 1));
    else if (/^locations?\s*:/i.test(line)) suggestion.locationPreferences = listAfter(line, line.slice(0, line.indexOf(":") + 1));
    else if (/^skills?\s*:/i.test(line)) suggestion.skills = listAfter(line, line.slice(0, line.indexOf(":") + 1));
    else if (/^languages?\s*:/i.test(line)) suggestion.languages = listAfter(line, line.slice(0, line.indexOf(":") + 1));
    else if (/^(expected graduation|graduation)\s*:/i.test(line)) suggestion.careerStage.graduation = line.replace(/^[^:]+:/, "").trim();
    else if (/^education\s*:/i.test(line)) {
      const [institution, field, expectedGraduation] = line.replace(/^[^:]+:/, "").split("|").map((x) => x.trim());
      suggestion.education.push({ institution, field, expectedGraduation, evidence: [line] });
    } else if (/^experience\s*:/i.test(line)) {
      const [organization, title, type = "other", dates] = line.replace(/^[^:]+:/, "").split("|").map((x) => x.trim());
      suggestion.experiences.push({ organization, title, type: ["employment", "internship", "freelance", "contract", "freelance/project", "project", "volunteer", "leadership", "other"].includes(type) ? type : "other", dates, evidence: [line] });
    }
  }
  return suggestion;
}
