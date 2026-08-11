import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatMonthYear, toMonthInputValue } from "@/lib/validation";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/**
 * Seletor de mês/ano em calendário. Valor no formato "AAAA-MM".
 * `min` bloqueia meses anteriores ou iguais (usado na data de término).
 */
export function MonthPicker({
  value,
  onChange,
  id,
  min,
  disabled,
  invalid,
  placeholder = "Selecione o mês",
}: {
  value?: string;
  onChange: (v: string) => void;
  id?: string;
  min?: string;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
}) {
  const normalized = toMonthInputValue(value) || "";
  const currentYear = new Date().getFullYear();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() =>
    normalized ? Number(normalized.slice(0, 4)) : currentYear,
  );

  const label = normalized
    ? `${MONTHS[Number(normalized.slice(5, 7)) - 1]} de ${normalized.slice(0, 4)}`
    : "";

  const minNorm = min ? toMonthInputValue(min) : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={invalid}
          className={cn("w-full justify-start font-normal", !label && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
          <span className="truncate">{label || placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="pointer-events-auto w-64 p-3">
        <div className="mb-2 flex items-center justify-between">
          <Button type="button" size="sm" variant="ghost" onClick={() => setYear((y) => y - 1)}>
            ‹
          </Button>
          <span className="text-sm font-medium">{year}</span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setYear((y) => Math.min(y + 1, currentYear + 10))}
          >
            ›
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {MONTHS.map((m, i) => {
            const v = `${year}-${String(i + 1).padStart(2, "0")}`;
            const blocked = !!minNorm && v <= minNorm;
            const selected = v === normalized;
            return (
              <Button
                key={m}
                type="button"
                size="sm"
                variant={selected ? "default" : "ghost"}
                disabled={blocked}
                className="h-8 text-xs"
                onClick={() => {
                  onChange(v);
                  setOpen(false);
                }}
              >
                {m.slice(0, 3)}
              </Button>
            );
          })}
        </div>
        {normalized && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full text-xs"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            Limpar
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

export { formatMonthYear };
