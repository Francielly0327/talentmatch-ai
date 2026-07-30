import { z } from "zod";

/* ---------------------------------- masks --------------------------------- */

export function onlyDigits(v: string) {
  return v.replace(/\D+/g, "");
}

/** Aplica máscara brasileira: (11) 9999-9999 ou (11) 99999-9999 */
export function maskPhone(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Remove números e símbolos que não fazem parte de nomes */
export function sanitizeName(value: string) {
  return value.replace(/[^\p{L}\s'’.-]/gu, "").replace(/\s{2,}/g, " ");
}

/** Mantém apenas letras, espaço, hífen e apóstrofo (cidades) */
export const sanitizeCity = sanitizeName;

/* -------------------------------- validators ------------------------------- */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function isValidEmail(v: string) {
  return EMAIL_RE.test(v.trim());
}

export function isValidPhone(v: string) {
  const d = onlyDigits(v);
  return d.length === 10 || d.length === 11;
}

export function isValidName(v: string) {
  return /^[\p{L}][\p{L}\s'’.-]{1,}$/u.test(v.trim());
}

/** Completa um link a partir de um usuário ou URL parcial */
export function normalizeUrl(
  value: string,
  kind: "linkedin" | "github" | "generic" = "generic",
) {
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (kind === "linkedin") {
    if (/linkedin\.com/i.test(v)) return `https://${v.replace(/^\/+/, "")}`;
    return `https://linkedin.com/in/${v.replace(/^\/+|^in\//gi, "")}`;
  }
  if (kind === "github") {
    if (/github\.com/i.test(v)) return `https://${v.replace(/^\/+/, "")}`;
    return `https://github.com/${v.replace(/^\/+/, "")}`;
  }
  if (/^[\w-]+(\.[\w-]+)+/.test(v)) return `https://${v}`;
  return v;
}

export function isValidUrl(v: string) {
  if (!v.trim()) return true;
  try {
    const u = new URL(normalizeUrl(v));
    return !!u.hostname && u.hostname.includes(".");
  } catch {
    return false;
  }
}

/** Valida um campo mês/ano no formato AAAA-MM (input type=month) ou MM/AAAA */
export function isValidMonthYear(v: string) {
  if (!v.trim()) return true;
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(v)) {
    const year = Number(v.slice(0, 4));
    return year >= 1950 && year <= new Date().getFullYear() + 10;
  }
  if (/^(0[1-9]|1[0-2])\/\d{4}$/.test(v)) return true;
  return false;
}

const MONTHS_PT = [
  "Jan.", "Fev.", "Mar.", "Abr.", "Mai.", "Jun.",
  "Jul.", "Ago.", "Set.", "Out.", "Nov.", "Dez.",
];

/** AAAA-MM -> "Jan. 2024" */
export function formatMonthYear(v?: string) {
  if (!v) return "";
  const iso = v.match(/^(\d{4})-(\d{2})$/);
  if (iso) return `${MONTHS_PT[Number(iso[2]) - 1]} ${iso[1]}`;
  const br = v.match(/^(\d{2})\/(\d{4})$/);
  if (br) return `${MONTHS_PT[Number(br[1]) - 1]} ${br[2]}`;
  return v;
}

/** Converte texto livre ("03/2022", "2022") para AAAA-MM quando possível */
export function toMonthInputValue(v?: string) {
  if (!v) return "";
  if (/^\d{4}-\d{2}$/.test(v)) return v;
  const br = v.match(/^(\d{1,2})\/(\d{4})$/);
  if (br) return `${br[2]}-${String(br[1]).padStart(2, "0")}`;
  const y = v.match(/^(\d{4})$/);
  if (y) return `${y[1]}-01`;
  return "";
}

/* ---------------------------------- zod ----------------------------------- */

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Informe o nome completo")
  .max(80, "Máximo de 80 caracteres")
  .regex(/^[\p{L}][\p{L}\s'’.-]+$/u, "Use apenas letras, espaços, hífen e apóstrofo");

export const emailSchema = z
  .string()
  .trim()
  .max(160, "Máximo de 160 caracteres")
  .regex(EMAIL_RE, "Informe um email válido (nome@email.com)");

export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => isValidPhone(v), "Informe um telefone válido: (11) 99999-9999");

export const urlSchema = z
  .string()
  .trim()
  .refine((v) => isValidUrl(v), "Informe um link válido");

export const basicInfoSchema = z.object({
  fullName: nameSchema,
  title: z.string().trim().max(80).optional().or(z.literal("")),
  email: emailSchema.or(z.literal("")),
  phone: phoneSchema.or(z.literal("")),
  city: z.string().trim().max(60).optional().or(z.literal("")),
  state: z.string().trim().max(2).optional().or(z.literal("")),
  linkedin: urlSchema.optional().or(z.literal("")),
  github: urlSchema.optional().or(z.literal("")),
  website: urlSchema.optional().or(z.literal("")),
  portfolio: urlSchema.optional().or(z.literal("")),
});

export type BasicInfo = z.infer<typeof basicInfoSchema>;
