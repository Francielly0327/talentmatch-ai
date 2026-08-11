# TalentMatch AI

> Plataforma inteligente para análise de vagas e criação de currículos personalizados e otimizados para sistemas ATS.

## Sobre o projeto

O **TalentMatch AI** é uma aplicação desenvolvida para auxiliar candidatos durante o processo de busca por oportunidades de emprego.

A plataforma analisa os requisitos de uma vaga, compara com o perfil profissional do candidato e auxilia na criação de versões personalizadas do currículo, destacando competências e palavras-chave relevantes para cada oportunidade.

O projeto foi desenvolvido como parte do bootcamp **Riachuelo - Criando Produtos com IA**, da **DIO — Digital Innovation One**.

## Funcionalidades

- 📄 **Importação de currículo em PDF** com extração automática das informações.
- 📝 **Criação e edição de currículos** a partir do zero ou utilizando dados importados.
- 🎯 **Análise de compatibilidade com vagas**, com cálculo de Match Score.
- 🔎 **Identificação de requisitos e palavras-chave** presentes na vaga.
- 📊 **Gap Analysis** para identificar competências que podem ser desenvolvidas.
- 🤖 **Otimização de currículo para ATS**, adaptando o conteúdo de acordo com a vaga.
- 📑 **Preview e exportação em PDF** com layout profissional e compatível com ATS.
- 👤 **Perfil profissional** com informações reutilizáveis na criação de diferentes currículos.
- 📱 **Interface responsiva**, desenvolvida para desktop e dispositivos móveis.

## Tecnologias

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

### Bibliotecas

- React Hook Form
- Zod
- TanStack Query
- Framer Motion
- Recharts
- pdfjs-dist

### Arquitetura de IA

A aplicação possui uma camada de serviços preparada para funcionalidades de Inteligência Artificial, como:

- Análise de vagas
- Extração de palavras-chave
- Cálculo de compatibilidade
- Identificação de competências
- Otimização de currículos
- Geração de currículos ATS Friendly

## Interface

O projeto utiliza uma interface moderna e minimalista, construída com **shadcn/ui**, com foco em clareza, acessibilidade e responsividade.

A identidade visual utiliza principalmente tons de:

- Azul claro
- Branco
- Amarelo claro

## Arquitetura

O projeto foi estruturado com componentes reutilizáveis e serviços desacoplados, facilitando futuras evoluções da aplicação.

Entre os principais serviços estão:

- `AIService` — funcionalidades relacionadas à IA
- `ResumeParserService` — processamento e extração de currículos
- `StorageService` — persistência dos dados

A aplicação utiliza **LocalStorage** na versão atual, mantendo a arquitetura preparada para uma futura integração com banco de dados e autenticação.

## Execução

Clone o repositório:

```bash
git clone https://github.com/SEU-USUARIO/talentmatch-ai.git
```

Instale as dependências:

```bash
npm install
```

Execute o projeto:

```bash
npm run dev
```

## Autora

**Francielly Almeida**

Projeto desenvolvido para fins educacionais e de portfólio.
