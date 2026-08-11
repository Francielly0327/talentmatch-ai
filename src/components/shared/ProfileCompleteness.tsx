import { Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { completenessTone, profileCompleteness } from "@/lib/profile-utils";
import type { Profile } from "@/types";

/** Indicador de completude do perfil, reutilizável. */
export function ProfileCompleteness({
  profile,
  compact,
  onFocusField,
}: {
  profile: Profile;
  compact?: boolean;
  onFocusField?: (anchor: string) => void;
}) {
  const { items, percent } = profileCompleteness(profile);
  const tone = completenessTone(percent);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", tone.dot)} />
            <p className="text-sm font-semibold">Complete seu perfil</p>
          </div>
          <span className={cn("text-sm font-semibold", tone.text)}>{percent}%</span>
        </div>
        <Progress value={percent} className="h-2" />
        <p className="text-xs text-muted-foreground">{tone.label}</p>

        {!compact && (
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => onFocusField?.(item.anchor)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs transition-colors hover:bg-accent/60",
                    item.done ? "text-muted-foreground" : "font-medium",
                  )}
                >
                  {item.done ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 shrink-0 text-destructive" />
                  )}
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {compact && percent < 100 && (
          <Button asChild size="sm" variant="outline" className="w-full">
            <Link to="/profile">Completar perfil</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
