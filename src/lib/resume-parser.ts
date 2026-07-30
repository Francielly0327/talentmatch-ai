import type { Education, Experience } from "@/types";
import { uid } from "./storage";
import { maskPhone, normalizeUrl } from "./validation";

/**
 * ResumeParserService — lê um PDF no navegador (pdfjs-dist), extrai o texto de
 * todas as páginas e identifica as seções de um currículo.
 * Nada é inventado: o que não for identificado com segurança fica vazio.
 */

export type ResumeParseErrorCode =
  | "not_pdf"
  | "empty_file"
  | "too_large"
  | "corrupted"
  | "no_text"
  | "unknown";

export class ResumeParseError extends Error {
  code: ResumeParseErrorCode;
  constructor(code: ResumeParseErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "ResumeParseError";
  }
}

export const PARSE_ERROR_MESSAGES: Record<ResumeParseErrorCode, string> = {
  not_pdf: "Envie um arquivo em formato PDF.",
  empty_file: "Este arquivo está vazio. Escolha outro currículo.",
  too_large: "O arquivo excede o limite de 10 MB.",
  corrupted: "Não foi possível abrir este PDF. Verifique o arquivo e tente novamente.",
  no_text:
    "Não encontramos texto neste PDF. Ele pode ser um documento escaneado ou uma imagem. Tente enviar uma versão digital do currículo ou preencha as informações manualmente.",
  unknown: "Ocorreu um problema ao processar seu currículo. Tente novamente.",
};

export const MAX_PDF_BYTES = 10 * 1024 * 1024;

export interface LanguageEntry {
  language: string;
  level: string;
}

export interface ParsedResume {
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  linkedin: string;
  github: string;
  website: string;
  portfolio: string;
  professionalSummary: string;
  experiences: Experience[];
  education: Education[];
  certifications: string[];
  hardSkills: string[];
  softSkills: string[];
  languages: string[];
  projects: Array<{ id: string; name: string; description: string; link?: string }>;
}

export interface ParsedResumeSummary {
  experiencesFound: number;
  educationFound: number;
  skillsFound: number;
  languagesFound: number;
  certificationsFound: number;
}

export interface ParsedResumeResult {
  parsed: ParsedResume;
  summary: ParsedResumeSummary;
  rawText: string;
  pages: number;
}

export type ParseStage = "reading" | "extracting" | "organizing" | "done";
export interface ParseProgress {
  stage: ParseStage;
  progress: number; // 0..100
  message: string;
}

const STAGE_MESSAGES: Record<ParseStage, string> = {
  reading: "Lendo seu currículo...",
  extracting: "Extraindo suas informações...",
  organizing: "Organizando suas experiências, formação e competências...",
  done: "Currículo importado com sucesso!",
};

/* ----------------------------- extração de PDF ----------------------------- */

export function validatePdfFile(file: File) {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) throw new ResumeParseError("not_pdf", PARSE_ERROR_MESSAGES.not_pdf);
  if (file.size === 0) throw new ResumeParseError("empty_file", PARSE_ERROR_MESSAGES.empty_file);
  if (file.size > MAX_PDF_BYTES)
    throw new ResumeParseError("too_large", PARSE_ERROR_MESSAGES.too_large);
}

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjs;
}

/** Extrai texto de todas as páginas preservando as quebras de linha visuais. */
export async function extractTextFromPdf(
  file: File,
  onProgress?: (p: ParseProgress) => void,
): Promise<{ text: string; pages: number }> {
  validatePdfFile(file);
  const pdfjs = await loadPdfjs();
  const buf = await file.arrayBuffer();
  if (buf.byteLength === 0)
    throw new ResumeParseError("empty_file", PARSE_ERROR_MESSAGES.empty_file);

  let doc: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>;
  try {
    doc = await pdfjs.getDocument({
      data: new Uint8Array(buf),
      useSystemFonts: true,
    }).promise;
  } catch (err) {
    console.error("[ResumeParser] erro ao abrir PDF", err);
    throw new ResumeParseError("corrupted", PARSE_ERROR_MESSAGES.corrupted);
  }

  const pages = doc.numPages;
  let out = "";
  for (let p = 1; p <= pages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const rows = new Map<number, Array<{ x: number; str: string }>>();
    for (const item of content.items) {
      const it = item as { str?: string; transform?: number[] };
      if (typeof it.str !== "string" || !it.str.trim()) continue;
      const t = it.transform ?? [0, 0, 0, 0, 0, 0];
      const y = Math.round(t[5] / 3) * 3; // agrupa por linha
      const arr = rows.get(y) ?? [];
      arr.push({ x: t[4], str: it.str });
      rows.set(y, arr);
    }
    const lines = Array.from(rows.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, items]) =>
        items
          .sort((a, b) => a.x - b.x)
          .map((i) => i.str)
          .join(" ")
          .replace(/\s{2,}/g, " ")
          .trim(),
      )
      .filter(Boolean);
    out += lines.join("\n") + "\n";
    onProgress?.({
      stage: "reading",
      progress: Math.round((p / pages) * 55),
      message: STAGE_MESSAGES.reading,
    });
  }
  await doc.destroy();
  return { text: out, pages };
}

/* ------------------------------- heurísticas ------------------------------- */

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE = /(?:\+55\s?)?(?:\(?\d{2}\)?[\s.-]?)?9?\d{4}[\s.-]?\d{4}/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/[a-z0-9\-_/%.]+/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-z0-9\-_/.]+/i;
const URL_RE = /https?:\/\/[^\s|,;]+|www\.[^\s|,;]+/gi;

const UF = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR",
  "PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const TECH_HINTS = [
  "react","react native","typescript","javascript","node","node.js","next.js","nextjs","vue","angular","svelte",
  "python","django","flask","fastapi","java","spring","spring boot","kotlin","swift","go","golang",
  "rust","c#","c++",".net","php","laravel","ruby","rails","aws","azure","gcp","docker",
  "kubernetes","terraform","postgres","postgresql","mysql","mongodb","redis","firebase","supabase",
  "graphql","rest","api rest","sql","nosql","tailwind","css","sass","html","git","github","gitlab","linux","bash",
  "jest","cypress","playwright","vitest","figma","excel","power bi","tableau","spark","airflow","pandas",
  "scrum","kanban","jira","ci/cd","devops","machine learning","data science","photoshop","illustrator",
];
const SOFT_HINTS = [
  "comunicação","liderança","proatividade","trabalho em equipe","colaboração","negociação",
  "resolução de problemas","organização","empatia","adaptabilidade","criatividade","resiliência",
  "pensamento crítico","gestão de tempo","communication","leadership","teamwork","problem solving","ownership",
];
const LANG_HINTS: Array<[string, RegExp]> = [
  ["Português", /portugu[êe]s|portuguese/i],
  ["Inglês", /ingl[êe]s|english/i],
  ["Espanhol", /espanhol|spanish|castellano/i],
  ["Francês", /franc[êe]s|french/i],
  ["Alemão", /alem[ãa]o|german/i],
  ["Italiano", /italiano|italian/i],
  ["Japonês", /japon[êe]s|japanese/i],
];
const LANG_LEVELS: Array<[string, RegExp]> = [
  ["Nativo", /nativo|native|materna/i],
  ["Fluente", /fluente|fluent|c2|proficiente/i],
  ["Avançado", /avan[çc]ado|advanced|c1/i],
  ["Intermediário", /intermedi[áa]rio|intermediate|b1|b2/i],
  ["Básico", /b[áa]sico|basic|iniciante|a1|a2/i],
];

function matchHints(text: string, hints: string[]): string[] {
  const lower = ` ${text.toLowerCase()} `;
  const found: string[] = [];
  for (const h of hints) {
    const esc = h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^a-z0-9+#.])${esc}([^a-z0-9+#]|$)`, "i").test(lower)) {
      found.push(h.replace(/(^|\s|\.)\S/g, (m) => m.toUpperCase()));
    }
  }
  return Array.from(new Set(found));
}

const SECTION_PATTERNS: Array<[string, RegExp]> = [
  ["summary", /^(resumo profissional|resumo|perfil profissional|perfil|objetivo|sobre mim|about|summary|profile)\b/i],
  ["experience", /^(experi[êe]ncias? profissionais?|experi[êe]ncias?|hist[óo]rico profissional|atua[çc][ãa]o profissional|experience|work experience|employment)\b/i],
  ["education", /^(forma[çc][ãa]o acad[êe]mica|forma[çc][ãa]o|educa[çc][ãa]o|escolaridade|education|academic)\b/i],
  ["skills", /^(compet[êe]ncias?|habilidades|conhecimentos|skills|technical skills|hard skills|tecnologias|ferramentas)\b/i],
  ["softskills", /^(compet[êe]ncias comportamentais|soft skills)\b/i],
  ["certifications", /^(certifica[çc][õo]es|cursos( complementares| e certifica[çc][õo]es)?|certifications|courses|licen[çc]as)\b/i],
  ["languages", /^(idiomas?|l[íi]nguas|languages)\b/i],
  ["projects", /^(projetos|portf[óo]lio de projetos|projects)\b/i],
];

function splitSections(lines: string[]): Record<string, string[]> {
  const out: Record<string, string[]> = { header: [] };
  let current = "header";
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    let matched: string | null = null;
    if (line.length <= 48) {
      const bare = line.replace(/[:•|]/g, "").trim();
      for (const [key, re] of SECTION_PATTERNS) {
        if (re.test(bare)) {
          matched = key;
          break;
        }
      }
    }
    if (matched) {
      current = matched;
      out[current] = out[current] ?? [];
    } else {
      (out[current] = out[current] ?? []).push(line);
    }
  }
  return out;
}

const MONTHS =
  "jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|feb|apr|may|aug|sep|oct|dec";
const DATE_TOKEN = `(?:(?:${MONTHS})[a-zç]*\\.?\\s*(?:de\\s*)?\\d{4}|\\d{1,2}\\/\\d{4}|\\d{4})`;
const CURRENT = `(?:atual|momento|presente|present|current|hoje|today)`;
const RANGE_RE = new RegExp(
  `(${DATE_TOKEN})\\s*(?:[-–—]|até|a|to|until)\\s*(${DATE_TOKEN}|${CURRENT})`,
  "i",
);
const SINGLE_DATE_RE = new RegExp(DATE_TOKEN, "i");

const MONTH_INDEX: Record<string, number> = {
  jan: 1, fev: 2, feb: 2, mar: 3, abr: 4, apr: 4, mai: 5, may: 5, jun: 6,
  jul: 7, ago: 8, aug: 8, set: 9, sep: 9, out: 10, oct: 10, nov: 11, dez: 12, dec: 12,
};

function toMonthValue(token: string): string {
  const t = token.trim().toLowerCase();
  if (new RegExp(`^${CURRENT}$`, "i").test(t)) return "";
  const mYear = t.match(new RegExp(`^(${MONTHS})[a-zç]*\\.?\\s*(?:de\\s*)?(\\d{4})$`, "i"));
  if (mYear) return `${mYear[2]}-${String(MONTH_INDEX[mYear[1].slice(0, 3)] ?? 1).padStart(2, "0")}`;
  const slash = t.match(/^(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[2]}-${slash[1].padStart(2, "0")}`;
  const year = t.match(/^(\d{4})$/);
  if (year) return `${year[1]}-01`;
  return "";
}

function isCurrent(token: string) {
  return new RegExp(CURRENT, "i").test(token);
}

/** Agrupa linhas em blocos: cada bloco começa numa linha que contém período. */
function chunkByDates(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let currentBlock: string[] = [];
  for (const line of lines) {
    const hasDate = RANGE_RE.test(line) || SINGLE_DATE_RE.test(line);
    if (hasDate && currentBlock.some((l) => RANGE_RE.test(l) || SINGLE_DATE_RE.test(l))) {
      blocks.push(currentBlock);
      currentBlock = [line];
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length) blocks.push(currentBlock);
  return blocks.filter((b) => b.length);
}

function parseExperiences(lines: string[]): Experience[] {
  if (!lines.length) return [];
  return chunkByDates(lines)
    .slice(0, 12)
    .map((block): Experience | null => {
      const joined = block.join("\n");
      const range = joined.match(RANGE_RE);
      const dateLineIdx = block.findIndex((l) => RANGE_RE.test(l) || SINGLE_DATE_RE.test(l));
      const startDate = range ? toMonthValue(range[1]) : "";
      const current = range ? isCurrent(range[2]) : false;
      const endDate = range && !current ? toMonthValue(range[2]) : "";

      // Linhas de título: antes/na linha da data, sem as datas
      const titleLines = block
        .slice(0, Math.max(1, dateLineIdx + 1))
        .map((l) => l.replace(RANGE_RE, "").replace(/[|•·]+/g, " ").replace(/\s{2,}/g, " ").trim())
        .filter(Boolean);

      let role = titleLines[0] ?? "";
      let company = titleLines[1] ?? "";
      const sep = role.match(/^(.+?)\s+(?:—|–|-|@|na |at )\s*(.+)$/);
      if (!company && sep) {
        role = sep[1].trim();
        company = sep[2].trim();
      }

      const description = block
        .slice(dateLineIdx + 1)
        .filter((l) => l !== company)
        .join("\n")
        .trim();

      if (!role && !company && !description) return null;
      return { id: uid(), company, role, startDate, endDate, current, description };
    })
    .filter((e): e is Experience => e !== null);
}

const DEGREE_RE =
  /(ensino m[ée]dio|t[ée]cnico|tecn[óo]logo|bacharelado|licenciatura|gradua[çc][ãa]o|p[óo]s[- ]gradua[çc][ãa]o|mba|mestrado|doutorado|curso livre)/i;
const STATUS_RE = /(em andamento|cursando|conclu[íi]do|completo|trancado|n[ãa]o conclu[íi]do|incompleto)/i;

function parseEducation(lines: string[]): Education[] {
  if (!lines.length) return [];
  return chunkByDates(lines)
    .slice(0, 8)
    .map((block): Education | null => {
      const joined = block.join("\n");
      const range = joined.match(RANGE_RE);
      const startDate = range ? toMonthValue(range[1]) : "";
      const endDate = range ? toMonthValue(range[2]) : "";
      const clean = block
        .map((l) => l.replace(RANGE_RE, "").replace(/[|•·]+/g, " ").replace(/\s{2,}/g, " ").trim())
        .filter(Boolean);
      if (!clean.length) return null;

      const degree = joined.match(DEGREE_RE)?.[0] ?? "";
      const statusRaw = joined.match(STATUS_RE)?.[0] ?? "";
      const status = statusRaw
        ? /andamento|cursando/i.test(statusRaw)
          ? "Em andamento"
          : /trancado/i.test(statusRaw)
            ? "Trancado"
            : /n[ãa]o conclu|incompleto/i.test(statusRaw)
              ? "Não concluído"
              : "Concluído"
        : "";

      const institutionIdx = clean.findIndex((l) =>
        /universidade|faculdade|instituto|centro universit|col[ée]gio|etec|fatec|senai|senac|uni[a-z]/i.test(l),
      );
      const institution = institutionIdx >= 0 ? clean[institutionIdx] : clean[1] ?? "";
      const course = clean.find((l) => l !== institution) ?? "";

      const type = degree
        ? degree.replace(/^\w/, (c) => c.toUpperCase())
        : "";

      return { id: uid(), institution, course, type, status, startDate, endDate };
    })
    .filter((e): e is Education => e !== null && !!(e.course || e.institution));
}

function parseListLines(lines: string[], max = 12): string[] {
  return lines
    .flatMap((l) => l.split(/\s*[•·]\s*|\s{3,}/))
    .map((s) => s.replace(/^[-–—*]\s*/, "").trim())
    .filter((s) => s.length > 2 && s.length < 140)
    .slice(0, max);
}

function parseLanguages(lines: string[], fallbackText: string): string[] {
  const source = lines.length ? lines.join("\n") : "";
  const out: string[] = [];
  for (const [name, re] of LANG_HINTS) {
    const scope = source || fallbackText;
    const idx = scope.search(re);
    if (idx < 0) continue;
    const window = scope.slice(idx, idx + 60);
    const level = LANG_LEVELS.find(([, lre]) => lre.test(window))?.[0] ?? "";
    out.push(level ? `${name} — ${level}` : name);
  }
  return Array.from(new Set(out));
}

function looksLikeName(line: string) {
  const l = line.trim();
  if (l.length < 5 || l.length > 60) return false;
  if (EMAIL_RE.test(l) || /\d/.test(l) || /https?:|@/.test(l)) return false;
  const words = l.split(/\s+/);
  if (words.length < 2 || words.length > 6) return false;
  return words.every((w) => /^[\p{Lu}\p{Ll}][\p{L}'’.-]*$/u.test(w));
}

/* --------------------------------- serviço --------------------------------- */

export const ResumeParserService = {
  messages: STAGE_MESSAGES,

  async parsePdf(
    file: File,
    onProgress?: (p: ParseProgress) => void,
  ): Promise<ParsedResumeResult> {
    onProgress?.({ stage: "reading", progress: 5, message: STAGE_MESSAGES.reading });
    const { text, pages } = await extractTextFromPdf(file, onProgress);

    const meaningful = text.replace(/\s/g, "");
    if (meaningful.length < 40) {
      throw new ResumeParseError("no_text", PARSE_ERROR_MESSAGES.no_text);
    }

    onProgress?.({ stage: "extracting", progress: 70, message: STAGE_MESSAGES.extracting });
    const result = this.parseText(text, pages);
    onProgress?.({ stage: "organizing", progress: 92, message: STAGE_MESSAGES.organizing });
    onProgress?.({ stage: "done", progress: 100, message: STAGE_MESSAGES.done });
    return result;
  },

  parseText(text: string, pages = 1): ParsedResumeResult {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.replace(/\u00a0/g, " ").trim())
      .filter(Boolean);
    const sections = splitSections(lines);
    const flat = lines.join(" ");

    const email = flat.match(EMAIL_RE)?.[0]?.trim() ?? "";
    const phoneRaw = flat.match(PHONE_RE)?.[0] ?? "";
    const phone = phoneRaw ? maskPhone(phoneRaw) : "";
    const linkedinRaw = flat.match(LINKEDIN_RE)?.[0] ?? "";
    const githubRaw = flat.match(GITHUB_RE)?.[0] ?? "";
    const linkedin = linkedinRaw ? normalizeUrl(linkedinRaw, "linkedin") : "";
    const github = githubRaw ? normalizeUrl(githubRaw, "github") : "";
    const urls = (flat.match(URL_RE) ?? []).filter(
      (u) => !/linkedin|github/i.test(u),
    );
    const website = urls[0] ? normalizeUrl(urls[0]) : "";
    const portfolio = urls[1] ? normalizeUrl(urls[1]) : "";

    // Cidade / Estado — "São Paulo - SP", "São Paulo/SP"
    let city = "";
    let state = "";
    const loc = flat.match(
      new RegExp(`([A-ZÀ-Ú][\\p{L}\\s.'-]{2,30}?)\\s*[-–/,]\\s*(${UF.join("|")})(?![\\p{L}])`, "u"),
    );
    if (loc) {
      city = loc[1].trim().replace(/\s{2,}/g, " ");
      state = loc[2].toUpperCase();
    }

    const headerLines = sections.header ?? [];
    const fullName = headerLines.find(looksLikeName) ?? "";
    const nameIdx = headerLines.indexOf(fullName);
    const professionalTitle =
      nameIdx >= 0
        ? (headerLines
            .slice(nameIdx + 1, nameIdx + 4)
            .find(
              (l) =>
                l.length > 3 &&
                l.length < 70 &&
                !EMAIL_RE.test(l) &&
                !/https?:|@|\d{4}/.test(l) &&
                l !== city,
            ) ?? "")
        : "";

    const professionalSummary = (sections.summary ?? []).join(" ").trim().slice(0, 1200);

    const skillsText = (sections.skills ?? []).join("\n");
    const hardSkills = matchHints(skillsText || flat, TECH_HINTS);
    const softSkills = matchHints(
      [(sections.softskills ?? []).join("\n"), skillsText, flat].join("\n"),
      SOFT_HINTS,
    );

    const experiences = parseExperiences(sections.experience ?? []);
    const education = parseEducation(sections.education ?? []);
    const certifications = parseListLines(sections.certifications ?? []);
    const languages = parseLanguages(sections.languages ?? [], flat);
    const projects = (sections.projects ?? []).length
      ? chunkByDates(sections.projects ?? [])
          .slice(0, 6)
          .map((block) => ({
            id: uid(),
            name: block[0] ?? "",
            description: block.slice(1).join(" ").slice(0, 400),
          }))
          .filter((p) => p.name)
      : [];

    const parsed: ParsedResume = {
      fullName,
      professionalTitle,
      email,
      phone,
      city,
      state,
      linkedin,
      github,
      website,
      portfolio,
      professionalSummary,
      experiences,
      education,
      certifications,
      hardSkills,
      softSkills,
      languages,
      projects,
    };

    return {
      parsed,
      pages,
      rawText: text,
      summary: {
        experiencesFound: experiences.length,
        educationFound: education.length,
        skillsFound: hardSkills.length + softSkills.length,
        languagesFound: languages.length,
        certificationsFound: certifications.length,
      },
    };
  },
};
