import type { Profile, Resume, Job, AnalysisRecord } from "@/types";

const KEYS = {
  profile: "tm_profile",
  resumes: "tm_resumes",
  jobs: "tm_jobs",
  analyses: "tm_analyses",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("tm_storage_change", { detail: key }));
}

export const emptyProfile: Profile = {
  name: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  linkedin: "",
  github: "",
  portfolio: "",
  website: "",
  summary: "",
  experiences: [],
  education: [],
  certifications: [],
  languages: [],
  hardSkills: [],
  softSkills: [],
  salaryExpectation: "",
  workModel: "",
  availability: "",
  level: "",
};

export const StorageService = {
  getProfile: () => read<Profile>(KEYS.profile, emptyProfile),
  saveProfile: (p: Profile) => write(KEYS.profile, p),

  getResumes: () => read<Resume[]>(KEYS.resumes, []),
  saveResumes: (r: Resume[]) => write(KEYS.resumes, r),
  getResume: (id: string) => read<Resume[]>(KEYS.resumes, []).find((x) => x.id === id),
  upsertResume: (resume: Resume) => {
    const list = read<Resume[]>(KEYS.resumes, []);
    const idx = list.findIndex((r) => r.id === resume.id);
    if (idx >= 0) list[idx] = resume;
    else list.unshift(resume);
    write(KEYS.resumes, list);
  },
  deleteResume: (id: string) => {
    const list = read<Resume[]>(KEYS.resumes, []).filter((r) => r.id !== id);
    write(KEYS.resumes, list);
  },

  getJobs: () => read<Job[]>(KEYS.jobs, []),
  saveJobs: (j: Job[]) => write(KEYS.jobs, j),
  getJob: (id: string) => read<Job[]>(KEYS.jobs, []).find((x) => x.id === id),
  upsertJob: (job: Job) => {
    const list = read<Job[]>(KEYS.jobs, []);
    const idx = list.findIndex((j) => j.id === job.id);
    if (idx >= 0) list[idx] = job;
    else list.unshift(job);
    write(KEYS.jobs, list);
  },
  deleteJob: (id: string) => {
    const list = read<Job[]>(KEYS.jobs, []).filter((j) => j.id !== id);
    write(KEYS.jobs, list);
  },

  getAnalyses: () => read<AnalysisRecord[]>(KEYS.analyses, []),
  addAnalysis: (a: AnalysisRecord) => {
    const list = read<AnalysisRecord[]>(KEYS.analyses, []);
    list.unshift(a);
    write(KEYS.analyses, list);
  },
};

export function useStorageKey() {
  // helper hook re-render trigger via event
  return KEYS;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
