import { normalize } from "./br-cities";

/** Catálogo de competências técnicas conhecidas para autocomplete. */
export const HARD_SKILLS = [
  "React", "React Native", "React.js", "Next.js", "Vue.js", "Angular", "Svelte",
  "JavaScript", "TypeScript", "Node.js", "Express", "NestJS", "Deno",
  "Java", "Java Spring", "Spring Boot", "Kotlin", "Scala",
  "Python", "Django", "Flask", "FastAPI", "Pandas", "NumPy",
  "C", "C++", "C#", ".NET", "ASP.NET", "Go", "Rust", "Ruby", "Ruby on Rails",
  "PHP", "Laravel", "Symfony", "WordPress",
  "HTML", "CSS", "Sass", "Tailwind CSS", "Bootstrap", "Styled Components",
  "SQL", "PostgreSQL", "MySQL", "SQL Server", "Oracle", "MongoDB", "Redis", "Firebase", "Supabase",
  "Git", "GitHub", "GitLab", "Bitbucket", "CI/CD", "Docker", "Kubernetes", "Terraform", "Jenkins",
  "AWS", "Azure", "Google Cloud", "Linux", "Nginx",
  "REST API", "GraphQL", "gRPC", "Microsserviços", "WebSockets",
  "Jest", "Cypress", "Playwright", "Testes automatizados", "TDD",
  "Scrum", "Kanban", "Agile", "Jira", "Trello", "Notion",
  "Figma", "Adobe XD", "Photoshop", "Illustrator", "Canva", "UI Design", "UX Design", "Design System",
  "Power BI", "Tableau", "Looker Studio", "Excel avançado", "Google Analytics", "Data Studio",
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "LLMs", "Prompt Engineering",
  "ETL", "Airflow", "Spark", "Big Data", "Data Warehouse", "Modelagem de dados",
  "SEO", "Google Ads", "Meta Ads", "Inbound Marketing", "E-mail marketing", "Copywriting",
  "Salesforce", "HubSpot", "CRM", "SAP", "TOTVS", "ERP",
  "Contabilidade", "Departamento pessoal", "Folha de pagamento", "Recrutamento e seleção",
  "Atendimento ao cliente", "Vendas", "Negociação", "Gestão de projetos", "Gestão de pessoas",
  "Logística", "Controle de estoque", "Compras", "Qualidade", "Lean", "Six Sigma",
  "AutoCAD", "SolidWorks", "Revit", "Pacote Office",
];

export const SOFT_SKILLS = [
  "Comunicação", "Trabalho em equipe", "Liderança", "Proatividade", "Organização",
  "Resolução de problemas", "Pensamento crítico", "Criatividade", "Adaptabilidade",
  "Gestão de tempo", "Empatia", "Colaboração", "Autonomia", "Resiliência",
  "Foco em resultados", "Atenção aos detalhes", "Inteligência emocional", "Negociação",
  "Escuta ativa", "Mentoria",
];

/** Sugere competências do catálogo a partir de um trecho digitado. */
export function suggestSkills(query: string, catalog: string[], exclude: string[] = [], limit = 8) {
  const q = normalize(query);
  const taken = new Set(exclude.map(normalize));
  if (!q) return catalog.filter((s) => !taken.has(normalize(s))).slice(0, limit);
  const starts: string[] = [];
  const has: string[] = [];
  for (const s of catalog) {
    const n = normalize(s);
    if (taken.has(n)) continue;
    if (n.startsWith(q)) starts.push(s);
    else if (n.includes(q)) has.push(s);
  }
  return [...starts, ...has].slice(0, limit);
}

/**
 * Extrai competências mencionadas nos textos do próprio perfil.
 * Nunca inventa: só retorna itens do catálogo que aparecem literalmente no texto.
 */
export function skillsFromText(texts: string[], catalog: string[], exclude: string[] = []) {
  const haystack = normalize(texts.filter(Boolean).join(" \n "));
  if (!haystack) return [];
  const taken = new Set(exclude.map(normalize));
  const found: string[] = [];
  for (const skill of catalog) {
    const n = normalize(skill);
    if (taken.has(n) || found.includes(skill)) continue;
    const re = new RegExp(`(^|[^a-z0-9+#.])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9+#]|$)`);
    if (re.test(haystack)) found.push(skill);
  }
  return found.slice(0, 12);
}
