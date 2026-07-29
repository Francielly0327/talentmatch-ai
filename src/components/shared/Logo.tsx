import logoAsset from "@/assets/talentmatch-logo.png.asset.json";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}

export function Logo({ className, showWordmark = false, size = 36 }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img
        src={logoAsset.url}
        alt="TalentMatch AI"
        width={size}
        height={size}
        className="h-auto w-auto object-contain"
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight">TalentMatch</span>
          <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
            AI · ATS
          </span>
        </span>
      )}
    </span>
  );
}
