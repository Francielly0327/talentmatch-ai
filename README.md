# Talent Match AI

# TalentMatch AI — Plataforma Inteligente de Matchmaking de Vagas + Currículo ATS

## Objetivo

Crie uma aplicação web moderna, completa e escalável chamada **TalentMatch AI**.

O aplicativo deverá conectar candidatos às vagas ideais utilizando Inteligência Artificial, gerar análises de compatibilidade (match score), identificar lacunas de habilidades, otimizar currículos para ATS (Applicant Tracking Systems), criar versões específicas do currículo para cada vaga e acompanhar todo o processo de candidatura.

Todo o projeto deve ser desenvolvido **100% dentro do Lovable**, utilizando Supabase como backend futuramente. **Nesta primeira versão, não implemente autenticação, login, cadastro ou qualquer fluxo de usuários. O aplicativo deve abrir diretamente na tela principal e permitir que qualquer pessoa utilize todas as funcionalidades imediatamente.**

---

# Stack

Utilize exclusivamente:

- React

- TypeScript

- Vite

- TailwindCSS

- shadcn/ui como Design System

- Lucide Icons

- Supabase (estrutura preparada para uso futuro)

- React Query (TanStack Query)

- React Hook Form

- Zod

- Framer Motion

- Recharts

Arquitetura limpa.

Componentes reutilizáveis.

Código organizado.

Responsivo.

Dark Mode preparado (mesmo que desativado inicialmente).

---

# Design System

Utilizar **shadcn/ui** como base.

## Estilo

Visual moderno.

Minimalista.

Tecnologia.

Elegante.

Interface semelhante a produtos da Microsoft, Notion e Linear.

Muito espaço em branco.

Cards suaves.

Animações discretas.

Bordas arredondadas.

Sombras leves.

---

# Paleta

Primary

Azul claro

(#60A5FA)

Primary Hover

#3B82F6

Secondary

Branco

Accent

Amarelo claro

(#FDE68A)

Background

#F8FAFC

Cards

#FFFFFF

Borders

#E2E8F0

Text

#0F172A

Muted

#64748B

Success

#22C55E

Warning

#F59E0B

Danger

#EF4444

---

# Tipografia

Fonte:

Inter

Hierarquia consistente.

---

# Compatibilidade de Dispositivos

A aplicação deve ser **Mobile First** e totalmente funcional em qualquer dispositivo.

Desenvolver uma experiência completa para:

- Smartphones Android

- Smartphones iPhone (iOS)

- Tablets

- Notebooks

- Monitores Desktop

- Telas UltraWide

Toda funcionalidade disponível no desktop também deve estar disponível no mobile.

Não criar versões reduzidas da aplicação.

Não remover funcionalidades no mobile.

A interface deve se adaptar automaticamente utilizando layouts responsivos.

Utilizar breakpoints do TailwindCSS.

Implementar:

- Sidebar colapsável

- Bottom Navigation quando fizer sentido

- Drawer/Menu lateral em dispositivos móveis

- Cards adaptáveis

- Tabelas responsivas

- Scroll horizontal apenas quando inevitável

- Inputs otimizados para toque

- Botões com área de toque confortável

- Modais adaptáveis ao tamanho da tela

- Dialogs responsivos

- Componentes com excelente usabilidade em telas pequenas

A experiência deve parecer um aplicativo nativo quando utilizada em smartphones.

---

# Fluxo Inicial

Ao abrir a aplicação:

- Não exibir tela de login.

- Não solicitar cadastro.

- Não solicitar autenticação.

- Não utilizar OAuth.

- Não exigir criação de conta.

- Não criar sessões de usuário.

O aplicativo deve abrir diretamente no Dashboard.

Todos os dados devem ser armazenados localmente (LocalStorage) nesta primeira versão, mantendo uma arquitetura preparada para futura migração para Supabase sem necessidade de refatoração significativa.

---

# Dashboard

Tela inicial da aplicação.

Mostrar:

Resumo

Quantidade de vagas analisadas

Currículos criados

Match médio

Últimas vagas

Últimos currículos

Gráfico de evolução

Sugestões de melhorias

Ações rápidas:

- Novo Currículo

- Nova Análise de Vaga

- Histórico

- Comparar Currículos

---

# Perfil Profissional

Criar uma seção onde o usuário poderá preencher seus dados profissionais.

Não existe conta.

Existe apenas um perfil local.

Campos:

Nome

Email

Telefone

Cidade

Estado

LinkedIn

GitHub

Portfólio

Website

Resumo profissional

Experiências

Formações

Certificações

Idiomas

Competências

Soft Skills

Hard Skills

Pretensão salarial

Modelo de trabalho

- Presencial

- Híbrido

- Remoto

Disponibilidade

Nível

- Estágio

- Júnior

- Pleno

- Sênior

- Especialista

Salvar automaticamente.

---

# Currículos

O usuário poderá possuir vários currículos.

Exemplos

Currículo Geral

Currículo Backend

Currículo Frontend

Currículo Dados

Currículo QA

Currículo DevOps

etc.

Cada currículo poderá ser:

Editar

Duplicar

Excluir

Versionar

Exportar em PDF

Importar PDF

Importar DOCX

Importar Markdown

Salvar automaticamente.

---

# ATS Resume Builder

O sistema deve gerar currículos ATS Friendly.

Seguindo boas práticas:

Sem tabelas

Sem colunas

Sem caixas de texto

Layout simples

Palavras-chave relevantes

Hierarquia correta

Boa leitura por ATS

Utilizar Markdown internamente antes da renderização.

---

# Match de Vagas

O usuário poderá:

Colar descrição da vaga

ou

Enviar PDF

ou

Enviar DOCX

ou

Importar texto

Após isso:

A IA deverá:

Extrair

Empresa

Cargo

Senioridade

Tecnologias

Soft Skills

Hard Skills

Experiência exigida

Idiomas

Benefícios

Salário

Local

Tipo de trabalho

Palavras-chave ATS

Responsabilidades

Requisitos obrigatórios

Requisitos desejáveis

---

# Match Score

Gerar uma pontuação de 0 a 100.

Mostrar:

Compatibilidade Geral

Hard Skills

Soft Skills

Experiência

Educação

Idiomas

Palavras-chave

Senioridade

Exemplo

Overall Match

87%

Hard Skills

92%

Soft Skills

81%

Experiência

74%

ATS Keywords

95%

Mostrar tudo em gráficos.

---

# Gap Analysis

Exibir:

Você possui:

✔ React

✔ TypeScript

✔ Git

Faltam:

❌ Docker

❌ Kubernetes

❌ Azure

❌ CI/CD

Mostrar prioridades.

Alta

Média

Baixa

---

# ATS Optimizer

A IA deverá criar automaticamente uma nova versão do currículo.

Jamais substituir o currículo original.

Criar uma cópia.

Nome sugerido:

Currículo - Empresa X

ou

Frontend - Empresa X

A IA deverá:

Reescrever resumo

Reorganizar experiências

Destacar projetos

Destacar tecnologias

Adicionar palavras-chave relevantes

Melhorar descrições

Adequar para ATS

Sem inventar experiências.

Nunca adicionar informações falsas.

Caso falte alguma informação, sugerir melhorias ao usuário em vez de criar conteúdo fictício.

---

# Comparação

Tela comparando:

Currículo Original

vs

Currículo ATS

Mostrar:

Texto alterado

Palavras adicionadas

Palavras removidas

Compatibilidade antes

Compatibilidade depois

---

# Simulador ATS

Mostrar como um ATS leria o currículo.

Informar:

Problemas encontrados

Palavras repetidas

Ausência de palavras-chave

Estrutura ruim

Campos não reconhecidos

Pontuação ATS

---

# Histórico

Salvar:

Todas análises

Todos currículos

Todos matches

Todas otimizações

Data

Empresa

Cargo

Versão criada

Tudo salvo localmente.

---

# Busca Inteligente

Pesquisar:

Empresas

Tecnologias

Currículos

Vagas

Competências

---

# Favoritos

Salvar vagas favoritas.

---

# Notas

Cada vaga poderá possuir:

Notas

Checklist

Observações

---

# Checklist

Exemplo

✔ Currículo enviado

✔ Carta enviada

✔ LinkedIn atualizado

✔ Portfólio enviado

✔ Teste realizado

✔ Entrevista RH

✔ Entrevista Técnica

✔ Oferta

---

# IA

Criar um módulo de IA preparado para integração futura.

Criar um serviço chamado:

AIService

Com funções desacopladas:

- analyzeJob()

- calculateMatch()

- extractKeywords()

- optimizeResume()

- generateATSResume()

- generateSuggestions()

- simulateATS()

- compareResumes()

- identifySkillGaps()

- summarizeJob()

Todas devem possuir interfaces bem definidas para futura integração com OpenAI ou outro provedor.

Utilizar mocks inicialmente quando não houver integração configurada.

---

# Persistência

Nesta primeira versão:

Não utilizar autenticação.

Não utilizar usuários.

Não utilizar sessões.

Todos os dados devem ser persistidos utilizando LocalStorage, porém toda a arquitetura deve ser preparada para futura substituição por Supabase.

Criar uma camada de abstração de armazenamento (StorageService) para facilitar essa migração.

---

# Dashboard Analytics

Criar gráficos:

Matches por mês

Currículos criados

Análises realizadas

Top Skills

Skills faltantes

---

# Responsividade

A aplicação deve possuir responsividade completa e comportamento consistente em todas as resoluções.

Garantir funcionamento em:

- Mobile

- Tablet

- Notebook

- Desktop

- Telas UltraWide

Nenhuma funcionalidade pode existir apenas no desktop.

Toda funcionalidade implementada deve funcionar igualmente no mobile.

---

# UX

Loading states

Skeletons

Empty states

Estados de erro

Toast notifications

Confirmações

Modais

Drawers

Command Menu

Breadcrumb

Tabs

Accordion

Tooltips

Popover

Dropdown

---

# Performance

Lazy Loading

Code Splitting

React Query

Cache

Memoização

Paginação

Busca otimizada

---

# Segurança

Validação com Zod

Sanitização de inputs

Proteção contra dados inválidos

Arquitetura preparada para futura autenticação.

---

# Estrutura de Pastas

/src

/components

/ui

/layout

/dashboard

/resume

/jobs

/profile

/analytics

/ai

/shared

/pages

/hooks

/services

/lib

/utils

/types

/schemas

/constants

/context

/assets

---

# Componentes

Criar componentes reutilizáveis para:

Resume Card

Job Card

Match Card

Score Gauge

Skill Badge

Keyword Badge

ATS Score

Timeline

Progress Card

Charts

Tables

Dialogs

Forms

---

# Fluxo Principal

1. O aplicativo abre diretamente no Dashboard.

2. O usuário preenche seu perfil profissional.

3. Cria ou importa um currículo.

4. Cola ou importa uma vaga.

5. O sistema analisa automaticamente a vaga.

6. Calcula o Match Score.

7. Exibe gráficos e análise detalhada.

8. Identifica lacunas de competências.

9. Gera sugestões de melhoria.

10. Cria uma nova versão ATS Friendly do currículo.

11. Permite comparar a versão original com a otimizada.

12. Salva todo o histórico localmente.

13. O usuário acompanha suas análises e candidaturas em um painel organizado.

---

# Qualidade Esperada

O resultado deve parecer um produto SaaS premium pronto para produção, com interface moderna, excelente experiência do usuário, arquitetura escalável, componentes reutilizáveis, tipagem forte, código limpo, alta performance e preparado para futuras integrações de IA, Supabase, autenticação e novas funcionalidades, mantendo consistência visual através do **shadcn/ui** e seguindo boas práticas de desenvolvimento.

A aplicação deve oferecer uma experiência impecável tanto em **PC quanto em dispositivos móveis**, com todas as funcionalidades disponíveis em ambas as plataformas, sem limitações de recursos, garantindo navegação fluida, responsividade completa e excelente usabilidade independentemente do tamanho da tela.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://talentmatchbr.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a2f35aa1-3dec-4e13-8cc0-9b41fa4e1ff3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
