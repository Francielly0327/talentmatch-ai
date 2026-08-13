import { normalize } from "./br-cities";
import { candidateText, hasTerm, words } from "./match-engine";
import { uid } from "./storage";
import type { Experience, Job, MatchResult, Profile, Resume } from "@/types";

/**
 * Geração de uma NOVA versão do currículo adaptada a uma vaga.
 *
 * REGRA ABSOLUTA: nada é inventado. Só reorganizamos, priorizamos e reescrevemos
 * (com ligações textuais neutras) informações que já existem no currículo/perfil.
 * Nenhuma competência, empresa, cargo, formação, projeto, número ou resultado novo
 * é adicionado.
 */

/** Termos que a vaga valoriza (usados apenas para ORDENAR conteúdo verdadeiro). */
function jobTerms(job: Job): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of [
    ...(job.requiredSkills ?? []),
    ...job.hardSkills,
    ...job.technologies,
    ...job.softSkills,
    ...(job.desiredSkills ?? []),
    ...job.keywords.slice(0, 20),
  ]) {
    const n = normalize(t);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(t);
  }
  return out;
}

/** Ordena competências reais do candidato: primeiro as que a vaga pede. */
function prioritizeSkills(candidate: string[], jobPriority: string[]): string[] {
  const order = new Map<string, number>();
  jobPriority.forEach((s, i) => order.set(normalize(s), i));
  return candidate
    .map((s, i) => ({ s, i, rank: order.get(normalize(s)) ?? Number.MAX_SAFE_INTEGER }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map((x) => x.s);
}

/** Relevância de uma experiência real frente aos termos da vaga (determinístico). */
function experienceRelevance(exp: Experience, terms: string[], roleTokens: string[]): number {
  const text = normalize(`${exp.role} ${exp.company} ${exp.description}`);
  let score = 0;
  for (const t of terms) if (hasTerm(text, t)) score += 3;
  for (const t of roleTokens) if (text.includes(t)) score += 2;
  if (exp.current) score += 1;
  return score;
}

/** Resumo profissional adaptado — usa apenas competências que o candidato possui. */
function tailorSummary(
  base: string,
  job: Job,
  highlighted: string[],
): string {
  const clean = (base || "").trim().replace(/\s+/g, " ").replace(/\s*\.\s*$/, "");
  const top = highlighted.slice(0, 5);
  const skillsPhrase = top.length
    ? top.length === 1
      ? top[0]
      : `${top.slice(0, -1).join(", ")} e ${top[top.length - 1]}`
    : "";

  const target = [job.role, job.company && job.company !== "—" ? job.company : ""]
    .filter(Boolean)
    .join(" · ");

  const sentences: string[] = [];
  if (clean) sentences.push(`${clean}.`);
  if (skillsPhrase) {
    sentences.push(
      `Competências aplicadas em ${skillsPhrase}, alinhadas às necessidades da vaga de ${job.role}.`,
    );
  } else if (target) {
    sentences.push(`Candidatura direcionada à vaga de ${job.role}.`);
  }
  return sentences.join(" ").trim();
}

export interface TailorResult {
  resume: Resume;
  /** O que efetivamente mudou em relação ao currículo de origem. */
  changes: string[];
}

export function tailorResumeForJob(
  job: Job,
  source: Resume,
  profile: Profile,
  match: MatchResult,
): TailorResult {
  const haystack = candidateText(source, profile);
  const terms = jobTerms(job);
  const roleTokens = Array.from(new Set(words(job.role))).filter((w) => w.length > 2);

  // Competências REAIS do candidato que a vaga valoriza (nunca adicionamos novas).
  const highlighted = terms.filter(
    (t) =>
      source.hardSkills.some((s) => normalize(s) === normalize(t)) ||
      (profile.hardSkills ?? []).some((s) => normalize(s) === normalize(t)) ||
      hasTerm(haystack, t),
  );
  const highlightedHard = source.hardSkills.filter((s) =>
    terms.some((t) => normalize(t) === normalize(s)),
  );

  const hardSkills = prioritizeSkills(source.hardSkills, terms);
  const softSkills = prioritizeSkills(source.softSkills, [...job.softSkills, ...terms]);

  const experiences = source.experiences
    .map((e, i) => ({ e, i, r: experienceRelevance(e, terms, roleTokens) }))
    .sort((a, b) => b.r - a.r || a.i - b.i)
    .map((x) => x.e);

  const projects = (source.projects ?? [])
    .map((p, i) => ({
      p,
      i,
      r: terms.filter((t) => hasTerm(normalize(`${p.name} ${p.description}`), t)).length,
    }))
    .sort((a, b) => b.r - a.r || a.i - b.i)
    .map((x) => x.p);

  // Palavras-chave ATS: só as verdadeiras (encontradas no perfil). Sem stuffing.
  const keywords = Array.from(
    new Set([...match.matchedKeywords, ...highlightedHard].map((k) => k.trim())),
  ).filter(Boolean);

  const summary = tailorSummary(source.summary || profile.summary, job, highlightedHard);

  const now = new Date().toISOString();
  const companyLabel = job.company && job.company !== "—" ? job.company : "";
  const name = ["Currículo", job.role, companyLabel].filter(Boolean).join(" — ");

  const resume: Resume = {
    ...source,
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    summary,
    hardSkills,
    softSkills,
    experiences,
    projects,
    keywords,
    optimizedFor: job.id,
    parentId: source.id,
    tailoredFor: {
      jobId: job.id,
      role: job.role,
      company: job.company,
      matchScore: match.overall,
      createdAt: now,
      highlightedSkills: highlightedHard,
    },
  };

  const changes: string[] = [];
  if (summary !== source.summary) changes.push("Resumo profissional adaptado à vaga (sem inventar dados).");
  if (hardSkills.join("|") !== source.hardSkills.join("|"))
    changes.push("Competências técnicas reordenadas por relevância para a vaga.");
  if (softSkills.join("|") !== source.softSkills.join("|"))
    changes.push("Competências comportamentais reordenadas.");
  if (experiences.map((e) => e.id).join("|") !== source.experiences.map((e) => e.id).join("|"))
    changes.push("Experiências mais relevantes movidas para o topo.");
  if (projects.map((p) => p.id).join("|") !== (source.projects ?? []).map((p) => p.id).join("|"))
    changes.push("Projetos reordenados por aderência à vaga.");
  if (keywords.length) changes.push(`${keywords.length} palavras-chave reais da vaga aplicadas.`);
  if (!changes.length) changes.push("Seu currículo já estava alinhado — criamos uma cópia vinculada à vaga.");

  return { resume, changes };
}

export { highlightedFallback };
/** Utilitário exportado para testes manuais/depuração. */
function highlightedFallback(job: Job) {
  return jobTerms(job);
}
