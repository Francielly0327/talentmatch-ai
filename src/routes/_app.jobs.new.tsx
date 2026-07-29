import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Briefcase, FileText, Info, Sparkles, Settings2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { StorageService, uid } from "@/lib/storage";
import { AIService } from "@/lib/ai-service";
import { useResumes, useProfile } from "@/hooks/use-storage";
import type { Job, AnalysisRecord } from "@/types";

export const Route = createFileRoute("/_app/jobs/new")({
  head: () => ({
    meta: [
      { title: "Nova análise de vaga — TalentMatch AI" },
      { name: "description", content: "Analise uma nova vaga em três passos guiados." },
      { property: "og:title", content: "Nova análise de vaga — TalentMatch AI" },
      { property: "og:description", content: "Assistente em etapas para análise inteligente de vagas." },
    ],
  }),
  component: NewJobAnalysisPage,
});

const STORAGE_KEY = "tm_new_job_draft";

interface Draft {
  title: string;
  company: string;
  link: string;
  description: string;
  resumeId: string;
  workModel: string;
  seniority: string;
  notes: string;
}

const emptyDraft: Draft = {
  title: "",
  company: "",
  link: "",
  description: "",
  resumeId: "",
  workModel: "",
  seniority: "",
  notes: "",
};

function loadDraft(): Draft {
  if (typeof window === "undefined") return emptyDraft;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...emptyDraft, ...(JSON.parse(raw) as Draft) } : emptyDraft;
  } catch {
    return emptyDraft;
  }
}

const STEPS = [
  { id: 1, title: "Vaga", desc: "Dados da vaga", icon: Briefcase },
  { id: 2, title: "Currículo", desc: "Escolha o currículo", icon: FileText },
  { id: 3, title: "Preferências", desc: "Ajustes finais", icon: Settings2 },
] as const;

function NewJobAnalysisPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [draft, setDraft] = useState<Draft>(() => loadDraft());
  const navigate = useNavigate();
  const resumes = useResumes();
  const [profile] = useProfile();

  const update = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => {
      const next = { ...d, [k]: v };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const canNext = useMemo(() => {
    if (step === 1) return draft.title.trim().length > 1 && draft.description.trim().length > 30;
    if (step === 2) return true;
    return true;
  }, [step, draft]);

  const finish = () => {
    const composed = [
      draft.title && `Vaga: ${draft.title}`,
      draft.company && `Empresa: ${draft.company}`,
      draft.seniority && `Senioridade: ${draft.seniority}`,
      draft.workModel && `Modelo: ${draft.workModel}`,
      draft.link && `Link: ${draft.link}`,
      "",
      draft.description,
    ]
      .filter((l) => l !== undefined)
      .join("\n");

    const extracted = AIService.analyzeJob(composed);
    const job: Job = {
      id: uid(),
      createdAt: new Date().toISOString(),
      rawText: composed,
      ...extracted,
      role: draft.title || extracted.role,
      company: draft.company || extracted.company,
      seniority: draft.seniority || extracted.seniority,
      workType: draft.workModel || extracted.workType,
      notes: draft.notes,
    };
    StorageService.upsertJob(job);

    // Run analysis if resume selected
    const resume = resumes.find((r) => r.id === draft.resumeId);
    if (resume) {
      const score = AIService.calculateMatch(job, resume, profile);
      const gaps = AIService.identifySkillGaps(job, resume, profile);
      const suggestions = AIService.generateSuggestions(score, gaps);
      const record: AnalysisRecord = {
        id: uid(),
        jobId: job.id,
        resumeId: resume.id,
        createdAt: new Date().toISOString(),
        score,
        gaps,
        suggestions,
      };
      StorageService.addAnalysis(record);
    }

    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    toast.success("Vaga analisada com sucesso");
    navigate({ to: "/jobs/$id", params: { id: job.id } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button asChild size="icon" variant="ghost">
            <Link to="/jobs" aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Nova análise de vaga</h1>
            <p className="text-sm text-muted-foreground">
              Siga os três passos abaixo. Seus dados ficam salvos automaticamente.
            </p>
          </div>
        </div>
      </div>

      {/* Info card */}
      <Alert className="border-primary/30 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle>Armazenamento local</AlertTitle>
        <AlertDescription>
          Nesta versão, seus dados ficam salvos apenas neste navegador. Para não perder suas
          análises, copie ou exporte os resultados importantes.
        </AlertDescription>
      </Alert>

      {/* Stepper */}
      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const isDone = s.id < step;
          const isActive = s.id === step;
          return (
            <li
              key={s.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors",
                isActive && "border-primary/60 shadow-sm",
                isDone && "border-primary/30 bg-primary/5",
              )}
            >
              <div
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-semibold",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Passo {s.id}
                </div>
                <div className="truncate text-sm font-semibold">{s.title}</div>
              </div>
            </li>
          );
        })}
      </ol>

      <motion.div
        key={step}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados da vaga</CardTitle>
              <p className="text-sm text-muted-foreground">
                Cole o descritivo completo — a IA extrai skills, requisitos e palavras-chave.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título da vaga *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Desenvolvedor(a) Frontend Pleno"
                  value={draft.title}
                  onChange={(e) => update("title", e.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    placeholder="Ex: Acme Corp"
                    value={draft.company}
                    onChange={(e) => update("company", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="link">Link da vaga (opcional)</Label>
                  <Input
                    id="link"
                    type="url"
                    placeholder="https://…"
                    value={draft.link}
                    onChange={(e) => update("link", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Descrição completa da vaga *</Label>
                <Textarea
                  id="desc"
                  rows={12}
                  placeholder="Cole aqui o texto completo da vaga, incluindo requisitos, responsabilidades e benefícios."
                  value={draft.description}
                  onChange={(e) => update("description", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo de 30 caracteres. Quanto mais completo, melhor a análise.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Escolha o currículo</CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecione o currículo que deseja comparar com a vaga. Você pode pular e escolher depois.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4">
              {resumes.length === 0 ? (
                <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-6">
                  <p className="text-sm text-muted-foreground">
                    Você ainda não tem currículos cadastrados.
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/resumes/new">
                      <FileText className="mr-1 h-4 w-4" /> Criar currículo agora
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label>Currículo</Label>
                  <Select value={draft.resumeId} onValueChange={(v) => update("resumeId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um currículo…" />
                    </SelectTrigger>
                    <SelectContent>
                      {resumes.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Você poderá trocar de currículo depois na tela da vaga.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preferências</CardTitle>
              <p className="text-sm text-muted-foreground">
                Refinamentos opcionais para melhorar a análise e o histórico.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Modelo de trabalho</Label>
                  <Select value={draft.workModel} onValueChange={(v) => update("workModel", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remoto">Remoto</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                      <SelectItem value="presencial">Presencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Nível</Label>
                  <Select value={draft.seniority} onValueChange={(v) => update("seniority", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estagio">Estágio</SelectItem>
                      <SelectItem value="junior">Júnior</SelectItem>
                      <SelectItem value="pleno">Pleno</SelectItem>
                      <SelectItem value="senior">Sênior</SelectItem>
                      <SelectItem value="especialista">Especialista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notas pessoais</Label>
                <Textarea
                  rows={4}
                  placeholder="Anote lembretes, contatos ou pontos de atenção."
                  value={draft.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Actions */}
      <div className="sticky bottom-16 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card/95 p-3 shadow-sm backdrop-blur lg:bottom-4">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
          disabled={step === 1}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/jobs">Cancelar</Link>
          </Button>
          {step < 3 ? (
            <Button onClick={() => canNext && setStep((s) => ((s + 1) as 1 | 2 | 3))} disabled={!canNext}>
              Continuar <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finish}>
              <Sparkles className="mr-1 h-4 w-4" /> Analisar vaga
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
