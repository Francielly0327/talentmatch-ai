import type { Profile, Resume, Experience, Education } from "@/types";
import { uid } from "./storage";

/**
 * ResumeParserService — extrai texto de um PDF e tenta detectar as principais
 * seções de um currículo. Desacoplado para futura integração com IA
 * (OpenAI, Gemini, Claude etc.).
 */

export interface ParsedResumeSummary {
  experiencesFound: number;
  educationFound: number;
  skillsFound: number;
  languagesFound: number;
  certificationsFound: number;
}

export interface ParsedResumeResult {
  profile: Partial<Profile>;
  resume: Partial<Resume>;
  summary: ParsedResumeSummary;
  rawText: string;
}

async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  (pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc = "";
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({
    data: buf,
    isEvalSupported: false,
    useWorkerFetch: false,
    disableWorker: true,
  } as unknown as Parameters<typeof pdfjs.getDocument>[0]).promise;

  let out = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const strings = content.items
      .map((i: unknown) => (i && typeof i === "object" && "str" in i ? String((i as { str: string }).str) : ""))
      .filter(Boolean);
    out += strings.join(" ") + "\n";
  }
  return out;
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE = /(\+?\d{1,3}[\s.-]?)?(\(?\d{2,3}\)?[\s.-]?)?\d{4,5}[\s.-]?\d{4}/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[a-z0-9\-_/]+/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-z0-9\-_/]+/i;
const URL_RE = /https?:\/\/[^\s]+/i;

const TECH_HINTS = [
  "react","typescript","javascript","node","node.js","next","nextjs","vue","angular",
  "python","django","flask","fastapi","java","spring","kotlin","swift","go","golang",
  "rust","c#",".net","php","laravel","ruby","rails","aws","azure","gcp","docker",
  "kubernetes","k8s","terraform","postgres","postgresql","mysql","mongodb","redis",
  "graphql","rest","sql","tailwind","css","html","git","linux","bash","jest",
  "cypress","playwright","figma","excel","power bi","tableau","spark","airflow",
];
const SOFT_HINTS = [
  "comunicação","liderança","proatividade","trabalho em equipe","colaboração",
  "resolução de problemas","organização","empatia","adaptabilidade","criatividade",
  "communication","leadership","teamwork","problem solving","ownership",
];
const LANG_HINTS = [
  "inglês","english","espanhol","spanish","português","portuguese","french","francês",
  "alemão","german","italiano","italian","mandarim","chinese","japonês","japanese",
];

function matches(text: string, hints: string[]): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const h of hints) {
    const re = new RegExp(`(^|[^a-z0-9])${h.replace(/[.+#/]/g, "\\$&")}([^a-z0-9]|$)`, "i");
    if (re.test(lower)) found.add(h);
  }
  return Array.from(found);
}

function splitSections(text: string): Record<string, string> {
  const headers = [
    ["summary", /(resumo profissional|resumo|perfil profissional|about me|summary|profile)/i],
    ["experience", /(experi[êe]ncia profissional|experi[êe]ncia|hist[óo]rico profissional|experience|work history|employment)/i],
    ["education", /(forma[çc][ãa]o|educa[çc][ãa]o|escolaridade|education|academic)/i],
    ["skills", /(compet[êe]ncias|habilidades|skills|technical skills|tecnologias)/i],
    ["certifications", /(certifica[çc][õo]es|cursos|certifications|courses)/i],
    ["languages", /(idiomas|l[íi]nguas|languages)/i],
    ["projects", /(projetos|projects)/i],
  ] as const;

  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const out: Record<string, string> = {};
  let current = "header";
  out[current] = "";
  for (const line of lines) {
    let matched: string | null = null;
    for (const [key, re] of headers) {
      if (re.test(line) && line.length < 60) {
        matched = key;
        break;
      }
    }
    if (matched) {
      current = matched;
      if (!out[current]) out[current] = "";
    } else {
      out[current] = (out[current] || "") + " " + line;
    }
  }
  return out;
}

const DATE_RANGE_RE =
  /((?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{2}\/\d{4}|\d{4})\s*[-–—até to]{1,4}\s*((?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{2}\/\d{4}|\d{4}|atual|presente|present|current)/i;

function parseExperiences(section: string): Experience[] {
  if (!section) return [];
  const chunks = section
    .split(/(?=(?:[A-ZÀ-Ú][^\n.]{2,}))/g)
    .map((c) => c.trim())
    .filter((c) => c.length > 20 && DATE_RANGE_RE.test(c))
    .slice(0, 8);

  return chunks.map((chunk): Experience => {
    const m = chunk.match(DATE_RANGE_RE);
    const startDate = m?.[1] || "";
    const endDate = m?.[2] || "";
    // Try to pick a role and company from before the dates
    const beforeDates = chunk.slice(0, m?.index ?? chunk.length).trim();
    const parts = beforeDates.split(/[|·•\-–—@]/).map((p) => p.trim()).filter(Boolean);
    const role = parts[0] || "";
    const company = parts[1] || "";
    const description = chunk.slice((m?.index ?? 0) + (m?.[0].length ?? 0)).trim().slice(0, 400);
    return { id: uid(), company, role, startDate, endDate, description };
  });
}

function parseEducation(section: string): Education[] {
  if (!section) return [];
  const chunks = section
    .split(/(?=(?:[A-ZÀ-Ú][^\n.]{2,}))/g)
    .map((c) => c.trim())
    .filter((c) => c.length > 10)
    .slice(0, 6);

  return chunks.map((chunk): Education => {
    const m = chunk.match(DATE_RANGE_RE);
    const startDate = m?.[1] || "";
    const endDate = m?.[2] || "";
    const before = chunk.slice(0, m?.index ?? chunk.length).trim();
    const parts = before.split(/[|·•\-–—@]/).map((p) => p.trim()).filter(Boolean);
    const course = parts[0] || "";
    const institution = parts[1] || "";
    return { id: uid(), institution, course, startDate, endDate };
  });
}

function parseCertifications(section: string): string[] {
  if (!section) return [];
  return section
    .split(/[•\n·|]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3 && s.length < 120)
    .slice(0, 10);
}

export const ResumeParserService = {
  async parsePdf(file: File): Promise<ParsedResumeResult> {
    const text = await extractTextFromPdf(file);
    return this.parseText(text);
  },

  parseText(text: string): ParsedResumeResult {
    const sections = splitSections(text);
    const flat = text.replace(/\s+/g, " ");

    const email = flat.match(EMAIL_RE)?.[0] || "";
    const phone = flat.match(PHONE_RE)?.[0] || "";
    const linkedin = flat.match(LINKEDIN_RE)?.[0] || "";
    const github = flat.match(GITHUB_RE)?.[0] || "";
    // Try to find a personal website — first URL that is not linkedin/github
    const urls = flat.match(new RegExp(URL_RE, "gi")) || [];
    const website =
      urls.find((u) => !/linkedin|github/i.test(u)) || "";

    // Name = first non-empty short line that isn't email/phone
    const headerLines = (sections.header || "").split(/\s{2,}|\n/).map((l) => l.trim()).filter(Boolean);
    const nameCandidate =
      headerLines.find(
        (l) =>
          l.length > 3 &&
          l.length < 60 &&
          !EMAIL_RE.test(l) &&
          !PHONE_RE.test(l) &&
          /^[A-ZÀ-Úa-zà-ú][A-ZÀ-Úa-zà-ú\s.'-]+$/.test(l),
      ) || "";

    const hardSkills = matches(sections.skills || flat, TECH_HINTS);
    const softSkills = matches(flat, SOFT_HINTS);
    const languages = matches(sections.languages || flat, LANG_HINTS);
    const experiences = parseExperiences(sections.experience || "");
    const education = parseEducation(sections.education || "");
    const certifications = parseCertifications(sections.certifications || "");

    const summaryText = (sections.summary || "").trim().slice(0, 800);

    const profile: Partial<Profile> = {
      name: nameCandidate,
      email,
      phone,
      linkedin,
      github,
      website,
      summary: summaryText,
      hardSkills,
      softSkills,
      languages,
      certifications,
      experiences,
      education,
    };

    const resume: Partial<Resume> = {
      summary: summaryText,
      experiences,
      education,
      hardSkills,
      softSkills,
      keywords: [],
    };

    return {
      profile,
      resume,
      summary: {
        experiencesFound: experiences.length,
        educationFound: education.length,
        skillsFound: hardSkills.length + softSkills.length,
        languagesFound: languages.length,
        certificationsFound: certifications.length,
      },
      rawText: text,
    };
  },
};
