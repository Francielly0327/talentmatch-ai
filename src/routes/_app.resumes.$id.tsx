import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResumeWorkspace } from "@/components/resume/ResumeWorkspace";
import { StorageService } from "@/lib/storage";
import type { Resume } from "@/types";

export const Route = createFileRoute("/_app/resumes/$id")({
  head: () => ({
    meta: [
      { title: "Editar currículo — TalentMatch AI" },
      { name: "description", content: "Edite seu currículo com preview A4 em tempo real e exporte em PDF pronto para ATS." },
      { property: "og:title", content: "Editar currículo — TalentMatch AI" },
      { property: "og:description", content: "Edição de currículo com preview idêntico ao PDF exportado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResumeEditorPage,
});

function ResumeEditorPage() {
  const { id } = useParams({ from: "/_app/resumes/$id" });
  const [resume, setResume] = useState<Resume | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setResume(StorageService.getResume(id));
    setLoaded(true);
  }, [id]);

  // autosave em LocalStorage
  useEffect(() => {
    if (!resume) return;
    const t = setTimeout(() => {
      StorageService.upsertResume({ ...resume, updatedAt: new Date().toISOString() });
    }, 500);
    return () => clearTimeout(t);
  }, [resume]);

  if (!loaded) return null;

  if (!resume) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">Currículo não encontrado.</p>
        <Button asChild variant="outline">
          <Link to="/resumes">Voltar para currículos</Link>
        </Button>
      </div>
    );
  }

  return (
    <ResumeWorkspace
      resume={resume}
      savedAt={resume.updatedAt}
      onChange={(patch) => setResume((r) => (r ? { ...r, ...patch } : r))}
      onSave={() => {
        const saved = { ...resume, updatedAt: new Date().toISOString() };
        StorageService.upsertResume(saved);
        setResume(saved);
        toast.success("Currículo salvo");
      }}
    />
  );
}
