// Modified for the Roxy Career web edition.
import { z } from "zod";
import type { campusDatasetSchema } from "./campus-dataset.mjs";

const jobTagRules = [
  ["embedded", /嵌入式|单片机|固件|驱动(?:开发|工程)|BSP|firmware|embedded/i],
  ["hardware", /硬件|芯片(?:设计|开发|测试|研发|验证|工程师|岗)|半导体(?:工艺|设备)|集成电路(?:设计|验证)|FPGA|PCB|射频|数字IC|模拟IC|电子(?:工程师|研发|电路)|版图|硬件测试|\bIC\s*(?:design|verification)/i],
  ["software", /软件(?:开发|工程师|研发)|前端|后端|全栈|客户端|服务端|系统开发|应用开发|程序员|计算机视觉(?:开发|工程师)|Java开发|Python开发|C\+\+开发|software engineer|developer/i],
  ["aiData", /算法|大模型|机器学习|深度学习|数据(?:工程|分析|开发|科学)|人工智能(?:工程师|研发|开发)|AI\s*(?:工程师|研发|开发|应用)|data (?:scientist|engineer|analyst)|machine learning/i],
  ["automation", /自动化(?:技术工程师|工程师|设备|控制|研发|调试)|电气(?:工程师|设计|研发)|电控|控制算法|PLC|机器人工程师|机电(?:工程师|一体化设备)/i],
  ["mechanical", /机械(?:工程师|设计|研发)|结构(?:工程师|设计|研发)|工艺(?:工程师|研发)|制造(?:工程师|技术员)|模具|工业工程师|设备(?:工程师|维护)|\bME engineer/i],
  ["qualityTesting", /测试|测评工程师|质检|质量(?:工程师|管理|检验)|品质(?:工程师|管理)|QA\b|\bSDET\b/i],
  ["networking", /通信(?:工程师|研发)|网络(?:工程师|运维|安全)|信息安全|系统运维|云(?:计算工程师|平台运维)|安全(?:工程师|运维)|DevOps/i],
  ["productDesign", /产品(?:经理|助理|专员|设计)|交互设计|视觉设计|UI设计|UX设计|工业设计|平面设计|product manager|product designer/i],
  ["operations", /运营|新媒体|编辑|内容策划|广告投放|主播|视频剪辑|用户增长/i],
  ["sales", /销售|商务(?:专员|经理)|市场(?:营销|专员|拓展|管培)|营销专员|外贸(?:业务|专员|跟单)|客户经理|售前|business development/i],
  ["finance", /会计|审计|出纳|财务(?:专员|管培|助理|岗|类)|风控|投研|柜员|理财经理|投资(?:分析|助理)/i],
  ["peopleAdmin", /人力资源|招聘专员|行政(?:专员|助理|岗|管培)|法务|合规(?:专员|岗)|HRBP/i],
  ["supplyChain", /采购|供应链|物流(?:专员|工程师|管培|运营|管理)|仓储|跟单|计划工程师|\bPMC\b/i],
  ["education", /教师|教研|助教|讲师|教育(?:顾问|管培)|班主任/i],
  ["healthResearch", /医师|药师|护士|临床(?:研究|监查|协调)|研发(?:科学家|研究员)|实验(?:技术员|员|助理)|制药(?:工程师|研发)|科研(?:助理|岗)/i],
  ["managementTrainee", /管培生|管理培训生|管理储备|储备干部|management trainee/i],
] as const;

type CampusJobTag = (typeof jobTagRules)[number][0];

function deriveJobTags({ company, positions }: Pick<CampusRecord, "company" | "positions">): CampusJobTag[] {
  // A job tag describes the role. Majors and employer names can contain the same words.
  const lines = positions.replaceAll(company, "").split(/\r?\n/);
  const roleLine = lines.find((line) => /^岗位[：:]/.test(line));
  const roles = roleLine ?? lines.filter((line) => !/^\s*(?:需求专业|要求专业|专业要求)[：:]/.test(line)).join("\n");
  const labels = roles.split(/(?:需求专业|专业要求|相关专业)[：:]/, 1)[0];
  return jobTagRules.filter(([, keyword]) => keyword.test(labels)).map(([tag]) => tag);
}

export const campusQuerySchema = z.object({
  recordId: z.string().trim().min(1).max(120).optional(),
  q: z.string().trim().max(120).default(""),
  recruitmentType: z.string().max(120).default(""),
  target: z.string().max(120).default(""),
  location: z.string().trim().max(120).default(""),
  companyType: z.string().max(120).default(""),
  industry: z.string().max(120).default(""),
  jobTag: z.string().max(120).default(""),
  exam: z.string().max(120).default(""),
  deadline: z.enum(["", "dated", "expired", "unspecified", "invalid"]).default(""),
  sort: z.enum(["updated_desc", "updated_asc", "deadline_asc", "deadline_desc", "company_asc"]).default("updated_desc"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
});

export type CampusDataset = z.infer<typeof campusDatasetSchema>;
export type CampusRecord = CampusDataset["records"][number];
export type CampusQuery = z.infer<typeof campusQuerySchema>;
export type CampusResult = ReturnType<typeof queryCampus>;
export type CampusCatalogRecord = CampusResult["records"][number];
export const CAMPUS_PAGE_SIZE = 20;

export function chinaDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function campusDeadline(record: Pick<CampusRecord, "deadlineDate" | "deadlineRaw">, today: string) {
  if (record.deadlineDate) return record.deadlineDate < today ? "expired" : "dated";
  return /^\d{4}[-/年]/.test(record.deadlineRaw) ? "invalid" : "unspecified";
}

export function queryCampus(dataset: CampusDataset | null, query: CampusQuery, today = chinaDate(), pageSize = CAMPUS_PAGE_SIZE) {
  const records = (dataset?.records ?? []).map((record) => ({ ...record, jobTags: deriveJobTags(record) }));
  const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  const keywords = query.q.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  // ponytail: linear scans suit this small read-only catalog; use indexed storage if measured query cost grows.
  const matches = records.filter((record) => {
    if (query.recruitmentType && !record.recruitmentTypes.includes(query.recruitmentType)) return false;
    if (query.target && !record.targets.includes(query.target)) return false;
    if (query.companyType && record.companyType !== query.companyType) return false;
    if (query.industry && record.industry !== query.industry) return false;
    if (query.jobTag && !record.jobTags.some((tag) => tag === query.jobTag)) return false;
    if (query.exam && !record.exams.includes(query.exam)) return false;
    if (query.deadline && campusDeadline(record, today) !== query.deadline) return false;
    if (query.location && !record.location.toLocaleLowerCase().includes(query.location.toLocaleLowerCase())) return false;
    const searchable = [record.company, record.positions, record.location, record.industry].join(" ").toLocaleLowerCase();
    return keywords.every((keyword) => searchable.includes(keyword));
  }).sort((a, b) => {
    let order = 0;
    if (query.sort === "company_asc") order = a.company.localeCompare(b.company, "zh-CN");
    else {
      const byDeadline = query.sort.startsWith("deadline_");
      const left = byDeadline ? a.deadlineDate : a.updatedAt;
      const right = byDeadline ? b.deadlineDate : b.updatedAt;
      // Unknown dates always follow dated records, in either direction.
      if (!left !== !right) return left ? -1 : 1;
      order = (left ?? "").localeCompare(right ?? "") * (query.sort.endsWith("desc") ? -1 : 1);
    }
    return order || a.id.localeCompare(b.id);
  });
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  const page = Math.min(query.page, pages);
  return {
    source: dataset ? { name: dataset.sourceName, preparedAt: dataset.preparedAt } : null,
    asOf: today,
    totalRecords: records.length,
    total: matches.length,
    page,
    pages,
    pageSize,
    records: matches.slice((page - 1) * pageSize, page * pageSize),
    selectedRecord: records.find((record) => record.id === query.recordId) ?? null,
    facets: {
      recruitmentType: unique(records.flatMap((record) => record.recruitmentTypes)),
      target: unique(records.flatMap((record) => record.targets)),
      companyType: unique(records.map((record) => record.companyType)),
      industry: unique(records.map((record) => record.industry)),
      jobTag: jobTagRules.map(([tag]) => tag).filter((tag) => records.some((record) => record.jobTags.includes(tag))),
      exam: unique(records.flatMap((record) => record.exams)),
    },
  };
}
