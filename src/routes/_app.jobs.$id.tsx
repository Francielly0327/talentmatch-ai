import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScoreGauge } from "@/components/shared/ScoreGauge";
import { StorageService, uid } from "@/lib/storage";
import { AIService } from "@/lib/ai-service";
import { useProfile, useResumes } from "@/hooks/use-storage";
import type { AnalysisRecord } from "@/types";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
  XCircle,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/_app/jobs/$id")({
  head: () => ({
    meta: [
      { title: "Análise de vaga — TalentMatch AI" },
      { name: "description", content: "Match score, gaps e otimização ATS para a vaga." },
      { property: "og:title", content: "Análise de vaga — TalentMatch AI" },
      { property: "og:description", content: "Análise detalhada de vaga com IA." },
    ],
  }),
  component: JobDetail,
});

function JobDetail() {
  const { id } = useParams({ from: "/_app/jobs/$id" });
  const job = StorageService.getJob(id);
  const resumes = useResumes();
  const [profile] = useProfile();
  const [selectedResume, setSelectedResume] = useState<string | undefined>(resumes[0]?.id);
  const navigate = useNavigate();
  const [notes, setNotes] = useState(job?.notes || "");
  const [checklist, setChecklist] = useState(
    job?.checklist || defaultChecklist(),
  );

  const resume = resumes.find((r) => r.id === selectedResume);
  const score = useMemo(
    () => (job && resume ? AIService.calculateMatch(job, resume, profile) : null),
    [job, resume, profile],
  );
  const gaps = useMemo(
    () => (job && resume ? AIService.identifySkillGaps(job, resume, profile) : null),
    [job, resume, profile],
  );
  const suggestions = useMemo(
    () => (score && gaps ? AIService.generateSuggestions(score, gaps) : []),
    [score, gaps],
  );

  if (!job) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Vaga não encontrada. <Link to="/jobs" className="text-primary">voltar</Link>
      </div>
    );
  }

  const radarData = score
    ? [
        { k: "Hard", v: score.hardSkills },
        { k: "Soft", v: score.softSkills },
        { k: "Exp.", v: score.experience },
        { k: "Educ.", v: score.education },
        { k: "Idiomas", v: score.languages },
        { k: "Keywords", v: score.keywords },
        { k: "Senior.", v: score.seniority },
      ]
    : [];

  const saveNotes = () => {
    StorageService.upsertJob({ ...job, notes, checklist });
    toast.success("Salvo");
  };

  const optimize = () => {
    if (!resume) {
      toast.error("Selecione um currículo primeiro.");
      return;
    }
    const optimized = AIService.optimizeResume(job, resume, profile);
    StorageService.upsertResume(optimized);
    const record: AnalysisRecord = {
      id: uid(),
      jobId: job.id,
      resumeId: resume.id,
      createdAt: new Date().toISOString(),
      score: score!,
      gaps: gaps!,
      suggestions,
      optimizedResumeId: optimized.id,
    };
    StorageService.addAnalysis(record);
    toast.success("Currículo ATS gerado");
    navigate({ to: "/resumes/$id", params: { id: optimized.id } });
  };

  const runAnalysis = () => {
    if (!resume || !score || !gaps) return;
    StorageService.addAnalysis({
      id: uid(),
      jobId: job.id,
      resumeId: resume.id,
      createdAt: new Date().toISOString(),
      score,
      gaps,
      suggestions,
    });
    toast.success("Análise registrada no histórico");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button asChild size="icon" variant="ghost">
            <Link to="/jobs"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{job.role}</h1>
              <button
                onClick={() => StorageService.upsertJob({ ...job, favorite: !job.favorite })}
                className={job.favorite ? "text-warning" : "text-muted-foreground"}
                aria-label="Favoritar"
              >
                <Star className={"h-5 w-5 " + (job.favorite ? "fill-current" : "")} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              {job.company} · {job.seniority || "—"} {job.location && `· ${job.location}`}{" "}
              {job.workType && `· ${job.workType}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedResume} onValueChange={setSelectedResume}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Selecione currículo" />
            </SelectTrigger>
            <SelectContent>
              {resumes.length === 0 && <div className="p-2 text-xs text-muted-foreground">Crie um currículo primeiro</div>}
              {resumes.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={runAnalysis} disabled={!resume}>
            Registrar análise
          </Button>
          <Button onClick={optimize} disabled={!resume}>
            <Sparkles className="mr-1 h-4 w-4" /> Otimizar para ATS
          </Button>
        </div>
      </div>

      {!resume && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Crie um currículo para calcular o match desta vaga.
            </p>
            <Button asChild size="sm">
              <Link to="/resumes"><Plus className="mr-1 h-4 w-4" /> Novo currículo</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {resume && score && gaps && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <Card>
            <CardHeader><CardTitle className="text-base">Match Score</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <ScoreGauge value={score.overall} label="Compatibilidade geral" size={160} />
              <div className="grid w-full grid-cols-2 gap-2 text-xs">
                <ScoreLine label="Hard skills" value={score.hardSkills} />
                <ScoreLine label="Soft skills" value={score.softSkills} />
                <ScoreLine label="Experiência" value={score.experience} />
                <ScoreLine label="Educação" value={score.education} />
                <ScoreLine label="Idiomas" value={score.languages} />
                <ScoreLine label="Keywords" value={score.keywords} />
                <ScoreLine label="Senioridade" value={score.seniority} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Compatibilidade por dimensão</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="k" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar dataKey="v" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="gaps">Gaps</TabsTrigger>
          <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
          <TabsTrigger value="tracking">Acompanhar</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4 grid gap-4 md:grid-cols-2">
          <InfoCard title="Tecnologias" items={job.technologies} />
          <InfoCard title="Soft skills" items={job.softSkills} />
          <InfoCard title="Idiomas" items={job.languages} />
          <InfoCard title="Palavras-chave ATS" items={job.keywords} />
          <ListCard title="Requisitos obrigatórios" items={job.requiredRequirements} />
          <ListCard title="Requisitos desejáveis" items={job.desiredRequirements} />
          <ListCard title="Responsabilidades" items={job.responsibilities} />
          <ListCard title="Benefícios" items={job.benefits} />
        </TabsContent>

        <TabsContent value="gaps" className="mt-4">
          {gaps ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Você possui</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-1.5">
                  {gaps.matched.length ? gaps.matched.map((s) => (
                    <Badge key={s} className="bg-success/15 text-success hover:bg-success/20">{s}</Badge>
                  )) : <span className="text-xs text-muted-foreground">Nenhum match direto.</span>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><XCircle className="h-4 w-4 text-danger" /> Faltam</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {gaps.missing.length === 0 && <span className="text-xs text-muted-foreground">Sem gaps.</span>}
                  {(["high", "medium", "low"] as const).map((p) => {
                    const items = gaps.missing.filter((g) => g.priority === p);
                    if (!items.length) return null;
                    return (
                      <div key={p} className="space-y-1">
                        <div className="text-xs uppercase tracking-widest text-muted-foreground">
                          {p === "high" ? "Alta prioridade" : p === "medium" ? "Média" : "Baixa"}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {items.map((g) => (
                            <Badge key={g.skill} variant="outline" className={
                              p === "high" ? "border-danger/50 text-danger" :
                              p === "medium" ? "border-warning/50 text-warning" :
                              "border-muted-foreground/30"
                            }>{g.skill}</Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Selecione um currículo para ver os gaps.</p>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Sugestões de melhoria</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {suggestions.length === 0 && <p className="text-sm text-muted-foreground">Selecione um currículo para ver sugestões.</p>}
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {s}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Checklist</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {checklist.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted">
                  <Checkbox checked={c.done} onCheckedChange={(v) => {
                    setChecklist((arr) => arr.map((x) => x.id === c.id ? { ...x, done: !!v } : x));
                  }} />
                  <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.label}</span>
                </label>
              ))}
              <div className="flex gap-2 pt-2">
                <ChecklistAdd onAdd={(label) => setChecklist((arr) => [...arr, { id: uid(), label, done: false }])} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Notas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anotações sobre a vaga, contatos, entrevistas…" />
              <Button size="sm" onClick={saveNotes}>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function defaultChecklist() {
  return [
    { id: uid(), label: "Currículo enviado", done: false },
    { id: uid(), label: "Carta enviada", done: false },
    { id: uid(), label: "LinkedIn atualizado", done: false },
    { id: uid(), label: "Portfólio enviado", done: false },
    { id: uid(), label: "Teste realizado", done: false },
    { id: uid(), label: "Entrevista RH", done: false },
    { id: uid(), label: "Entrevista técnica", done: false },
    { id: uid(), label: "Oferta", done: false },
  ];
}

function ChecklistAdd({ onAdd }: { onAdd: (v: string) => void }) {
  const [v, setV] = useState("");
  return (
    <>
      <Input value={v} onChange={(e) => setV(e.target.value)} placeholder="Novo item" />
      <Button size="sm" variant="outline" onClick={() => { if (v.trim()) { onAdd(v.trim()); setV(""); } }}>
        <Plus className="h-4 w-4" />
      </Button>
    </>
  );
}

function ScoreLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 flex items-center justify-between">
        <span className="font-semibold tabular-nums">{value}%</span>
        <div className="h-1 flex-1 ml-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap gap-1.5">
        {items.length ? items.map((i) => (
          <Badge key={i} variant="secondary" className="text-[11px]">{i}</Badge>
        )) : <span className="text-xs text-muted-foreground">Não identificado.</span>}
      </CardContent>
    </Card>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent>
        {items.length ? (
          <ul className="space-y-1.5 text-sm">
            {items.map((i, idx) => (
              <li key={idx} className="flex gap-2">
                <Circle className="mt-1.5 h-1.5 w-1.5 shrink-0 fill-current text-primary" />
                <span>{i}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-xs text-muted-foreground">Não identificado.</span>
        )}
      </CardContent>
    </Card>
  );
}
