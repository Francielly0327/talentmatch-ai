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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MatchBreakdown,
  MatchGauge,
  MatchKeywordsPanel,
  MatchSkillsPanel,
} from "@/components/match/MatchBreakdown";
import { StorageService, uid } from "@/lib/storage";
import { calculateMatch, classifyJobSkills, generateSuggestions, toGapAnalysis } from "@/lib/match-engine";
import { tailorResumeForJob } from "@/lib/resume-tailor";
import { resumeFromProfile } from "@/lib/resume-factory";
import { useProfile, useResumes } from "@/hooks/use-storage";
import type { AnalysisRecord } from "@/types";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react";

export const Route = createFileRoute("/_app/jobs/$id")({
  head: () => ({
    meta: [
      { title: "Análise de vaga — TalentMatch AI" },
      { name: "description", content: "Match score determinístico, gaps e currículo personalizado para a vaga." },
      { property: "og:title", content: "Análise de vaga — TalentMatch AI" },
      { property: "og:description", content: "Veja exatamente como seu match foi calculado." },
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
  const [checklist, setChecklist] = useState(job?.checklist || defaultChecklist());

  const resume = resumes.find((r) => r.id === selectedResume) ?? resumes[0];

  /** Vaga com requisitos classificados (obrigatórios x diferenciais). */
  const analyzedJob = useMemo(() => {
    if (!job) return null;
    const { required, desired } = classifyJobSkills(job);
    return { ...job, requiredSkills: required, desiredSkills: desired };
  }, [job]);

  const match = useMemo(
    () => (analyzedJob && resume ? calculateMatch(analyzedJob, resume, profile) : null),
    [analyzedJob, resume, profile],
  );
  const suggestions = useMemo(() => (match ? generateSuggestions(match) : []), [match]);

  if (!job || !analyzedJob) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Vaga não encontrada. <Link to="/jobs" className="text-primary">voltar</Link>
      </div>
    );
  }

  const radarData = match
    ? match.criteria.filter((c) => c.applicable).map((c) => ({ k: shortLabel(c.key), v: c.score }))
    : [];

  const saveNotes = () => {
    StorageService.upsertJob({ ...job, notes, checklist });
    toast.success("Salvo");
  };

  /** Cria uma NOVA versão do currículo adaptada a esta vaga. O original nunca muda. */
  const createTailoredResume = () => {
    const source =
      resume ??
      (profile.name || profile.hardSkills.length ? resumeFromProfile(profile) : null);
    if (!source) {
      toast.error("Complete seu perfil ou crie um currículo antes de gerar a versão da vaga.");
      return;
    }
    const currentMatch = match ?? calculateMatch(analyzedJob, source, profile);
    const { resume: tailored, changes, notices } = tailorResumeForJob(
      analyzedJob,
      source,
      profile,
      currentMatch,
    );
    StorageService.upsertResume(tailored);
    const record: AnalysisRecord = {
      id: uid(),
      jobId: job.id,
      resumeId: source.id,
      createdAt: new Date().toISOString(),
      score: currentMatch,
      gaps: toGapAnalysis(currentMatch),
      suggestions: suggestions.length ? suggestions : generateSuggestions(currentMatch),
      optimizedResumeId: tailored.id,
    };
    StorageService.addAnalysis(record);
    toast.success("Currículo personalizado criado", { description: changes[0] });
    navigate({ to: "/resumes/$id", params: { id: tailored.id } });
  };

  const runAnalysis = () => {
    if (!resume || !match) return;
    StorageService.addAnalysis({
      id: uid(),
      jobId: job.id,
      resumeId: resume.id,
      createdAt: new Date().toISOString(),
      score: match,
      gaps: toGapAnalysis(match),
      suggestions,
    });
    toast.success("Análise registrada no histórico");
  };

  const tailoredVersions = resumes.filter((r) => r.tailoredFor?.jobId === job.id);

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
          <Select value={resume?.id} onValueChange={setSelectedResume}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Selecione currículo" />
            </SelectTrigger>
            <SelectContent>
              {resumes.length === 0 && (
                <div className="p-2 text-xs text-muted-foreground">Crie um currículo primeiro</div>
              )}
              {resumes.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={runAnalysis} disabled={!resume}>
            Registrar análise
          </Button>
          <Button onClick={createTailoredResume}>
            <Wand2 className="mr-1 h-4 w-4" /> Criar currículo para esta vaga
          </Button>
        </div>
      </div>

      {!resume && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Crie um currículo (ou complete seu perfil) para calcular o match desta vaga.
            </p>
            <Button asChild size="sm">
              <Link to="/resumes/new"><Plus className="mr-1 h-4 w-4" /> Novo currículo</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {tailoredVersions.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Currículos criados para esta vaga</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {tailoredVersions.map((r) => (
              <Button key={r.id} asChild size="sm" variant="outline">
                <Link to="/resumes/$id" params={{ id: r.id }}>
                  {r.name} · {r.tailoredFor?.matchScore}%
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {resume && match && (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <div className="space-y-6">
              <MatchGauge match={match} />
              <Card>
                <CardHeader><CardTitle className="text-base">Compatibilidade por critério</CardTitle></CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="k" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar dataKey="v" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.35} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <MatchBreakdown match={match} />
          </div>

          <MatchSkillsPanel match={match} />

          <Card className="border-primary/30">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
              <div>
                <div className="font-semibold">Currículo personalizado para esta vaga</div>
                <p className="text-sm text-muted-foreground">
                  Criamos uma nova versão priorizando suas competências e experiências reais
                  relacionadas à vaga. Seu currículo original não é alterado.
                </p>
              </div>
              <Button onClick={createTailoredResume}>
                <Wand2 className="mr-1 h-4 w-4" /> Criar currículo para esta vaga
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="keywords">Palavras-chave</TabsTrigger>
          <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
          <TabsTrigger value="tracking">Acompanhar</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4 grid gap-4 md:grid-cols-2">
          <InfoCard title="Competências obrigatórias" items={analyzedJob.requiredSkills ?? []} />
          <InfoCard title="Diferenciais (desejáveis)" items={analyzedJob.desiredSkills ?? []} />
          <InfoCard title="Soft skills" items={job.softSkills} />
          <InfoCard title="Idiomas" items={job.languages} />
          <ListCard title="Requisitos obrigatórios" items={job.requiredRequirements} />
          <ListCard title="Requisitos desejáveis" items={job.desiredRequirements} />
          <ListCard title="Responsabilidades" items={job.responsibilities} />
          <ListCard title="Benefícios" items={job.benefits} />
        </TabsContent>

        <TabsContent value="keywords" className="mt-4">
          {match ? (
            <MatchKeywordsPanel match={match} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Selecione um currículo para comparar as palavras-chave.
            </p>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Sugestões de melhoria</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {suggestions.length === 0 && (
                <p className="text-sm text-muted-foreground">Selecione um currículo para ver sugestões.</p>
              )}
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

function shortLabel(key: string) {
  switch (key) {
    case "required": return "Obrigatórias";
    case "experience": return "Experiência";
    case "education": return "Formação";
    case "keywords": return "Keywords";
    case "seniority": return "Senioridade";
    case "desired": return "Diferenciais";
    default: return "Outros";
  }
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
