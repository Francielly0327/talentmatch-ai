import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnalyses } from "@/hooks/use-storage";
import { StorageService } from "@/lib/storage";
import { History as HistoryIcon } from "lucide-react";

export const Route = createFileRoute("/_app/history")({
  head: () => ({
    meta: [
      { title: "Histórico — TalentMatch AI" },
      { name: "description", content: "Todas as suas análises, matches e otimizações." },
      { property: "og:title", content: "Histórico — TalentMatch AI" },
      { property: "og:description", content: "Timeline de análises e otimizações." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const analyses = useAnalyses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Histórico</h1>
        <p className="text-sm text-muted-foreground">Timeline das suas análises e otimizações.</p>
      </div>

      {analyses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <HistoryIcon className="h-6 w-6" />
            </div>
            <div className="text-lg font-semibold">Sem histórico ainda</div>
            <p className="text-sm text-muted-foreground">Analise uma vaga para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {analyses.map((a) => {
            const job = StorageService.getJob(a.jobId);
            const resume = StorageService.getResume(a.resumeId);
            const opt = a.optimizedResumeId ? StorageService.getResume(a.optimizedResumeId) : null;
            return (
              <Card key={a.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      {job?.role || "Vaga removida"} — <span className="text-muted-foreground">{job?.company}</span>
                    </CardTitle>
                    <div className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString("pt-BR")} · Currículo:{" "}
                      {resume?.name || "removido"}
                    </div>
                  </div>
                  <Badge className="bg-primary/10 text-primary" variant="secondary">{a.score.overall}%</Badge>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {job && <Link to="/jobs/$id" params={{ id: job.id }} className="text-primary hover:underline">Abrir vaga</Link>}
                  {resume && <Link to="/resumes/$id" params={{ id: resume.id }} className="text-primary hover:underline">Ver currículo</Link>}
                  {opt && <Link to="/resumes/$id" params={{ id: opt.id }} className="text-primary hover:underline">Currículo otimizado</Link>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
