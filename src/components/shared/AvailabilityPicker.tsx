import { AVAILABILITY_OPTIONS } from "@/lib/profile-utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Cards selecionáveis de disponibilidade. */
export function AvailabilityPicker({
  value,
  onChange,
  id,
}: {
  value?: string;
  onChange: (v: string) => void;
  id?: string;
}) {
  return (
    <RadioGroup
      id={id}
      value={value ?? ""}
      onValueChange={onChange}
      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
    >
      {AVAILABILITY_OPTIONS.map((opt) => (
        <Label
          key={opt.value}
          htmlFor={`av-${opt.value}`}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
            value === opt.value
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "hover:bg-accent/50",
          )}
        >
          <RadioGroupItem id={`av-${opt.value}`} value={opt.value} className="mt-0.5" />
          <span className="min-w-0 space-y-1">
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", opt.dot)} />
              {opt.label}
            </span>
            <span className="block text-xs font-normal text-muted-foreground">
              {opt.description}
            </span>
          </span>
        </Label>
      ))}
    </RadioGroup>
  );
}
