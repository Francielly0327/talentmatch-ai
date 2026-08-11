import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DOMAINS = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br", "icloud.com", "live.com", "bol.com.br", "uol.com.br"];

/** Input de email com sugestão de domínios (editável livremente). */
export function EmailInput({
  value,
  onChange,
  id,
  invalid,
  placeholder = "voce@email.com",
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  invalid?: boolean;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [local, domain] = value.split("@");
  const showList = focused && !!local?.trim() && !value.includes(" ");
  const filtered = domain
    ? DOMAINS.filter((d) => d.startsWith(domain.toLowerCase()) && d !== domain.toLowerCase())
    : DOMAINS.slice(0, 4);

  return (
    <div className="relative">
      <Input
        id={id}
        type="email"
        inputMode="email"
        autoComplete="email"
        aria-invalid={invalid}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/\s+/g, "").slice(0, 160))}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setFocused(false), 120);
        }}
      />
      {showList && filtered.length > 0 && (
        <ul
          className={cn(
            "absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover p-1 shadow-md",
          )}
        >
          {filtered.slice(0, 5).map((d) => (
            <li key={d}>
              <button
                type="button"
                className="w-full truncate rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  onChange(`${local}@${d}`);
                  setFocused(false);
                }}
              >
                {local}@{d}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
