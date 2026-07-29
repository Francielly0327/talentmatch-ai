import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StorageService, uid } from "@/lib/storage";
import { useResumes } from "@/hooks/use-storage";
import type { Resume } from "@/types";
import { FileText, Plus, Copy, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/resumes/")({
  head: () => ({
    meta: [
      { title: "Currículos — TalentMatch AI" },
      { name: "description", content: "Gerencie múltiplas versões do seu currículo." },
      { property: "og:title", content: "Currículos — TalentMatch AI" },
      { property: "og:description", content: "Crie, edite e otimize seus currículos." },
    ],
  }),
  component: ResumesPage,
});


function ResumesPage() {
  const resumes = useResumes();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Currículos</h1>
          <p className="text-sm text-muted-foreground">
            Mantenha versões diferentes para cada tipo de vaga.
          </p>
        </div>
        <Button asChild>
          <Link to="/resumes/new"><Plus className="mr-1 h-4 w-4" /> Novo currículo</Link>
        </Button>
      </div>


      {resumes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-semibold">Nenhum currículo ainda</div>
              <p className="text-sm text-muted-foreground">Crie sua primeira versão para começar.</p>
            </div>
            <Button asChild><Link to="/resumes/new"><Plus className="mr-1 h-4 w-4" /> Novo currículo</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="group h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between gap-2 text-base">
                    <Link to="/resumes/$id" params={{ id: r.id }} className="line-clamp-2 hover:text-primary">
                      {r.name}
                    </Link>
                  </CardTitle>
                  <div className="text-xs text-muted-foreground">
                    Atualizado em {new Date(r.updatedAt).toLocaleDateString("pt-BR")}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {r.hardSkills.slice(0, 6).map((s) => (
                      <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                    ))}
                    {r.hardSkills.length === 0 && (
                      <span className="text-xs text-muted-foreground">Sem skills</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link to="/resumes/$id" params={{ id: r.id }}>Abrir</Link>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      const clone: Resume = { ...r, id: uid(), name: `${r.name} (cópia)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
                      StorageService.upsertResume(clone);
                      toast.success("Currículo duplicado");
                    }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      if (confirm("Excluir este currículo?")) {
                        StorageService.deleteResume(r.id);
                        toast.success("Excluído");
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
