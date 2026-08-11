import type { Profile } from "@/types";
import { isValidEmail, isValidPhone } from "./validation";

/* ------------------------------- moeda BRL ------------------------------- */

/** Converte digitação livre em centavos (apenas dígitos). */
export function currencyDigits(value: string) {
  return value.replace(/\D+/g, "").slice(0, 11);
}

/** "6000" -> "R$ 60,00" enquanto digita centavos. */
export function maskCurrency(value: string) {
  const d = currencyDigits(value);
  if (!d) return "";
  const cents = Number(d);
  return formatBRL(cents / 100);
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

/** Extrai o valor numérico (reais) de um texto formatado. */
export function parseBRL(value: string): number | undefined {
  const d = currencyDigits(value);
  if (!d) return undefined;
  return Number(d) / 100;
}

/* ------------------------- disponibilidade (cards) ------------------------ */

export const AVAILABILITY_OPTIONS = [
  { value: "imediata", label: "Imediata", description: "Disponível para começar imediatamente.", dot: "bg-emerald-500" },
  { value: "15dias", label: "Até 15 dias", description: "Disponível em até 15 dias.", dot: "bg-amber-400" },
  { value: "30dias", label: "Até 30 dias", description: "Disponível em até 30 dias.", dot: "bg-orange-500" },
  { value: "temporario", label: "Temporário", description: "Disponível para oportunidades temporárias.", dot: "bg-sky-500" },
  { value: "combinar", label: "A combinar", description: "Disponibilidade negociável.", dot: "bg-muted-foreground" },
] as const;

export function availabilityLabel(value?: string) {
  return AVAILABILITY_OPTIONS.find((o) => o.value === value)?.label ?? value ?? "";
}

/* ---------------------------------- datas --------------------------------- */

/** Compara "AAAA-MM". Retorna true quando fim <= início. */
export function isEndBeforeStart(start?: string, end?: string) {
  if (!start || !end) return false;
  return end <= start;
}

/* ------------------------------- completude ------------------------------- */

export type CompletenessItem = { key: string; label: string; done: boolean; anchor: string };

export function profileChecklist(profile: Profile): CompletenessItem[] {
  const items: CompletenessItem[] = [
    { key: "name", label: "Nome completo", done: !!profile.name?.trim(), anchor: "pf-name" },
    { key: "email", label: "Email", done: isValidEmail(profile.email ?? ""), anchor: "pf-email" },
    { key: "phone", label: "Telefone", done: isValidPhone(profile.phone ?? ""), anchor: "pf-phone" },
    { key: "city", label: "Cidade", done: !!profile.city?.trim(), anchor: "pf-city" },
    { key: "state", label: "Estado", done: !!profile.state?.trim(), anchor: "pf-state" },
    { key: "title", label: "Título profissional", done: !!profile.title?.trim(), anchor: "pf-title" },
    { key: "summary", label: "Resumo profissional", done: (profile.summary ?? "").trim().length >= 30, anchor: "pf-summary" },
    { key: "salary", label: "Pretensão salarial", done: !!profile.salaryExpectation?.trim(), anchor: "pf-salary" },
    { key: "availability", label: "Disponibilidade", done: !!profile.availability?.trim(), anchor: "pf-availability" },
    { key: "level", label: "Nível profissional", done: !!profile.level?.trim(), anchor: "pf-level" },
    { key: "hardSkills", label: "Competências técnicas", done: (profile.hardSkills ?? []).length > 0, anchor: "pf-skills" },
  ];

  if (!profile.hasNoExperience) {
    const ok =
      (profile.experiences ?? []).length > 0 &&
      profile.experiences.every(
        (e) =>
          e.company.trim() &&
          e.role.trim() &&
          e.startDate.trim() &&
          (e.current || e.endDate.trim()) &&
          !isEndBeforeStart(e.startDate, e.endDate) &&
          e.description.trim(),
      );
    items.push({ key: "experience", label: "Experiência profissional", done: ok, anchor: "pf-experience" });
  }

  if (!profile.hasNoEducation) {
    const ok =
      (profile.education ?? []).length > 0 &&
      profile.education.every(
        (e) => e.institution.trim() && e.course.trim() && !!e.type?.trim() && !!e.status?.trim(),
      );
    items.push({ key: "education", label: "Formação acadêmica", done: ok, anchor: "pf-education" });
  }

  return items;
}

export function profileCompleteness(profile: Profile) {
  const items = profileChecklist(profile);
  const done = items.filter((i) => i.done).length;
  const percent = items.length ? Math.round((done / items.length) * 100) : 0;
  const missing = items.filter((i) => !i.done);
  return { items, done, total: items.length, percent, missing };
}

export function completenessTone(percent: number) {
  if (percent < 40) return { label: "Precisa completar", dot: "bg-destructive", text: "text-destructive" };
  if (percent < 70) return { label: "Em progresso", dot: "bg-amber-500", text: "text-amber-600" };
  if (percent < 90) return { label: "Quase completo", dot: "bg-sky-500", text: "text-sky-600" };
  return { label: "Perfil completo", dot: "bg-emerald-500", text: "text-emerald-600" };
}
