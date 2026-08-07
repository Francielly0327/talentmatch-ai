import { uid } from "@/lib/storage";
import type { ParsedResume } from "@/lib/resume-parser";
import type { Profile, Resume } from "@/types";

function base(name: string): Resume {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    fullName: "",
    title: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    linkedin: "",
    github: "",
    website: "",
    portfolio: "",
    summary: "",
    experiences: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
    hardSkills: [],
    softSkills: [],
    keywords: [],
  };
}

export function emptyResume(name = "Novo currículo"): Resume {
  return base(name);
}

export function resumeFromParsed(p: ParsedResume, name?: string): Resume {
  const r = base(name || (p.fullName ? `Currículo de ${p.fullName}` : "Currículo importado"));
  return {
    ...r,
    fullName: p.fullName,
    title: p.professionalTitle,
    email: p.email,
    phone: p.phone,
    city: p.city,
    state: p.state,
    linkedin: p.linkedin,
    github: p.github,
    website: p.website,
    portfolio: p.portfolio,
    summary: p.professionalSummary,
    experiences: p.experiences,
    education: p.education,
    projects: p.projects,
    certifications: p.certifications,
    languages: p.languages,
    hardSkills: p.hardSkills,
    softSkills: p.softSkills,
  };
}

export function resumeFromProfile(profile: Profile, name?: string): Resume {
  const r = base(name || (profile.name ? `Currículo de ${profile.name}` : "Currículo do perfil"));
  return {
    ...r,
    fullName: profile.name,
    title: profile.title ?? "",
    email: profile.email,
    phone: profile.phone,
    city: profile.city,
    state: profile.state,
    linkedin: profile.linkedin,
    github: profile.github,
    website: profile.website,
    portfolio: profile.portfolio,
    summary: profile.summary,
    experiences: profile.experiences ?? [],
    education: profile.education ?? [],
    projects: profile.projects ?? [],
    certifications: profile.certifications ?? [],
    languages: profile.languages ?? [],
    hardSkills: profile.hardSkills ?? [],
    softSkills: profile.softSkills ?? [],
  };
}
