"use client";

import type { ComponentType, PointerEvent } from "react";

import { cn } from "@/lib/utils";
import metricStyles from "./glass-metric.module.css";

export function GlassMetric({
  tone,
  icon: Icon,
  label,
  value,
  onClick,
}: {
  tone: "blue" | "gold" | "sky" | "champagne";
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  onClick?: () => void;
}) {
  const Tile = onClick ? "button" : "div";

  function updateTilt(event: PointerEvent<HTMLElement>) {
    const tile = event.currentTarget;
    if (tile.dataset.pressed !== "true") return;

    // Measure the stationary wrapper so the tilted surface cannot move its own hit area.
    const bounds = tile.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    tile.style.setProperty("--metric-rotate-x", `${3 - y * 16}deg`);
    tile.style.setProperty("--metric-rotate-y", `${(x - 0.5) * 22}deg`);
    tile.style.setProperty("--metric-light-x", `${x * 100}%`);
    tile.style.setProperty("--metric-light-y", `${y * 100}%`);
  }

  function startTilt(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (!onClick) event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.pressed = "true";
    updateTilt(event);
  }

  function endTilt(event: PointerEvent<HTMLElement>) {
    delete event.currentTarget.dataset.pressed;
  }

  return (
    <Tile
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(metricStyles.tile, metricStyles[tone])}
      onPointerDown={startTilt}
      onPointerMove={updateTilt}
      onPointerUp={endTilt}
      onPointerLeave={onClick ? endTilt : undefined}
      onPointerCancel={endTilt}
      onLostPointerCapture={endTilt}
    >
      <span className={metricStyles.surface}>
        <span className={metricStyles.glass} aria-hidden="true" />
        <span className={metricStyles.content}>
          <span className={metricStyles.icon} aria-hidden="true"><Icon className="h-4 w-4" /></span>
          <span className={metricStyles.value}>{value}</span>
          <span className={metricStyles.label}>{label}</span>
        </span>
      </span>
    </Tile>
  );
}

