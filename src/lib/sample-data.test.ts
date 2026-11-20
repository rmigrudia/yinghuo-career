import { describe, expect, it } from "vitest";

import { contentToJadeResume, jadeResumeToContent } from "./resume-adapter";
import { normalizeResumeContent } from "./resume-content";
import { interviewReportSchema } from "./interview";
import { interviewPreparationSchema } from "./interview-preparation";
import {
  buildSampleAnswers,
  buildSampleApplications,
  sampleInterviewPreparation,
  sampleInterviewSession,
  sampleJobs,
  sampleResumeVersions,
  sampleTailoredResumeVersion,
} from "./sample-data";

const sampleSeedDate = new Date("2026-11-18T19:00:00.000Z");

describe("sample resume versions", () => {
  it("provides complete, distinct public resume examples", () => {
    expect(sampleResumeVersions.length).toBeGreaterThanOrEqual(1);
    expect(new Set(sampleResumeVersions.map((version) => version.id)).size).toBe(sampleResumeVersions.length);
    expect(new Set(sampleResumeVersions.map((version) => version.content.basics.name)).size).toBe(
      sampleResumeVersions.length,
    );
    expect(new Set(sampleResumeVersions.map((version) => JSON.stringify(version.content))).size).toBe(
      sampleResumeVersions.length,
    );

    for (const version of sampleResumeVersions) {
      expect(version.content.basics.name).toBeTruthy();
      expect(version.content.education.length).toBeGreaterThan(0);
      expect(version.content.internships.length).toBeGreaterThan(0);
      expect(version.content.projects.length).toBeGreaterThan(0);
      expect(version.content.skills.length).toBeGreaterThan(0);
      expect(version.content.profile.summary).toContain("演示简历 · 人物与经历为虚构");
    }
  });

  it("retains the demonstration profile after saving and reopening", () => {
    const source = sampleResumeVersions[0].content;
    const saved = jadeResumeToContent(contentToJadeResume(normalizeResumeContent(source)));
    expect(saved.basics).toMatchObject({ name: "唐铭轩", email: "xxx@163.com", phone: "" });
    expect(saved.education[0]).toMatchObject({ school: "嘉应学院", degree: "本科", major: "新闻学" });
    expect(saved.editor?.sections?.find(({ type }) => type === "personal_info")?.content).toMatchObject({
      gender: "男", age: "22 岁",
    });
    expect(saved.profile.summary).toContain("演示简历 · 人物与经历为虚构");
  });

  it("links all three Pearl River Delta jobs to their university recruitment notices", () => {
    expect(sampleJobs.map(({ city }) => city)).toEqual(["佛山顺德", "广州天河", "深圳"]);
    expect(sampleJobs.map(({ link }) => new URL(link!).host)).toEqual([
      "career.cuhk.edu.cn", "jy.gzhu.edu.cn", "51uns.bysjy.com.cn",
    ]);
    expect(sampleJobs[0]).toMatchObject({ deadline: null, deadlineNotice: "endOfNovember" });
    expect(sampleJobs.every(({ deadline }) => deadline === null)).toBe(true);
  });

  it("provides a complete and internally linked demo workflow", () => {
    const sampleApplications = buildSampleApplications(sampleSeedDate);
    const jobIds = new Set(sampleJobs.map((job) => job.id));
    const versionIds = new Set([
      ...sampleResumeVersions.map((version) => version.id),
      sampleTailoredResumeVersion.id,
    ]);

    expect(sampleJobs.every((job) => job.city && job.link && !job.jd.includes("暂未补充"))).toBe(true);
    expect(sampleApplications.every((application) => jobIds.has(application.jobId))).toBe(true);
    expect(sampleApplications.map(({ status }) => status)).toEqual(["INTERVIEW", "APPLIED", "ARCHIVED"]);
    expect(sampleApplications[0].stageDate).toBe("2026-11-21");
    expect(sampleApplications[1].nextFollowUpAt).toBe("2026-11-23");
    expect(buildSampleApplications(sampleSeedDate)).toEqual(sampleApplications);
    expect(
      sampleApplications.every(
        (application) => application.resumeVersionId === null || versionIds.has(application.resumeVersionId),
      ),
    ).toBe(true);
    expect(jobIds.has(sampleTailoredResumeVersion.jobId)).toBe(true);
    expect(sampleInterviewPreparation.jobId).toBe(sampleTailoredResumeVersion.jobId);
    expect(sampleInterviewSession.jobId).toBe(sampleTailoredResumeVersion.jobId);
    expect(interviewPreparationSchema.safeParse(sampleInterviewPreparation.content).success).toBe(true);
    expect(sampleInterviewSession.questions).toHaveLength(8);
    expect(Object.keys(buildSampleAnswers(sampleSeedDate))).toHaveLength(sampleInterviewSession.questions.length);
    expect(sampleInterviewSession.feedback.questionReviews).toHaveLength(sampleInterviewSession.questions.length);
    expect(interviewReportSchema.safeParse(sampleInterviewSession.feedback).success).toBe(true);
  });
});
