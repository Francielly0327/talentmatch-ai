import { Input } from "@/components/ui/input";
import { maskCurrency } from "@/lib/profile-utils";

/** Input com máscara monetária brasileira (R$ 0.000,00). */
export function CurrencyInput({
  value,
  onChange,
  id,
  invalid,
  placeholder = "R$ 0,00",
}: {
  value: string;
  onChange: (formatted: string) => void;
  id?: string;
  invalid?: boolean;
  placeholder?: string;
}) {
  return (
    <Input
      id={id}
      inputMode="numeric"
      aria-invalid={invalid}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(maskCurrency(e.target.value))}
    />
  );
}
