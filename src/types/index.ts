export interface Profile {
  name: string;
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
  salaryExpectation: string;
  workModel: "presencial" | "hibrido" | "remoto" | "";
  availability: string;
  level: "estagio" | "junior" | "pleno" | "senior" | "especialista" | "";
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  course: string;
  startDate: string;
  endDate: string;
}

export interface Resume {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  summary: string;
  experiences: Experience[];
  education: Education[];
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
  favorite?: boolean;
  notes?: string;
  checklist?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
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
  score: MatchScore;
  gaps: GapAnalysis;
  suggestions: string[];
  optimizedResumeId?: string;
}
