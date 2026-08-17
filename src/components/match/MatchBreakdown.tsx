import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreGauge } from "@/components/shared/ScoreGauge";
import { CheckCircle2, HelpCircle, Info, Repeat } from "lucide-react";
import type { MatchResult } from "@/types";

/**
 * "Como calculamos seu Match": mostra cada critério, seu peso aplicável,
 * a nota e o resultado final. Totalmente transparente e determinístico.
 */
export function MatchBreakdown({ match }: { match: MatchResult }) {
  const applicable = match.criteria.filter((c) => c.applicable);
  const totalWeight = applicable.reduce((s, c) => s + c.weight, 0) || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4 text-primary" /> Como calculamos seu Match
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {match.criteria.map((c) => {
            const share = c.applicable ? Math.round((c.weight / totalWeight) * 100) : 0;
            return (
              <div
                key={c.key}
                className={
                  "rounded-lg border p-3 " + (c.applicable ? "" : "opacity-60")
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium">{c.label}</div>
                  {c.applicable ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        peso {share}%
                      </Badge>
                      <span className="text-sm font-semibold tabular-nums">{c.score}%</span>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      não aplicável
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.detail}</p>
                {c.applicable && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Match final
            </div>
            <p className="text-xs text-muted-foreground">
              Média ponderada apenas dos critérios aplicáveis a esta vaga.
            </p>
          </div>
          <div className="text-3xl font-bold tabular-nums text-primary">{match.overall}%</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MatchGauge({ match }: { match: MatchResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Match Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <ScoreGauge value={match.overall} label="Compatibilidade geral" size={160} />
        <p className="text-center text-xs text-muted-foreground">
          Cálculo determinístico: o mesmo perfil com a mesma vaga sempre resulta no mesmo
          percentual.
        </p>
      </CardContent>
    </Card>
  );
}

/** Você já possui / Não encontramos no seu perfil. */
export function MatchSkillsPanel({ match }: { match: MatchResult }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4 text-success" /> Você já possui
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {match.matchedSkills.length ? (
            match.matchedSkills.map((s) => (
              <Badge key={s} className="bg-success/15 text-success hover:bg-success/20">
                {s}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">
              Nenhuma competência da vaga encontrada no seu perfil.
            </span>
          )}
        </CardContent>
      </Card>

      {match.relatedSkills?.length > 0 && (
        <Card className="md:col-span-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Repeat className="h-4 w-4 text-primary" /> Competências transferíveis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              A vaga pede estes itens e encontramos experiências reais suas relacionadas — nada foi
              inventado.
            </p>
            <div className="space-y-1.5">
              {match.relatedSkills.map((r) => (
                <div key={r.skill} className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/20">{r.skill}</Badge>
                  <span className="text-muted-foreground">
                    relacionado a {r.evidence.join(", ")}
                    {r.concept ? ` (${r.concept})` : ""}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-4 w-4 text-warning" /> A vaga pede e não encontramos no seu
            perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {match.missingSkills.length === 0 ? (
            <span className="text-xs text-muted-foreground">
              Encontramos todos os itens pedidos pela vaga.
            </span>
          ) : (
            <>
              {(["high", "medium"] as const).map((p) => {
                const items = match.missingSkills.filter((m) => m.priority === p);
                if (!items.length) return null;
                return (
                  <div key={p} className="space-y-1">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      {p === "high" ? "Obrigatórios" : "Diferenciais"}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((m) => (
                        <Badge
                          key={m.skill}
                          variant="outline"
                          className={
                            p === "high"
                              ? "border-danger/50 text-danger"
                              : "border-warning/50 text-warning"
                          }
                        >
                          {m.skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
              <p className="pt-1 text-xs text-muted-foreground">
                Não encontramos essa informação no seu perfil — se você tem essa experiência,
                adicione-a para melhorar o match.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Palavras-chave ATS encontradas / não encontradas. */
export function MatchKeywordsPanel({ match }: { match: MatchResult }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Palavras-chave encontradas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {match.matchedKeywords.length ? (
            match.matchedKeywords.map((k) => (
              <Badge key={k} variant="secondary" className="text-[11px]">
                ✓ {k}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">Nenhuma.</span>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Palavras-chave não encontradas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {match.missingKeywords.length ? (
            match.missingKeywords.map((k) => (
              <Badge key={k} variant="outline" className="text-[11px] text-muted-foreground">
                ○ {k}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">Nenhuma.</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
