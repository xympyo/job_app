import { describe, expect, it } from "vitest";
import { companyDiligence, diligenceLabel, diligenceTone, emptyData } from "../lib/domain";
import { companyDiligenceSchema, companyDiligenceSourceSchema } from "../lib/schema";

const companyId = "11111111-1111-4111-8111-111111111111";
const diligenceId = "22222222-2222-4222-8222-222222222222";

describe("employer diligence", () => {
  it("resolves a current record by canonical company and uses explainable labels", () => {
    const data = emptyData();
    data.company_diligence.push({ company_id: companyId, status: "caution", confidence: "medium", summary: "", positive_signals: [], concern_signals: [], verification_questions: [], operational_recommendation: "", researched_at: "2026-09-17" });
    expect(companyDiligence(data, companyId).status).toBe("caution");
    expect(diligenceLabel("hold")).toBe("Hold / Research");
    expect(diligenceLabel()).toBe("Not researched");
    expect(diligenceTone("cleared")).toBe("green");
  });
  it("validates normalized records and source evidence without review-text dumps", () => {
    expect(companyDiligenceSchema.parse({ company_id: companyId, status: "cleared", confidence: "high", researched_at: "2026-09-17" }).status).toBe("cleared");
    expect(companyDiligenceSourceSchema.parse({ company_diligence_id: diligenceId, source_name: "Official site", source_url: "https://example.com", source_type: "Official" }).scope).toBe("company");
    expect(() => companyDiligenceSourceSchema.parse({ company_diligence_id: diligenceId, source_name: "Review", source_url: "javascript:alert(1)", source_type: "Review" })).toThrow();
  });
});
