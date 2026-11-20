// Modified for the Yinghuo Career web edition.
import { chinaDate } from "./campus";
import type { InterviewAnswers, InterviewQuestion, InterviewReport } from "./interview";
import type { InterviewPreparation } from "./interview-preparation";
import { contentToJadeResume, jadeResumeToContent } from "./resume-adapter";
import type { ApplicationRecord, JobRecord, ResumeContent } from "./types";
import type { PersonalInfoContent } from "@/types/resume";

export const sampleDataRevision = 1;

export const legacySampleIds = {
  jobs: [
    "cmqgzt65k0003a0cwskeetbo1", "cmqgua8t70000a0cwl8o3xqwn", "cmq1p2ksn0006ui8wbyrbxega",
    "cmq1p21td0003ui8wzce4qda6", "cmq1ox0mq0000ui8wt80spiuh", "job-meituan-backend",
  ],
  applications: [
    "cmqgzt65v0005a0cw4gpgz37f", "cmqgua8tg0002a0cwscbuxxq1", "cmq1p2ksw0008ui8wf2yh55ri",
    "cmq1p21tm0005ui8w3u1taqyh", "cmq1ox0n40002ui8w0au2hlxb", "app-meituan-backend",
  ],
  versions: ["rv-baidu-ai-original", "rv-baidu-ai-tailored"],
  preparations: ["prep-baidu-ai-data"],
  sessions: ["interview-baidu-ai-data"],
};

export const sampleJobs: Array<JobRecord & { deadlineNotice?: "endOfNovember" }> = [
  {
    id: "demo-job-shunde-publicity",
    company: "广东省广播电视网络股份有限公司",
    title: "宣传策划岗",
    city: "佛山顺德",
    source: "高校就业网",
    link: "https://career.cuhk.edu.cn/job/view/id/470042",
    deadline: null,
    deadlineNotice: "endOfNovember",
    jd: "广东广电网络2027届秋季校招市场类岗位，工作地点为佛山顺德分公司。要求本科及以上学历，新闻传播学、广告学、市场营销、数字媒体、汉语言文学等相关专业。公告未单列该岗位的具体职责，简历投递截止时间为2026年11月底。",
  },
  {
    id: "demo-job-guangzhou-media",
    company: "广州留学猫咨询有限公司",
    title: "新媒体运营实习生",
    city: "广州天河",
    source: "高校就业网",
    link: "https://jy.gzhu.edu.cn/web/index/job-detail?id=155844",
    deadline: null,
    jd: "参与小红书选题、文案与配图制作，协助合作账号沟通并跟进内容发布，定期整理笔记表现。公告要求本科及以上，新闻传播、中文、市场营销、英语等专业优先，每周至少到岗5天、实习不少于3个月。",
  },
  {
    id: "demo-job-shenzhen-social",
    company: "维屿（深圳）科技有限公司（ESR）",
    title: "社媒助理",
    city: "深圳",
    source: "高校就业网",
    link: "https://51uns.bysjy.com.cn/Announce/Details/3634664?schoolCode=10700",
    deadline: null,
    jd: "ESR 2027届全球校园招聘岗位，工作地点为深圳，学历要求本科及以上。公告面向2026年9月至2027年7月毕业的2027届学生。岗位的具体职责与申请要求以招聘页面为准。",
  },
];

const [shundeJob, guangzhouJob, shenzhenJob] = sampleJobs;
const demoNotice = "演示简历 · 人物与经历为虚构";
const resumeName = "唐铭轩的演示简历";
const tailoredName = "唐铭轩 · 宣传策划岗（演示）";

function withDemoPersonalInfo(content: ResumeContent): ResumeContent {
  const resume = contentToJadeResume(content);
  const personal = resume.sections.find((section) => section.type === "personal_info");
  Object.assign(personal!.content as PersonalInfoContent, { gender: "男", age: "22 岁" });
  for (const section of resume.sections) {
    if (["work_experience", "certifications", "self_evaluation"].includes(section.type)) section.visible = false;
  }
  return { ...content, editor: jadeResumeToContent(resume).editor };
}

const tangResume = withDemoPersonalInfo({
  editor: { displayName: resumeName, template: "academic" },
  basics: { name: "唐铭轩", email: "xxx@163.com", phone: "", city: "求职意向地：广州、佛山、深圳", links: [] },
  profile: {
    title: "新媒体运营 / 内容运营 / 活动策划",
    summary: "演示简历 · 人物与经历为虚构。2027 届新闻学本科生，做过公众号文案、排版和活动短视频，求职方向为新媒体运营、内容运营和活动策划。",
  },
  education: [{
    school: "嘉应学院", degree: "本科", major: "新闻学", start: "2023-09", end: "2027-06",
    highlights: ["2027 届，预计 2027 年 6 月毕业。"],
  }],
  experiences: [],
  internships: [{
    company: "广州社区活动团队（虚构）", role: "内容运营实习生", start: "2026-07", end: "2026-08",
    highlights: [
      "协助制作 6 篇公众号推文，负责收集活动信息、撰写初稿和基础排版。",
      "用剪映剪辑 3 条活动短视频，完成字幕和素材整理。",
      "用 Excel 登记推文阅读量和互动数，整理每周发布与反馈记录。",
    ],
  }],
  projects: [{
    name: "校园社团招新宣传", role: "宣传组成员",
    highlights: ["撰写招新推文初稿并制作报名表，活动现场协助签到，整理常见报名问题。"],
  }],
  skills: ["文案编辑", "秀米排版", "剪映基础剪辑", "Excel 数据整理"],
  awards: [],
  selfReview: "",
});

export const sampleResumeVersions = [{
  id: "demo-resume-tang",
  jobId: null,
  name: resumeName,
  summary: demoNotice,
  content: tangResume,
}];

const tailoredResume = withDemoPersonalInfo({
  ...tangResume,
  editor: { ...tangResume.editor, displayName: tailoredName, sections: undefined },
  profile: {
    title: "宣传策划",
    summary: "演示简历 · 人物与经历为虚构。2027 届新闻学本科生，有校园活动宣传、公众号文案排版和发布数据整理经历，求职方向为宣传策划。",
  },
  internships: [{
    ...tangResume.internships[0],
    highlights: [
      tangResume.internships[0].highlights[0],
      tangResume.internships[0].highlights[2],
      tangResume.internships[0].highlights[1],
    ],
  }],
});

export const sampleTailoredResumeVersion = {
  id: "demo-resume-tang-shunde",
  jobId: shundeJob.id,
  name: tailoredName,
  summary: demoNotice,
  content: {
    ...tailoredResume,
    _tailoringBaseResume: tangResume,
    _optimizationMeta: {
      company: shundeJob.company,
      title: shundeJob.title,
      keywords: ["活动宣传", "文案编辑", "内容复盘"],
      summary: "把已有的宣传文案和数据整理经历放到更容易看到的位置。",
      changes: ["将活动宣传和文案排版列为求职重点", "将发布数据整理移到短视频剪辑之前"],
      versionName: tailoredName,
    },
  } as ResumeContent,
};

function dateOffset(day: string, offset: number) {
  const date = new Date(day);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export const sampleApplicationIds = ["demo-app-shunde", "demo-app-guangzhou", "demo-app-shenzhen"];

export function buildSampleApplications(now: Date): ApplicationRecord[] {
  const today = chinaDate(now);
  return [
    {
      id: sampleApplicationIds[0], jobId: shundeJob.id, status: "INTERVIEW", interviewRound: "FIRST",
      resumeVersionId: sampleTailoredResumeVersion.id,
      appliedAt: dateOffset(today, -6), stageDate: dateOffset(today, 2), nextFollowUpAt: null,
      notes: "练习用社团招新和公众号实习讲清自己的分工，准备一页活动复盘。",
    },
    {
      id: sampleApplicationIds[1], jobId: guangzhouJob.id, status: "APPLIED",
      resumeVersionId: sampleResumeVersions[0].id,
      appliedAt: dateOffset(today, -3), stageDate: dateOffset(today, -3), nextFollowUpAt: dateOffset(today, 4),
      notes: "整理一篇推文和一条短视频作为作品样例，记录每周可到岗时间。",
    },
    {
      id: sampleApplicationIds[2], jobId: shenzhenJob.id, status: "ARCHIVED",
      resumeVersionId: sampleResumeVersions[0].id,
      appliedAt: dateOffset(today, -8), stageDate: dateOffset(today, -1), nextFollowUpAt: null,
      notes: "暂时把精力放在广州和佛山的岗位，保留公告供之后回看。",
    },
  ];
}

const interviewContext = {
  company: shundeJob.company,
  title: shundeJob.title,
  jd: shundeJob.jd,
  resumeName: tailoredName,
  resume: tailoredResume,
};

const interviewExamples = [
  {
    category: "self-introduction", prompt: "请用一分钟介绍自己，并说明为什么想做宣传策划。",
    focus: "把所学专业与一次亲自参与的宣传工作连起来。",
    answer: "我是嘉应学院新闻学专业的唐铭轩，预计2027年毕业。我做过公众号内容实习，也在社团招新时写过推文、做过报名表，希望从宣传策划和活动执行的基础工作做起。",
    suggestion: "增加一句在推文中实际负责的工作，让介绍更具体。",
    revised: "我是嘉应学院新闻学专业的唐铭轩，预计2027年毕业。我在两个月的实习里协助制作了6篇推文，做过活动信息收集、初稿和排版。校园招新时，我也负责过报名表和现场签到。我想继续积累本地活动宣传和复盘的经验。",
  },
  {
    category: "motivation", prompt: "你为什么选择佛山顺德的宣传策划岗？",
    focus: "用个人职业目标解释选择，避免猜测公司的岗位职责。",
    answer: "我希望在珠三角发展。我的经历主要是校园和社区活动宣传，想把内容制作与活动执行接起来。",
    suggestion: "解释选择顺德这个工作地点的原因，并留一个问题请招聘方确认职责。",
    revised: "我愿意在顺德工作，希望从文案制作和活动执行做起。校园招新时我体验过从推文到报名和签到的过程，也想了解这个岗位平时侧重内容制作还是活动落地。",
  },
  {
    category: "project", prompt: "你参与过一次什么样的活动宣传？你个人负责哪些环节？",
    focus: "区分自己的交付与团队的成果。",
    answer: "社团招新时，我写了推文初稿、做了报名表，活动当天在签到点协助核对报名信息。",
    suggestion: "补充一个做事细节和一条可复用的改进。",
    revised: "社团招新时，我先把时间、地点和活动内容整理成推文初稿，再用报名表收集参与信息。现场我负责签到并记录常见问题。下次我会把这些问题提前补到推文里，减少重复咨询。",
  },
  {
    category: "professional", prompt: "如果活动通知很长，你会如何把它改成一篇清晰的公众号推文？",
    focus: "检查信息优先级、文案结构和发布前核对。",
    answer: "我会先提取时间、地点、对象和报名方式，然后把报名入口放在读者容易找到的位置，发布前再检查一遍。",
    suggestion: "说清核对对象，尤其是链接、时间和报名条件。",
    revised: "我会先整理活动对象、时间、地点、报名截止和参与方式。正文用短段落，开头说清谁适合参加，末尾放报名入口。发布前请活动负责人核对日期和限制，并在手机上测试链接。",
  },
  {
    category: "professional", prompt: "一篇推文发出去后，你会记录哪些数据，怎样做简单复盘？",
    focus: "选择基本指标并说明它们能支持的判断。",
    answer: "我会在 Excel 里记录阅读量和互动数，再和最近相似主题的推文对比。",
    suggestion: "加入发布时间和内容类型，而且区分阅读与活动报名。",
    revised: "我会记发布时间、主题、阅读量和互动数。如果有可核实的报名数据，就单独记录。先和近期同类推文对照，找出需要复查的标题或报名入口，下一次只改一项再观察。",
  },
  {
    category: "behavioral", prompt: "临近发布时间，有人说海报上的活动地点改了，你会怎么处理？",
    focus: "体现信息核查、协作和修改确认。",
    answer: "我会先和活动负责人确认最新地址，然后暂停发布，把文案、海报和报名表逐一核对。",
    suggestion: "补充已经发出的内容怎么同步更新。",
    revised: "我会请负责人确认新地址和生效时间，再暂停旧稿发布。核对推文、海报和报名表后请同伴复查。若旧消息已发出，我会在原渠道发更正，并通知已报名者。",
  },
  {
    category: "failure", prompt: "如果同类推文的互动比预期低，你会先检查什么？",
    focus: "提出可验证的改法，避免把一次波动当作结论。",
    answer: "我会先看标题有没有说清活动内容，以及结尾的互动引导是否具体。",
    suggestion: "说出优先修改的一项，以及下一次怎么比较。",
    revised: "我会先对照同一类活动的标题、发布时间和互动数。如果标题只写了活动名，我会把适用对象和参与价值放进去。下一次尽量保持其他条件相近，再记录变化。",
  },
  {
    category: "reverse-question", prompt: "你还想向面试官了解什么？",
    focus: "了解岗位的工作内容、协作方式和入职预期。",
    answer: "我想问新人先负责哪些宣传工作，以及公司如何评估一次活动宣传。",
    suggestion: "把问题落到入职后的第一项交付。",
    revised: "请问新人入职后通常先参与哪些项目？如果负责一篇活动推文，选题、审核和发布分别怎么协作？团队最看重哪一项交付标准？",
  },
] as const satisfies ReadonlyArray<Pick<InterviewQuestion, "category" | "prompt" | "focus"> & {
  answer: string;
  suggestion: string;
  revised: string;
}>;

export const sampleInterviewPreparation = {
  id: "demo-prep-shunde",
  jobId: shundeJob.id,
  resumeVersionId: sampleTailoredResumeVersion.id,
  mode: "comprehensive",
  context: { ...interviewContext, focus: "comprehensive", locale: "zh-CN" },
  content: {
    meta: {
      company: shundeJob.company, title: shundeJob.title, roleFamily: "校园招聘 · 宣传策划",
      roleSummary: "以文案、活动执行和数据复盘为主题的模拟面试准备。",
      assumptions: ["公告未单列该岗位职责。文案、活动和数据主题用于练习，具体职责以招聘方说明为准。"],
    },
    capabilityProfile: {
      overview: "已有基础的活动宣传、公众号编辑和数据整理经验，可以准备一组实例展示执行能力。",
      dimensions: [
        { label: "文案表达", requirementLevel: "core", evidenceLevel: "strong", evidenceSummary: "协助制作6篇公众号推文。", nextStep: "准备一篇有初稿和修改记录的作品。" },
        { label: "活动执行", requirementLevel: "core", evidenceLevel: "partial", evidenceSummary: "负责社团招新报名与现场签到。", nextStep: "说明个人负责的具体步骤。" },
        { label: "基础复盘", requirementLevel: "important", evidenceLevel: "partial", evidenceSummary: "使用Excel记录推文阅读和互动。", nextStep: "准备一份简短复盘并解释比较口径。" },
        { label: "短视频整理", requirementLevel: "bonus", evidenceLevel: "strong", evidenceSummary: "剪辑3条活动短视频。", nextStep: "挑一条样片，说明如何处理字幕和素材。" },
        { label: "本地传播", requirementLevel: "important", evidenceLevel: "unknown", evidenceSummary: "简历暂无顺德的受众研究案例。", nextStep: "准备一种了解本地活动受众的方法。" },
      ],
    },
    evidenceMatrix: [
      { requirement: "文案编辑与发布", resumeEvidence: ["公众号推文初稿与基础排版"], state: "direct", assessment: "具备基础操作经验。", action: "准备脱敏的推文样例。" },
      { requirement: "活动宣传执行", resumeEvidence: ["招新推文、报名表、现场签到"], state: "transferable", assessment: "覆盖宣传到现场的部分环节。", action: "讲清活动中的分工与交接。" },
      { requirement: "数据记录与复盘", resumeEvidence: ["Excel登记阅读量、互动数"], state: "direct", assessment: "有基础数据记录习惯。", action: "区分阅读、互动与报名指标。" },
    ],
    knowledgeTopics: [
      { topic: "活动宣传信息", priority: "must", whyRelevant: "让读者快速找到报名所需内容。", explanation: "围绕对象、时间、地点、流程和入口组织文案。", currentEvidence: "写过招新推文。", targetLevel: "用短文案说明活动与报名步骤。", selfCheckQuestions: ["报名入口放在哪里？", "活动地址变化后怎么同步？"] },
      { topic: "公众号基础排版", priority: "must", whyRelevant: "方便手机用户阅读并完成报名。", explanation: "把关键信息放在前面，按用途拆分段落。", currentEvidence: "协助完成基础排版。", targetLevel: "能在手机端检查成稿和链接。", selfCheckQuestions: ["发布前要核对什么？", "开头哪几项信息最重要？"] },
      { topic: "基础数据复盘", priority: "should", whyRelevant: "帮助判断下一次宣传应该改什么。", explanation: "记录同类内容的发布条件与互动，再给出一个可验证的改法。", currentEvidence: "日常记录阅读和互动。", targetLevel: "在表格里说明比较口径。", selfCheckQuestions: ["阅读与报名有什么区别？", "只有一次数据时能下什么结论？"] },
    ],
    deepDives: [{
      resumeItem: "校园社团招新宣传", whyRelevant: "可以展示一次文案与现场执行的配合。",
      personalContributionFocus: "解释推文、报名表和签到是怎样连接起来的。",
      likelyFollowUps: ["初稿怎样核对活动信息？", "现场的常见问题怎么收集？"],
      factsToConfirm: ["确切分工", "是否保留脱敏的推文或报名表样例"],
    }],
    targetedQuestions: interviewExamples.map(({ category, prompt, focus }, index) => ({
      question: prompt, category, preparationDirection: focus, priority: index < 4 ? "must" : "should",
    })),
    preparationPlan: {
      mustPrepare: ["准备一篇推文样例与一个修改细节。", "用一分钟讲清自己在招新活动中的分工。"],
      shouldPrepare: ["整理一页发布记录，练习区分阅读、互动和报名数据。"],
      optional: ["准备一条短视频作为基础剪辑样例。"],
    },
    selfIntroduction: interviewExamples[0].revised,
    reverseQuestions: ["新人主要参与哪些宣传项目？", "活动文案通常由谁负责审核？", "团队怎样复盘活动效果？"],
  } satisfies InterviewPreparation,
};

export const sampleInterviewSession = {
  id: "demo-interview-shunde",
  jobId: shundeJob.id,
  resumeVersionId: sampleTailoredResumeVersion.id,
  mode: "comprehensive",
  status: "COMPLETED",
  context: interviewContext,
  questions: interviewExamples.map(({ category, prompt, focus }, index): InterviewQuestion => ({
    id: "q-" + (index + 1), category, prompt, focus, order: index,
  })),
  feedback: {
    overallScore: 75,
    dimensions: { jobFit: 78, structure: 76, evidence: 74, star: 72 },
    strengths: ["能用演示简历中的具体经历解释自己的职责。", "注意文案发布前核对和基础数据记录。"],
    improvements: ["回答时说清个人交付成果与协作步骤。", "区分内容数据和报名数据，避免从一次变化推断原因。"],
    questionReviews: interviewExamples.map(({ focus, suggestion, revised }, index) => ({
      questionId: "q-" + (index + 1), diagnosis: focus, suggestion, improvedAnswer: revised,
    })),
    nextActions: ["挑一篇推文复述修改过程。", "用最近一次宣传练习做一页复盘。"],
  } satisfies InterviewReport,
  currentQuestionIndex: interviewExamples.length - 1,
};

export function buildSampleAnswers(completedAt: Date): InterviewAnswers {
  const updatedAt = completedAt.toISOString();
  return Object.fromEntries(interviewExamples.map(({ answer }, index) => {
    const questionId = sampleInterviewSession.questions[index].id;
    return [questionId, { questionId, content: answer, skipped: false, updatedAt }];
  }));
}
