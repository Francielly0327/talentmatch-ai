import type {
  Job,
  Resume,
  Profile,
  MatchScore,
  GapAnalysis,
} from "@/types";
import { uid } from "./storage";

/**
 * AIService — desacoplado para futura integração com OpenAI / Lovable AI Gateway.
 * Nesta versão usa heurísticas locais (mock inteligente) sobre o texto.
 */

const STOPWORDS = new Set([
  "a","o","e","de","do","da","dos","das","com","para","por","em","um","uma",
  "os","as","que","se","na","no","nas","nos","the","and","or","of","to","in",
  "for","with","on","at","is","are","be","as","by","an","this","that","from",
]);

const TECH_HINTS = [
  "react","typescript","javascript","node","node.js","next","nextjs","vue","angular",
  "python","django","flask","fastapi","java","spring","kotlin","swift","go","golang",
  "rust","c#",".net","php","laravel","ruby","rails","aws","azure","gcp","docker",
  "kubernetes","k8s","terraform","ci/cd","jenkins","github actions","gitlab",
  "postgres","postgresql","mysql","mongodb","redis","kafka","rabbitmq","graphql",
  "rest","api","sql","nosql","tailwind","css","html","sass","figma","git",
  "linux","bash","microservices","tdd","scrum","agile","jira","html5","css3",
  "vite","webpack","jest","cypress","playwright","selenium","power bi","tableau",
  "excel","spark","hadoop","airflow","dbt","snowflake","bigquery","etl",
];

const SOFT_HINTS = [
  "comunicação","liderança","proatividade","trabalho em equipe","colaboração",
  "resolução de problemas","organização","empatia","adaptabilidade","criatividade",
  "communication","leadership","teamwork","problem solving","ownership",
];

const LANG_HINTS = ["inglês","english","espanhol","spanish","português","french","francês"];

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#.\/\s-]/gu, " ")
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t) && t.length > 1);
}

function findMatches(text: string, hints: string[]): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const h of hints) {
    const re = new RegExp(`(^|[^a-z0-9])${h.replace(/[.+#/]/g, "\\$&")}([^a-z0-9]|$)`, "i");
    if (re.test(lower)) found.add(h);
  }
  return Array.from(found);
}

function pickRegex(text: string, patterns: RegExp[]): string {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return (m[1] || m[0]).trim();
  }
  return "";
}

export const AIService = {
  extractKeywords(text: string): string[] {
    const t = tokens(text);
    const freq: Record<string, number> = {};
    for (const w of t) freq[w] = (freq[w] || 0) + 1;
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([w]) => w);
  },

  analyzeJob(rawText: string): Omit<Job, "id" | "createdAt" | "rawText"> {
    const text = rawText;
    const tech = findMatches(text, TECH_HINTS);
    const soft = findMatches(text, SOFT_HINTS);
    const langs = findMatches(text, LANG_HINTS);
    const keywords = AIService.extractKeywords(text);

    const company =
      pickRegex(text, [/empresa[:\s-]+([^\n]{2,60})/i, /company[:\s-]+([^\n]{2,60})/i]) || "—";
    const role =
      pickRegex(text, [
        /vaga[:\s-]+([^\n]{2,80})/i,
        /cargo[:\s-]+([^\n]{2,80})/i,
        /position[:\s-]+([^\n]{2,80})/i,
        /^(desenvolvedor[a]?[^\n]{2,60})/im,
        /^(engenheiro[a]?[^\n]{2,60})/im,
        /^(analista[^\n]{2,60})/im,
      ]) || "—";
    const seniority =
      pickRegex(text, [/(estagi[áa]rio|j[úu]nior|pleno|s[êe]nior|especialista|lead|staff)/i]) ||
      "—";
    const salary = pickRegex(text, [/r\$\s?[\d\.\,]+/i, /\$\s?[\d\.\,]+/i]) || "";
    const location =
      pickRegex(text, [/local[:\s-]+([^\n]{2,60})/i, /localiza[çc][ãa]o[:\s-]+([^\n]{2,60})/i]) ||
      "";
    const workType =
      pickRegex(text, [/(remoto|h[íi]brido|presencial|remote|hybrid|onsite)/i]) || "";

    const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const requiredRequirements = lines
      .filter((l) => /requisit|obrigat|required|must/i.test(l))
      .slice(0, 8);
    const desiredRequirements = lines
      .filter((l) => /desej|nice to have|diferenci/i.test(l))
      .slice(0, 8);
    const responsibilities = lines
      .filter((l) => /respons|atividade|responsibilit/i.test(l))
      .slice(0, 8);
    const benefits = lines
      .filter((l) => /benef|vale|plano|gympass|home office/i.test(l))
      .slice(0, 8);

    return {
      company,
      role,
      seniority,
      technologies: tech,
      hardSkills: tech,
      softSkills: soft,
      languages: langs,
      benefits,
      salary,
      location,
      workType,
      keywords,
      responsibilities,
      requiredRequirements,
      desiredRequirements,
    };
  },

  calculateMatch(job: Job, resume: Resume, profile: Profile): MatchScore {
    const resumeText = [
      resume.summary,
      resume.hardSkills.join(" "),
      resume.softSkills.join(" "),
      resume.keywords.join(" "),
      resume.experiences.map((e) => `${e.role} ${e.company} ${e.description}`).join(" "),
      resume.education.map((e) => `${e.course} ${e.institution}`).join(" "),
      profile.hardSkills.join(" "),
      profile.softSkills.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    const pct = (arr: string[]) => {
      if (!arr.length) return 100;
      const hit = arr.filter((s) => resumeText.includes(s.toLowerCase())).length;
      return Math.round((hit / arr.length) * 100);
    };

    const hardSkills = pct(job.hardSkills);
    const softSkills = pct(job.softSkills);
    const keywords = pct(job.keywords.slice(0, 15));
    const languages = pct(job.languages);
    const experience = Math.min(100, 40 + resume.experiences.length * 15);
    const education = resume.education.length ? 90 : 50;
    const seniority =
      profile.level && job.seniority.toLowerCase().includes(profile.level) ? 100 : 70;

    const overall = Math.round(
      hardSkills * 0.35 +
        keywords * 0.2 +
        softSkills * 0.1 +
        experience * 0.15 +
        education * 0.05 +
        languages * 0.05 +
        seniority * 0.1,
    );

    return { overall, hardSkills, softSkills, experience, education, languages, keywords, seniority };
  },

  identifySkillGaps(job: Job, resume: Resume, profile: Profile): GapAnalysis {
    const resumeSkills = new Set(
      [...resume.hardSkills, ...profile.hardSkills].map((s) => s.toLowerCase()),
    );
    const jobSkills = Array.from(new Set([...job.hardSkills, ...job.technologies]));
    const matched: string[] = [];
    const missing: GapAnalysis["missing"] = [];
    for (const s of jobSkills) {
      if (resumeSkills.has(s.toLowerCase())) matched.push(s);
      else {
        const priority: "high" | "medium" | "low" =
          job.requiredRequirements.join(" ").toLowerCase().includes(s.toLowerCase())
            ? "high"
            : job.desiredRequirements.join(" ").toLowerCase().includes(s.toLowerCase())
              ? "medium"
              : "low";
        missing.push({ skill: s, priority });
      }
    }
    return { matched, missing };
  },

  generateSuggestions(score: MatchScore, gaps: GapAnalysis): string[] {
    const s: string[] = [];
    if (score.keywords < 80)
      s.push("Inclua mais palavras-chave da vaga no seu resumo e experiências.");
    if (score.hardSkills < 80)
      s.push("Destaque tecnologias específicas exigidas na seção de skills.");
    if (score.experience < 70)
      s.push("Detalhe entregas e resultados quantificáveis em cada experiência.");
    for (const m of gaps.missing.filter((g) => g.priority === "high").slice(0, 3)) {
      s.push(`Considere adquirir ou destacar experiência com ${m.skill} (requisito obrigatório).`);
    }
    if (!s.length) s.push("Seu currículo está bem alinhado com a vaga.");
    return s;
  },

  optimizeResume(job: Job, resume: Resume, profile: Profile): Resume {
    const missingSkills = AIService.identifySkillGaps(job, resume, profile).missing
      .filter((m) => m.priority !== "high")
      .map((m) => m.skill);
    const newKeywords = Array.from(
      new Set([...resume.keywords, ...job.keywords.slice(0, 15), ...job.hardSkills]),
    );
    const summary = `${profile.name || "Profissional"} com foco em ${job.role}. ${
      resume.summary || profile.summary || ""
    } Experiência aplicada em ${job.hardSkills.slice(0, 5).join(", ") || "tecnologias relevantes"}.`.trim();

    return {
      id: uid(),
      name: `${resume.name} — ${job.company !== "—" ? job.company : job.role}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      summary,
      experiences: resume.experiences.map((e) => ({
        ...e,
        description: enhanceDescription(e.description, job.hardSkills),
      })),
      education: resume.education,
      hardSkills: Array.from(new Set([...resume.hardSkills, ...job.hardSkills])),
      softSkills: Array.from(new Set([...resume.softSkills, ...job.softSkills])),
      keywords: newKeywords,
      optimizedFor: job.id,
      parentId: resume.id,
    };
  },

  simulateATS(resume: Resume, job?: Job) {
    const problems: string[] = [];
    if (!resume.summary) problems.push("Resumo profissional ausente.");
    if (resume.experiences.length === 0) problems.push("Nenhuma experiência cadastrada.");
    if (resume.hardSkills.length < 3) problems.push("Poucas hard skills listadas.");
    const text = `${resume.summary} ${resume.hardSkills.join(" ")}`.toLowerCase();
    if (job) {
      const missingKw = job.keywords.slice(0, 10).filter((k) => !text.includes(k));
      if (missingKw.length)
        problems.push(`Faltam palavras-chave: ${missingKw.slice(0, 5).join(", ")}`);
    }
    const score = Math.max(20, 100 - problems.length * 15);
    return { score, problems };
  },

  compareResumes(original: Resume, optimized: Resume) {
    const origWords = new Set(tokens(originalToText(original)));
    const optWords = new Set(tokens(originalToText(optimized)));
    const added = Array.from(optWords).filter((w) => !origWords.has(w)).slice(0, 30);
    const removed = Array.from(origWords).filter((w) => !optWords.has(w)).slice(0, 30);
    return { added, removed };
  },
};

function originalToText(r: Resume) {
  return [
    r.summary,
    r.hardSkills.join(" "),
    r.softSkills.join(" "),
    r.experiences.map((e) => `${e.role} ${e.company} ${e.description}`).join(" "),
  ].join(" ");
}

function enhanceDescription(desc: string, jobSkills: string[]): string {
  if (!desc) return "";
  const missing = jobSkills.filter((s) => !desc.toLowerCase().includes(s.toLowerCase())).slice(0, 3);
  if (!missing.length) return desc;
  return `${desc} — com uso de ${missing.join(", ")}.`;
}
