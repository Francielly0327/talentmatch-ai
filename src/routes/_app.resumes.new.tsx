import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Info,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TagInput } from "@/components/shared/TagInput";
import { cn } from "@/lib/utils";
import { StorageService, uid } from "@/lib/storage";
import { ResumeParserService, type ParsedResumeSummary } from "@/lib/resume-parser";
import { useProfile } from "@/hooks/use-storage";
import type { Profile, Resume, Experience, Education } from "@/types";

export const Route = createFileRoute("/_app/resumes/new")({
  head: () => ({
    meta: [
      { title: "Novo currículo — TalentMatch AI" },
      { name: "description", content: "Crie um currículo ATS: importe um PDF, use seu perfil ou comece do zero." },
      { property: "og:title", content: "Novo currículo — TalentMatch AI" },
      { property: "og:description", content: "Assistente para criar currículos otimizados para ATS." },
    ],
  }),
  component: NewResumePage,
});

interface DraftResume {
  name: string;
  title: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  linkedin: string;
  github: string;
  website: string;
  portfolio: string;
  summary: string;
  experiences: Experience[];
  education: Education[];
  certifications: string[];
  hardSkills: string[];
  softSkills: string[];
  languages: string[];
  salaryExpectation: string;
  workModel: string;
  availability: string;
  level: string;
}

const emptyDraft: DraftResume = {
  name: "",
  title: "",
  fullName: "",
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
  certifications: [],
  hardSkills: [],
  softSkills: [],
  languages: [],
  salaryExpectation: "",
  workModel: "",
  availability: "",
  level: "",
};

function fromProfile(p: Profile, name = "Currículo geral"): DraftResume {
  return {
    ...emptyDraft,
    name,
    fullName: p.name,
    email: p.email,
    phone: p.phone,
    city: p.city,
    state: p.state,
    linkedin: p.linkedin,
    github: p.github,
    website: p.website,
    portfolio: p.portfolio,
    summary: p.summary,
    experiences: p.experiences,
    education: p.education,
    certifications: p.certifications,
    hardSkills: p.hardSkills,
    softSkills: p.softSkills,
    languages: p.languages,
    salaryExpectation: p.salaryExpectation,
    workModel: p.workModel,
    availability: p.availability,
    level: p.level,
  };
}

const DRAFT_KEY = "tm_new_resume_draft";

function NewResumePage() {
  const [profile] = useProfile();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"choose" | "wizard">("choose");
  const [draft, setDraft] = useState<DraftResume>(emptyDraft);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ParsedResumeSummary | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof DraftResume>(k: K, v: DraftResume[K]) => {
    setDraft((d) => {
      const next = { ...d, [k]: v };
      if (typeof window !== "undefined") localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      return next;
    });
  };

  const startBlank = () => {
    setDraft({ ...emptyDraft, name: "Currículo geral" });
    setMode("wizard");
  };

  const startFromProfile = () => {
    setDraft(fromProfile(profile, "Currículo baseado no perfil"));
    setMode("wizard");
    toast.success("Dados do perfil carregados");
  };

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Envie um arquivo PDF.");
      return;
    }
    try {
      setImporting(true);
      toast.loading("Analisando seu currículo…", { id: "parse" });
      const result = await ResumeParserService.parsePdf(file);
      const merged: DraftResume = {
        ...emptyDraft,
        name: "Currículo importado",
        fullName: result.profile.name || "",
        email: result.profile.email || "",
        phone: result.profile.phone || "",
        linkedin: result.profile.linkedin || "",
        github: result.profile.github || "",
        website: result.profile.website || "",
        summary: result.profile.summary || "",
        experiences: result.profile.experiences || [],
        education: result.profile.education || [],
        certifications: result.profile.certifications || [],
        hardSkills: result.profile.hardSkills || [],
        softSkills: result.profile.softSkills || [],
        languages: result.profile.languages || [],
      };
      setDraft(merged);
      setImportSummary(result.summary);
      toast.success("Currículo importado com sucesso", { id: "parse" });
      setMode("wizard");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível ler o PDF. Tente outro arquivo.", { id: "parse" });
    } finally {
      setImporting(false);
    }
  };

  const saveResume = (asDraft = false) => {
    if (!draft.name.trim()) {
      toast.error("Dê um nome ao currículo antes de salvar.");
      return;
    }
    const resume: Resume = {
      id: uid(),
      name: draft.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      summary: draft.summary,
      experiences: draft.experiences,
      education: draft.education,
      hardSkills: draft.hardSkills,
      softSkills: draft.softSkills,
      keywords: [],
    };
    StorageService.upsertResume(resume);
    if (typeof window !== "undefined") localStorage.removeItem(DRAFT_KEY);
    toast.success(asDraft ? "Rascunho salvo" : "Currículo salvo");
    navigate({ to: "/resumes/$id", params: { id: resume.id } });
  };

  if (mode === "choose") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button asChild size="icon" variant="ghost">
            <Link to="/resumes" aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Novo currículo</h1>
            <p className="text-sm text-muted-foreground">Como você deseja começar?</p>
          </div>
        </div>

        <Alert className="border-primary/30 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle>Armazenamento local</AlertTitle>
          <AlertDescription>
            Seus currículos ficam salvos apenas neste navegador. Faça exportações regulares para
            não perder seus dados.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 lg:grid-cols-3">
          <button
            type="button"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
            className="group relative overflow-hidden rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/10 via-card to-accent/20 p-6 text-left shadow-sm transition-all hover:shadow-md disabled:opacity-70"
          >
            <Badge className="absolute right-4 top-4">Recomendado</Badge>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
              {importing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            </div>
            <h2 className="mt-4 text-lg font-semibold">Importar currículo em PDF</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A IA extrai suas experiências, formação, competências e contatos automaticamente.
            </p>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
              {importing ? "Analisando…" : "Escolher arquivo"} <ArrowRight className="ml-1 h-3 w-3" />
            </div>
          </button>

          <button
            type="button"
            onClick={startFromProfile}
            className="rounded-2xl border bg-card p-6 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Usar informações do meu perfil</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Preenche automaticamente os campos disponíveis a partir do seu perfil já cadastrado.
            </p>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
              Usar perfil <ArrowRight className="ml-1 h-3 w-3" />
            </div>
          </button>

          <button
            type="button"
            onClick={startBlank}
            className="rounded-2xl border bg-card p-6 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <Plus className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Criar currículo do zero</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Comece com um formulário em branco e preencha cada seção manualmente.
            </p>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
              Começar do zero <ArrowRight className="ml-1 h-3 w-3" />
            </div>
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    );
  }

  return (
    <Wizard
      draft={draft}
      update={update}
      onSave={saveResume}
      onCancel={() => {
        if (confirm("Descartar este currículo?")) {
          if (typeof window !== "undefined") localStorage.removeItem(DRAFT_KEY);
          navigate({ to: "/resumes" });
        }
      }}
      importSummary={importSummary}
    />
  );
}

function Wizard({
  draft,
  update,
  onSave,
  onCancel,
  importSummary,
}: {
  draft: DraftResume;
  update: <K extends keyof DraftResume>(k: K, v: DraftResume[K]) => void;
  onSave: (asDraft?: boolean) => void;
  onCancel: () => void;
  importSummary: ParsedResumeSummary | null;
}) {
  const [tab, setTab] = useState("basics");

  const tabs = [
    { id: "basics", label: "Informações" },
    { id: "summary", label: "Resumo" },
    { id: "experience", label: "Experiências" },
    { id: "education", label: "Formação" },
    { id: "certs", label: "Certificações" },
    { id: "skills", label: "Competências" },
    { id: "languages", label: "Idiomas" },
    { id: "prefs", label: "Preferências" },
  ];

  const completion = useMemo(() => {
    let filled = 0;
    const total = 8;
    if (draft.fullName) filled++;
    if (draft.email || draft.phone) filled++;
    if (draft.summary) filled++;
    if (draft.experiences.length) filled++;
    if (draft.education.length) filled++;
    if (draft.hardSkills.length) filled++;
    if (draft.languages.length) filled++;
    if (draft.workModel || draft.level) filled++;
    return Math.round((filled / total) * 100);
  }, [draft]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={onCancel} aria-label="Voltar">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Novo currículo</h1>
            <p className="text-sm text-muted-foreground">
              Preencha as seções abaixo. Um preview ATS aparece ao lado em tempo real.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/95 p-3 shadow-sm backdrop-blur">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <Input
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Nome do currículo (ex: Currículo Frontend) *"
              className="h-9 border-0 bg-transparent p-0 text-sm font-semibold shadow-none focus-visible:ring-0"
            />
            <div className="mt-1 flex items-center gap-2">
              <Progress value={completion} className="h-1.5 max-w-[180px]" />
              <span className="text-[10px] text-muted-foreground">{completion}% preenchido</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button variant="outline" onClick={() => onSave(true)}>
            <Save className="mr-1 h-4 w-4" /> Salvar rascunho
          </Button>
          <Button onClick={() => onSave(false)}>
            <Check className="mr-1 h-4 w-4" /> Salvar currículo
          </Button>
        </div>
      </div>

      {importSummary && (
        <Alert className="border-primary/30 bg-primary/5">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertTitle>Importação concluída</AlertTitle>
          <AlertDescription>
            <span className="mr-3">✔ {importSummary.experiencesFound} experiências</span>
            <span className="mr-3">✔ {importSummary.educationFound} formações</span>
            <span className="mr-3">✔ {importSummary.skillsFound} competências</span>
            <span className="mr-3">✔ {importSummary.languagesFound} idiomas</span>
            <span className="mr-3">✔ {importSummary.certificationsFound} certificações</span>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <Tabs value={tab} onValueChange={setTab}>
            <div className="overflow-x-auto">
              <TabsList className="w-max">
                {tabs.map((t) => (
                  <TabsTrigger key={t.id} value={t.id}>
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="basics" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Informações básicas</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome completo"><Input value={draft.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Como aparece no seu documento" /></Field>
                  <Field label="Título profissional"><Input value={draft.title} onChange={(e) => update("title", e.target.value)} placeholder="Ex: Desenvolvedor Frontend Pleno" /></Field>
                  <Field label="Email"><Input type="email" value={draft.email} onChange={(e) => update("email", e.target.value)} placeholder="voce@email.com" /></Field>
                  <Field label="Telefone"><Input value={draft.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(11) 99999-9999" /></Field>
                  <Field label="Cidade"><Input value={draft.city} onChange={(e) => update("city", e.target.value)} placeholder="São Paulo" /></Field>
                  <Field label="Estado"><Input value={draft.state} onChange={(e) => update("state", e.target.value)} placeholder="SP" /></Field>
                  <Field label="LinkedIn"><Input value={draft.linkedin} onChange={(e) => update("linkedin", e.target.value)} placeholder="https://linkedin.com/in/…" /></Field>
                  <Field label="GitHub"><Input value={draft.github} onChange={(e) => update("github", e.target.value)} placeholder="https://github.com/…" /></Field>
                  <Field label="Website"><Input value={draft.website} onChange={(e) => update("website", e.target.value)} placeholder="https://…" /></Field>
                  <Field label="Portfólio"><Input value={draft.portfolio} onChange={(e) => update("portfolio", e.target.value)} placeholder="https://…" /></Field>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumo profissional</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Um parágrafo curto (2–4 linhas) sobre quem você é e no que entrega valor.
                  </p>
                </CardHeader>
                <CardContent>
                  <Textarea
                    rows={8}
                    value={draft.summary}
                    onChange={(e) => update("summary", e.target.value)}
                    placeholder="Ex: Desenvolvedor Frontend Pleno com 5 anos de experiência em aplicações React e TypeScript de alta escala…"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="experience" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Experiências</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      update("experiences", [
                        ...draft.experiences,
                        { id: uid(), company: "", role: "", startDate: "", endDate: "", description: "" },
                      ])
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" /> Adicionar experiência
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {draft.experiences.length === 0 && (
                    <EmptyState label="Nenhuma experiência adicionada ainda." />
                  )}
                  {draft.experiences.map((exp, i) => (
                    <div key={exp.id} className="grid gap-2 rounded-lg border p-4 sm:grid-cols-2">
                      <Input placeholder="Empresa" value={exp.company} onChange={(e) => {
                        const arr = [...draft.experiences]; arr[i] = { ...exp, company: e.target.value }; update("experiences", arr);
                      }} />
                      <Input placeholder="Cargo" value={exp.role} onChange={(e) => {
                        const arr = [...draft.experiences]; arr[i] = { ...exp, role: e.target.value }; update("experiences", arr);
                      }} />
                      <Input placeholder="Início (ex: 03/2022)" value={exp.startDate} onChange={(e) => {
                        const arr = [...draft.experiences]; arr[i] = { ...exp, startDate: e.target.value }; update("experiences", arr);
                      }} />
                      <Input placeholder="Fim (ou 'atual')" value={exp.endDate} onChange={(e) => {
                        const arr = [...draft.experiences]; arr[i] = { ...exp, endDate: e.target.value }; update("experiences", arr);
                      }} />
                      <div className="sm:col-span-2">
                        <Textarea
                          rows={4}
                          placeholder="Descrição e principais resultados (use números sempre que possível)"
                          value={exp.description}
                          onChange={(e) => {
                            const arr = [...draft.experiences]; arr[i] = { ...exp, description: e.target.value }; update("experiences", arr);
                          }}
                        />
                      </div>
                      <div className="sm:col-span-2 flex justify-end">
                        <Button size="sm" variant="ghost" onClick={() => update("experiences", draft.experiences.filter((x) => x.id !== exp.id))}>
                          <Trash2 className="mr-1 h-4 w-4" /> Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="education" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Formação</CardTitle>
                  <Button size="sm" variant="outline" onClick={() =>
                    update("education", [...draft.education, { id: uid(), institution: "", course: "", startDate: "", endDate: "" }])
                  }>
                    <Plus className="mr-1 h-4 w-4" /> Adicionar formação
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {draft.education.length === 0 && <EmptyState label="Nenhuma formação adicionada." />}
                  {draft.education.map((ed, i) => (
                    <div key={ed.id} className="grid gap-2 rounded-lg border p-4 sm:grid-cols-2">
                      <Input placeholder="Instituição" value={ed.institution} onChange={(e) => {
                        const arr = [...draft.education]; arr[i] = { ...ed, institution: e.target.value }; update("education", arr);
                      }} />
                      <Input placeholder="Curso" value={ed.course} onChange={(e) => {
                        const arr = [...draft.education]; arr[i] = { ...ed, course: e.target.value }; update("education", arr);
                      }} />
                      <Input placeholder="Início" value={ed.startDate} onChange={(e) => {
                        const arr = [...draft.education]; arr[i] = { ...ed, startDate: e.target.value }; update("education", arr);
                      }} />
                      <Input placeholder="Fim (ou previsão)" value={ed.endDate} onChange={(e) => {
                        const arr = [...draft.education]; arr[i] = { ...ed, endDate: e.target.value }; update("education", arr);
                      }} />
                      <div className="sm:col-span-2 flex justify-end">
                        <Button size="sm" variant="ghost" onClick={() => update("education", draft.education.filter((x) => x.id !== ed.id))}>
                          <Trash2 className="mr-1 h-4 w-4" /> Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="certs" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Certificações</CardTitle>
                  <p className="text-sm text-muted-foreground">Adicione uma por linha ou como tags.</p>
                </CardHeader>
                <CardContent>
                  <TagInput value={draft.certifications} onChange={(v) => update("certifications", v)} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Competências</CardTitle></CardHeader>
                <CardContent className="grid gap-4">
                  <Field label="Hard skills"><TagInput value={draft.hardSkills} onChange={(v) => update("hardSkills", v)} /></Field>
                  <Field label="Soft skills"><TagInput value={draft.softSkills} onChange={(v) => update("softSkills", v)} /></Field>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="languages" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Idiomas</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Ex: <em>Inglês — Avançado</em>, <em>Espanhol — Intermediário</em>.
                  </p>
                </CardHeader>
                <CardContent>
                  <TagInput value={draft.languages} onChange={(v) => update("languages", v)} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prefs" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Preferências</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <Field label="Pretensão salarial">
                    <Input value={draft.salaryExpectation} onChange={(e) => update("salaryExpectation", e.target.value)} placeholder="Ex: R$ 10.000" />
                  </Field>
                  <Field label="Disponibilidade">
                    <Input value={draft.availability} onChange={(e) => update("availability", e.target.value)} placeholder="Ex: Imediata" />
                  </Field>
                  <Field label="Modelo de trabalho">
                    <Select value={draft.workModel} onValueChange={(v) => update("workModel", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remoto">Remoto</SelectItem>
                        <SelectItem value="hibrido">Híbrido</SelectItem>
                        <SelectItem value="presencial">Presencial</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Nível profissional">
                    <Select value={draft.level} onValueChange={(v) => update("level", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
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
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Live preview */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Preview ATS
          </div>
          <ResumePreview draft={draft} />
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function ResumePreview({ draft }: { draft: DraftResume }) {
  return (
    <div className="rounded-2xl border bg-white p-6 text-sm text-neutral-800 shadow-sm">
      <header className="border-b pb-3">
        <div className="text-xl font-bold text-neutral-900">
          {draft.fullName || "Seu nome aqui"}
        </div>
        {draft.title && <div className="text-sm text-neutral-600">{draft.title}</div>}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-500">
          {draft.email && <span>{draft.email}</span>}
          {draft.phone && <span>· {draft.phone}</span>}
          {(draft.city || draft.state) && <span>· {[draft.city, draft.state].filter(Boolean).join(", ")}</span>}
          {draft.linkedin && <span>· LinkedIn</span>}
          {draft.github && <span>· GitHub</span>}
        </div>
      </header>

      {draft.summary && (
        <Section title="Resumo">
          <p className="text-[12px] leading-snug text-neutral-700">{draft.summary}</p>
        </Section>
      )}

      {draft.experiences.length > 0 && (
        <Section title="Experiência">
          {draft.experiences.map((e) => (
            <div key={e.id} className="mb-2">
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-[12px] font-semibold text-neutral-900">
                  {e.role || "Cargo"} {e.company && <span className="font-normal text-neutral-600">· {e.company}</span>}
                </div>
                <div className="text-[10px] text-neutral-500">{[e.startDate, e.endDate].filter(Boolean).join(" — ")}</div>
              </div>
              {e.description && <p className="mt-1 text-[11px] leading-snug text-neutral-700">{e.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {draft.education.length > 0 && (
        <Section title="Formação">
          {draft.education.map((e) => (
            <div key={e.id} className="mb-1 flex items-baseline justify-between gap-2">
              <div className="text-[12px] text-neutral-800">
                <span className="font-semibold">{e.course || "Curso"}</span>
                {e.institution && <span className="text-neutral-600"> · {e.institution}</span>}
              </div>
              <div className="text-[10px] text-neutral-500">{[e.startDate, e.endDate].filter(Boolean).join(" — ")}</div>
            </div>
          ))}
        </Section>
      )}

      {draft.hardSkills.length + draft.softSkills.length > 0 && (
        <Section title="Competências">
          <div className="flex flex-wrap gap-1">
            {[...draft.hardSkills, ...draft.softSkills].slice(0, 30).map((s) => (
              <span key={s} className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px]",
                draft.hardSkills.includes(s) ? "border-blue-200 bg-blue-50 text-blue-800" : "border-amber-200 bg-amber-50 text-amber-800",
              )}>
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {draft.certifications.length > 0 && (
        <Section title="Certificações">
          <ul className="list-inside list-disc text-[11px] text-neutral-700">
            {draft.certifications.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </Section>
      )}

      {draft.languages.length > 0 && (
        <Section title="Idiomas">
          <div className="flex flex-wrap gap-1">
            {draft.languages.map((l) => (
              <span key={l} className="rounded-md border px-1.5 py-0.5 text-[10px] text-neutral-700">{l}</span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-3">
      <h3 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500">{title}</h3>
      {children}
    </section>
  );
}
