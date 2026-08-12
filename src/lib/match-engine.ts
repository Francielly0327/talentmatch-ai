import { normalize } from "./br-cities";
import type {
  GapAnalysis,
  Job,
  MatchCriterion,
  MatchResult,
  Profile,
  Resume,
} from "@/types";

/**
 * Motor de compatibilidade DETERMINÍSTICO.
 *
 * Regras invioláveis:
 * - Nenhum uso de Math.random(), data/hora ou fallback fixo (ex.: 75%).
 * - Mesmo perfil + mesma vaga => exatamente o mesmo score.
 * - Só considera critérios que realmente existem na vaga (normalização de pesos).
 * - Nunca infere que o candidato possui algo que não está escrito no perfil/currículo.
 */

/* ------------------------------------------------------------------ */
/* Utilidades de texto                                                 */
/* ------------------------------------------------------------------ */

const STOP = new Set([
  "a","o","e","de","do","da","dos","das","com","para","por","em","um","uma","os","as","que",
  "se","na","no","nas","nos","ao","aos","the","and","or","of","to","in","for","with","on","at",
  "is","are","be","as","by","an","this","that","from","ser","ter","sua","seu","mais","como",
  "vaga","empresa","cargo","nivel","nível","area","área","sobre","voce","você","nossa","nosso",
]);

export function words(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9+#.]+/)
    .map((w) => w.replace(/^[.]+|[.]+$/g, ""))
    .filter((w) => w.length > 1 && !STOP.has(w));
}

/** Verifica se um termo aparece no texto respeitando limites de palavra. */
export function hasTerm(haystackNormalized: string, term: string): boolean {
  const t = normalize(term).trim();
  if (!t) return false;
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`);
  return re.test(haystackNormalized);
}

/** Texto completo e normalizado com tudo que o candidato realmente declarou. */
export function candidateText(resume: Resume, profile: Profile): string {
  const parts = [
    resume.summary,
    resume.title,
    resume.hardSkills.join(" "),
    resume.softSkills.join(" "),
    (resume.keywords ?? []).join(" "),
    (resume.certifications ?? []).join(" "),
    (resume.languages ?? []).join(" "),
    resume.experiences.map((e) => `${e.role} ${e.company} ${e.description}`).join(" "),
    resume.education.map((e) => `${e.course} ${e.institution} ${e.type ?? ""}`).join(" "),
    (resume.projects ?? []).map((p) => `${p.name} ${p.description}`).join(" "),
    profile.summary,
    profile.title ?? "",
    profile.hardSkills.join(" "),
    profile.softSkills.join(" "),
    (profile.certifications ?? []).join(" "),
    (profile.languages ?? []).join(" "),
    profile.experiences.map((e) => `${e.role} ${e.company} ${e.description}`).join(" "),
    profile.education.map((e) => `${e.course} ${e.institution} ${e.type ?? ""}`).join(" "),
    (profile.projects ?? []).map((p) => `${p.name} ${p.description}`).join(" "),
  ];
  return normalize(parts.filter(Boolean).join(" \n "));
}

/** Competências declaradas explicitamente (lista de skills, sem inferência textual). */
export function declaredSkills(resume: Resume, profile: Profile): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of [
    ...resume.hardSkills,
    ...resume.softSkills,
    ...(profile.hardSkills ?? []),
    ...(profile.softSkills ?? []),
  ]) {
    const n = normalize(s);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(s);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Classificação de requisitos da vaga                                 */
/* ------------------------------------------------------------------ */

const DESIRED_RE = /desej[áa]vel|diferencial|diferenciais|nice to have|ser[áa] um plus|plus\b|opcional|bonus|b[ôo]nus/i;
const REQUIRED_RE = /obrigat[óo]ri|requisito|required|must have|essencial|imprescind[íi]vel|necess[áa]ri|exig/i;

/**
 * Separa as competências da vaga entre obrigatórias e desejáveis,
 * olhando em qual bloco de texto cada uma aparece.
 */
export function classifyJobSkills(job: Job): { required: string[]; desired: string[] } {
  if (job.requiredSkills?.length || job.desiredSkills?.length) {
    return {
      required: job.requiredSkills ?? [],
      desired: job.desiredSkills ?? [],
    };
  }
  const all: string[] = [];
  const seen = new Set<string>();
  for (const s of [...job.hardSkills, ...job.technologies]) {
    const n = normalize(s);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    all.push(s);
  }

  const desiredBlock = normalize(job.desiredRequirements.join(" \n "));
  const requiredBlock = normalize(job.requiredRequirements.join(" \n "));
  const lines = job.rawText.split(/\n+/);
  const desiredLines = normalize(lines.filter((l) => DESIRED_RE.test(l)).join(" \n "));
  const requiredLines = normalize(lines.filter((l) => REQUIRED_RE.test(l)).join(" \n "));

  const required: string[] = [];
  const desired: string[] = [];
  for (const s of all) {
    const inDesired = hasTerm(desiredBlock, s) || hasTerm(desiredLines, s);
    const inRequired = hasTerm(requiredBlock, s) || hasTerm(requiredLines, s);
    if (inDesired && !inRequired) desired.push(s);
    else required.push(s);
  }
  return { required, desired };
}

/* ------------------------------------------------------------------ */
/* Senioridade                                                         */
/* ------------------------------------------------------------------ */

const LEVEL_RANK: Array<[RegExp, number]> = [
  [/estagi/, 1],
  [/trainee|aprendiz/, 1],
  [/junior|júnior|jr\b/, 2],
  [/pleno|mid|pl\b/, 3],
  [/senior|sênior|sr\b/, 4],
  [/especialista|specialist|lead|staff|principal|coordenador|gerente/, 5],
];

export function levelRank(value: string): number | null {
  const n = normalize(value);
  if (!n) return null;
  for (const [re, rank] of LEVEL_RANK) if (re.test(n)) return rank;
  return null;
}

/* ------------------------------------------------------------------ */
/* Cálculo dos critérios                                               */
/* ------------------------------------------------------------------ */

function pctFound(items: string[], haystack: string, declared: Set<string>) {
  const found: string[] = [];
  const missing: string[] = [];
  for (const item of items) {
    if (declared.has(normalize(item)) || hasTerm(haystack, item)) found.push(item);
    else missing.push(item);
  }
  const score = items.length ? Math.round((found.length / items.length) * 100) : 0;
  return { found, missing, score };
}

function experienceScore(job: Job, resume: Resume, profile: Profile, haystack: string) {
  const experiences = resume.experiences.length ? resume.experiences : profile.experiences ?? [];
  if (!experiences.length) {
    return { score: 0, detail: "Nenhuma experiência informada no perfil." };
  }
  const expText = normalize(
    experiences.map((e) => `${e.role} ${e.company} ${e.description}`).join(" \n "),
  );

  // 1) Tecnologias da vaga presentes nas experiências (60%)
  const techs = Array.from(new Set([...job.hardSkills, ...job.technologies]));
  const techHit = techs.length
    ? techs.filter((t) => hasTerm(expText, t)).length / techs.length
    : hasTerm(haystack, job.role)
      ? 1
      : 0;

  // 2) Aderência ao cargo/área (25%)
  const roleTokens = Array.from(new Set(words(job.role))).filter((w) => w.length > 2);
  const roleHit = roleTokens.length
    ? roleTokens.filter((t) => expText.includes(t)).length / roleTokens.length
    : 0;

  // 3) Aderência às responsabilidades (15%)
  const respTokens = Array.from(
    new Set(job.responsibilities.flatMap((r) => words(r))),
  ).filter((w) => w.length > 3);
  const respHit = respTokens.length
    ? respTokens.filter((t) => expText.includes(t)).length / respTokens.length
    : roleHit;

  const score = Math.round(100 * (0.6 * techHit + 0.25 * roleHit + 0.15 * respHit));
  const detail = `${experiences.length} experiência(s); ${Math.round(techHit * 100)}% das tecnologias da vaga aparecem nas suas atuações.`;
  return { score: Math.max(0, Math.min(100, score)), detail };
}

const EDU_REQUIRED_RE =
  /forma[çc][ãa]o|gradua[çc][ãa]o|graduado|superior completo|superior cursando|bacharel|licenciatura|tecn[óo]logo|curso t[ée]cnico|ensino m[ée]dio|p[óo]s-?gradua/i;

function educationApplicable(job: Job) {
  return EDU_REQUIRED_RE.test(job.rawText);
}

function educationScore(job: Job, resume: Resume, profile: Profile) {
  const education = resume.education.length ? resume.education : profile.education ?? [];
  if (!education.length) return { score: 0, detail: "Nenhuma formação informada no perfil." };
  const eduText = normalize(
    education.map((e) => `${e.course} ${e.institution} ${e.type ?? ""} ${e.status ?? ""}`).join(" "),
  );
  const jobEduLines = job.rawText
    .split(/\n+/)
    .filter((l) => EDU_REQUIRED_RE.test(l))
    .join(" \n ");
  const tokens = Array.from(new Set(words(jobEduLines))).filter((w) => w.length > 3);
  const hit = tokens.length ? tokens.filter((t) => eduText.includes(t)).length / tokens.length : 0;
  const score = Math.round(70 + 30 * Math.min(1, hit * 2));
  return {
    score,
    detail: hit > 0 ? "Formação compatível com o pedido da vaga." : "Formação informada no perfil.",
  };
}

function seniorityScore(job: Job, profile: Profile) {
  const jobRank = levelRank(job.seniority) ?? levelRank(job.role) ?? levelRank(job.rawText);
  const candRank = levelRank(profile.level);
  if (jobRank === null || candRank === null) return null;
  const diff = candRank - jobRank;
  const score = diff === 0 ? 100 : diff > 0 ? 90 : diff === -1 ? 60 : diff === -2 ? 30 : 10;
  return {
    score,
    detail:
      diff === 0
        ? "Seu nível é exatamente o pedido pela vaga."
        : diff > 0
          ? "Seu nível é superior ao pedido pela vaga."
          : "Seu nível está abaixo do pedido pela vaga.",
  };
}

function otherRequirements(job: Job, profile: Profile, haystack: string) {
  const parts: Array<{ score: number; label: string }> = [];

  if (job.languages.length) {
    const langs = pctFound(job.languages, haystack, new Set());
    parts.push({ score: langs.score, label: `Idiomas ${langs.found.length}/${job.languages.length}` });
  }
  if (job.workType && profile.workModel) {
    const jt = normalize(job.workType);
    const pm = normalize(profile.workModel);
    const compatible =
      jt.includes(pm) ||
      (pm === "hibrido" && (jt.includes("remoto") || jt.includes("presencial"))) ||
      (jt.includes("remote") && pm === "remoto") ||
      (jt.includes("hybrid") && pm === "hibrido") ||
      (jt.includes("onsite") && pm === "presencial");
    parts.push({ score: compatible ? 100 : 40, label: `Modelo de trabalho ${compatible ? "compatível" : "divergente"}` });
  }
  if (job.location && (profile.city || profile.state)) {
    const loc = normalize(job.location);
    const compatible =
      (profile.city && loc.includes(normalize(profile.city))) ||
      (profile.state && loc.includes(normalize(profile.state))) ||
      /remoto|remote|home office|anywhere/.test(loc);
    parts.push({ score: compatible ? 100 : 50, label: `Localização ${compatible ? "compatível" : "diferente"}` });
  }
  if (!parts.length) return null;
  const score = Math.round(parts.reduce((s, p) => s + p.score, 0) / parts.length);
  return { score, detail: parts.map((p) => p.label).join(" · ") };
}

/* ------------------------------------------------------------------ */
/* API pública                                                         */
/* ------------------------------------------------------------------ */

export function calculateMatch(job: Job, resume: Resume, profile: Profile): MatchResult {
  const haystack = candidateText(resume, profile);
  const declared = new Set(declaredSkills(resume, profile).map(normalize));
  const { required, desired } = classifyJobSkills(job);

  const criteria: MatchCriterion[] = [];

  // 1. Competências obrigatórias — 40%
  const req = pctFound(required, haystack, declared);
  criteria.push({
    key: "required",
    label: "Competências obrigatórias",
    weight: 40,
    applicable: required.length > 0,
    score: req.score,
    detail: required.length
      ? `${req.found.length}/${required.length} encontradas no seu perfil`
      : "A vaga não listou competências obrigatórias",
    matched: req.found,
    missing: req.missing,
  });

  // 2. Experiência profissional — 25%
  const exp = experienceScore(job, resume, profile, haystack);
  criteria.push({
    key: "experience",
    label: "Experiência profissional",
    weight: 25,
    applicable: true,
    score: exp.score,
    detail: exp.detail,
    matched: [],
    missing: [],
  });

  // 3. Formação acadêmica — 10% (só se a vaga pedir)
  const eduApplicable = educationApplicable(job);
  const edu = eduApplicable
    ? educationScore(job, resume, profile)
    : { score: 0, detail: "A vaga não exige formação específica — não penaliza." };
  criteria.push({
    key: "education",
    label: "Formação acadêmica",
    weight: 10,
    applicable: eduApplicable,
    score: edu.score,
    detail: edu.detail,
    matched: [],
    missing: [],
  });

  // 4. Palavras-chave — 10%
  const jobKeywords = job.keywords.slice(0, 20);
  const kw = pctFound(jobKeywords, haystack, declared);
  criteria.push({
    key: "keywords",
    label: "Palavras-chave e conhecimentos",
    weight: 10,
    applicable: jobKeywords.length > 0,
    score: kw.score,
    detail: jobKeywords.length
      ? `${kw.found.length}/${jobKeywords.length} palavras-chave da vaga aparecem no seu perfil`
      : "Nenhuma palavra-chave identificada na vaga",
    matched: kw.found,
    missing: kw.missing,
  });

  // 5. Senioridade — 10%
  const sen = seniorityScore(job, profile);
  criteria.push({
    key: "seniority",
    label: "Senioridade",
    weight: 10,
    applicable: sen !== null,
    score: sen?.score ?? 0,
    detail: sen?.detail ?? "Nível não informado na vaga ou no seu perfil — não penaliza.",
    matched: [],
    missing: [],
  });

  // 6. Diferenciais — 5%
  const dif = pctFound(desired, haystack, declared);
  criteria.push({
    key: "desired",
    label: "Diferenciais (desejáveis)",
    weight: 5,
    applicable: desired.length > 0,
    score: dif.score,
    detail: desired.length
      ? `${dif.found.length}/${desired.length} diferenciais encontrados`
      : "A vaga não listou diferenciais",
    matched: dif.found,
    missing: dif.missing,
  });

  // 7. Outros requisitos — 5%
  const others = otherRequirements(job, profile, haystack);
  criteria.push({
    key: "others",
    label: "Outros requisitos",
    weight: 5,
    applicable: others !== null,
    score: others?.score ?? 0,
    detail: others?.detail ?? "Sem outros requisitos objetivos identificados.",
    matched: [],
    missing: [],
  });

  const applicable = criteria.filter((c) => c.applicable);
  const totalWeight = applicable.reduce((s, c) => s + c.weight, 0);
  const overall = totalWeight
    ? Math.round(applicable.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight)
    : 0;

  return {
    overall,
    criteria,
    requiredSkills: required,
    desiredSkills: desired,
    matchedSkills: [...req.found, ...dif.found],
    missingSkills: [
      ...req.missing.map((s) => ({ skill: s, priority: "high" as const })),
      ...dif.missing.map((s) => ({ skill: s, priority: "medium" as const })),
    ],
    matchedKeywords: kw.found,
    missingKeywords: kw.missing,
  };
}

export function toGapAnalysis(match: MatchResult): GapAnalysis {
  return { matched: match.matchedSkills, missing: match.missingSkills };
}

export function generateSuggestions(match: MatchResult): string[] {
  const out: string[] = [];
  const by = (k: string) => match.criteria.find((c) => c.key === k);
  const req = by("required");
  if (req?.applicable && req.score < 80 && req.missing.length) {
    out.push(
      `Se você já trabalhou com ${req.missing.slice(0, 3).join(", ")}, inclua no perfil — não encontramos essa informação.`,
    );
  }
  const kw = by("keywords");
  if (kw?.applicable && kw.score < 70) {
    out.push("Use no resumo e nas descrições as palavras-chave da vaga que realmente correspondem à sua atuação.");
  }
  const exp = by("experience");
  if (exp && exp.score < 70) {
    out.push("Detalhe nas suas experiências as atividades e tecnologias que você de fato utilizou.");
  }
  const sen = by("seniority");
  if (sen?.applicable && sen.score < 60) {
    out.push("O nível da vaga está acima do seu nível declarado — reforce entregas de maior responsabilidade que você já teve.");
  }
  if (!out.length) out.push("Seu perfil está bem alinhado com esta vaga.");
  return out;
}
