import { normalize } from "./br-cities";
import { candidateText, hasTerm, words } from "./match-engine";
import { conceptHighlights, conceptsOf, findTransferable } from "./transferable-skills";
import { uid } from "./storage";
import type { Experience, Job, MatchResult, Profile, Resume } from "@/types";

/**
 * Geração de uma NOVA versão do currículo adaptada a uma vaga.
 *
 * REGRA ABSOLUTA: nada é inventado. Só reorganizamos, priorizamos, resumimos e
 * reformulamos (com ligações textuais neutras) informações que já existem no
 * currículo/perfil. Nenhuma empresa, cargo, data, formação, certificação,
 * competência, número ou resultado novo é adicionado.
 */

/** Termos que a vaga valoriza (usados apenas para ORDENAR/DESTACAR conteúdo verdadeiro). */
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

/** Relevância de um texto real frente aos termos da vaga (determinístico). */
function relevanceOf(text: string, terms: string[], roleTokens: string[]): number {
  const t = normalize(text);
  let score = 0;
  for (const term of terms) if (hasTerm(t, term)) score += 3;
  for (const token of roleTokens) if (t.includes(token)) score += 2;
  // conceitos transferíveis presentes no texto
  score += conceptHighlights(t, terms).length * 2;
  return score;
}

/** Ordena competências reais do candidato: primeiro as que a vaga pede (direta ou transferível). */
function prioritizeSkills(candidate: string[], jobPriority: string[]): string[] {
  const order = new Map<string, number>();
  jobPriority.forEach((s, i) => order.set(normalize(s), i));
  const conceptOrder = new Map<string, number>();
  jobPriority.forEach((s, i) => {
    for (const c of conceptsOf(s)) if (!conceptOrder.has(c.id)) conceptOrder.set(c.id, i);
  });

  return candidate
    .map((s, i) => {
      const direct = order.get(normalize(s));
      let rank = direct ?? Number.MAX_SAFE_INTEGER;
      if (direct === undefined) {
        for (const c of conceptsOf(s)) {
          const r = conceptOrder.get(c.id);
          // transferível entra depois das diretas, mas antes das irrelevantes
          if (r !== undefined) rank = Math.min(rank, 1000 + r);
        }
      }
      return { s, i, rank };
    })
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map((x) => x.s);
}

/** Quebra a descrição em trechos reais (bullets/frases), sem perder conteúdo. */
function splitSegments(description: string): string[] {
  return description
    .split(/\n+|(?<=[.;])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Reformula a descrição de UMA experiência real:
 * - move para o início os trechos que conversam com a vaga;
 * - acrescenta uma linha de destaque com competências que JÁ aparecem naquele texto.
 * Nunca acrescenta atividade, ferramenta ou resultado que não esteja escrito.
 */
function adaptDescription(
  description: string,
  terms: string[],
  roleTokens: string[],
): { text: string; changed: boolean; highlights: string[] } {
  const original = (description || "").trim();
  if (!original) return { text: original, changed: false, highlights: [] };

  const segments = splitSegments(original);
  const ranked = segments
    .map((s, i) => ({ s, i, r: relevanceOf(s, terms, roleTokens) }))
    .sort((a, b) => b.r - a.r || a.i - b.i);

  const reordered = ranked.map((x) => x.s);
  const bulletStyle = /\n/.test(original) || /^[-•*]/.test(segments[0] ?? "");
  const joined = bulletStyle ? reordered.join("\n") : reordered.join(" ");

  const highlights = conceptHighlights(normalize(original), terms);
  const highlightLine = highlights.length
    ? `Destaques para esta vaga: ${highlights.slice(0, 5).join(", ")}.`
    : "";

  const text = highlightLine
    ? bulletStyle
      ? `${joined}\n${highlightLine}`
      : `${joined} ${highlightLine}`
    : joined;

  return {
    text,
    changed: text.trim() !== original,
    highlights,
  };
}

/** Resumo profissional adaptado — usa apenas competências que o candidato possui. */
function tailorSummary(
  base: string,
  job: Job,
  directSkills: string[],
  transferable: string[],
): string {
  const clean = (base || "").trim().replace(/\s+/g, " ").replace(/\s*\.\s*$/, "");
  const list = (arr: string[]) =>
    arr.length === 1 ? arr[0] : `${arr.slice(0, -1).join(", ")} e ${arr[arr.length - 1]}`;

  const sentences: string[] = [];
  if (clean) sentences.push(`${clean}.`);

  const top = directSkills.slice(0, 5);
  if (top.length) {
    sentences.push(
      `Experiência aplicada em ${list(top)}, competências alinhadas aos requisitos da vaga de ${job.role}.`,
    );
  }
  const transf = transferable.filter((t) => !top.some((s) => normalize(s) === normalize(t))).slice(0, 4);
  if (transf.length) {
    sentences.push(
      `Atuação envolvendo ${list(transf)}, aspectos do histórico profissional que se aplicam diretamente a esta função.`,
    );
  }
  if (!top.length && !transf.length) {
    sentences.push(`Candidatura direcionada à vaga de ${job.role}.`);
  }
  return sentences.join(" ").trim();
}

export interface TailorResult {
  resume: Resume;
  /** O que efetivamente mudou em relação ao currículo de origem. */
  changes: string[];
  /** Competências transferíveis realmente encontradas. */
  transferable: string[];
  /** Avisos (ex.: pouca aderência). */
  notices: string[];
}

/* ------------------------------------------------------------------ */
/* Validação anti-invenção                                             */
/* ------------------------------------------------------------------ */

/**
 * Garante que o currículo gerado só contém fatos que existem na origem.
 * Qualquer divergência estrutural é revertida para o dado original.
 */
export function enforceTruthfulness(
  tailored: Resume,
  source: Resume,
  profile: Profile,
): { resume: Resume; violations: string[] } {
  const violations: string[] = [];
  const out: Resume = { ...tailored };

  // Experiências: empresa, cargo e datas SEMPRE do original.
  const byId = new Map(source.experiences.map((e) => [e.id, e]));
  out.experiences = tailored.experiences
    .filter((e) => byId.has(e.id))
    .map((e) => {
      const orig = byId.get(e.id)!;
      if (
        e.company !== orig.company ||
        e.role !== orig.role ||
        e.startDate !== orig.startDate ||
        e.endDate !== orig.endDate ||
        e.current !== orig.current
      ) {
        violations.push(`Dados factuais da experiência "${orig.role}" restaurados.`);
      }
      return { ...e, company: orig.company, role: orig.role, startDate: orig.startDate, endDate: orig.endDate, current: orig.current };
    });
  if (out.experiences.length !== source.experiences.length) {
    violations.push("Experiências ausentes restauradas.");
    const kept = new Set(out.experiences.map((e) => e.id));
    out.experiences = [...out.experiences, ...source.experiences.filter((e) => !kept.has(e.id))];
  }

  // Formação e certificações: cópia fiel.
  out.education = source.education;
  out.certifications = source.certifications;
  out.languages = source.languages;

  // Competências: nada além do que já existe no currículo ou no perfil.
  const allowed = new Set(
    [
      ...source.hardSkills,
      ...source.softSkills,
      ...(profile.hardSkills ?? []),
      ...(profile.softSkills ?? []),
    ].map(normalize),
  );
  const filterSkills = (list: string[], label: string) => {
    const kept = list.filter((s) => allowed.has(normalize(s)));
    if (kept.length !== list.length) violations.push(`${label} não comprovadas foram removidas.`);
    return kept;
  };
  out.hardSkills = filterSkills(out.hardSkills, "Competências técnicas");
  out.softSkills = filterSkills(out.softSkills, "Competências comportamentais");

  // Projetos: só os que existem.
  const projIds = new Set((source.projects ?? []).map((p) => p.id));
  out.projects = (out.projects ?? []).filter((p) => projIds.has(p.id));

  return { resume: out, violations };
}

/* ------------------------------------------------------------------ */
/* Geração                                                             */
/* ------------------------------------------------------------------ */

export function tailorResumeForJob(
  job: Job,
  source: Resume,
  profile: Profile,
  match: MatchResult,
): TailorResult {
  const haystack = candidateText(source, profile);
  const terms = jobTerms(job);
  const roleTokens = Array.from(new Set(words(job.role))).filter((w) => w.length > 2);

  // Competências REAIS do candidato que a vaga pede (correspondência direta).
  const highlightedHard = source.hardSkills.filter((s) =>
    terms.some((t) => normalize(t) === normalize(s)),
  );
  // Competências transferíveis com evidência real no histórico.
  const transferableMatches = match.relatedSkills?.length
    ? match.relatedSkills
    : findTransferable(terms, haystack);
  const transferable = Array.from(new Set(transferableMatches.map((t) => t.skill)));

  const hardSkills = prioritizeSkills(source.hardSkills, terms);
  const softSkills = prioritizeSkills(source.softSkills, [...job.softSkills, ...terms]);

  // Experiências: mesma verdade, ordem e descrição adaptadas à vaga.
  const scored = source.experiences.map((e, i) => ({
    e,
    i,
    r: relevanceOf(`${e.role} ${e.company} ${e.description}`, terms, roleTokens) + (e.current ? 1 : 0),
  }));
  const ordered = [...scored].sort((a, b) => b.r - a.r || a.i - b.i);

  const adaptedExperiences: Experience[] = [];
  const experienceChanges: string[] = [];
  ordered.forEach((x, position) => {
    const adapted = adaptDescription(x.e.description, terms, roleTokens);
    adaptedExperiences.push({ ...x.e, description: adapted.text });
    if (adapted.changed) {
      experienceChanges.push(
        `Experiência "${x.e.role}${x.e.company ? ` · ${x.e.company}` : ""}" reformulada para destacar ${adapted.highlights.slice(0, 3).join(", ") || "os pontos pedidos pela vaga"}.`,
      );
    }
    if (position === 0 && x.i !== 0) {
      experienceChanges.unshift(`Experiência "${x.e.role}" priorizada no topo do currículo.`);
    }
  });

  const projects = (source.projects ?? [])
    .map((p, i) => ({ p, i, r: relevanceOf(`${p.name} ${p.description}`, terms, roleTokens) }))
    .sort((a, b) => b.r - a.r || a.i - b.i)
    .map((x) => x.p);

  // Palavras-chave ATS: só as verdadeiras. Sem stuffing.
  const keywords = Array.from(
    new Set([...match.matchedKeywords, ...highlightedHard, ...transferable].map((k) => k.trim())),
  ).filter(Boolean);

  const summary = tailorSummary(
    source.summary || profile.summary,
    job,
    highlightedHard,
    transferable,
  );

  const now = new Date().toISOString();
  const companyLabel = job.company && job.company !== "—" ? job.company : "";
  const name = ["Currículo", job.role, companyLabel].filter(Boolean).join(" — ");

  const draft: Resume = {
    ...source,
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    summary,
    hardSkills,
    softSkills,
    experiences: adaptedExperiences,
    projects,
    keywords,
    optimizedFor: job.id,
    parentId: source.id,
  };

  const { resume: safe, violations } = enforceTruthfulness(draft, source, profile);

  const changes: string[] = [];
  if (summary !== source.summary) changes.push("Resumo profissional adaptado à vaga (sem inventar dados).");
  if (hardSkills.join("|") !== source.hardSkills.join("|"))
    changes.push("Competências técnicas reorganizadas por relevância para a vaga.");
  if (softSkills.join("|") !== source.softSkills.join("|"))
    changes.push("Competências comportamentais reorganizadas.");
  changes.push(...experienceChanges);
  if (projects.map((p) => p.id).join("|") !== (source.projects ?? []).map((p) => p.id).join("|"))
    changes.push("Projetos reordenados por aderência à vaga.");
  if (transferable.length)
    changes.push(
      `${transferable.length} competência(s) transferível(is) evidenciada(s): ${transferable.slice(0, 5).join(", ")}.`,
    );
  if (keywords.length) changes.push(`${keywords.length} palavras-chave reais da vaga aplicadas.`);
  changes.push("Cargos, empresas, datas e formação mantidos exatamente como no currículo original.");

  const notices: string[] = [...violations];
  if (!highlightedHard.length && !transferable.length) {
    notices.push(
      "Encontramos poucas informações transferíveis para esta vaga. O currículo foi mantido fiel ao seu histórico profissional.",
    );
  }

  const resume: Resume = {
    ...safe,
    tailoredFor: {
      jobId: job.id,
      role: job.role,
      company: job.company,
      matchScore: match.overall,
      createdAt: now,
      highlightedSkills: highlightedHard,
      transferableSkills: transferable,
      changes,
    },
  };

  return { resume, changes, transferable, notices };
}
