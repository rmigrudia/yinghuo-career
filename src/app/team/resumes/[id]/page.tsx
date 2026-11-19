import Link from "next/link";
import { ArrowLeft, Eye, LockKeyhole } from "lucide-react";
import { notFound } from "next/navigation";

import { getTeamResume } from "@/lib/team";
import { saveResumeAction } from "../../actions";
import { requireTeamActor } from "../../session";
import styles from "../../team.module.css";

export const dynamic = "force-dynamic";

export default async function TeamResumePage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [actor, { id }, { error }] = await Promise.all([requireTeamActor(), params, searchParams]);
  const creating = id === "new";
  const resume = creating ? null : await getTeamResume(actor, id);
  if (!creating && !resume) notFound();
  const owns = creating || resume?.ownerId === actor.id;
  const visible = resume?.teamVisible ?? true;
  return (
    <main className={styles.page} lang="zh-CN">
      <div className={styles.shell}>
        <header className={styles.topbar}><Link href="/team#resumes" className={styles.brand} prefetch={false}><ArrowLeft size={18} /> 返回团队简历</Link><Link href="/">萤火职航</Link></header>
        <section className={`${styles.card} ${styles.document}`}>
          <div className={styles.heading}><h1>{resume?.title ?? "新增我的简历"}</h1></div>
          <p className={styles.muted}>{visible ? <Eye size={16} /> : <LockKeyhole size={16} />} {visible ? "团队可见" : "仅本人可见"} {resume ? `· ${resume.owner.displayName}` : ""}</p>
          {typeof error === "string" && <p className={styles.error} role="alert">{error.slice(0, 180)}</p>}
          {owns ? <form className={styles.form} action={saveResumeAction}>
            {resume && <input type="hidden" name="id" value={resume.id} />}
            <input type="hidden" name="revision" value={resume?.revision ?? 0} />
            <label>简历名称<input name="title" required maxLength={100} defaultValue={resume?.title} /></label>
            <label>简历内容<textarea name="content" required rows={14} maxLength={30000} defaultValue={resume?.content} placeholder="粘贴你的简历文本，团队成员可以在这里查看。" /></label>
            <label className={styles.toggle}>
              <input type="checkbox" name="teamVisible" defaultChecked={visible} />
              <span><strong>团队可见</strong><small>关闭并保存后，这份简历只有你可以查看。</small></span>
            </label>
            <button className={styles.primary}>保存简历</button>
          </form> : <div className={styles.resumeContent}>{resume?.content}</div>}
        </section>
      </div>
    </main>
  );
}
