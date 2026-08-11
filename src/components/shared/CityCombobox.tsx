import { useMemo, useState } from "react";
import { BR_STATES } from "@/lib/br-data";
import { searchCities, findCity, allCities } from "@/lib/br-cities";
import { Combobox } from "./Combobox";

/** Combobox de cidades brasileiras com prioridade para a UF selecionada. */
export function CityCombobox({
  city,
  state,
  onChange,
  id,
  invalid,
}: {
  city?: string;
  state?: string;
  onChange: (v: { city: string; state: string }) => void;
  id?: string;
  invalid?: boolean;
}) {
  const [query, setQuery] = useState("");

  const options = useMemo(() => {
    const list = searchCities(query, state, 40);
    const opts = list.map((c) => ({ value: `${c.name}|${c.uf}`, label: c.label }));
    if (city && !opts.some((o) => o.value === `${city}|${state}`)) {
      opts.unshift({ value: `${city}|${state ?? ""}`, label: `${city}${state ? ` - ${state}` : ""}` });
    }
    return opts;
  }, [query, state, city]);

  const value = city ? `${city}|${state ?? ""}` : undefined;

  return (
    <Combobox
      id={id}
      invalid={invalid}
      value={value}
      options={options}
      onSearchChange={setQuery}
      placeholder="Selecione a cidade"
      searchPlaceholder="Digite o nome da cidade..."
      emptyText="Nenhuma cidade encontrada."
      onChange={(v) => {
        const [name, uf] = v.split("|");
        const found = findCity(name, uf);
        onChange({ city: found?.name ?? name, state: found?.uf ?? uf ?? "" });
      }}
    />
  );
}

/** Select pesquisável de UF (sigla ou nome). */
export function StateCombobox({
  value,
  onChange,
  id,
  invalid,
}: {
  value?: string;
  onChange: (uf: string) => void;
  id?: string;
  invalid?: boolean;
}) {
  return (
    <Combobox
      id={id}
      invalid={invalid}
      value={value}
      options={BR_STATES.map((s) => ({ value: s.value, label: s.label }))}
      placeholder="Selecione o estado"
      searchPlaceholder="UF ou nome do estado..."
      emptyText="Estado não encontrado."
      onChange={onChange}
    />
  );
}

/** Verifica se cidade e UF formam uma combinação válida. */
export function isCityStateConsistent(city?: string, state?: string) {
  if (!city?.trim() || !state?.trim()) return true;
  return allCities().some((c) => c.name === city && c.uf === state);
}
