import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  Sparkles,
  Upload,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ResumeWorkspace } from "@/components/resume/ResumeWorkspace";
import { StorageService } from "@/lib/storage";
import {
  ResumeParserService,
  ResumeParseError,
  PARSE_ERROR_MESSAGES,
  validatePdfFile,
  type ParsedResumeSummary,
} from "@/lib/resume-parser";
import { emptyResume, resumeFromParsed, resumeFromProfile } from "@/lib/resume-factory";
import { useProfile } from "@/hooks/use-storage";
import { ProfileGateDialog, isProfileReady } from "@/components/shared/ProfileGateDialog";
import type { Resume } from "@/types";

export const Route = createFileRoute("/_app/resumes/new")({
  head: () => ({
    meta: [
      { title: "Novo currículo — TalentMatch AI" },
      { name: "description", content: "Importe um PDF, use seu perfil ou comece do zero e gere um currículo ATS em A4." },
      { property: "og:title", content: "Novo currículo — TalentMatch AI" },
      { property: "og:description", content: "Assistente para criar currículos otimizados para ATS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewResumePage,
});

function NewResumePage() {
  const navigate = useNavigate();
  const [profile] = useProfile();
  const [gateOpen, setGateOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<Resume | null>(null);
  const [summary, setSummary] = useState<ParsedResumeSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageMsg, setStageMsg] = useState("");
  const [error, setError] = useState("");
  const [blankName, setBlankName] = useState("");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setSummary(null);
    try {
      validatePdfFile(file);
    } catch (e) {
      setError(e instanceof ResumeParseError ? e.message : "Arquivo inválido.");
      return;
    }
    setBusy(true);
    setProgress(3);
    try {
      const result = await ResumeParserService.parsePdf(file, (p) => {
        setProgress(p.progress);
        setStageMsg(p.message);
      });
      setDraft(resumeFromParsed(result.parsed, file.name.replace(/\.pdf$/i, "")));
      setSummary(result.summary);
      toast.success("Currículo importado — revise os dados abaixo");
    } catch (e) {
      const msg =
        e instanceof ResumeParseError
          ? e.message
          : PARSE_ERROR_MESSAGES.unknown ?? "Não foi possível ler o PDF.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
      setProgress(0);
      setStageMsg("");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = () => {
    if (!draft) return;
    if (!draft.fullName?.trim()) {
      toast.error("Informe o nome completo antes de salvar");
      return;
    }
    const saved = { ...draft, updatedAt: new Date().toISOString() };
    StorageService.upsertResume(saved);
    toast.success("Currículo salvo");
    navigate({ to: "/resumes/$id", params: { id: saved.id } });
  };

  if (draft) {
    return (
      <div className="space-y-4">
        {summary && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Dados extraídos do seu PDF</AlertTitle>
            <AlertDescription className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="secondary">{summary.experiencesFound} experiências</Badge>
              <Badge variant="secondary">{summary.educationFound} formações</Badge>
              <Badge variant="secondary">{summary.skillsFound} competências</Badge>
              <Badge variant="secondary">{summary.languagesFound} idiomas</Badge>
              <Badge variant="secondary">{summary.certificationsFound} certificações</Badge>
              <span className="w-full pt-1 text-xs text-muted-foreground">
                Revise e complete as informações — o preview atualiza em tempo real.
              </span>
            </AlertDescription>
          </Alert>
        )}
        <ResumeWorkspace
          resume={draft}
          onChange={(patch) => setDraft((d) => (d ? { ...d, ...patch } : d))}
          onSave={save}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <Button asChild size="icon" variant="ghost" aria-label="Voltar">
          <Link to="/resumes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">Novo currículo</h1>
          <p className="text-sm text-muted-foreground">
            Escolha como quer começar. Você poderá editar tudo depois.
          </p>
        </div>
      </div>

      {/* Opção 1 — importar PDF */}
      <Card className="border-primary/40">
        <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">Importar currículo em PDF</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Lemos seu PDF e preenchemos os campos automaticamente.
            </p>
          </div>
          <Badge className="shrink-0">Recomendado</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <Upload className="h-6 w-6 text-primary" />
            )}
            <span className="text-sm font-medium">
              {busy ? stageMsg || "Processando..." : "Selecionar arquivo PDF"}
            </span>
            <span className="text-xs text-muted-foreground">
              Compatível com Word, Canva e LinkedIn · até 10 MB
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {busy && <Progress value={progress} />}
          {error && (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertTitle>Não foi possível importar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Opção 2 — perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usar informações do meu perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <p className="min-w-0 text-sm text-muted-foreground">
              {profile.name
                ? `Preenche com os dados de ${profile.name}.`
                : "Seu perfil ainda está vazio — preencha-o para usar esta opção."}
            </p>
            <Button
              variant="outline"
              className="shrink-0"
              onClick={() => {
                if (!isProfileReady(profile)) {
                  setGateOpen(true);
                  return;
                }
                setDraft(resumeFromProfile(profile));
              }}
              disabled={!profile.name}
            >
              <User className="mr-1 h-4 w-4" /> Usar perfil
            </Button>
          </div>
          <ProfileGateDialog
            open={gateOpen}
            onOpenChange={setGateOpen}
            profile={profile}
            onContinueAnyway={() => {
              setGateOpen(false);
              setDraft(resumeFromProfile(profile));
            }}
          />
        </CardContent>

      </Card>

      {/* Opção 3 — do zero */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Criar currículo do zero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="blankName">Nome do currículo</Label>
            <Input
              id="blankName"
              value={blankName}
              onChange={(e) => setBlankName(e.target.value)}
              placeholder="Ex.: Currículo Front-end 2026"
            />
          </div>
          <Button onClick={() => setDraft(emptyResume(blankName.trim() || "Novo currículo"))}>
            <Sparkles className="mr-1 h-4 w-4" /> Começar do zero
          </Button>
        </CardContent>
      </Card>

      <Alert>
        <FileText className="h-4 w-4" />
        <AlertTitle>Armazenamento local</AlertTitle>
        <AlertDescription>
          Seus currículos ficam salvos apenas neste navegador (LocalStorage) e permanecem
          disponíveis após atualizar a página.
        </AlertDescription>
      </Alert>
    </div>
  );
}
