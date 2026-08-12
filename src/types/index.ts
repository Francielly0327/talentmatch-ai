export interface Profile {
  name: string;
  title?: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  linkedin: string;
  github: string;
  portfolio: string;
  website: string;
  summary: string;
  experiences: Experience[];
  education: Education[];
  certifications: string[];
  languages: string[];
  hardSkills: string[];
  softSkills: string[];
  projects?: ProjectItem[];
  salaryExpectation: string;
  /** Valor numérico da pretensão salarial em reais (para análises). */
  salaryValue?: number;
  workModel: "presencial" | "hibrido" | "remoto" | "";
  availability: string;
  level: string;
  /** Usuário declarou não possuir experiência profissional. */
  hasNoExperience?: boolean;
  /** Usuário declarou não possuir formação acadêmica. */
  hasNoEducation?: boolean;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  course: string;
  type?: string;
  status?: string;
  startDate: string;
  endDate: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  link?: string;
}

export interface Resume {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  /** Basic header information — always rendered at the top of the resume */
  fullName?: string;
  title?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  portfolio?: string;
  summary: string;
  experiences: Experience[];
  education: Education[];
  projects?: ProjectItem[];
  certifications?: string[];
  languages?: string[];
  hardSkills: string[];
  softSkills: string[];
  keywords: string[];
  optimizedFor?: string; // job id
  parentId?: string; // original resume id
}

export interface Job {
  id: string;
  createdAt: string;
  rawText: string;
  company: string;
  role: string;
  seniority: string;
  technologies: string[];
  hardSkills: string[];
  softSkills: string[];
  languages: string[];
  benefits: string[];
  salary: string;
  location: string;
  workType: string;
  keywords: string[];
  responsibilities: string[];
  requiredRequirements: string[];
  desiredRequirements: string[];
  /** Competências classificadas como obrigatórias na descrição da vaga. */
  requiredSkills?: string[];
  /** Competências classificadas como desejáveis / diferenciais. */
  desiredSkills?: string[];
  favorite?: boolean;
  notes?: string;
  checklist?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

/** Um critério objetivo do cálculo de compatibilidade. */
export interface MatchCriterion {
  key: string;
  label: string;
  /** Peso de referência (0-100). Só entra na conta se `applicable`. */
  weight: number;
  applicable: boolean;
  /** Nota do critério, 0-100. */
  score: number;
  detail: string;
  matched: string[];
  missing: string[];
}

/** Resultado determinístico do cálculo de match. */
export interface MatchResult {
  overall: number;
  criteria: MatchCriterion[];
  requiredSkills: string[];
  desiredSkills: string[];
  matchedSkills: string[];
  missingSkills: Array<{ skill: string; priority: "high" | "medium" | "low" }>;
  matchedKeywords: string[];
  missingKeywords: string[];
}

export interface MatchScore {
  overall: number;
  hardSkills: number;
  softSkills: number;
  experience: number;
  education: number;
  languages: number;
  keywords: number;
  seniority: number;
}

export interface GapAnalysis {
  matched: string[];
  missing: Array<{ skill: string; priority: "high" | "medium" | "low" }>;
}

export interface AnalysisRecord {
  id: string;
  jobId: string;
  resumeId: string;
  createdAt: string;
  score: MatchResult;
  gaps: GapAnalysis;
  suggestions: string[];
  optimizedResumeId?: string;
}

