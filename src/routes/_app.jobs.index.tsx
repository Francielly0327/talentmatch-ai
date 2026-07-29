import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StorageService } from "@/lib/storage";
import { useJobs } from "@/hooks/use-storage";
import { Briefcase, Plus, Star, Trash2, ArrowRight } from "lucide-react";


export const Route = createFileRoute("/_app/jobs/")({
  head: () => ({
    meta: [
      { title: "Vagas — TalentMatch AI" },
      { name: "description", content: "Cole descrições de vagas e analise seu match automaticamente." },
      { property: "og:title", content: "Vagas — TalentMatch AI" },
      { property: "og:description", content: "Análise inteligente de vagas com IA." },
    ],
  }),
  component: JobsPage,
});

function JobsPage() {
  const jobs = useJobs();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const navigate = useNavigate();

  const analyze = () => {
    if (text.trim().length < 30) {
      toast.error("Cole uma descrição de vaga mais completa.");
      return;
    }
    const extracted = AIService.analyzeJob(text);
    const job: Job = {
      id: uid(),
      createdAt: new Date().toISOString(),
      rawText: text,
      ...extracted,
    };
    StorageService.upsertJob(job);
    setText("");
    setOpen(false);
    toast.success("Vaga analisada");
    navigate({ to: "/jobs/$id", params: { id: job.id } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Vagas</h1>
          <p className="text-sm text-muted-foreground">
            Cole a descrição da vaga — a IA extrai tudo e calcula seu match.
          </p>
        </div>
        <Button asChild>
          <Link to="/jobs/new"><Plus className="mr-1 h-4 w-4" /> Analisar vaga</Link>
        </Button>

      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-semibold">Nenhuma vaga ainda</div>
              <p className="text-sm text-muted-foreground">Cole uma descrição para iniciar sua primeira análise.</p>
            </div>
            <Button asChild><Link to="/jobs/new"><Plus className="mr-1 h-4 w-4" /> Analisar vaga</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j, i) => (
            <motion.div key={j.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between gap-2 text-base">
                    <Link to="/jobs/$id" params={{ id: j.id }} className="line-clamp-2 hover:text-primary">
                      {j.role}
                    </Link>
                    <button
                      onClick={() => StorageService.upsertJob({ ...j, favorite: !j.favorite })}
                      className={j.favorite ? "text-warning" : "text-muted-foreground"}
                      aria-label="Favoritar"
                    >
                      <Star className={"h-4 w-4 " + (j.favorite ? "fill-current" : "")} />
                    </button>
                  </CardTitle>
                  <div className="text-xs text-muted-foreground">
                    {j.company} · {j.seniority || "—"} {j.workType && `· ${j.workType}`}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {j.hardSkills.slice(0, 5).map((s) => (
                      <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link to="/jobs/$id" params={{ id: j.id }}>
                        Abrir <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      if (confirm("Excluir esta vaga?")) {
                        StorageService.deleteJob(j.id);
                        toast.success("Excluída");
                      }
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
