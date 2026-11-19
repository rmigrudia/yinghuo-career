"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

import styles from "./team.module.css";

export function CopyInvitation({ path }: { path: string }) {
  const [feedback, setFeedback] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).href);
      setFeedback("已复制邀请链接");
    } catch {
      setFeedback("请复制下方链接地址。");
    }
  }

  return (
    <div className={styles.invitation}>
      <button type="button" className={styles.secondary} onClick={copy}><Copy size={16} /> 复制邀请链接</button>
      <a href={path}>查看邀请链接</a>
      <span role="status">{feedback}</span>
    </div>
  );
}
