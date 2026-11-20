import { useState } from "react";
import { createRoot } from "react-dom/client";
import { IntlProvider } from "use-intl";
import { ArrowLeft, ArrowUpRight, Building2, X } from "lucide-react";
import { CareerLanding } from "@/app/career-landing";
import { AgentMascot } from "@/components/agent/agent-mascot";
import { CampusWorkspace } from "@/components/campus/campus-workspace";
import theme from "@/components/app/workspace-theme.module.css";
import { campusQuerySchema, queryCampus, type CampusDataset } from "@/lib/campus";
import messages from "./campus-messages.json";
import "@/app/globals.css";
import "./cloud.css";

let catalogRequest: Promise<CampusDataset> | undefined;

function loadDataset() {
  catalogRequest ??= fetch("/data/campus.json")
    .then((response) => {
      if (!response.ok) throw new Error("Campus snapshot unavailable");
      return response.json() as Promise<CampusDataset>;
    })
    .catch((error: unknown) => {
      catalogRequest = undefined;
      throw error;
    });
  return catalogRequest;
}

async function loadCatalog(query: string, signal: AbortSignal) {
  const dataset = await loadDataset();
  signal.throwIfAborted();
  return queryCampus(dataset, campusQuerySchema.parse(Object.fromEntries(new URLSearchParams(query))));
}

function CatalogGuide() {
  const [open, setOpen] = useState(false);
  const shortcuts = [
    ["深圳岗位", { location: "深圳" }],
    ["广州岗位", { location: "广州" }],
    ["实习机会", { recruitmentType: "实习" }],
    ["秋招机会", { recruitmentType: "秋招" }],
  ] as const;

  return (
    <div className="catalog-guide">
      {open ? (
        <section className="catalog-guide-panel" id="catalog-guide-panel" aria-label="找岗助手" onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
          <header>
            <strong>找岗助手</strong>
            <button type="button" aria-label="关闭找岗助手" onClick={() => setOpen(false)}><X size={17} /></button>
          </header>
          <p>选个城市或招聘类型，打开公司详情看投递入口。</p>
          <div className="catalog-guide-shortcuts">
            {shortcuts.map(([label, params]) => (
              <a key={label} href={`/campus?${new URLSearchParams(params)}`}>{label}<ArrowUpRight size={14} /></a>
            ))}
          </div>
        </section>
      ) : null}
      <button type="button" className="catalog-guide-trigger" aria-label={open ? "收起找岗助手" : "打开找岗助手"} aria-expanded={open} aria-controls={open ? "catalog-guide-panel" : undefined} onClick={() => setOpen((value) => !value)}>
        <AgentMascot />
      </button>
    </div>
  );
}

function CloudCareer() {
  const campus = /^\/campus\/?$/.test(location.pathname);
  if (!campus) {
    return <><CareerLanding catalogOnly /><CatalogGuide /></>;
  }

  return (
    <div className={theme.workspace}>
      <header className="cloud-topbar" data-workspace-chrome="toolbar">
        <div>
          <a href="/" className="cloud-brand"><img src="/brand/firefly-mark.png" alt="" width={38} height={38} />萤火职航</a>
          <nav aria-label="云端导航">
            <a href="/#cities"><ArrowLeft size={15} aria-hidden /> 探索城市</a>
            <a href="/campus" aria-current="page"><Building2 size={16} aria-hidden /> 校招信息库</a>
          </nav>
        </div>
      </header>
      <main className="cloud-main">
        <IntlProvider locale="zh-CN" messages={messages} timeZone="Asia/Shanghai">
          <CampusWorkspace loadCatalog={loadCatalog} />
        </IntlProvider>
      </main>
      <CatalogGuide />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<CloudCareer />);
