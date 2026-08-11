import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { suggestSkills } from "@/lib/skills-data";

/** Tags com autocomplete: seleciona sugestão, ou cria uma nova com Enter. */
export function SkillTagInput({
  value,
  onChange,
  catalog,
  placeholder = "Digite e pressione Enter",
  id,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  catalog: string[];
  placeholder?: string;
  id?: string;
}) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);

  const suggestions = focused && text.trim() ? suggestSkills(text, catalog, value, 6) : [];

  const add = (raw: string) => {
    const t = raw.trim().slice(0, 60);
    if (!t) return;
    if (!value.some((v) => v.toLowerCase() === t.toLowerCase())) onChange([...value, t]);
    setText("");
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(suggestions[0] && suggestions[0].toLowerCase().startsWith(text.trim().toLowerCase()) && text.trim().length > 1 ? text : text);
    }
    if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover p-1 shadow-md">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  className="w-full truncate rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => add(s)}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="max-w-full gap-1 pr-1">
              <span className="truncate">{tag}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== tag))}
                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                aria-label={`Remover ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/** Chips de sugestões baseadas no que o usuário já preencheu. */
export function SuggestedSkills({
  suggestions,
  onAdd,
  title = "Competências sugeridas",
}: {
  suggestions: string[];
  onAdd: (skill: string) => void;
  title?: string;
}) {
  if (!suggestions.length) return null;
  return (
    <div className="rounded-lg border border-dashed p-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Encontradas no que você já escreveu. Adicione apenas o que fizer sentido.
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant="outline"
            className="h-7 rounded-full px-2 text-xs"
            onClick={() => onAdd(s)}
          >
            <Plus className="mr-1 h-3 w-3" /> {s}
          </Button>
        ))}
      </div>
    </div>
  );
}
