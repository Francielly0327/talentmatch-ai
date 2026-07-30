export const BR_STATES = [
  { value: "AC", label: "AC — Acre" },
  { value: "AL", label: "AL — Alagoas" },
  { value: "AP", label: "AP — Amapá" },
  { value: "AM", label: "AM — Amazonas" },
  { value: "BA", label: "BA — Bahia" },
  { value: "CE", label: "CE — Ceará" },
  { value: "DF", label: "DF — Distrito Federal" },
  { value: "ES", label: "ES — Espírito Santo" },
  { value: "GO", label: "GO — Goiás" },
  { value: "MA", label: "MA — Maranhão" },
  { value: "MT", label: "MT — Mato Grosso" },
  { value: "MS", label: "MS — Mato Grosso do Sul" },
  { value: "MG", label: "MG — Minas Gerais" },
  { value: "PA", label: "PA — Pará" },
  { value: "PB", label: "PB — Paraíba" },
  { value: "PR", label: "PR — Paraná" },
  { value: "PE", label: "PE — Pernambuco" },
  { value: "PI", label: "PI — Piauí" },
  { value: "RJ", label: "RJ — Rio de Janeiro" },
  { value: "RN", label: "RN — Rio Grande do Norte" },
  { value: "RS", label: "RS — Rio Grande do Sul" },
  { value: "RO", label: "RO — Rondônia" },
  { value: "RR", label: "RR — Roraima" },
  { value: "SC", label: "SC — Santa Catarina" },
  { value: "SP", label: "SP — São Paulo" },
  { value: "SE", label: "SE — Sergipe" },
  { value: "TO", label: "TO — Tocantins" },
] as const;

export const WORK_MODELS = [
  { value: "remoto", label: "Remoto" },
  { value: "hibrido", label: "Híbrido" },
  { value: "presencial", label: "Presencial" },
] as const;

export const LEVELS = [
  { value: "estagio", label: "Estágio" },
  { value: "trainee", label: "Trainee" },
  { value: "junior", label: "Júnior" },
  { value: "pleno", label: "Pleno" },
  { value: "senior", label: "Sênior" },
  { value: "especialista", label: "Especialista" },
  { value: "lideranca", label: "Liderança" },
] as const;

export const AVAILABILITY = [
  { value: "imediata", label: "Imediata" },
  { value: "15dias", label: "Em até 15 dias" },
  { value: "30dias", label: "Em até 30 dias" },
  { value: "mais30", label: "Acima de 30 dias" },
  { value: "combinar", label: "A combinar" },
] as const;

export const LANGUAGE_OPTIONS = [
  "Português",
  "Inglês",
  "Espanhol",
  "Francês",
  "Alemão",
  "Italiano",
  "Japonês",
  "Outro",
] as const;

export const LANGUAGE_LEVELS = [
  "Básico",
  "Intermediário",
  "Avançado",
  "Fluente",
  "Nativo",
] as const;

export const EDUCATION_TYPES = [
  "Ensino médio",
  "Curso técnico",
  "Graduação",
  "Tecnólogo",
  "Bacharelado",
  "Licenciatura",
  "Pós-graduação",
  "MBA",
  "Mestrado",
  "Doutorado",
  "Curso livre",
  "Outro",
] as const;

export const EDUCATION_STATUS = [
  "Em andamento",
  "Concluído",
  "Trancado",
  "Não concluído",
] as const;

export function labelOf(
  list: ReadonlyArray<{ value: string; label: string }>,
  value?: string,
): string {
  if (!value) return "";
  return list.find((i) => i.value === value)?.label ?? value;
}
