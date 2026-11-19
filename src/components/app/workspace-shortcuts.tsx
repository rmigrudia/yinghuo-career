"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Building2, House, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import styles from "./workspace-shortcuts.module.css";

export function WorkspaceShortcuts({ onOpenCampus }: { onOpenCampus: () => void }) {
  const t = useTranslations("app.sidebar");
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;
  const trigger = useRef<HTMLButtonElement>(null);

  function close() {
    setHovered(false);
    setPinned(false);
  }

  return (
    <nav
      aria-label={t("shortcutMenu")}
      className={cn("no-print", styles.shortcuts)}
      data-open={open}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setHovered(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return;
        event.preventDefault();
        trigger.current?.focus();
        close();
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={cn(styles.tile, styles.trigger)}
        aria-expanded={open}
        onClick={() => { if (pinned) close(); else setPinned(true); }}
      >
        <span className={styles.face}>
          <span className={styles.content}><Settings aria-hidden="true" />{t("shortcutMenu")}</span>
        </span>
      </button>
      <Link
        href="/"
        className={cn(styles.tile, styles.home)}
        tabIndex={open ? undefined : -1}
        aria-hidden={!open}
        onClick={close}
      >
        <span className={styles.face}>
          <span className={styles.content}><House aria-hidden="true" />{t("shortcutHome")}</span>
        </span>
      </Link>
      <button
        type="button"
        className={cn(styles.tile, styles.campus)}
        tabIndex={open ? undefined : -1}
        aria-hidden={!open}
        onClick={() => { close(); onOpenCampus(); }}
      >
        <span className={styles.face}>
          <span className={styles.content}><Building2 aria-hidden="true" />{t("shortcutCampus")}</span>
        </span>
      </button>
    </nav>
  );
}
