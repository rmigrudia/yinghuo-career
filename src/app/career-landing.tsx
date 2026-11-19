"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BriefcaseBusiness, FileText, MapPin, Mic, Navigation, Send } from "lucide-react";
import styles from "./career-landing.module.css";

const cities = [
  { id: "shenzhen", name: "深圳", english: "SHENZHEN", position: "57% 53%", landmark: "福田 · 市民中心" },
  { id: "guangzhou", name: "广州", english: "GUANGZHOU", position: "55% 53%", landmark: "珠江 · 广州塔" },
  { id: "shanghai", name: "上海", english: "SHANGHAI", position: "50% 56%", landmark: "浦东 · 陆家嘴" },
  { id: "beijing", name: "北京", english: "BEIJING", position: "53% 55%", landmark: "国贸 · 中央商务区" },
  { id: "hangzhou", name: "杭州", english: "HANGZHOU", position: "53% 54%", landmark: "钱江新城 · 钱塘江" },
  { id: "chengdu", name: "成都", english: "CHENGDU", position: "52% 56%", landmark: "交子公园 · 金融城" },
  { id: "suzhou", name: "苏州", english: "SUZHOU", position: "53% 54%", landmark: "金鸡湖 · 东方之门" },
  { id: "dongguan", name: "东莞", english: "DONGGUAN", position: "55% 54%", landmark: "松山湖 · 科技产业园" },
] as const;

type City = (typeof cities)[number];

const steps = [
  { label: "找岗位", description: "按你想去的城市，筛选实习和校招机会。", icon: BriefcaseBusiness, path: "/campus" },
  { label: "改简历", description: "对照岗位要求，整理最值得写的经历。", icon: FileText, path: "/match" },
  { label: "准备面试", description: "围绕岗位与简历，练习具体的面试问题。", icon: Mic, path: "/interview" },
  { label: "跟进投递", description: "把投递、笔试、面试和 Offer 记录在一起。", icon: Send, path: "/pipeline" },
];

const catalogSteps = [
  { label: "当前城市", description: "查看所选城市的岗位，再按方向或企业筛选。", icon: BriefcaseBusiness, path: "/campus" },
  { label: "实习", description: "浏览实习机会和企业投递入口。", icon: Navigation, path: "/campus?recruitmentType=实习" },
  { label: "秋招", description: "按行业和城市查找秋季招聘信息。", icon: FileText, path: "/campus?recruitmentType=秋招" },
  { label: "春招", description: "浏览春季招聘记录和招聘公告。", icon: Send, path: "/campus?recruitmentType=春招" },
];

const cityImage = (city: City) => `/images/cities/${city.id}.webp`;
const cityThumbnail = (city: City) => `/images/cities/${city.id}-small.webp`;
const cityJobs = (city: City) => `/campus?${new URLSearchParams({ location: city.name })}`;

function tiltGlass(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - .5;
  const y = (event.clientY - bounds.top) / bounds.height - .5;
  const style = event.currentTarget.style;
  style.setProperty("--tilt-x", `${-y * 10}deg`);
  style.setProperty("--tilt-y", `${x * 12}deg`);
  style.setProperty("--light-x", `${(x + .5) * 100}%`);
  style.setProperty("--light-y", `${(y + .5) * 100}%`);
}

function resetGlass(event: PointerEvent<HTMLElement>) {
  for (const property of ["--tilt-x", "--tilt-y", "--light-x", "--light-y"]) {
    event.currentTarget.style.removeProperty(property);
  }
}

export function CareerLanding({ catalogOnly = false }: { catalogOnly?: boolean } = {}) {
  const [active, setActive] = useState<number>(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const current = useRef(0);
  const requested = useRef(0);
  const root = useRef<HTMLElement>(null);
  const mobileRail = useRef<HTMLDivElement>(null);
  const city = cities[active];
  const group = Math.floor(active / 4);

  useEffect(() => {
    const main = root.current;
    if (!main) return;
    let frame = 0;
    function update() {
      const height = Math.max(window.innerHeight, 1);
      const y = Math.min(window.scrollY, height);
      const ratio = y / height;
      main?.style.setProperty("--photo-y", `${y * .42}px`);
      main?.style.setProperty("--cloud-y", `${y * -.38}px`);
      main?.style.setProperty("--cloud-scale", String(1 + .35 * ratio));
      main?.style.setProperty("--top-cloud", String(Math.min(1, ratio / .45)));
      main?.style.setProperty("--rail-y", `${y * .2}px`);
      main?.style.setProperty("--rail-opacity", String(Math.max(0, 1 - ratio * 2)));
      setScrolled(window.scrollY >= height * .3);
    }
    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  useEffect(() => {
    const rail = mobileRail.current;
    const button = rail?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    if (rail && button && rail.clientWidth) {
      const offset = button.getBoundingClientRect().left - rail.getBoundingClientRect().left;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      rail.scrollTo({ left: rail.scrollLeft + offset - (rail.clientWidth - button.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
    }
  }, [active]);

  useEffect(() => {
    if (previous === null) return;
    const timer = window.setTimeout(() => setPrevious(null), 1300);
    return () => window.clearTimeout(timer);
  }, [active, previous]);

  async function choose(index: number) {
    const serial = ++requested.current;
    if (index === current.current) return;
    const photo = new window.Image();
    photo.src = cityImage(cities[index]);
    try { await photo.decode(); } catch { /* The CSS tint provides a readable fallback. */ }
    if (serial !== requested.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPrevious(reduce ? null : current.current);
    setActive(index);
    current.current = index;
  }

  function thumbnail(index: number) {
    const item = cities[index];
    return (
      <button type="button" key={item.id} className={styles.thumb} aria-pressed={active === index} onClick={() => void choose(index)}>
        <span className={styles.thumbPhoto}>
          <Image src={cityThumbnail(item)} alt="" fill sizes="112px" style={{ objectPosition: item.position }} />
        </span>
        <span className={styles.thumbName}>{item.name}</span>
      </button>
    );
  }

  function scene(item: City, moving: boolean, outgoing = false) {
    return (
      <div key={item.id} className={`${styles.scene} ${moving ? styles.incoming : ""} ${outgoing ? styles.outgoing : ""}`} aria-hidden="true">
        <div className={styles.photo}>
          <Image src={cityImage(item)} alt="" fill sizes="100vw" unoptimized preload={item.id === cities[0].id && !outgoing && !moving} style={{ objectPosition: item.position }} />
        </div>
        <div className={styles.tint} />
        <div className={styles.cityTitle}>
          <span className={styles.cityWord}>{item.name}</span>
          <span className={styles.cityLatin}>{item.english}</span>
        </div>
      </div>
    );
  }

  return (
    <main ref={root} className={styles.page} lang="zh-CN">
      <header className={styles.nav} data-solid={scrolled}>
        <a href="#top" className={styles.brand} aria-label="萤火职航，返回顶部">
          <Image src="/brand/roxy-career.svg" width={32} height={32} alt="" />
          <span>萤火<span className={styles.brandChinese}>职航</span></span>
        </a>
        <nav className={styles.navLinks} aria-label="首页导航">
          <a href="#cities">探索城市</a>
          <a href="#workflow">{catalogOnly ? "招聘类型" : "求职流程"}</a>
        </nav>
        <Link href={catalogOnly ? "/campus" : "/dashboard"} className={styles.navAction} onPointerMove={tiltGlass} onPointerLeave={resetGlass}>{catalogOnly ? "浏览岗位" : "打开工作台"} <ArrowUpRight size={15} aria-hidden /></Link>
      </header>

      <section className={styles.hero} id="top" aria-labelledby="landing-title">
        <div className={styles.sceneStack} aria-hidden="true">
          {previous !== null && scene(cities[previous], false, true)}
          {scene(city, previous !== null)}
        </div>
        {previous !== null && <div key={city.id} className={styles.wipeMist} aria-hidden="true" />}
        <div className={styles.clouds} aria-hidden="true"><span /><span /></div>
        <div className={styles.topCloud} aria-hidden="true" />
        <div className={styles.fade} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.intro}>
            <h1 id="landing-title">去想去的城市，<br />做想做的事</h1>
            <p>从实习到第一份工作，按城市找到你的下一站。</p>
          </div>
          <div className={styles.rail} role="group" aria-label="切换城市" data-slot={active % 4}>
            <span className={styles.ring} aria-hidden="true" />
            <span className={styles.ringOuter} aria-hidden="true" />
            <div className={styles.thumbnails}>{cities.slice(group * 4, group * 4 + 4).map((_, offset) => thumbnail(group * 4 + offset))}</div>
            <div className={styles.railPages}>
              <button type="button" aria-label="上一组城市" disabled={group === 0} onClick={() => void choose(0)}><ArrowLeft size={15} aria-hidden /></button>
              <span aria-hidden="true">{group + 1} / 2</span>
              <button type="button" aria-label="下一组城市" disabled={group === 1} onClick={() => void choose(4)}><ArrowRight size={15} aria-hidden /></button>
            </div>
          </div>
        </div>
        <div className={styles.heroBottom}>
          <div ref={mobileRail} className={styles.mobileRail} role="group" aria-label="切换城市">
            {cities.map((_, index) => thumbnail(index))}
          </div>
          <div className={styles.dock}>
            <span className={styles.destinationIcon}><MapPin size={20} aria-hidden /></span>
            <span className={styles.currentCity} aria-live="polite"><strong>{city.name}</strong><small>{city.landmark}</small></span>
            <a href="#workflow" className={styles.scrollCta} onPointerMove={tiltGlass} onPointerLeave={resetGlass}>{catalogOnly ? "探索招聘机会" : "进入求职流程"} <ArrowDown size={18} aria-hidden /></a>
          </div>
        </div>
      </section>

      <section id="workflow" className={styles.section} aria-labelledby="workflow-title">
        <div className={styles.sectionHeading}>
          <h2 id="workflow-title">求职，从这里开始</h2>
          <p>{catalogOnly ? "按招聘类型浏览企业公告与投递入口。" : "从发现机会，到准备好下一场面试。"}</p>
        </div>
        <div className={styles.steps}>
          {(catalogOnly ? catalogSteps : steps).map(({ label, description, icon: Icon, path }) => (
            <Link key={path} href={path === "/campus" ? cityJobs(city) : path} className={styles.step} onPointerMove={tiltGlass} onPointerLeave={resetGlass}>
              <span className={styles.stepIcon}><Icon size={23} strokeWidth={1.65} aria-hidden /></span>
              <strong>{label}</strong>
              <span>{description}</span>
              <ArrowUpRight className={styles.stepArrow} size={19} aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      <section id="cities" className={`${styles.section} ${styles.citySection}`} aria-labelledby="cities-title">
        <div className={styles.sectionHeading}>
          <h2 id="cities-title">探索你想去的城市</h2>
          <Link href="/campus" className={styles.allJobs} onPointerMove={tiltGlass} onPointerLeave={resetGlass}>全部岗位 <ArrowUpRight size={16} aria-hidden /></Link>
        </div>
        <div className={styles.cityGrid}>
          {cities.map((item) => (
            <Link key={item.id} href={cityJobs(item)} aria-label={`查看${item.name}岗位`} className={styles.cityCard} onPointerMove={tiltGlass} onPointerLeave={resetGlass}>
              <Image src={cityThumbnail(item)} alt="" fill sizes="(max-width: 560px) 45vw, (max-width: 900px) 40vw, 25vw" style={{ objectPosition: item.position }} />
              <span className={styles.cardName}><small>{item.english}</small><strong>{item.name}</strong></span>
              <span className={styles.cardArrow}><ArrowUpRight size={18} aria-hidden /></span>
            </Link>
          ))}
        </div>
      </section>
      <footer className={styles.footer}><a href="#top">萤火职航</a><Link href={cityJobs(city)}><Navigation size={14} aria-hidden /> 查看{city.name}岗位</Link></footer>
    </main>
  );
}
