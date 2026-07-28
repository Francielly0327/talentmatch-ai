import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "@/components/shared/TagInput";
import { StorageService, uid } from "@/lib/storage";
import type { Profile } from "@/types";
import { Plus, Save, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Perfil profissional — TalentMatch AI" },
      { name: "description", content: "Preencha seus dados profissionais, skills e experiências." },
      { property: "og:title", content: "Perfil profissional — TalentMatch AI" },
      { property: "og:description", content: "Gerencie suas informações profissionais." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(() => StorageService.getProfile());

  useEffect(() => {
    const t = setTimeout(() => StorageService.saveProfile(profile), 400);
    return () => clearTimeout(t);
  }, [profile]);

  const update = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setProfile((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Perfil profissional</h1>
          <p className="text-sm text-muted-foreground">
            Dados salvos automaticamente no seu dispositivo.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            StorageService.saveProfile(profile);
            toast.success("Perfil salvo");
          }}
        >
          <Save className="mr-1 h-4 w-4" /> Salvar
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Informações básicas</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome"><Input value={profile.name} onChange={(e) => update("name", e.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={profile.email} onChange={(e) => update("email", e.target.value)} /></Field>
          <Field label="Telefone"><Input value={profile.phone} onChange={(e) => update("phone", e.target.value)} /></Field>
          <Field label="Cidade"><Input value={profile.city} onChange={(e) => update("city", e.target.value)} /></Field>
          <Field label="Estado"><Input value={profile.state} onChange={(e) => update("state", e.target.value)} /></Field>
          <Field label="LinkedIn"><Input value={profile.linkedin} onChange={(e) => update("linkedin", e.target.value)} /></Field>
          <Field label="GitHub"><Input value={profile.github} onChange={(e) => update("github", e.target.value)} /></Field>
          <Field label="Portfólio"><Input value={profile.portfolio} onChange={(e) => update("portfolio", e.target.value)} /></Field>
          <Field label="Website"><Input value={profile.website} onChange={(e) => update("website", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Resumo profissional</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={profile.summary}
            onChange={(e) => update("summary", e.target.value)}
            placeholder="Fale brevemente sobre você, sua atuação, principais entregas e objetivos."
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Preferências</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Pretensão salarial">
              <Input value={profile.salaryExpectation} onChange={(e) => update("salaryExpectation", e.target.value)} placeholder="R$ 10.000" />
            </Field>
            <Field label="Modelo de trabalho">
              <Select value={profile.workModel || undefined} onValueChange={(v) => update("workModel", v as Profile["workModel"])}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                  <SelectItem value="remoto">Remoto</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Disponibilidade">
              <Input value={profile.availability} onChange={(e) => update("availability", e.target.value)} placeholder="Imediata" />
            </Field>
            <Field label="Nível">
              <Select value={profile.level || undefined} onValueChange={(v) => update("level", v as Profile["level"])}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="estagio">Estágio</SelectItem>
                  <SelectItem value="junior">Júnior</SelectItem>
                  <SelectItem value="pleno">Pleno</SelectItem>
                  <SelectItem value="senior">Sênior</SelectItem>
                  <SelectItem value="especialista">Especialista</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Competências</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Hard skills">
              <TagInput value={profile.hardSkills} onChange={(v) => update("hardSkills", v)} placeholder="Ex: React, TypeScript, AWS" />
            </Field>
            <Field label="Soft skills">
              <TagInput value={profile.softSkills} onChange={(v) => update("softSkills", v)} placeholder="Ex: Comunicação, Liderança" />
            </Field>
            <Field label="Idiomas">
              <TagInput value={profile.languages} onChange={(v) => update("languages", v)} placeholder="Ex: Inglês avançado" />
            </Field>
            <Field label="Certificações">
              <TagInput value={profile.certifications} onChange={(v) => update("certifications", v)} placeholder="Ex: AWS Solutions Architect" />
            </Field>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Experiências</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              update("experiences", [
                ...profile.experiences,
                { id: uid(), company: "", role: "", startDate: "", endDate: "", description: "" },
              ])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.experiences.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma experiência cadastrada.</p>
          )}
          {profile.experiences.map((exp, i) => (
            <div key={exp.id} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
              <Field label="Empresa">
                <Input value={exp.company} onChange={(e) => {
                  const arr = [...profile.experiences]; arr[i] = { ...exp, company: e.target.value }; update("experiences", arr);
                }} />
              </Field>
              <Field label="Cargo">
                <Input value={exp.role} onChange={(e) => {
                  const arr = [...profile.experiences]; arr[i] = { ...exp, role: e.target.value }; update("experiences", arr);
                }} />
              </Field>
              <Field label="Início">
                <Input value={exp.startDate} placeholder="MM/AAAA" onChange={(e) => {
                  const arr = [...profile.experiences]; arr[i] = { ...exp, startDate: e.target.value }; update("experiences", arr);
                }} />
              </Field>
              <Field label="Fim">
                <Input value={exp.endDate} placeholder="MM/AAAA ou Atual" onChange={(e) => {
                  const arr = [...profile.experiences]; arr[i] = { ...exp, endDate: e.target.value }; update("experiences", arr);
                }} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Descrição">
                  <Textarea rows={3} value={exp.description} onChange={(e) => {
                    const arr = [...profile.experiences]; arr[i] = { ...exp, description: e.target.value }; update("experiences", arr);
                  }} />
                </Field>
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => update("experiences", profile.experiences.filter((x) => x.id !== exp.id))}>
                  <Trash2 className="mr-1 h-4 w-4" /> Remover
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Formação</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              update("education", [
                ...profile.education,
                { id: uid(), institution: "", course: "", startDate: "", endDate: "" },
              ])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.education.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma formação cadastrada.</p>
          )}
          {profile.education.map((ed, i) => (
            <div key={ed.id} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
              <Field label="Instituição">
                <Input value={ed.institution} onChange={(e) => {
                  const arr = [...profile.education]; arr[i] = { ...ed, institution: e.target.value }; update("education", arr);
                }} />
              </Field>
              <Field label="Curso">
                <Input value={ed.course} onChange={(e) => {
                  const arr = [...profile.education]; arr[i] = { ...ed, course: e.target.value }; update("education", arr);
                }} />
              </Field>
              <Field label="Início">
                <Input value={ed.startDate} onChange={(e) => {
                  const arr = [...profile.education]; arr[i] = { ...ed, startDate: e.target.value }; update("education", arr);
                }} />
              </Field>
              <Field label="Fim">
                <Input value={ed.endDate} onChange={(e) => {
                  const arr = [...profile.education]; arr[i] = { ...ed, endDate: e.target.value }; update("education", arr);
                }} />
              </Field>
              <div className="sm:col-span-2 flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => update("education", profile.education.filter((x) => x.id !== ed.id))}>
                  <Trash2 className="mr-1 h-4 w-4" /> Remover
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
