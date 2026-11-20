import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { legacySampleIds, sampleDataRevision } from "./sample-data";

describe("clearSampleData", () => {
  let database: PrismaClient;
  let clearSampleData: () => Promise<unknown>;
  let resetAppDataToSample: () => Promise<unknown>;
  let ensureSeedData: () => Promise<void>;
  let directory: string;
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), "lujie-clear-sample-"));
    const databasePath = join(directory, "test.db");
    writeFileSync(databasePath, "");
    process.env.DATABASE_URL = `file:${databasePath.replaceAll("\\", "/")}`;
    const migration = spawnSync(
      process.execPath,
      [resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"],
      { cwd: process.cwd(), env: process.env, encoding: "utf8" },
    );
    if (migration.status !== 0) throw new Error(migration.stderr || migration.stdout);

    delete (globalThis as { prisma?: PrismaClient }).prisma;
    vi.resetModules();
    ({ database } = await import("./db"));
    ({ clearSampleData, ensureSeedData, resetAppDataToSample } = await import("./repository"));
  }, 30_000);

  beforeEach(async () => {
    await resetAppDataToSample();
  });

  afterAll(async () => {
    await database?.$disconnect();
    delete (globalThis as { prisma?: PrismaClient }).prisma;
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    rmSync(directory, { recursive: true, force: true });
  });

  it("preserves a user-created application that reuses a sample job", async () => {
    const sampleApplication = await database.application.findFirstOrThrow({ include: { job: true } });
    await database.application.delete({ where: { id: sampleApplication.id } });
    const userApplication = await database.application.create({
      data: {
        id: "user-recreated-application",
        jobId: sampleApplication.jobId,
        status: "APPLIED",
        notes: "用户重新创建的投递卡片",
      },
    });

    await clearSampleData();

    const preserved = await database.application.findUniqueOrThrow({
      where: { id: userApplication.id },
      include: { job: true },
    });
    expect(preserved.jobId).not.toBe(sampleApplication.jobId);
    expect(preserved.job.company).toBe(sampleApplication.job.company);
    expect(preserved.job.title).toBe(sampleApplication.job.title);
    expect(await database.job.findUnique({ where: { id: sampleApplication.jobId } })).toBeNull();
  }, 30_000);

  it("preserves user-created artifacts that reuse a sample job without an application", async () => {
    const sampleJob = await database.job.findFirstOrThrow();
    const resume = await database.resume.create({ data: { name: "用户简历" } });
    const version = await database.resumeVersion.create({
      data: {
        id: "user-tailored-version",
        resumeId: resume.id,
        jobId: sampleJob.id,
        name: "用户定制简历",
        summary: "用户生成的岗位定制版本",
        content: {},
      },
    });

    await clearSampleData();

    const preserved = await database.resumeVersion.findUniqueOrThrow({
      where: { id: version.id },
      include: { job: true },
    });
    expect(preserved.jobId).not.toBe(sampleJob.id);
    expect(preserved.job?.company).toBe(sampleJob.company);
    expect(preserved.job?.title).toBe(sampleJob.title);
  }, 30_000);

  it("preserves an edited example resume and application while removing untouched examples", async () => {
    const original = await database.resumeVersion.findFirstOrThrow({ where: { jobId: null } });
    const application = await database.application.findUniqueOrThrow({ where: { id: "demo-app-shunde" } });
    const editedAt = new Date(Math.max(original.createdAt.getTime(), application.createdAt.getTime()) + 1000);
    await database.resumeVersion.update({
      where: { id: original.id }, data: { name: "合成个人简历", updatedAt: editedAt },
    });
    await database.application.update({
      where: { id: application.id }, data: { notes: "合成个人跟进", updatedAt: editedAt },
    });
    await database.job.update({
      where: { id: application.jobId }, data: { title: "合成岗位", updatedAt: editedAt },
    });

    await clearSampleData();

    expect(await database.resumeVersion.count()).toBe(2);
    expect(await database.resumeVersion.findUnique({ where: { id: original.id } })).toMatchObject({ name: "合成个人简历" });
    expect(await database.application.count()).toBe(1);
    expect(await database.application.findUnique({ where: { id: application.id }, include: { resumeVersion: true } })).toMatchObject({
      notes: "合成个人跟进",
      resumeVersion: { id: application.resumeVersionId },
    });
    expect(await database.job.count()).toBe(1);
    expect(await database.job.findUnique({ where: { id: application.jobId } })).toMatchObject({ title: "合成岗位" });
  });

  it("keeps existing data if restoring samples fails during reset", async () => {
    const before = await database.resumeVersion.findFirstOrThrow({ where: { jobId: null } });
    await database.resumeVersion.update({ where: { id: before.id }, data: { name: "需要保留的合成简历" } });
    await database.$executeRawUnsafe("CREATE TRIGGER test_reset_failure BEFORE INSERT ON Resume BEGIN SELECT RAISE(ABORT, 'synthetic restore failure'); END");
    try {
      await expect(resetAppDataToSample()).rejects.toThrow();
      expect(await database.resumeVersion.findUnique({ where: { id: before.id } })).toMatchObject({ name: "需要保留的合成简历" });
    } finally {
      await database.$executeRawUnsafe("DROP TRIGGER test_reset_failure");
    }
  });

  async function setUpLegacyWorkspace() {
    await clearSampleData();
    await database.settings.update({
      where: { id: "singleton" },
      data: { sampleDataRevision: 0, sampleDataCleared: false },
    });
    const createdAt = new Date("2026-11-18T10:00:00.000Z");
    const resume = await database.resume.create({ data: { name: "旧示例简历" } });
    await database.resumeVersion.createMany({ data: legacySampleIds.versions.map((id) => ({
      id, name: "旧示例版本", summary: "", content: {}, resumeId: resume.id, createdAt, updatedAt: createdAt,
    })) });
    await database.job.createMany({ data: legacySampleIds.jobs.slice(0, 3).map((id) => ({
      id, company: "旧示例公司", title: "旧示例岗位", city: "", source: "", jd: "", link: "", createdAt, updatedAt: createdAt,
    })) });
    await database.application.createMany({ data: legacySampleIds.applications.slice(0, 3).map((id, index) => ({
      id, jobId: legacySampleIds.jobs[index], resumeVersionId: legacySampleIds.versions[0], createdAt, updatedAt: createdAt,
    })) });
    return createdAt;
  }

  it("replaces untouched legacy examples once and seeds a linked demonstration", async () => {
    await setUpLegacyWorkspace();
    await ensureSeedData();
    await ensureSeedData();
    expect(await database.resume.count()).toBe(1);
    expect(await database.job.count()).toBe(3);
    expect(await database.application.count()).toBe(3);
    expect(await database.resumeVersion.count()).toBe(2);
    expect(await database.job.findUnique({ where: { id: legacySampleIds.jobs[0] } })).toBeNull();
    const prep = await database.interviewPreparation.findFirstOrThrow({ include: { resumeVersion: true, job: true } });
    expect(prep.resumeVersion?.name).toContain("唐铭轩");
    expect(prep.job?.city).toBe("佛山顺德");
    const interview = await database.interviewSession.findFirstOrThrow();
    expect(interview.jobId).toBe(prep.jobId);
    expect(await database.settings.findUnique({ where: { id: "singleton" } })).toMatchObject({ sampleDataRevision });
  }, 30_000);

  it("preserves changed examples, trashed records and their legacy relations during upgrade", async () => {
    const createdAt = await setUpLegacyWorkspace();
    const changedAt = new Date(createdAt.getTime() + 1000);
    const [edited, trashed, untouched] = legacySampleIds.applications;
    await database.application.update({ where: { id: edited }, data: { notes: "用户写的跟进内容", updatedAt: changedAt } });
    await database.application.update({ where: { id: trashed }, data: { deletedAt: changedAt } });
    await database.trashSnapshot.create({
      data: { kind: "job-analysis", recordId: legacySampleIds.jobs[2], name: "原职位资料", content: { jd: "回收站中的内容" } },
    });
    try {
      await ensureSeedData();
      expect(await database.application.findUnique({ where: { id: edited } })).toMatchObject({
        jobId: legacySampleIds.jobs[0], resumeVersionId: legacySampleIds.versions[0], notes: "用户写的跟进内容", updatedAt: changedAt,
      });
      expect(await database.application.findUnique({ where: { id: trashed } })).toMatchObject({
        jobId: legacySampleIds.jobs[1], resumeVersionId: legacySampleIds.versions[0], deletedAt: changedAt,
      });
      expect(await database.application.findUnique({ where: { id: untouched } })).toBeNull();
      expect(await database.job.findUnique({ where: { id: legacySampleIds.jobs[2] } })).toBeTruthy();
      expect(await database.trashSnapshot.count()).toBe(1);
    } finally {
      await database.trashSnapshot.deleteMany();
    }
  }, 30_000);

  it("does not reseed workspaces that opted out of samples", async () => {
    await clearSampleData();
    await database.settings.update({ where: { id: "singleton" }, data: { sampleDataRevision: 0 } });
    await ensureSeedData();
    expect(await database.job.count()).toBe(0);
    expect(await database.resume.count()).toBe(0);
  }, 30_000);
});
