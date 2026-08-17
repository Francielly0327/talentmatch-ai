import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Download, Eye, PencilLine, Save, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResumeForm } from "@/components/resume/ResumeForm";
import { ResumePreviewResponsive } from "@/components/resume/ResumePreview";
import { printResumePdf, resumeToDoc } from "@/lib/resume-document";
import { useProfile } from "@/hooks/use-storage";
import type { Resume } from "@/types";

/**
 * Área de trabalho do currículo: editor + preview em tempo real.
 * Desktop: lado a lado. Mobile: abas "Editar" / "Visualizar currículo".
 */
export function ResumeWorkspace({
  resume,
  onChange,
  onSave,
  savedAt,
}: {
  resume: Resume;
  onChange: (patch: Partial<Resume>) => void;
  onSave: () => void;
  savedAt?: string;
}) {
  const [profile] = useProfile();
  const [tab, setTab] = useState("editor");
  const doc = useMemo(() => resumeToDoc(resume, profile), [resume, profile]);

  return (
    <div className="space-y-5">
      <header className="sticky top-0 z-20 -mx-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Button asChild size="icon" variant="ghost" aria-label="Voltar">
            <Link to="/resumes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <Input
              value={resume.name}
              onChange={(e) => onChange({ name: e.target.value })}
              aria-label="Nome do currículo"
              className="h-auto truncate border-0 p-0 text-lg font-bold shadow-none focus-visible:ring-0 sm:text-xl"
            />
            <p className="truncate text-xs text-muted-foreground">
              Salvo automaticamente
              {savedAt ? ` · ${new Date(savedAt).toLocaleString("pt-BR")}` : ""}
              {resume.tailoredFor
                ? ` · Personalizado para ${resume.tailoredFor.role} (${resume.tailoredFor.matchScore}% match)`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={() => printResumePdf(doc)}>
            <Download className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Baixar PDF</span>
          </Button>
          <Button onClick={onSave}>
            <Save className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Salvar</span>
          </Button>
        </div>
      </header>

      {resume.tailoredFor && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">
              Currículo otimizado para: {resume.tailoredFor.role}
              {resume.tailoredFor.company && resume.tailoredFor.company !== "—"
                ? ` · ${resume.tailoredFor.company}`
                : ""}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Personalização realizada pela IA usando apenas informações verdadeiras do seu currículo
            original. Você pode editar tudo abaixo.
          </p>
          {resume.tailoredFor.changes?.length ? (
            <ul className="mt-3 space-y-1">
              {resume.tailoredFor.changes.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/90">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {resume.tailoredFor.transferableSkills?.length ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Competências transferíveis evidenciadas:{" "}
              <span className="text-foreground">
                {resume.tailoredFor.transferableSkills.join(", ")}
              </span>
            </p>
          ) : null}
        </div>
      )}

      {/* Desktop: editor + preview lado a lado */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="min-w-0">
          <ResumeForm resume={resume} onChange={onChange} />
        </div>
        <div className="min-w-0">
          <div className="sticky top-24">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Preview do currículo (igual ao PDF)
            </p>
            <ResumePreviewResponsive data={doc} />
          </div>
        </div>
      </div>

      {/* Mobile / tablet: abas */}
      <div className="lg:hidden">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">
              <PencilLine className="mr-1 h-4 w-4" /> Editar
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="mr-1 h-4 w-4" /> Visualizar currículo
            </TabsTrigger>
          </TabsList>
          <TabsContent value="editor" className="mt-4">
            <ResumeForm resume={resume} onChange={onChange} />
          </TabsContent>
          <TabsContent value="preview" className="mt-4 space-y-3">
            <ResumePreviewResponsive data={doc} />
            <Button className="w-full" variant="outline" onClick={() => printResumePdf(doc)}>
              <Download className="mr-1 h-4 w-4" /> Baixar PDF
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
