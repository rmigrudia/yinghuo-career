import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, ClipboardList, FileText, History, LockKeyhole, Users } from "lucide-react";
import type { TeamApplication } from "@prisma/client";

import { applicationStatuses, getTeamWorkspace, inspectInvitation, teamCanBeCreated, teamRoles } from "@/lib/team";
import {
  createInvitationAction, joinTeamAction, loginTeamAction, logoutTeamAction, moveApplicationAction,
  saveApplicationAction, setRoleAction, setupTeamAction,
} from "./actions";
import { CopyInvitation } from "./copy-invitation";
import { teamActor } from "./session";
import styles from "./team.module.css";

export const dynamic = "force-dynamic";

const activityLabels: Record<string, string> = {
  "member.invited": "邀请成员",
  "member.joined": "加入团队",
  "member.role": "调整成员权限",
  "application.created": "新增投递",
  "application.updated": "更新投递",
  "application.deleted": "移入回收站",
  "application.restored": "恢复投递",
  "resume.created": "新增简历",
  "resume.updated": "更新简历",
  "resume.visibility": "修改简历共享",
};
const time = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", dateStyle: "medium", timeStyle: "short" });

type Search = { setup?: string; join?: string; invitation?: string; activity?: string; member?: string; target?: string; error?: string };

function AccountFields({ create }: { create: boolean }) {
  return (
    <>
      {create && <label>显示名称<input name="displayName" required maxLength={40} autoComplete="nickname" placeholder="团队成员看到的名字" /></label>}
      <label>用户名<input name="handle" required minLength={3} maxLength={32} pattern="[a-zA-Z0-9][a-zA-Z0-9_\-]{2,31}" autoComplete="username" placeholder="3–32 位字母、数字、下划线或短横线" /></label>
      <label>密码<input name="password" type="password" required minLength={create ? 12 : undefined} maxLength={128} autoComplete={create ? "new-password" : "current-password"} placeholder={create ? "至少 12 个字符" : "输入你的密码"} /></label>
    </>
  );
}

function ApplicationFields({ record }: { record?: TeamApplication }) {
  return (
    <>
      {record && <input type="hidden" name="id" value={record.id} />}
      <input type="hidden" name="revision" value={record?.revision ?? 0} />
      <div className={styles.formRow}>
        <label>公司<input name="company" required maxLength={100} defaultValue={record?.company} /></label>
        <label>岗位<input name="title" required maxLength={100} defaultValue={record?.title} /></label>
        <label>投递阶段<select name="status" defaultValue={record?.status ?? "APPLIED"}>
          {Object.entries(applicationStatuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select></label>
      </div>
      <label>备注<textarea name="notes" rows={3} maxLength={4000} defaultValue={record?.notes} /></label>
    </>
  );
}

function MoveRecord({ record, restore }: { record: TeamApplication; restore: boolean }) {
  return (
    <form action={moveApplicationAction}>
      <input type="hidden" name="id" value={record.id} />
      <input type="hidden" name="revision" value={record.revision} />
      <button className={styles.secondary} name="action" value={restore ? "restore" : "delete"}>{restore ? "恢复" : "移入回收站"}</button>
    </form>
  );
}

function changes(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is { field: string; before: string; after: string } =>
    entry && typeof entry.field === "string" && typeof entry.before === "string" && typeof entry.after === "string");
}

export default async function TeamPage({ searchParams }: { searchParams: Promise<Search> }) {
  const [query, actor] = await Promise.all([searchParams, teamActor()]);
  const join = typeof query.join === "string" ? query.join : "";
  const error = typeof query.error === "string" ? query.error.slice(0, 180) : "";
  if (!actor) {
    const [setupAvailable, invitation] = await Promise.all([
      teamCanBeCreated(), join ? inspectInvitation(join) : null,
    ]);
    const creating = query.setup === "1" && setupAvailable && !invitation;
    return (
      <main className={styles.page} lang="zh-CN">
        <div className={styles.shell}>
          <header className={styles.topbar}><Link href="/" className={styles.brand}><Image src="/brand/roxy-career.svg" width={35} height={35} alt="" />萤火职航</Link></header>
          <div className={styles.welcome}>
            <div className={styles.welcomeCopy}>
              <div className={styles.featureIcon}><Users size={31} /></div>
              <h1>{invitation ? invitation.workspace.name : "和团队一起跟进求职"}</h1>
              <p>共享投递进度，按需共享个人简历，查看每次改动由谁完成。</p>
            </div>
            <section className={styles.card}>
              <h2>{invitation ? "接受团队邀请" : creating ? "创建团队" : "登录团队工作区"}</h2>
              {error && <p className={styles.error} role="alert">{error}</p>}
              {join && !invitation && <p className={styles.error}>邀请链接已失效或已被使用。</p>}
              {invitation && <p className={styles.muted}>加入后具有「{teamRoles[invitation.role]}」权限。</p>}
              <form className={styles.form} action={invitation ? joinTeamAction : creating ? setupTeamAction : loginTeamAction}>
                {invitation && <input type="hidden" name="invite" value={join} />}
                {creating && <>
                  <label>团队名称<input name="workspace" required maxLength={64} /></label>
                  <label>初始化口令<input name="setupToken" type="password" required maxLength={256} autoComplete="off" /></label>
                </>}
                <AccountFields create={Boolean(invitation) || creating} />
                <button className={styles.primary}>{invitation ? "加入团队" : creating ? "创建团队" : "登录"}<ArrowRight size={17} /></button>
              </form>
              {setupAvailable && !creating && !invitation && <Link className={styles.textLink} href="/team?setup=1" prefetch={false}>首次使用，创建团队</Link>}
              {(creating || invitation) && <Link className={styles.textLink} href="/team" prefetch={false}>已有账号，去登录</Link>}
              {!creating && !invitation && !setupAvailable && <p className={styles.muted}>新成员通过管理员发来的邀请链接加入。</p>}
            </section>
          </div>
        </div>
      </main>
    );
  }

  const parsedPage = Number(query.activity);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 5000) : 1;
  const member = typeof query.member === "string" ? query.member.slice(0, 50) : "";
  const target = typeof query.target === "string" ? query.target.trim().slice(0, 100) : "";
  const { applications, resumes, members, activities, more } = await getTeamWorkspace(actor, page, { member, target });
  function activityLink(nextPage: number) {
    const params = new URLSearchParams({ activity: String(nextPage) });
    if (member) params.set("member", member);
    if (target) params.set("target", target);
    return `/team?${params.toString()}#activity`;
  }
  const open = applications.filter((record) => !record.deletedAt);
  const trashed = applications.filter((record) => record.deletedAt);
  const canEdit = actor.role !== "VIEWER";
  const isAdmin = actor.role === "ADMIN";
  const issued = isAdmin && typeof query.invitation === "string" && /^[A-Za-z0-9_-]{43}$/.test(query.invitation)
    ? query.invitation : "";
  return (
    <main className={styles.page} lang="zh-CN">
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link href="/" className={styles.brand}><Image src="/brand/roxy-career.svg" width={35} height={35} alt="" />萤火职航</Link>
          <div className={styles.account}><span>{actor.displayName} · {teamRoles[actor.role]}</span><form action={logoutTeamAction}><button className={styles.secondary}>退出登录</button></form></div>
        </header>
        <section className={styles.hero}>
          <div className={styles.featureIcon}><Users size={28} /></div>
          <div><h1>{actor.workspace.name}</h1><p>团队求职工作区</p></div>
          <nav className={styles.sections} aria-label="团队工作区">
            <a href="#applications">投递看板</a><a href="#resumes">团队简历</a><a href="#activity">操作记录</a><a href="#members">成员</a>
          </nav>
        </section>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.grid}>
          <section className={styles.card} id="applications">
            <div className={styles.heading}><BriefcaseBusiness size={22} /><h2>投递看板</h2><span>{open.length} 条</span></div>
            {canEdit && <details className={styles.editor}><summary>新增投递</summary><form className={styles.form} action={saveApplicationAction}><ApplicationFields /><button className={styles.primary}>保存投递</button></form></details>}
            {!open.length && <p className={styles.muted}>目前没有投递记录。</p>}
            <div className={styles.records}>{open.map((record) => (
              <article className={styles.record} key={record.id}>
                <div className={styles.recordHeading}><strong>{record.company} · {record.title}</strong><span className={styles.badge}>{applicationStatuses[record.status]}</span></div>
                {record.notes && <p className={styles.notes}>{record.notes}</p>}
                {canEdit && <details className={styles.editor}>
                  <summary>编辑记录</summary>
                  <form className={styles.form} action={saveApplicationAction}><ApplicationFields record={record} /><button className={styles.primary}>保存修改</button></form>
                  <MoveRecord record={record} restore={false} />
                </details>}
              </article>
            ))}</div>
            {!!trashed.length && <details className={styles.editor}><summary>回收站（{trashed.length}）</summary>
              {trashed.map((record) => <div key={record.id} className={styles.member}><span>{record.company} · {record.title}</span>{canEdit && <MoveRecord record={record} restore />}</div>)}
            </details>}
          </section>
          <section className={styles.card} id="resumes">
            <div className={styles.heading}><FileText size={22} /><h2>团队简历</h2></div>
            <Link className={styles.primary} href="/team/resumes/new" prefetch={false}>新增我的简历 <ArrowRight size={17} /></Link>
            {!resumes.length && <p className={styles.muted}>目前没有可查看的简历。</p>}
            <ul className={styles.resumes}>{resumes.map((resume) => (
              <li key={resume.id}><a href={`/team/resumes/${resume.id}`}><span><strong>{resume.title}</strong><small>{resume.owner.displayName}{resume.ownerId === actor.id && !resume.teamVisible ? " · 仅本人可见" : ""}</small></span><ArrowRight size={17} /></a></li>
            ))}</ul>
          </section>
          <section className={styles.card} id="activity">
            <div className={styles.heading}><History size={22} /><h2>操作记录</h2></div>
            <form className={`${styles.form} ${styles.filters}`} action="/team#activity">
              <label>成员<select name="member" defaultValue={member}><option value="">全部成员</option>{members.map((entry) => <option key={entry.id} value={entry.id}>{entry.displayName}</option>)}</select></label>
              <label>公司或岗位<input name="target" defaultValue={target} maxLength={100} /></label>
              <button className={styles.secondary}>筛选</button>
            </form>
            {!activities.length && <p className={styles.muted}>没有符合条件的操作记录。</p>}
            <ol className={styles.activity}>{activities.map((activity) => (
              <li key={activity.id}>
                <div><strong>{activity.actor.displayName}</strong> {activityLabels[activity.kind] ?? "更新记录"}「{activity.target}」</div>
                <time dateTime={activity.createdAt.toISOString()}>{time.format(activity.createdAt)}</time>
                {changes(activity.changes).map((change) => <p key={change.field}><strong>{change.field}</strong> {change.before || "空"} → {change.after || "空"}</p>)}
              </li>
            ))}</ol>
            {(page > 1 || more) && <nav className={styles.pagination} aria-label="操作记录分页">
              {page > 1 && <a href={activityLink(page - 1)}><ArrowLeft size={15} /> 上一页</a>}
              {more && <a href={activityLink(page + 1)}>下一页 <ArrowRight size={15} /></a>}
            </nav>}
          </section>
          <section className={styles.card} id="members">
            <div className={styles.heading}><Users size={22} /><h2>团队成员</h2><span>{members.length} 人</span></div>
            <ul className={styles.members}>{members.map((entry) => <li key={entry.id} className={styles.member}>
              <strong>{entry.displayName}</strong>
              {isAdmin && entry.role !== "ADMIN" ? <form action={setRoleAction} className={styles.roleForm}>
                <input type="hidden" name="id" value={entry.id} />
                <select name="role" defaultValue={entry.role} aria-label={`${entry.displayName}的权限`}>
                  <option value="EDITOR">可编辑看板</option><option value="VIEWER">仅查看看板</option>
                </select>
                <button className={styles.secondary}>保存</button>
              </form> : <span>{teamRoles[entry.role]}</span>}
            </li>)}</ul>
            {isAdmin && <details className={styles.editor} open={Boolean(issued) || undefined}>
              <summary>邀请成员</summary>
              <p className={styles.muted}>每条邀请链接限用一次，七天内有效。</p>
              <form className={styles.form} action={createInvitationAction}>
                <label>成员权限<select name="role"><option value="EDITOR">可编辑投递看板</option><option value="VIEWER">仅查看投递看板</option></select></label>
                <button className={styles.primary}>生成邀请链接</button>
              </form>
              {issued && <CopyInvitation path={`/team?join=${issued}`} />}
            </details>}
          </section>
        </div>
        <footer className={styles.footer}><LockKeyhole size={15} /> 仅团队成员可访问工作区 <Link href="/campus"><ClipboardList size={16} /> 浏览校招信息库</Link></footer>
      </div>
    </main>
  );
}
