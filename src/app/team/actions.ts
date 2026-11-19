"use server";

import { Prisma } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  createTeam, createTeamInvitation, joinTeam, moveTeamApplication, revokeTeamSession, saveTeamApplication,
  saveTeamResume, setTeamMemberRole, TeamError, teamLogin, teamSessionCookie,
} from "@/lib/team";
import { requireTeamActor, updateTeamCookie } from "./session";

const attempts = new Map<string, { count: number; expiresAt: number }>();
const windowMs = 10 * 60 * 1000;

function field(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

function account(form: FormData) {
  return { handle: field(form, "handle"), password: field(form, "password"), displayName: field(form, "displayName") };
}

async function limitAuthAttempts() {
  const address = (await headers()).get("x-forwarded-for")?.split(",").at(-1)?.trim().slice(0, 64) || "local";
  const now = Date.now();
  const tracked = attempts.get(address);
  if (tracked && tracked.expiresAt > now) {
    if (tracked.count >= 20) throw new TeamError("尝试过于频繁，请稍后再试。");
    tracked.count++;
    return;
  }
  if (attempts.size >= 2048) {
    for (const [key, attempt] of attempts) {
      if (attempt.expiresAt <= now) attempts.delete(key);
    }
    if (attempts.size >= 2048) throw new TeamError("尝试过于频繁，请稍后再试。");
  }
  attempts.set(address, { count: 1, expiresAt: now + windowMs });
}

async function submit(path: string, operation: () => Promise<void>) {
  try {
    await operation();
  } catch (error) {
    let message = "保存失败，请刷新后重试。";
    if (error instanceof TeamError) message = error.message;
    else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      message = "用户名已被使用，或团队已由管理员创建。";
    } else {
      console.error("Team operation failed", error instanceof Error ? error.name : typeof error);
    }
    const separator = path.includes("?") ? "&" : "?";
    redirect(`${path}${separator}error=${encodeURIComponent(message)}`);
  }
}

export async function setupTeamAction(form: FormData) {
  await submit("/team?setup=1", async () => {
    await limitAuthAttempts();
    const setup = field(form, "setupToken").slice(0, 256);
    await updateTeamCookie(await createTeam(account(form), field(form, "workspace"), setup));
  });
  redirect("/team");
}

export async function loginTeamAction(form: FormData) {
  await submit("/team", async () => {
    await limitAuthAttempts();
    await updateTeamCookie(await teamLogin(account(form)));
  });
  redirect("/team");
}

export async function joinTeamAction(form: FormData) {
  const rawInvite = field(form, "invite");
  const invite = /^[A-Za-z0-9_-]{43}$/.test(rawInvite) ? rawInvite : "";
  await submit(`/team?join=${invite}`, async () => {
    await limitAuthAttempts();
    await updateTeamCookie(await joinTeam(invite, account(form)));
  });
  redirect("/team");
}

export async function logoutTeamAction() {
  await revokeTeamSession((await cookies()).get(teamSessionCookie)?.value);
  await updateTeamCookie("");
  redirect("/team");
}

export async function createInvitationAction(form: FormData) {
  const actor = await requireTeamActor();
  let invitation = "";
  await submit("/team", async () => {
    invitation = await createTeamInvitation(actor, field(form, "role"));
  });
  redirect(`/team?invitation=${invitation}#members`);
}

export async function setRoleAction(form: FormData) {
  const actor = await requireTeamActor();
  await submit("/team", () => setTeamMemberRole(actor, field(form, "id"), field(form, "role")));
  redirect("/team#members");
}

export async function saveResumeAction(form: FormData) {
  const actor = await requireTeamActor();
  const rawId = field(form, "id");
  const id = /^[a-z0-9]{10,40}$/.test(rawId) ? rawId : undefined;
  const path = id ? `/team/resumes/${id}` : "/team/resumes/new";
  let saved = "";
  await submit(path, async () => {
    if (rawId && !id) throw new TeamError("无法识别这份简历。");
    saved = await saveTeamResume(actor, {
      id, revision: field(form, "revision"), title: field(form, "title"),
      content: field(form, "content"), teamVisible: form.has("teamVisible"),
    });
  });
  redirect(`/team/resumes/${saved}`);
}

export async function saveApplicationAction(form: FormData) {
  const actor = await requireTeamActor();
  await submit("/team", async () => {
    await saveTeamApplication(actor, {
      id: field(form, "id") || undefined, revision: field(form, "revision"),
      company: field(form, "company"), title: field(form, "title"),
      status: field(form, "status"), notes: field(form, "notes"),
    });
  });
  redirect("/team#applications");
}

export async function moveApplicationAction(form: FormData) {
  const actor = await requireTeamActor();
  await submit("/team", async () => {
    await moveTeamApplication(actor, field(form, "id"), field(form, "revision"), field(form, "action") === "restore");
  });
  redirect("/team#applications");
}
