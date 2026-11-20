import { afterEach, describe, expect, it, vi } from "vitest";

import { contentToJadeResume } from "@/lib/resume-adapter";
import { extractWordText } from "@/lib/resume-file-parsers";
import { sampleResumeVersions } from "@/lib/sample-data";
import type { WorkExperienceContent } from "@/types/resume";
import { exportResumeAsEditableDocx } from "./resume-workbench";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("editable resume Word export", () => {
  it.each([
    { language: "zh", current: true, endDate: null, endLabel: "至今" },
    { language: "en", current: true, endDate: null, endLabel: "Present" },
    { language: "zh", current: false, endDate: null, endLabel: "" },
    { language: "zh", current: true, endDate: "2026-10", endLabel: "2026-10" },
  ] as const)("preserves education and work dates in $language DOCX bytes (current=$current, end=$endDate)", async ({ language, current, endDate, endLabel }) => {
    const source = sampleResumeVersions[0].content;
    const resume = contentToJadeResume(source);
    resume.language = language;
    const work = resume.sections.find((section) => section.type === "internship_experience")!.content as WorkExperienceContent;
    const secondInternship = { ...work.items[0], id: "date-check", startDate: "2025-06", endDate: "2025-09" };
    work.items.push(secondInternship);
    work.items[0].current = current;
    work.items[0].startDate = "2024-10";
    work.items[0].endDate = endDate;
    let exportedBlob: Blob | undefined;
    const link = { click: vi.fn(), remove: vi.fn(), href: "", download: "" };
    vi.stubGlobal("document", {
      createElement: () => link,
      body: { appendChild: vi.fn() },
    });
    vi.stubGlobal("window", { setTimeout: vi.fn() });
    vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      exportedBlob = blob as Blob;
      return "blob:resume-export";
    });

    await exportResumeAsEditableDocx(resume);
    const text = await extractWordText(Buffer.from(await exportedBlob!.arrayBuffer()));

    expect(link.click).toHaveBeenCalledOnce();
    expect(link.download).toBe("唐铭轩的演示简历.docx");
    expect(text).toContain("嘉应学院 | 本科 | 新闻学");
    expect(text).toContain("男 | 22 岁 | xxx@163.com");
    expect(text).toContain("演示简历 · 人物与经历为虚构");
    expect(text).toContain(`2024-10${endLabel ? ` - ${endLabel}` : ""}\n`);
    if (!current || endDate) expect(text).not.toMatch(/至今|Present/);
    expect(text).toContain("2025-06 - 2025-09");
  });
});
