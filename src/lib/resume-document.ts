import type { Education, Experience, Profile, ProjectItem, Resume } from "@/types";
import { formatMonthYear } from "./validation";

/* -------------------------------------------------------------------------- */
/*  Modelo único usado tanto pelo preview quanto pelo PDF exportado            */
/* -------------------------------------------------------------------------- */

export interface ResumeDocData {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  linkedin: string;
  github: string;
  website: string;
  portfolio: string;
  summary: string;
  experiences: Experience[];
  education: Education[];
  projects: ProjectItem[];
  hardSkills: string[];
  softSkills: string[];
  certifications: string[];
  languages: string[];
}

export const emptyDoc: ResumeDocData = {
  fullName: "",
  title: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  linkedin: "",
  github: "",
  website: "",
  portfolio: "",
  summary: "",
  experiences: [],
  education: [],
  projects: [],
  hardSkills: [],
  softSkills: [],
  certifications: [],
  languages: [],
};

export function resumeToDoc(r: Resume, profile?: Profile): ResumeDocData {
  return {
    fullName: r.fullName || profile?.name || "",
    title: r.title || profile?.title || "",
    email: r.email ?? profile?.email ?? "",
    phone: r.phone ?? profile?.phone ?? "",
    city: r.city ?? profile?.city ?? "",
    state: r.state ?? profile?.state ?? "",
    linkedin: r.linkedin ?? profile?.linkedin ?? "",
    github: r.github ?? profile?.github ?? "",
    website: r.website ?? profile?.website ?? "",
    portfolio: r.portfolio ?? profile?.portfolio ?? "",
    summary: r.summary || "",
    experiences: r.experiences || [],
    education: r.education || [],
    projects: r.projects || [],
    hardSkills: r.hardSkills || [],
    softSkills: r.softSkills || [],
    certifications: r.certifications || [],
    languages: r.languages || [],
  };
}

/* ------------------------------- formatação -------------------------------- */

/** Remove qualquer sintaxe Markdown do texto final do currículo. */
export function stripMarkdown(input: string): string {
  if (!input) return "";
  return input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, "$1 ($2)")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1$2")
    .replace(/(^|[\s(])_([^_\n]+)_/g, "$1$2")
    .replace(/^\s{0,3}([-*_]\s?){3,}\s*$/gm, "")
    .replace(/\|/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Quebra uma descrição em marcadores limpos. */
export function toBullets(description: string): string[] {
  const clean = stripMarkdown(description || "");
  if (!clean) return [];
  return clean
    .split(/\r?\n+|(?:^|\s)[•·]\s*/)
    .map((l) => l.replace(/^\s*(?:[-–—*+]\s+|\d+[.)]\s+)/, "").trim())
    .filter(Boolean);
}

export function periodLabel(startDate?: string, endDate?: string, current?: boolean) {
  const start = formatMonthYear(startDate);
  const end = current ? "Atual" : formatMonthYear(endDate);
  if (start && end) return `${start} — ${end}`;
  return start || end || "";
}

export function prettyLink(url: string) {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function contactLine(d: ResumeDocData): string[] {
  const place = [d.city, d.state].filter(Boolean).join(" — ");
  return [place, d.phone, d.email].filter(Boolean);
}

export function linksLine(d: ResumeDocData): string[] {
  return [d.linkedin, d.github, d.portfolio, d.website]
    .filter(Boolean)
    .map(prettyLink);
}

export function resumeFileName(d: ResumeDocData) {
  const base = (d.fullName || "Curriculo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z\s-]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join("-");
  return `Curriculo-${base || "Sem-Nome"}`;
}

/* ---------------------------------- HTML ----------------------------------- */

function esc(s: string) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function section(title: string, body: string) {
  if (!body.trim()) return "";
  return `<section class="tm-sec"><h2>${esc(title)}</h2>${body}</section>`;
}

export function buildResumeBody(d: ResumeDocData): string {
  const contacts = contactLine(d).map(esc).join('<span class="tm-sep">|</span>');
  const links = linksLine(d).map(esc).join('<span class="tm-sep">|</span>');

  const header = `
    <header class="tm-head">
      <h1>${esc(d.fullName || "Seu nome completo")}</h1>
      ${d.title ? `<p class="tm-title">${esc(d.title)}</p>` : ""}
      ${contacts ? `<p class="tm-contact">${contacts}</p>` : ""}
      ${links ? `<p class="tm-contact tm-links">${links}</p>` : ""}
    </header>`;

  const summary = d.summary
    ? `<p class="tm-text">${esc(stripMarkdown(d.summary))}</p>`
    : "";

  const experiences = d.experiences
    .filter((e) => e.role || e.company || e.description)
    .map((e) => {
      const bullets = toBullets(e.description);
      return `
        <article class="tm-item">
          <div class="tm-item-head">
            <span class="tm-role">${esc(e.role || "")}</span>
            <span class="tm-period">${esc(periodLabel(e.startDate, e.endDate, e.current))}</span>
          </div>
          ${e.company ? `<div class="tm-company">${esc(e.company)}</div>` : ""}
          ${
            bullets.length
              ? `<ul class="tm-bullets">${bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
              : ""
          }
        </article>`;
    })
    .join("");

  const education = d.education
    .filter((e) => e.course || e.institution)
    .map((e) => {
      const meta = [e.type, e.status].filter((x): x is string => !!x).map(esc).join(" · ");
      return `
        <article class="tm-item">
          <div class="tm-item-head">
            <span class="tm-role">${esc(e.course || "")}</span>
            <span class="tm-period">${esc(periodLabel(e.startDate, e.endDate))}</span>
          </div>
          ${e.institution ? `<div class="tm-company">${esc(e.institution)}</div>` : ""}
          ${meta ? `<div class="tm-meta">${meta}</div>` : ""}
        </article>`;
    })
    .join("");

  const projects = d.projects
    .filter((p) => p.name || p.description)
    .map(
      (p) => `
        <article class="tm-item">
          <div class="tm-item-head"><span class="tm-role">${esc(p.name || "")}</span></div>
          ${p.link ? `<div class="tm-meta">${esc(prettyLink(p.link))}</div>` : ""}
          ${p.description ? `<p class="tm-text">${esc(stripMarkdown(p.description))}</p>` : ""}
        </article>`,
    )
    .join("");

  const skills = [
    d.hardSkills.length
      ? `<p class="tm-text"><strong>Competências técnicas:</strong> ${esc(d.hardSkills.join(" · "))}</p>`
      : "",
    d.softSkills.length
      ? `<p class="tm-text"><strong>Competências comportamentais:</strong> ${esc(d.softSkills.join(" · "))}</p>`
      : "",
  ].join("");

  const certifications = d.certifications.length
    ? `<ul class="tm-bullets">${d.certifications.map((c) => `<li>${esc(stripMarkdown(c))}</li>`).join("")}</ul>`
    : "";

  const languages = d.languages.length
    ? `<p class="tm-text">${esc(d.languages.join(" · "))}</p>`
    : "";

  return [
    header,
    section("Resumo profissional", summary),
    section("Experiência profissional", experiences),
    section("Formação acadêmica", education),
    section("Projetos", projects),
    section("Competências", skills),
    section("Certificações", certifications),
    section("Idiomas", languages),
  ].join("");
}

/** CSS compartilhado entre o preview e o PDF (escopo .tm-resume). */
export const RESUME_CSS = `
.tm-resume{background:#fff;color:#1f2933;font-family:"Helvetica Neue",Arial,Helvetica,sans-serif;font-size:10.5pt;line-height:1.45;}
.tm-resume *{box-sizing:border-box;}
.tm-resume h1,.tm-resume h2,.tm-resume p,.tm-resume ul{margin:0;padding:0;}
.tm-head{border-bottom:2px solid #60a5fa;padding-bottom:10px;margin-bottom:14px;}
.tm-head h1{font-size:20pt;font-weight:700;letter-spacing:.02em;color:#0f172a;text-transform:uppercase;}
.tm-title{margin-top:2px;font-size:11.5pt;font-weight:600;color:#2563eb;}
.tm-contact{margin-top:6px;font-size:9pt;color:#475569;}
.tm-links{color:#2563eb;}
.tm-sep{padding:0 6px;color:#94a3b8;}
.tm-sec{margin-top:14px;}
.tm-sec h2{font-size:10pt;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#1d4ed8;border-bottom:1px solid #dbeafe;padding-bottom:3px;margin-bottom:8px;}
.tm-item{margin-bottom:10px;page-break-inside:avoid;break-inside:avoid;}
.tm-item-head{display:flex;justify-content:space-between;gap:12px;align-items:baseline;}
.tm-role{font-size:11pt;font-weight:700;color:#0f172a;}
.tm-period{font-size:9pt;color:#64748b;white-space:nowrap;}
.tm-company{font-size:10pt;color:#334155;font-weight:500;}
.tm-meta{font-size:9pt;color:#64748b;}
.tm-text{font-size:10pt;color:#334155;margin-top:3px;text-align:justify;}
.tm-bullets{margin-top:4px;padding-left:16px;list-style:disc;}
.tm-bullets li{font-size:10pt;color:#334155;margin-bottom:2px;}
`;

const PRINT_CSS = `
@page{size:A4;margin:16mm 15mm;}
html,body{margin:0;padding:0;background:#fff;}
.tm-resume{width:100%;}
@media print{.tm-sec{page-break-inside:auto;}}
`;

/** Abre a janela de impressão com o mesmo layout do preview (A4). */
export function printResumePdf(d: ResumeDocData) {
  if (typeof window === "undefined") return;
  const title = resumeFileName(d);
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>${esc(title)}</title><style>${RESUME_CSS}${PRINT_CSS}</style></head>
<body><div class="tm-resume">${buildResumeBody(d)}</div>
<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},250);};<\/script>
</body></html>`;

  const w = window.open("", "_blank", "width=860,height=1000");
  if (!w) {
    // fallback: iframe oculto (mobile / popup bloqueado)
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 2000);
    }, 400);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
