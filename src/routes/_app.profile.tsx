import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/shared/Combobox";
import { CityCombobox, StateCombobox } from "@/components/shared/CityCombobox";
import { EmailInput } from "@/components/shared/EmailInput";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { AvailabilityPicker } from "@/components/shared/AvailabilityPicker";
import { MonthPicker } from "@/components/shared/MonthPicker";
import { SkillTagInput, SuggestedSkills } from "@/components/shared/SkillTagInput";
import { ProfileCompleteness } from "@/components/shared/ProfileCompleteness";
import { TagInput } from "@/components/shared/TagInput";
import { StorageService, uid } from "@/lib/storage";
import {
  EDUCATION_STATUS,
  EDUCATION_TYPES,
  LEVELS,
  WORK_MODELS,
} from "@/lib/br-data";
import { HARD_SKILLS, SOFT_SKILLS, skillsFromText } from "@/lib/skills-data";
import { isEndBeforeStart, parseBRL, profileCompleteness } from "@/lib/profile-utils";
import { isValidEmail, isValidName, isValidPhone, maskPhone, sanitizeName } from "@/lib/validation";
import type { Education, Experience, Profile } from "@/types";
import { Plus, Save, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Perfil profissional — TalentMatch AI" },
      { name: "description", content: "Preencha seus dados profissionais, skills e experiências com autocomplete e validação inteligente." },
      { property: "og:title", content: "Perfil profissional — TalentMatch AI" },
      { property: "og:description", content: "Gerencie suas informações profissionais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

type Touched = Record<string, boolean>;

function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(() => StorageService.getProfile());
  const [touched, setTouched] = useState<Touched>({});
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => StorageService.saveProfile(profile), 400);
    return () => clearTimeout(t);
  }, [profile]);

  // rola até o campo indicado no hash (#pf-...) vindo do bloqueio inteligente
  useEffect(() => {
    const anchor = window.location.hash.replace("#", "");
    if (!anchor) return;
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLElement).focus?.();
    }
  }, []);

  const update = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setProfile((p) => ({ ...p, [k]: v }));
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const setExp = (i: number, patch: Partial<Experience>) =>
    update("experiences", profile.experiences.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const setEdu = (i: number, patch: Partial<Education>) =>
    update("education", profile.education.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));

  /* ------------------------------ validações ------------------------------ */
  const err = {
    name: !profile.name.trim()
      ? "Informe seu nome completo."
      : !isValidName(profile.name)
        ? "Use apenas letras, espaços, acentos e hífen."
        : "",
    email: !profile.email.trim()
      ? "Informe seu email."
      : !isValidEmail(profile.email)
        ? "Informe um email válido."
        : "",
    phone: !profile.phone.trim()
      ? "Informe seu telefone."
      : !isValidPhone(profile.phone)
        ? "Informe um telefone válido: (11) 99999-9999."
        : "",
    city: !profile.city.trim() ? "Selecione sua cidade." : "",
    state: !profile.state.trim() ? "Selecione seu estado." : "",
    title: !profile.title?.trim() ? "Informe seu título profissional." : "",
    summary: !profile.summary.trim() ? "Informe seu resumo profissional." : "",
    salary: !profile.salaryExpectation.trim() ? "Informe sua pretensão salarial." : "",
    availability: !profile.availability.trim() ? "Selecione sua disponibilidade." : "",
    level: !profile.level.trim() ? "Selecione seu nível profissional." : "",
    hardSkills: profile.hardSkills.length === 0 ? "Adicione pelo menos uma competência." : "",
  };
  const show = (k: keyof typeof err) => (touched[k] ? err[k] : "");

  const completeness = profileCompleteness(profile);

  /* --------------------- sugestões de competências ------------------------ */
  const suggestedHard = useMemo(
    () =>
      skillsFromText(
        [
          profile.title ?? "",
          profile.summary,
          ...profile.experiences.flatMap((e) => [e.role, e.description]),
          ...profile.education.map((e) => e.course),
        ],
        HARD_SKILLS,
        profile.hardSkills,
      ),
    [profile.title, profile.summary, profile.experiences, profile.education, profile.hardSkills],
  );
  const suggestedSoft = useMemo(
    () =>
      skillsFromText(
        [profile.summary, ...profile.experiences.map((e) => e.description)],
        SOFT_SKILLS,
        profile.softSkills,
      ),
    [profile.summary, profile.experiences, profile.softSkills],
  );

  const focusAnchor = (anchor: string) => {
    const el = document.getElementById(anchor);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    (el as HTMLElement | null)?.focus?.();
  };

  const handleSave = () => {
    setTouched(Object.fromEntries(Object.keys(err).map((k) => [k, true])));
    StorageService.saveProfile(profile);
    if (completeness.missing.length) {
      toast.warning(`Perfil salvo. Faltam ${completeness.missing.length} informação(ões).`);
      focusAnchor(completeness.missing[0].anchor);
    } else {
      toast.success("Perfil salvo e completo!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Perfil profissional</h1>
          <p className="text-sm text-muted-foreground">
            Dados salvos automaticamente no seu dispositivo.
          </p>
        </div>
        <Button variant="outline" onClick={handleSave}>
          <Save className="mr-1 h-4 w-4" /> Salvar
        </Button>
      </div>

      <ProfileCompleteness profile={profile} onFocusField={focusAnchor} />

      {/* Dados pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nome completo *" error={show("name")} htmlFor="pf-name">
              <Input
                id="pf-name"
                value={profile.name}
                onChange={(e) => update("name", sanitizeName(e.target.value).slice(0, 80))}
                onBlur={() => touch("name")}
                aria-invalid={!!show("name")}
                placeholder="Fran Almeida"
              />
            </Field>
          </div>
          <Field label="Email *" error={show("email")} htmlFor="pf-email">
            <EmailInput
              id="pf-email"
              value={profile.email}
              invalid={!!show("email")}
              onChange={(v) => {
                update("email", v);
                touch("email");
              }}
            />
          </Field>
          <Field label="Telefone *" error={show("phone")} htmlFor="pf-phone">
            <Input
              id="pf-phone"
              inputMode="numeric"
              value={profile.phone}
              onChange={(e) => update("phone", maskPhone(e.target.value))}
              onBlur={() => touch("phone")}
              aria-invalid={!!show("phone")}
              placeholder="(13) 99999-9999"
            />
          </Field>
          <Field label="Cidade *" error={show("city")} htmlFor="pf-city">
            <CityCombobox
              id="pf-city"
              city={profile.city}
              state={profile.state}
              invalid={!!show("city")}
              onChange={({ city, state }) => {
                setProfile((p) => ({ ...p, city, state: state || p.state }));
                setTouched((t) => ({ ...t, city: true, state: true }));
              }}
            />
          </Field>
          <Field label="Estado *" error={show("state")} htmlFor="pf-state">
            <StateCombobox
              id="pf-state"
              value={profile.state}
              invalid={!!show("state")}
              onChange={(uf) => {
                setProfile((p) => ({ ...p, state: uf, city: p.state === uf ? p.city : "" }));
                touch("state");
              }}
            />
          </Field>
          <Field label="LinkedIn" htmlFor="pf-linkedin">
            <Input
              id="pf-linkedin"
              value={profile.linkedin}
              onChange={(e) => update("linkedin", e.target.value)}
              placeholder="linkedin.com/in/fran"
            />
          </Field>
          <Field label="GitHub" htmlFor="pf-github">
            <Input
              id="pf-github"
              value={profile.github}
              onChange={(e) => update("github", e.target.value)}
              placeholder="github.com/fran"
            />
          </Field>
          <Field label="Portfólio" htmlFor="pf-portfolio">
            <Input
              id="pf-portfolio"
              value={profile.portfolio}
              onChange={(e) => update("portfolio", e.target.value)}
            />
          </Field>
          <Field label="Website" htmlFor="pf-website">
            <Input
              id="pf-website"
              value={profile.website}
              onChange={(e) => update("website", e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Perfil profissional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil profissional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título profissional *" error={show("title")} htmlFor="pf-title">
              <Input
                id="pf-title"
                value={profile.title ?? ""}
                onChange={(e) => update("title", e.target.value.slice(0, 80))}
                onBlur={() => touch("title")}
                aria-invalid={!!show("title")}
                placeholder="Desenvolvedora Front-end"
              />
            </Field>
            <Field label="Nível profissional *" error={show("level")} htmlFor="pf-level">
              <Combobox
                id="pf-level"
                value={profile.level || undefined}
                invalid={!!show("level")}
                options={LEVELS.map((l) => ({ value: l.value, label: l.label }))}
                placeholder="Selecione o nível"
                onChange={(v) => {
                  update("level", v);
                  touch("level");
                }}
              />
            </Field>
            <Field label="Pretensão salarial *" error={show("salary")} htmlFor="pf-salary">
              <CurrencyInput
                id="pf-salary"
                value={profile.salaryExpectation}
                invalid={!!show("salary")}
                onChange={(formatted) => {
                  setProfile((p) => ({
                    ...p,
                    salaryExpectation: formatted,
                    salaryValue: parseBRL(formatted),
                  }));
                  touch("salary");
                }}
              />
            </Field>
            <Field label="Modelo de trabalho" htmlFor="pf-workmodel">
              <Select
                value={profile.workModel || undefined}
                onValueChange={(v) => update("workModel", v as Profile["workModel"])}
              >
                <SelectTrigger id="pf-workmodel">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_MODELS.map((w) => (
                    <SelectItem key={w.value} value={w.value}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Disponibilidade *" error={show("availability")}>
            <div id="pf-availability" tabIndex={-1} className="scroll-mt-24 outline-none">
              <AvailabilityPicker
                value={profile.availability}
                onChange={(v) => {
                  update("availability", v);
                  touch("availability");
                }}
              />
            </div>
          </Field>

          <Field label="Resumo profissional *" error={show("summary")} htmlFor="pf-summary">
            <Textarea
              id="pf-summary"
              rows={4}
              value={profile.summary}
              onChange={(e) => update("summary", e.target.value)}
              onBlur={() => touch("summary")}
              aria-invalid={!!show("summary")}
              placeholder="Fale brevemente sobre você, sua atuação, principais entregas e objetivos."
            />
          </Field>
        </CardContent>
      </Card>

      {/* Competências */}
      <Card id="pf-skills" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-base">Competências</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Hard skills *" error={show("hardSkills")} htmlFor="pf-hardskills">
            <SkillTagInput
              id="pf-hardskills"
              value={profile.hardSkills}
              catalog={[...HARD_SKILLS]}
              placeholder="Ex: React, TypeScript, AWS"
              onChange={(v) => {
                update("hardSkills", v);
                touch("hardSkills");
              }}
            />
          </Field>
          <SuggestedSkills
            suggestions={suggestedHard}
            onAdd={(s) => update("hardSkills", [...profile.hardSkills, s])}
          />

          <Field label="Soft skills" htmlFor="pf-softskills">
            <SkillTagInput
              id="pf-softskills"
              value={profile.softSkills}
              catalog={[...SOFT_SKILLS]}
              placeholder="Ex: Comunicação, Liderança"
              onChange={(v) => update("softSkills", v)}
            />
          </Field>
          <SuggestedSkills
            suggestions={suggestedSoft}
            onAdd={(s) => update("softSkills", [...profile.softSkills, s])}
            title="Soft skills sugeridas"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Idiomas">
              <TagInput
                value={profile.languages}
                onChange={(v) => update("languages", v)}
                placeholder="Ex: Inglês avançado"
              />
            </Field>
            <Field label="Certificações">
              <TagInput
                value={profile.certifications}
                onChange={(v) => update("certifications", v)}
                placeholder="Ex: AWS Solutions Architect"
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Experiências */}
      <Card id="pf-experience" className="scroll-mt-24">
        <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <CardTitle className="text-base">Experiência profissional</CardTitle>
          <Button
            size="sm"
            variant="outline"
            disabled={profile.hasNoExperience}
            onClick={() =>
              update("experiences", [
                ...profile.experiences,
                { id: uid(), company: "", role: "", startDate: "", endDate: "", current: false, description: "" },
              ])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!profile.hasNoExperience}
              onCheckedChange={(c) => update("hasNoExperience", !!c)}
            />
            Ainda não possuo experiência profissional
          </label>

          {!profile.hasNoExperience && (
            <>
              {profile.experiences.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma experiência cadastrada.</p>
              )}
              {profile.experiences.map((exp, i) => {
                const dateError = isEndBeforeStart(exp.startDate, exp.endDate)
                  ? "A data de término deve ser posterior à data de início."
                  : "";
                return (
                  <div key={exp.id} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                    <Field
                      label="Empresa *"
                      error={!exp.company.trim() ? "Informe a empresa." : ""}
                    >
                      <Input
                        value={exp.company}
                        onChange={(e) => setExp(i, { company: e.target.value })}
                      />
                    </Field>
                    <Field label="Cargo *" error={!exp.role.trim() ? "Informe o cargo." : ""}>
                      <Input value={exp.role} onChange={(e) => setExp(i, { role: e.target.value })} />
                    </Field>
                    <Field
                      label="Data de início *"
                      error={!exp.startDate ? "Selecione a data de início." : ""}
                    >
                      <MonthPicker
                        value={exp.startDate}
                        invalid={!exp.startDate}
                        onChange={(v) => setExp(i, { startDate: v })}
                      />
                    </Field>
                    <Field
                      label="Data de término"
                      error={
                        dateError ||
                        (!exp.current && !exp.endDate ? "Selecione a data de término." : "")
                      }
                    >
                      <MonthPicker
                        value={exp.current ? "" : exp.endDate}
                        min={exp.startDate}
                        disabled={!!exp.current}
                        invalid={!!dateError}
                        placeholder={exp.current ? "Atual" : "Selecione o mês"}
                        onChange={(v) => setExp(i, { endDate: v })}
                      />
                    </Field>
                    <label className="flex items-center gap-2 text-sm sm:col-span-2">
                      <Checkbox
                        checked={!!exp.current}
                        onCheckedChange={(c) =>
                          setExp(i, { current: !!c, endDate: c ? "" : exp.endDate })
                        }
                      />
                      Trabalho atualmente nesta empresa
                    </label>
                    <div className="sm:col-span-2">
                      <Field
                        label="Descrição *"
                        error={!exp.description.trim() ? "Descreva suas atividades." : ""}
                      >
                        <Textarea
                          rows={3}
                          value={exp.description}
                          onChange={(e) => setExp(i, { description: e.target.value })}
                          placeholder={"Principais atividades, tecnologias e resultados."}
                        />
                      </Field>
                    </div>
                    <div className="flex justify-end sm:col-span-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() =>
                          update("experiences", profile.experiences.filter((x) => x.id !== exp.id))
                        }
                      >
                        <Trash2 className="mr-1 h-4 w-4" /> Remover
                      </Button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </CardContent>
      </Card>

      {/* Formação */}
      <Card id="pf-education" className="scroll-mt-24">
        <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <CardTitle className="text-base">Formação acadêmica</CardTitle>
          <Button
            size="sm"
            variant="outline"
            disabled={profile.hasNoEducation}
            onClick={() =>
              update("education", [
                ...profile.education,
                { id: uid(), institution: "", course: "", type: "", status: "", startDate: "", endDate: "" },
              ])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!profile.hasNoEducation}
              onCheckedChange={(c) => update("hasNoEducation", !!c)}
            />
            Ainda não possuo formação acadêmica
          </label>

          {!profile.hasNoEducation && (
            <>
              {profile.education.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma formação cadastrada.</p>
              )}
              {profile.education.map((ed, i) => (
                <div key={ed.id} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                  <Field
                    label="Instituição *"
                    error={!ed.institution.trim() ? "Informe a instituição." : ""}
                  >
                    <Input
                      value={ed.institution}
                      onChange={(e) => setEdu(i, { institution: e.target.value })}
                    />
                  </Field>
                  <Field label="Curso *" error={!ed.course.trim() ? "Informe o curso." : ""}>
                    <Input value={ed.course} onChange={(e) => setEdu(i, { course: e.target.value })} />
                  </Field>
                  <Field label="Tipo de formação *" error={!ed.type ? "Selecione o tipo." : ""}>
                    <Combobox
                      value={ed.type || undefined}
                      options={EDUCATION_TYPES.map((t) => ({ value: t, label: t }))}
                      placeholder="Selecione"
                      onChange={(v) => setEdu(i, { type: v })}
                    />
                  </Field>
                  <Field label="Situação *" error={!ed.status ? "Selecione a situação." : ""}>
                    <Combobox
                      value={ed.status || undefined}
                      options={EDUCATION_STATUS.map((t) => ({ value: t, label: t }))}
                      placeholder="Selecione"
                      onChange={(v) => setEdu(i, { status: v })}
                    />
                  </Field>
                  <Field label="Início">
                    <MonthPicker
                      value={ed.startDate}
                      onChange={(v) => setEdu(i, { startDate: v })}
                    />
                  </Field>
                  <Field
                    label="Conclusão"
                    error={
                      isEndBeforeStart(ed.startDate, ed.endDate)
                        ? "A data de término deve ser posterior à data de início."
                        : ""
                    }
                  >
                    <MonthPicker
                      value={ed.endDate}
                      min={ed.startDate}
                      onChange={(v) => setEdu(i, { endDate: v })}
                    />
                  </Field>
                  <div className="flex justify-end sm:col-span-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() =>
                        update("education", profile.education.filter((x) => x.id !== ed.id))
                      }
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Remover
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
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
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
