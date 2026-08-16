import { normalize } from "./br-cities";
import { hasTerm } from "./match-engine";

/**
 * Competências TRANSFERÍVEIS.
 *
 * Cada "conceito" agrupa expressões equivalentes/relacionadas. Se a vaga pede um
 * termo do conceito e o candidato demonstra OUTRO termo do MESMO conceito no
 * histórico real dele, isso é uma correspondência transferível — nunca uma
 * invenção: a evidência precisa existir literalmente no currículo/perfil.
 */
export interface TransferableConcept {
  id: string;
  label: string;
  terms: string[];
}

export const TRANSFERABLE_CONCEPTS: TransferableConcept[] = [
  {
    id: "atendimento",
    label: "Atendimento",
    terms: [
      "atendimento", "atendimento ao cliente", "atendimento ao usuario", "atendimento ao publico",
      "suporte", "suporte tecnico", "suporte ao usuario", "help desk", "helpdesk", "service desk",
      "sac", "recepcao", "chamados", "tickets", "clientes", "usuarios",
    ],
  },
  {
    id: "organizacao",
    label: "Organização e rotinas",
    terms: [
      "organizacao", "organizado", "rotinas administrativas", "rotinas", "rotina", "agenda",
      "planejamento", "priorizacao", "gestao de tarefas", "arquivo", "arquivamento",
      "controle de tarefas", "acompanhamento de demandas", "demandas",
    ],
  },
  {
    id: "documentacao",
    label: "Documentação e registros",
    terms: [
      "documentacao", "documentos", "controle de documentos", "registro", "registros",
      "registro de informacoes", "cadastro", "cadastros", "protocolo", "relatorios",
      "planilhas", "controle de informacoes", "base de conhecimento",
    ],
  },
  {
    id: "comunicacao",
    label: "Comunicação",
    terms: [
      "comunicacao", "comunicacao escrita", "redacao", "e-mail", "email", "oratoria",
      "apresentacao", "apresentacoes", "relacionamento interpessoal", "escuta ativa",
      "alinhamento", "interlocucao",
    ],
  },
  {
    id: "problemas",
    label: "Resolução de problemas",
    terms: [
      "resolucao de problemas", "solucao de problemas", "troubleshooting", "diagnostico",
      "analise de problemas", "incidentes", "correcao", "manutencao",
    ],
  },
  {
    id: "office",
    label: "Pacote Office e planilhas",
    terms: [
      "excel", "pacote office", "office", "planilhas", "google sheets", "sheets", "word",
      "powerpoint", "libreoffice", "office 365", "google workspace",
    ],
  },
  {
    id: "dados",
    label: "Dados e indicadores",
    terms: [
      "analise de dados", "dados", "indicadores", "kpi", "kpis", "dashboards", "dashboard",
      "power bi", "metricas", "relatorios gerenciais", "sql",
    ],
  },
  {
    id: "sistemas",
    label: "Sistemas e informática",
    terms: [
      "sistemas", "sistema", "erp", "crm", "sap", "totvs", "software", "informatica",
      "computadores", "tecnologia da informacao", "ti", "hardware", "redes",
    ],
  },
  {
    id: "comercial",
    label: "Comercial e negociação",
    terms: [
      "vendas", "negociacao", "prospeccao", "comercial", "relacionamento com clientes",
      "pos-venda", "propostas", "orcamentos", "metas",
    ],
  },
  {
    id: "pessoas",
    label: "Liderança e pessoas",
    terms: [
      "lideranca", "gestao de equipe", "gestao de pessoas", "treinamento", "treinamentos",
      "mentoria", "capacitacao", "onboarding", "equipe",
    ],
  },
  {
    id: "processos",
    label: "Processos e qualidade",
    terms: [
      "processos", "melhoria continua", "procedimentos", "pop", "fluxos", "qualidade",
      "padronizacao", "auditoria", "compliance",
    ],
  },
  {
    id: "projetos",
    label: "Projetos e prazos",
    terms: [
      "gestao de projetos", "projetos", "cronograma", "prazos", "escopo", "scrum", "kanban",
      "acompanhamento de projetos",
    ],
  },
  {
    id: "financeiro",
    label: "Rotinas financeiras",
    terms: [
      "financeiro", "contas a pagar", "contas a receber", "faturamento", "notas fiscais",
      "nota fiscal", "cobranca", "orcamento", "conciliacao",
    ],
  },
  {
    id: "logistica",
    label: "Estoque e compras",
    terms: [
      "estoque", "logistica", "compras", "fornecedores", "inventario", "almoxarifado",
      "recebimento", "expedicao",
    ],
  },
  {
    id: "rh",
    label: "Rotinas de RH",
    terms: [
      "recrutamento", "selecao", "departamento pessoal", "folha de pagamento", "admissao",
      "desligamento", "ponto", "beneficios",
    ],
  },
];

/** Conceitos aos quais um termo (da vaga ou do currículo) pertence. */
export function conceptsOf(term: string): TransferableConcept[] {
  const n = normalize(term);
  if (!n) return [];
  return TRANSFERABLE_CONCEPTS.filter((c) =>
    c.terms.some((t) => {
      const tn = normalize(t);
      return tn === n || n.includes(tn) || tn.includes(n);
    }),
  );
}

export interface TransferableMatch {
  /** Termo pedido pela vaga. */
  skill: string;
  /** Conceito que faz a ponte. */
  concept: string;
  /** Trechos reais do currículo/perfil que sustentam a relação. */
  evidence: string[];
}

/**
 * Para termos da vaga NÃO encontrados literalmente, procura evidências reais
 * relacionadas no texto do candidato.
 */
export function findTransferable(
  jobSkills: string[],
  haystackNormalized: string,
): TransferableMatch[] {
  const out: TransferableMatch[] = [];
  for (const skill of jobSkills) {
    const concepts = conceptsOf(skill);
    if (!concepts.length) continue;
    const evidence: string[] = [];
    let conceptLabel = "";
    for (const c of concepts) {
      const hits = c.terms.filter(
        (t) => normalize(t) !== normalize(skill) && hasTerm(haystackNormalized, t),
      );
      if (hits.length) {
        conceptLabel = conceptLabel || c.label;
        for (const h of hits) if (!evidence.includes(h)) evidence.push(h);
      }
    }
    if (evidence.length) {
      out.push({ skill, concept: conceptLabel, evidence: evidence.slice(0, 4) });
    }
  }
  return out;
}

/** Termos de um conceito que aparecem em um texto (usado para destacar experiências). */
export function conceptHighlights(textNormalized: string, jobSkills: string[]): string[] {
  const wanted = new Set<string>();
  for (const s of jobSkills) for (const c of conceptsOf(s)) wanted.add(c.id);
  const out: string[] = [];
  for (const c of TRANSFERABLE_CONCEPTS) {
    if (!wanted.has(c.id)) continue;
    if (c.terms.some((t) => hasTerm(textNormalized, t))) out.push(c.label);
  }
  return out;
}
