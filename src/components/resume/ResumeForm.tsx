import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "@/components/shared/TagInput";
import { SkillTagInput } from "@/components/shared/SkillTagInput";
import { EmailInput } from "@/components/shared/EmailInput";
import { CityCombobox, StateCombobox } from "@/components/shared/CityCombobox";
import { MonthPicker } from "@/components/shared/MonthPicker";
import { isEndBeforeStart } from "@/lib/profile-utils";
import { HARD_SKILLS, SOFT_SKILLS } from "@/lib/skills-data";
import { uid } from "@/lib/storage";
import {
  BR_STATES,
  EDUCATION_STATUS,
  EDUCATION_TYPES,
  LANGUAGE_LEVELS,
  LANGUAGE_OPTIONS,
} from "@/lib/br-data";
import {
  isValidEmail,
  isValidPhone,
  isValidUrl,
  maskPhone,
  normalizeUrl,
  sanitizeCity,
  sanitizeName,
  toMonthInputValue,
} from "@/lib/validation";
import type { Education, Experience, ProjectItem, Resume } from "@/types";
import { useState } from "react";

type Patch = (patch: Partial<Resume>) => void;

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function Field({
  label,
  error,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SectionCard({
  id,
  title,
  description,
  children,
  action,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-24">
      <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function ItemToolbar({
  onUp,
  onDown,
  onRemove,
}: {
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button type="button" size="icon" variant="ghost" onClick={onUp} aria-label="Mover para cima">
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button type="button" size="icon" variant="ghost" onClick={onDown} aria-label="Mover para baixo">
        <ArrowDown className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={onRemove}
        aria-label="Remover"
        className="text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

/** Editor completo de currículo — usado em /resumes/new e /resumes/$id. */
export function ResumeForm({
  resume,
  onChange,
}: {
  resume: Resume;
  onChange: Patch;
}) {
  const [lang, setLang] = useState({ name: "", level: "" });

  const experiences = resume.experiences ?? [];
  const education = resume.education ?? [];
  const projects = resume.projects ?? [];
  const certifications = resume.certifications ?? [];
  const languages = resume.languages ?? [];

  const setExp = (i: number, patch: Partial<Experience>) =>
    onChange({ experiences: experiences.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) });
  const setEdu = (i: number, patch: Partial<Education>) =>
    onChange({ education: education.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) });
  const setProj = (i: number, patch: Partial<ProjectItem>) =>
    onChange({ projects: projects.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) });

  const nameError = !resume.fullName?.trim() ? "O nome completo é obrigatório" : "";
  const emailError = resume.email && !isValidEmail(resume.email) ? "Email inválido" : "";
  const phoneError = resume.phone && !isValidPhone(resume.phone) ? "Telefone inválido" : "";
  const urlError = (v?: string) => (v && !isValidUrl(v) ? "Link inválido" : "");

  return (
    <div className="space-y-5">
      {/* 1. Informações básicas */}
      <SectionCard
        id="basico"
        title="1. Informações básicas"
        description="Aparecem no topo do currículo final."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nome completo *" error={nameError} htmlFor="fullName">
              <Input
                id="fullName"
                value={resume.fullName ?? ""}
                onChange={(e) => onChange({ fullName: sanitizeName(e.target.value) })}
                placeholder="Maria Silva Souza"
                aria-invalid={!!nameError}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Título profissional" htmlFor="title">
              <Input
                id="title"
                value={resume.title ?? ""}
                onChange={(e) => onChange({ title: e.target.value.slice(0, 80) })}
                placeholder="Desenvolvedora Front-end Pleno"
              />
            </Field>
          </div>
          <Field label="Email" error={emailError} htmlFor="email">
            <EmailInput
              id="email"
              value={resume.email ?? ""}
              invalid={!!emailError}
              onChange={(v) => onChange({ email: v })}
            />
          </Field>
          <Field label="Telefone" error={phoneError} htmlFor="phone">
            <Input
              id="phone"
              inputMode="numeric"
              value={resume.phone ?? ""}
              onChange={(e) => onChange({ phone: maskPhone(e.target.value) })}
              placeholder="(11) 99999-9999"
              aria-invalid={!!phoneError}
            />
          </Field>
          <Field label="Cidade" htmlFor="city">
            <CityCombobox
              id="city"
              city={resume.city}
              state={resume.state}
              onChange={({ city, state }) =>
                onChange({ city, state: state || resume.state })
              }
            />
          </Field>
          <Field label="Estado">
            <StateCombobox
              value={resume.state || undefined}
              onChange={(uf) =>
                onChange({ state: uf, city: resume.state === uf ? resume.city : "" })
              }
            />
          </Field>

          <Field label="LinkedIn" error={urlError(resume.linkedin)} htmlFor="linkedin">
            <Input
              id="linkedin"
              value={resume.linkedin ?? ""}
              onChange={(e) => onChange({ linkedin: e.target.value })}
              onBlur={(e) => onChange({ linkedin: normalizeUrl(e.target.value, "linkedin") })}
              placeholder="linkedin.com/in/maria"
            />
          </Field>
          <Field label="GitHub" error={urlError(resume.github)} htmlFor="github">
            <Input
              id="github"
              value={resume.github ?? ""}
              onChange={(e) => onChange({ github: e.target.value })}
              onBlur={(e) => onChange({ github: normalizeUrl(e.target.value, "github") })}
              placeholder="github.com/maria"
            />
          </Field>
          <Field label="Website" error={urlError(resume.website)} htmlFor="website">
            <Input
              id="website"
              value={resume.website ?? ""}
              onChange={(e) => onChange({ website: e.target.value })}
              onBlur={(e) => onChange({ website: normalizeUrl(e.target.value) })}
              placeholder="mariasilva.dev"
            />
          </Field>
          <Field label="Portfólio" error={urlError(resume.portfolio)} htmlFor="portfolio">
            <Input
              id="portfolio"
              value={resume.portfolio ?? ""}
              onChange={(e) => onChange({ portfolio: e.target.value })}
              onBlur={(e) => onChange({ portfolio: normalizeUrl(e.target.value) })}
              placeholder="behance.net/maria"
            />
          </Field>
        </div>
      </SectionCard>

      {/* 2. Resumo */}
      <SectionCard
        id="resumo"
        title="2. Resumo profissional"
        description="3 a 5 linhas destacando sua experiência e resultados."
      >
        <Textarea
          value={resume.summary ?? ""}
          onChange={(e) => onChange({ summary: e.target.value })}
          rows={5}
          placeholder="Profissional com X anos de experiência em..."
        />
      </SectionCard>

      {/* 3. Experiência */}
      <SectionCard
        id="experiencia"
        title="3. Experiência profissional"
        action={
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                experiences: [
                  ...experiences,
                  { id: uid(), company: "", role: "", startDate: "", endDate: "", current: false, description: "" },
                ],
              })
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        }
      >
        {experiences.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma experiência adicionada ainda.</p>
        )}
        {experiences.map((exp, i) => (
          <div key={exp.id} className="space-y-3 rounded-lg border p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <p className="truncate text-sm font-medium">
                {exp.role || exp.company || `Experiência ${i + 1}`}
              </p>
              <ItemToolbar
                onUp={() => onChange({ experiences: move(experiences, i, i - 1) })}
                onDown={() => onChange({ experiences: move(experiences, i, i + 1) })}
                onRemove={() => onChange({ experiences: experiences.filter((_, x) => x !== i) })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Cargo">
                <Input value={exp.role} onChange={(e) => setExp(i, { role: e.target.value })} />
              </Field>
              <Field label="Empresa">
                <Input value={exp.company} onChange={(e) => setExp(i, { company: e.target.value })} />
              </Field>
              <Field label="Início">
                <Input
                  type="month"
                  value={toMonthInputValue(exp.startDate)}
                  onChange={(e) => setExp(i, { startDate: e.target.value })}
                />
              </Field>
              <Field label="Término">
                <Input
                  type="month"
                  disabled={exp.current}
                  value={toMonthInputValue(exp.endDate)}
                  onChange={(e) => setExp(i, { endDate: e.target.value })}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={!!exp.current}
                onCheckedChange={(c) => setExp(i, { current: !!c, endDate: c ? "" : exp.endDate })}
              />
              Trabalho aqui atualmente
            </label>
            <Field label="Atividades e resultados (uma por linha)">
              <Textarea
                rows={4}
                value={exp.description}
                onChange={(e) => setExp(i, { description: e.target.value })}
                placeholder={"Liderei a migração para React\nReduzi o tempo de carregamento em 40%"}
              />
            </Field>
          </div>
        ))}
      </SectionCard>

      {/* 4. Formação */}
      <SectionCard
        id="formacao"
        title="4. Formação acadêmica"
        action={
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                education: [
                  ...education,
                  { id: uid(), institution: "", course: "", type: "", status: "", startDate: "", endDate: "" },
                ],
              })
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        }
      >
        {education.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma formação adicionada ainda.</p>
        )}
        {education.map((ed, i) => (
          <div key={ed.id} className="space-y-3 rounded-lg border p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <p className="truncate text-sm font-medium">
                {ed.course || ed.institution || `Formação ${i + 1}`}
              </p>
              <ItemToolbar
                onUp={() => onChange({ education: move(education, i, i - 1) })}
                onDown={() => onChange({ education: move(education, i, i + 1) })}
                onRemove={() => onChange({ education: education.filter((_, x) => x !== i) })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Curso">
                <Input value={ed.course} onChange={(e) => setEdu(i, { course: e.target.value })} />
              </Field>
              <Field label="Instituição">
                <Input
                  value={ed.institution}
                  onChange={(e) => setEdu(i, { institution: e.target.value })}
                />
              </Field>
              <Field label="Tipo">
                <Select value={ed.type || undefined} onValueChange={(v) => setEdu(i, { type: v })}>
                  <SelectTrigger aria-label="Tipo de formação">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Situação">
                <Select value={ed.status || undefined} onValueChange={(v) => setEdu(i, { status: v })}>
                  <SelectTrigger aria-label="Situação">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_STATUS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Início">
                <Input
                  type="month"
                  value={toMonthInputValue(ed.startDate)}
                  onChange={(e) => setEdu(i, { startDate: e.target.value })}
                />
              </Field>
              <Field label="Conclusão">
                <Input
                  type="month"
                  value={toMonthInputValue(ed.endDate)}
                  onChange={(e) => setEdu(i, { endDate: e.target.value })}
                />
              </Field>
            </div>
          </div>
        ))}
      </SectionCard>

      {/* 5. Projetos */}
      <SectionCard
        id="projetos"
        title="5. Projetos"
        action={
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({ projects: [...projects, { id: uid(), name: "", description: "", link: "" }] })
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        }
      >
        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum projeto adicionado ainda.</p>
        )}
        {projects.map((p, i) => (
          <div key={p.id} className="space-y-3 rounded-lg border p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <p className="truncate text-sm font-medium">{p.name || `Projeto ${i + 1}`}</p>
              <ItemToolbar
                onUp={() => onChange({ projects: move(projects, i, i - 1) })}
                onDown={() => onChange({ projects: move(projects, i, i + 1) })}
                onRemove={() => onChange({ projects: projects.filter((_, x) => x !== i) })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome">
                <Input value={p.name} onChange={(e) => setProj(i, { name: e.target.value })} />
              </Field>
              <Field label="Link" error={urlError(p.link)}>
                <Input
                  value={p.link ?? ""}
                  onChange={(e) => setProj(i, { link: e.target.value })}
                  onBlur={(e) => setProj(i, { link: normalizeUrl(e.target.value) })}
                />
              </Field>
            </div>
            <Field label="Descrição">
              <Textarea
                rows={3}
                value={p.description}
                onChange={(e) => setProj(i, { description: e.target.value })}
              />
            </Field>
          </div>
        ))}
      </SectionCard>

      {/* 6. Certificações */}
      <SectionCard id="certificacoes" title="6. Certificações">
        <TagInput
          value={certifications}
          onChange={(v) => onChange({ certifications: v })}
          placeholder="Ex.: AWS Cloud Practitioner — pressione Enter"
        />
      </SectionCard>

      {/* 7. Competências */}
      <SectionCard id="competencias" title="7. Competências">
        <Field label="Competências técnicas">
          <TagInput
            value={resume.hardSkills ?? []}
            onChange={(v) => onChange({ hardSkills: v })}
            placeholder="Ex.: React — pressione Enter"
          />
        </Field>
        <Field label="Competências comportamentais">
          <TagInput
            value={resume.softSkills ?? []}
            onChange={(v) => onChange({ softSkills: v })}
            placeholder="Ex.: Comunicação — pressione Enter"
          />
        </Field>
      </SectionCard>

      {/* 8. Idiomas */}
      <SectionCard id="idiomas" title="8. Idiomas">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Idioma">
            <Select value={lang.name || undefined} onValueChange={(v) => setLang((l) => ({ ...l, name: v }))}>
              <SelectTrigger aria-label="Idioma">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Nível">
            <Select value={lang.level || undefined} onValueChange={(v) => setLang((l) => ({ ...l, level: v }))}>
              <SelectTrigger aria-label="Nível do idioma">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Button
            type="button"
            variant="outline"
            disabled={!lang.name || !lang.level}
            onClick={() => {
              const entry = `${lang.name} — ${lang.level}`;
              if (!languages.includes(entry)) onChange({ languages: [...languages, entry] });
              setLang({ name: "", level: "" });
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        </div>
        {languages.length > 0 && (
          <ul className="space-y-2">
            {languages.map((l, i) => (
              <li key={l} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-3 py-2">
                <span className="truncate text-sm">{l}</span>
                <ItemToolbar
                  onUp={() => onChange({ languages: move(languages, i, i - 1) })}
                  onDown={() => onChange({ languages: move(languages, i, i + 1) })}
                  onRemove={() => onChange({ languages: languages.filter((_, x) => x !== i) })}
                />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
