import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText,
  Briefcase,
  Sparkles,
  TrendingUp,
  Plus,
  ArrowRight,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAnalyses, useJobs, useResumes } from "@/hooks/use-storage";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — TalentMatch AI" },
      { name: "description", content: "Visão geral das suas análises, currículos e vagas." },
      { property: "og:title", content: "Dashboard — TalentMatch AI" },
      { property: "og:description", content: "Visão geral das suas análises e currículos." },
    ],
  }),
  component: Dashboard,
});

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof FileText;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
            <div className="mt-1 text-3xl font-bold tracking-tight">{value}</div>
            {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const resumes = useResumes();
  const jobs = useJobs();
  const analyses = useAnalyses();

  const avgMatch = analyses.length
    ? Math.round(analyses.reduce((s, a) => s + a.score.overall, 0) / analyses.length)
    : 0;

  // group last 6 months
  const now = new Date();
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString("pt-BR", { month: "short" }),
      matches: 0,
      curriculos: 0,
    };
  });
  for (const a of analyses) {
    const d = new Date(a.createdAt);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    const m = months.find((x) => x.key === k);
    if (m) m.matches += 1;
  }
  for (const r of resumes) {
    const d = new Date(r.createdAt);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    const m = months.find((x) => x.key === k);
    if (m) m.curriculos += 1;
  }

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-accent/20 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr]"
      >
        <div>
          <Badge variant="secondary" className="mb-3 gap-1">
            <Sparkles className="h-3 w-3" /> IA aplicada à sua carreira
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Encontre a vaga certa. <span className="text-primary">Otimize seu currículo.</span>
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Analise vagas em segundos, descubra seu match, identifique gaps de habilidades e
            gere versões do seu currículo prontas para ATS.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/jobs">
                <Plus className="mr-1 h-4 w-4" /> Nova análise de vaga
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/resumes">
                <FileText className="mr-1 h-4 w-4" /> Novo currículo
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 self-center">
          <div className="rounded-xl border bg-card p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Match médio
            </div>
            <div className="mt-1 text-3xl font-bold text-primary">{avgMatch}%</div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Análises</div>
            <div className="mt-1 text-3xl font-bold">{analyses.length}</div>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Briefcase} label="Vagas analisadas" value={jobs.length} />
        <Stat icon={FileText} label="Currículos" value={resumes.length} />
        <Stat icon={Target} label="Match médio" value={`${avgMatch}%`} />
        <Stat icon={TrendingUp} label="Otimizações" value={analyses.filter((a) => a.optimizedResumeId).length} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Evolução</CardTitle>
            <span className="text-xs text-muted-foreground">últimos 6 meses</span>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <RTooltip />
                <Bar dataKey="matches" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="curriculos" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickAction to="/jobs" label="Analisar nova vaga" icon={Briefcase} />
            <QuickAction to="/resumes" label="Criar currículo" icon={FileText} />
            <QuickAction to="/profile" label="Atualizar perfil" icon={Sparkles} />
            <QuickAction to="/history" label="Ver histórico" icon={TrendingUp} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimas vagas</CardTitle>
            <Link to="/jobs" className="text-xs text-primary hover:underline">
              ver todas
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {jobs.length === 0 && (
              <EmptyState label="Nenhuma vaga analisada ainda." to="/jobs" cta="Analisar vaga" />
            )}
            {jobs.slice(0, 5).map((j) => (
              <Link
                key={j.id}
                to="/jobs/$id"
                params={{ id: j.id }}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{j.role}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {j.company} · {j.seniority}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimos currículos</CardTitle>
            <Link to="/resumes" className="text-xs text-primary hover:underline">
              ver todos
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {resumes.length === 0 && (
              <EmptyState label="Nenhum currículo criado ainda." to="/resumes" cta="Criar currículo" />
            )}
            {resumes.slice(0, 5).map((r) => (
              <Link
                key={r.id}
                to="/resumes/$id"
                params={{ id: r.id }}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {r.hardSkills.slice(0, 5).join(" · ") || "sem skills"}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function QuickAction({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: typeof FileText;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function EmptyState({ label, to, cta }: { label: string; to: string; cta: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-8 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <Button asChild size="sm" variant="outline">
        <Link to={to}>{cta}</Link>
      </Button>
    </div>
  );
}
