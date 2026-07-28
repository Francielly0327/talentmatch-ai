import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TagInput } from "@/components/shared/TagInput";
import { ScoreGauge } from "@/components/shared/ScoreGauge";
import { StorageService, uid } from "@/lib/storage";
import { AIService } from "@/lib/ai-service";
import type { Resume } from "@/types";
import { ArrowLeft, Download, Plus, Save, Trash2, Zap } from "lucide-react";

export const Route = createFileRoute("/_app/resumes/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Editar currículo — TalentMatch AI` },
      { name: "description", content: `Edição de currículo ${params.id}.` },
      { property: "og:title", content: "Editar currículo — TalentMatch AI" },
      { property: "og:description", content: "Edição inteligente de currículo com foco em ATS." },
    ],
  }),
  component: ResumeEditor,
});

function ResumeEditor() {
  const { id } = useParams({ from: "/_app/resumes/$id" });
  const [resume, setResume] = useState<Resume | undefined>(() => StorageService.getResume(id));

  useEffect(() => {
    if (!resume) return;
    const t = setTimeout(() => {
      StorageService.upsertResume({ ...resume, updatedAt: new Date().toISOString() });
    }, 400);
    return () => clearTimeout(t);
  }, [resume]);

  const atsSim = useMemo(() => (resume ? AIService.simulateATS(resume) : null), [resume]);

  if (!resume) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">Currículo não encontrado.</p>
        <Button asChild variant="outline"><Link to="/resumes">Voltar</Link></Button>
      </div>
    );
  }

  const update = <K extends keyof Resume>(k: K, v: Resume[K]) =>
    setResume((r) => (r ? { ...r, [k]: v } : r));

  const exportMd = () => {
    const md = resumeToMarkdown(resume);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resume.name.replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPdf = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<pre style="font-family:Inter,sans-serif;white-space:pre-wrap;padding:32px;max-width:800px;margin:auto">${escapeHtml(
      resumeToMarkdown(resume),
    )}</pre>`);
    w.document.title = resume.name;
    w.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild size="icon" variant="ghost"><Link to="/resumes"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <Input
              value={resume.name}
              onChange={(e) => update("name", e.target.value)}
              className="h-auto border-0 p-0 text-2xl font-bold shadow-none focus-visible:ring-0"
            />
            <div className="text-xs text-muted-foreground">
              Salvo automaticamente · {new Date(resume.updatedAt).toLocaleString("pt-BR")}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportMd}><Download className="mr-1 h-4 w-4" /> Markdown</Button>
          <Button variant="outline" onClick={printPdf}><Download className="mr-1 h-4 w-4" /> PDF</Button>
          <Button onClick={() => { StorageService.upsertResume({ ...resume, updatedAt: new Date().toISOString() }); toast.success("Salvo"); }}>
            <Save className="mr-1 h-4 w-4" /> Salvar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
            <CardContent>
              <Textarea rows={4} value={resume.summary} onChange={(e) => update("summary", e.target.value)} placeholder="Resumo profissional focado em resultados." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Hard skills</Label>
                <div className="mt-1"><TagInput value={resume.hardSkills} onChange={(v) => update("hardSkills", v)} /></div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Soft skills</Label>
                <div className="mt-1"><TagInput value={resume.softSkills} onChange={(v) => update("softSkills", v)} /></div>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Palavras-chave ATS</Label>
                <div className="mt-1"><TagInput value={resume.keywords} onChange={(v) => update("keywords", v)} /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Experiências</CardTitle>
              <Button size="sm" variant="outline" onClick={() => update("experiences", [
                ...resume.experiences,
                { id: uid(), company: "", role: "", startDate: "", endDate: "", description: "" },
              ])}><Plus className="mr-1 h-4 w-4" /> Adicionar</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {resume.experiences.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma experiência.</p>}
              {resume.experiences.map((exp, i) => (
                <div key={exp.id} className="grid gap-2 rounded-lg border p-4 sm:grid-cols-2">
                  <Input placeholder="Empresa" value={exp.company} onChange={(e) => {
                    const arr = [...resume.experiences]; arr[i] = { ...exp, company: e.target.value }; update("experiences", arr);
                  }} />
                  <Input placeholder="Cargo" value={exp.role} onChange={(e) => {
                    const arr = [...resume.experiences]; arr[i] = { ...exp, role: e.target.value }; update("experiences", arr);
                  }} />
                  <Input placeholder="Início" value={exp.startDate} onChange={(e) => {
                    const arr = [...resume.experiences]; arr[i] = { ...exp, startDate: e.target.value }; update("experiences", arr);
                  }} />
                  <Input placeholder="Fim" value={exp.endDate} onChange={(e) => {
                    const arr = [...resume.experiences]; arr[i] = { ...exp, endDate: e.target.value }; update("experiences", arr);
                  }} />
                  <div className="sm:col-span-2">
                    <Textarea rows={3} placeholder="Descrição das entregas e resultados" value={exp.description} onChange={(e) => {
                      const arr = [...resume.experiences]; arr[i] = { ...exp, description: e.target.value }; update("experiences", arr);
                    }} />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <Button size="sm" variant="ghost" onClick={() => update("experiences", resume.experiences.filter((x) => x.id !== exp.id))}>
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
              <Button size="sm" variant="outline" onClick={() => update("education", [
                ...resume.education,
                { id: uid(), institution: "", course: "", startDate: "", endDate: "" },
              ])}><Plus className="mr-1 h-4 w-4" /> Adicionar</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {resume.education.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma formação.</p>}
              {resume.education.map((ed, i) => (
                <div key={ed.id} className="grid gap-2 rounded-lg border p-4 sm:grid-cols-2">
                  <Input placeholder="Instituição" value={ed.institution} onChange={(e) => {
                    const arr = [...resume.education]; arr[i] = { ...ed, institution: e.target.value }; update("education", arr);
                  }} />
                  <Input placeholder="Curso" value={ed.course} onChange={(e) => {
                    const arr = [...resume.education]; arr[i] = { ...ed, course: e.target.value }; update("education", arr);
                  }} />
                  <Input placeholder="Início" value={ed.startDate} onChange={(e) => {
                    const arr = [...resume.education]; arr[i] = { ...ed, startDate: e.target.value }; update("education", arr);
                  }} />
                  <Input placeholder="Fim" value={ed.endDate} onChange={(e) => {
                    const arr = [...resume.education]; arr[i] = { ...ed, endDate: e.target.value }; update("education", arr);
                  }} />
                  <div className="sm:col-span-2 flex justify-end">
                    <Button size="sm" variant="ghost" onClick={() => update("education", resume.education.filter((x) => x.id !== ed.id))}>
                      <Trash2 className="mr-1 h-4 w-4" /> Remover
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Simulação ATS</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {atsSim && <ScoreGauge value={atsSim.score} label="Compatibilidade ATS" />}
              <div className="w-full space-y-1">
                {atsSim?.problems.length ? (
                  atsSim.problems.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-md bg-warning/10 p-2 text-xs">
                      <Zap className="mt-0.5 h-3 w-3 text-warning" /> {p}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Sem problemas detectados.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {resume.parentId && (
            <Card>
              <CardHeader><CardTitle className="text-base">Otimizado</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>Este currículo é uma versão otimizada.</p>
                <Badge variant="secondary">Baseado em outro currículo</Badge>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function resumeToMarkdown(r: Resume): string {
  const lines: string[] = [];
  lines.push(`# ${r.name}\n`);
  if (r.summary) lines.push(`## Resumo\n${r.summary}\n`);
  if (r.hardSkills.length) lines.push(`## Hard Skills\n${r.hardSkills.join(", ")}\n`);
  if (r.softSkills.length) lines.push(`## Soft Skills\n${r.softSkills.join(", ")}\n`);
  if (r.experiences.length) {
    lines.push(`## Experiências`);
    for (const e of r.experiences) {
      lines.push(`\n### ${e.role} — ${e.company}\n${e.startDate} - ${e.endDate}\n\n${e.description}`);
    }
    lines.push("");
  }
  if (r.education.length) {
    lines.push(`## Formação`);
    for (const e of r.education) {
      lines.push(`- ${e.course} — ${e.institution} (${e.startDate} - ${e.endDate})`);
    }
  }
  if (r.keywords.length) lines.push(`\n## Palavras-chave\n${r.keywords.join(", ")}`);
  return lines.join("\n");
}

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}
