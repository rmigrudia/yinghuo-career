import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { ApplicationStatus, Prisma, TeamRole } from "@prisma/client";
import { z } from "zod";

import { database } from "./db";

const scryptAsync = promisify(scrypt);
const primaryWorkspace = "roxy-team";
const day = 24 * 60 * 60;
export const teamSessionSeconds = 7 * day;
export const teamSessionCookie = "roxy-team-session";
export const applicationStatuses = {
  APPLIED: "已投递",
  ASSESSMENT: "笔试 / 测评",
  INTERVIEW: "面试中",
  OFFER: "Offer",
  REJECTED: "拒绝",
  ARCHIVED: "归档",
} satisfies Record<ApplicationStatus, string>;
export const teamRoles = { ADMIN: "管理员", EDITOR: "可编辑看板", VIEWER: "仅查看看板" } satisfies Record<TeamRole, string>;

const memberSelection = {
  id: true,
  workspaceId: true,
  displayName: true,
  role: true,
  workspace: { select: { name: true } },
} satisfies Prisma.TeamMemberSelect;
export type TeamActor = Prisma.TeamMemberGetPayload<{ select: typeof memberSelection }>;
type Tx = Prisma.TransactionClient;

export class TeamError extends Error {}

const displayName = z.string().trim().min(1, "请填写显示名称。").max(40, "显示名称最多 40 字。");
const handle = z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9_-]{2,31}$/, "用户名需为 3–32 位字母、数字、下划线或短横线。");
const password = z.string().min(12, "密码至少 12 个字符。").max(128, "密码最多 128 个字符。");
const accountInfo = z.object({ handle, displayName, password });
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
const revision = z.coerce.number().int().nonnegative();

function token() {
  return randomBytes(32).toString("base64url");
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function hashPassword(value: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(value, salt, 32) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

async function passwordMatches(value: string, saved: string | undefined) {
  // Spend the same amount of work when the username does not exist.
  const [salt, hex] = (saved ?? `${"0".repeat(32)}:${"0".repeat(64)}`).split(":");
  const key = await scryptAsync(value, salt, 32) as Buffer;
  const expected = Buffer.from(hex, "hex");
  return timingSafeEqual(key, expected) && Boolean(saved);
}

function parse<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
  const result = schema.safeParse(value);
  if (!result.success) throw new TeamError(result.error.issues[0]?.message ?? "请检查表单。");
  return result.data;
}

async function addSession(db: Tx, memberId: string) {
  const value = token();
  await db.teamSession.deleteMany({ where: { memberId, expiresAt: { lte: new Date() } } });
  await db.teamSession.create({
    data: { tokenHash: digest(value), memberId, expiresAt: new Date(Date.now() + teamSessionSeconds * 1000) },
  });
  return value;
}

export async function teamCanBeCreated() {
  return (process.env.ROXY_TEAM_SETUP_TOKEN?.length ?? 0) >= 24 && await database.teamWorkspace.count() === 0;
}

export async function createTeam(account: unknown, nameInput: unknown, setupToken: string) {
  const expected = process.env.ROXY_TEAM_SETUP_TOKEN;
  if (!expected || expected.length < 24 || !timingSafeEqual(Buffer.from(digest(setupToken)), Buffer.from(digest(expected)))) {
    throw new TeamError("初始化口令不正确。");
  }
  if (await database.teamWorkspace.count()) throw new TeamError("团队已创建，请登录。");
  const input = parse(accountInfo, account);
  const name = parse(z.string().trim().min(1, "请填写团队名称。").max(64, "团队名称最多 64 字。"), nameInput);
  const passwordHash = await hashPassword(input.password);
  return database.$transaction(async (tx) => {
    const workspace = await tx.teamWorkspace.create({ data: { id: primaryWorkspace, name } });
    const member = await tx.teamMember.create({
      data: { workspaceId: workspace.id, handle: input.handle, displayName: input.displayName, passwordHash, role: "ADMIN" },
    });
    await addActivity(tx, member, "member.joined", member.displayName);
    return addSession(tx, member.id);
  });
}

export async function teamLogin(data: unknown) {
  const input = parse(z.object({ handle, password: z.string().max(128) }), data);
  const member = await database.teamMember.findUnique({ where: { handle: input.handle }, select: { id: true, passwordHash: true } });
  if (!await passwordMatches(input.password, member?.passwordHash) || !member) {
    throw new TeamError("用户名或密码不正确。");
  }
  return database.$transaction((tx) => addSession(tx, member.id));
}

export async function findTeamActor(session: string | undefined): Promise<TeamActor | null> {
  if (!session || !tokenPattern.test(session)) return null;
  const row = await database.teamSession.findFirst({
    where: { tokenHash: digest(session), expiresAt: { gt: new Date() } },
    select: { member: { select: memberSelection } },
  });
  return row?.member ?? null;
}

export async function revokeTeamSession(session: string | undefined) {
  if (session && tokenPattern.test(session)) await database.teamSession.deleteMany({ where: { tokenHash: digest(session) } });
}

export async function inspectInvitation(value: string) {
  if (!tokenPattern.test(value)) return null;
  return database.teamInvitation.findFirst({
    where: { tokenHash: digest(value), usedAt: null, expiresAt: { gt: new Date() } },
    select: { workspace: { select: { name: true } }, role: true },
  });
}

export async function createTeamInvitation(actor: TeamActor, input: unknown) {
  if (actor.role !== "ADMIN") throw new TeamError("只有管理员可以邀请成员。");
  const role = parse(z.enum(["EDITOR", "VIEWER"]), input);
  const value = token();
  await database.$transaction(async (tx) => {
    await tx.teamInvitation.create({
      data: { tokenHash: digest(value), workspaceId: actor.workspaceId, role, expiresAt: new Date(Date.now() + 7 * day * 1000) },
    });
    await addActivity(tx, actor, "member.invited", teamRoles[role]);
  });
  return value;
}

export async function joinTeam(invite: string, account: unknown) {
  if (!tokenPattern.test(invite) || !await inspectInvitation(invite)) throw new TeamError("邀请已失效，请向管理员索取新链接。");
  const input = parse(accountInfo, account);
  const passwordHash = await hashPassword(input.password);
  return database.$transaction(async (tx) => {
    const invitation = await tx.teamInvitation.findUniqueOrThrow({ where: { tokenHash: digest(invite) } });
    const claimed = await tx.teamInvitation.updateMany({
      where: { id: invitation.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (!claimed.count) throw new TeamError("此邀请已被使用或已失效。");
    const member = await tx.teamMember.create({
      data: {
        workspaceId: invitation.workspaceId, role: invitation.role, handle: input.handle,
        displayName: input.displayName, passwordHash,
      },
    });
    await addActivity(tx, member, "member.joined", member.displayName);
    return addSession(tx, member.id);
  });
}

type ActivityKind = "member.invited" | "member.joined" | "member.role" | "application.created" | "application.updated" |
  "application.deleted" | "application.restored" | "resume.created" | "resume.updated" | "resume.visibility";

type FieldChange = { field: string; before: string; after: string };

function addActivity(
  tx: Tx, actor: { id: string; workspaceId: string }, kind: ActivityKind, target: string, changes?: FieldChange[],
) {
  return tx.teamActivity.create({
    data: { workspaceId: actor.workspaceId, actorId: actor.id, kind, target, changes },
  });
}

function resumeAccess(actor: TeamActor) {
  return {
    owner: { workspaceId: actor.workspaceId },
    OR: [{ ownerId: actor.id }, { teamVisible: true }],
  } satisfies Prisma.TeamResumeWhereInput;
}

export function getTeamResume(actor: TeamActor, id: string) {
  return database.teamResume.findFirst({
    where: { id, ...resumeAccess(actor) },
    include: { owner: { select: { displayName: true } } },
  });
}

export async function setTeamMemberRole(actor: TeamActor, id: string, input: unknown) {
  if (actor.role !== "ADMIN") throw new TeamError("只有管理员可以调整成员权限。");
  const role = parse(z.enum(["EDITOR", "VIEWER"]), input);
  await database.$transaction(async (tx) => {
    const member = await tx.teamMember.findFirst({ where: { id, workspaceId: actor.workspaceId } });
    if (!member || member.role === "ADMIN") throw new TeamError("无法修改该成员的权限。");
    if (member.role === role) return;
    await tx.teamMember.update({ where: { id: member.id }, data: { role } });
    await addActivity(tx, actor, "member.role", member.displayName, [{
      field: "成员权限", before: teamRoles[member.role], after: teamRoles[role],
    }]);
  });
}

export async function getTeamWorkspace(actor: TeamActor, page: number, filters?: { member?: string; target?: string }) {
  const [applications, resumes, members, activities] = await Promise.all([
    database.teamApplication.findMany({
      where: { workspaceId: actor.workspaceId },
      orderBy: [{ deletedAt: "asc" }, { updatedAt: "desc" }, { id: "asc" }],
    }),
    database.teamResume.findMany({
      where: resumeAccess(actor),
      select: { id: true, title: true, teamVisible: true, ownerId: true, owner: { select: { displayName: true } } },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    }),
    database.teamMember.findMany({
      where: { workspaceId: actor.workspaceId },
      select: { id: true, role: true, displayName: true },
      orderBy: { createdAt: "asc" },
    }),
    database.teamActivity.findMany({
      where: {
        workspaceId: actor.workspaceId,
        actorId: filters?.member || undefined,
        target: filters?.target ? { contains: filters.target } : undefined,
      },
      include: { actor: { select: { displayName: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * 25,
      take: 26,
    }),
  ]);
  return { applications, resumes, members, activities: activities.slice(0, 25), more: activities.length > 25 };
}

export async function saveTeamResume(actor: TeamActor, input: unknown) {
  const data = parse(z.object({
    id: z.string().optional(),
    revision,
    title: z.string().trim().min(1, "请填写简历名称。").max(100, "简历名称最多 100 字。"),
    content: z.string().trim().min(1, "请填写简历内容。").max(30000, "简历内容最多 30,000 字。"),
    teamVisible: z.boolean(),
  }), input);
  const { id, revision: expectedRevision, title, content, teamVisible } = data;
  return database.$transaction(async (tx) => {
    if (!id) {
      const resume = await tx.teamResume.create({ data: { ownerId: actor.id, title, content, teamVisible } });
      await addActivity(tx, actor, "resume.created", "个人简历");
      return resume.id;
    }
    const previous = await tx.teamResume.findFirst({ where: { id, ownerId: actor.id } });
    if (!previous) throw new TeamError("只有简历本人可以修改。");
    const updated = await tx.teamResume.updateMany({
      where: { id, ownerId: actor.id, revision: expectedRevision },
      data: { title, content, teamVisible, revision: { increment: 1 } },
    });
    if (!updated.count) throw new TeamError("这份简历已有新版本，请刷新后再编辑。");
    if (previous.teamVisible !== teamVisible) {
      await addActivity(tx, actor, "resume.visibility", "个人简历", [{
        field: "共享范围", before: previous.teamVisible ? "团队可见" : "仅本人可见", after: teamVisible ? "团队可见" : "仅本人可见",
      }]);
    }
    if (previous.title !== title || previous.content !== content) await addActivity(tx, actor, "resume.updated", "个人简历");
    return id;
  });
}

function requireEditor(actor: TeamActor) {
  if (actor.role === "VIEWER") throw new TeamError("你的看板权限为只读。");
}

export async function saveTeamApplication(actor: TeamActor, input: unknown) {
  requireEditor(actor);
  const { id, revision: expectedRevision, ...next } = parse(z.object({
    id: z.string().optional(),
    revision,
    company: z.string().trim().min(1, "请填写公司。").max(100, "公司名称最多 100 字。"),
    title: z.string().trim().min(1, "请填写岗位。").max(100, "岗位名称最多 100 字。"),
    status: z.nativeEnum(ApplicationStatus),
    notes: z.string().trim().max(4000, "备注最多 4,000 字。"),
  }), input);
  const target = `${next.company} · ${next.title}`;
  await database.$transaction(async (tx) => {
    if (!id) {
      await tx.teamApplication.create({ data: { ...next, workspaceId: actor.workspaceId } });
      await addActivity(tx, actor, "application.created", target, [{ field: "投递阶段", before: "", after: applicationStatuses[next.status] }]);
      return;
    }
    const where = { id, workspaceId: actor.workspaceId, deletedAt: null };
    const previous = await tx.teamApplication.findFirst({ where });
    if (!previous) throw new TeamError("这条投递记录已不存在。");
    const updated = await tx.teamApplication.updateMany({
      where: { ...where, revision: expectedRevision },
      data: { ...next, revision: { increment: 1 } },
    });
    if (!updated.count) throw new TeamError("有人已修改这条记录，请刷新后再编辑。");
    const changes = [
      { field: "公司", before: previous.company, after: next.company },
      { field: "岗位", before: previous.title, after: next.title },
      { field: "投递阶段", before: applicationStatuses[previous.status], after: applicationStatuses[next.status] },
      { field: "备注", before: previous.notes, after: next.notes },
    ].filter((change) => change.before !== change.after);
    if (changes.length) await addActivity(tx, actor, "application.updated", target, changes);
  });
}

export async function moveTeamApplication(actor: TeamActor, id: string, input: unknown, restore: boolean) {
  requireEditor(actor);
  const expectedRevision = parse(revision, input);
  await database.$transaction(async (tx) => {
    const where = { id, workspaceId: actor.workspaceId, deletedAt: restore ? { not: null } : null };
    const previous = await tx.teamApplication.findFirst({ where });
    if (!previous) throw new TeamError("这条记录已不在当前列表。");
    const updated = await tx.teamApplication.updateMany({
      where: { ...where, revision: expectedRevision },
      data: { deletedAt: restore ? null : new Date(), revision: { increment: 1 } },
    });
    if (!updated.count) throw new TeamError("记录已有更新，请刷新后再试。");
    await addActivity(tx, actor, restore ? "application.restored" : "application.deleted", `${previous.company} · ${previous.title}`);
  });
}
