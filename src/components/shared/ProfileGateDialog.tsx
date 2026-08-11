import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { profileCompleteness } from "@/lib/profile-utils";
import type { Profile } from "@/types";

/**
 * Explica o que falta antes de gerar/exportar um currículo,
 * e leva o usuário direto ao primeiro campo pendente.
 */
export function ProfileGateDialog({
  open,
  onOpenChange,
  profile,
  onContinueAnyway,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: Profile;
  onContinueAnyway?: () => void;
}) {
  const { missing } = profileCompleteness(profile);
  const first = missing[0]?.anchor;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Antes de continuar, complete seu perfil
          </DialogTitle>
          <DialogDescription>Faltam estas informações essenciais:</DialogDescription>
        </DialogHeader>
        <ul className="space-y-1 text-sm">
          {missing.map((m) => (
            <li key={m.key} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              {m.label}
            </li>
          ))}
        </ul>
        <DialogFooter className="gap-2 sm:gap-2">
          {onContinueAnyway && (
            <Button variant="ghost" onClick={onContinueAnyway}>
              Continuar mesmo assim
            </Button>
          )}
          <Button asChild>
            <Link to="/profile" hash={first}>
              Completar perfil
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Retorna true quando o perfil possui o mínimo necessário. */
export function isProfileReady(profile: Profile) {
  return profileCompleteness(profile).missing.length === 0;
}
