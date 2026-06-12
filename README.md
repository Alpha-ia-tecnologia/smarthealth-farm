# Smart Health CAHOSP — Frontend

Plataforma de **gestão preditiva da cadeia farmacêutica** da Central de Abastecimento
Hospitalar (CAHOSP / EMSERH-MA). Interface web moderna que cobre os **62 requisitos
funcionais** especificados no documento *Requisitos Funcionais Smart Health* (Edital
FAPEMA GovIA — Desafio Tecnológico 2).

> Esta é a camada de **frontend** com dados fictícios (mock) realistas. A camada de dados
> está isolada em `src/data` com tipos em `src/types`, pronta para ser substituída pela
> integração com as APIs da EMSERH.

## Stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (estilo *new-york*)
- **React Router** (rotas com code-splitting)
- **TanStack Query** (estado de servidor/API) · **TanStack Table** (tabelas densas)
- **Recharts** (gráficos) · **lucide-react** (ícones)
- **Vitest + Testing Library + MSW** (testes)
- Tema institucional "clínico & confiável" (azul/teal) com **modo claro/escuro**

## Como rodar

```bash
npm install
npm run dev      # ambiente de desenvolvimento (http://localhost:5173)
npm run build    # build de produção (typecheck + bundle)
npm run preview  # pré-visualizar o build
npm run lint     # ESLint
```

> O frontend conversa com a API em `http://localhost:3002/api` (configurável via `VITE_API_URL`
> no `.env`; veja `.env.example`). O CORS do backend libera `http://localhost:5173`, então rode
> o front nessa porta.

## Testes

Os testes usam **Vitest** (runner), **Testing Library** (renderiza e interage como o usuário) e
**MSW** (simula a API HTTP — nenhum teste depende do backend de pé).

```bash
npm run test       # modo watch (re-roda ao salvar)
npm run test:run   # roda uma vez (CI)
npm run coverage   # roda com relatório de cobertura
```

- Arquivos de teste ficam **co-localizados**: `algo.ts` → `algo.test.ts` (ou `.test.tsx`).
- A infraestrutura compartilhada vive em [`src/test/`](src/test/): `handlers.ts` (respostas
  simuladas da API no envelope real), `server.ts` (servidor MSW), `setup.ts` (ciclo de vida +
  polyfills do jsdom) e `utils.tsx` (helper `renderizar` com todos os providers do app).
- Para um caso de erro específico, sobrescreva o handler no próprio teste com `server.use(...)`.
- O que testar e o padrão por camada (serviço → hook → UI) estão no [`CLAUDE.md`](CLAUDE.md) (§8).

## Estrutura

```
src/
  components/ui/        primitivos shadcn/ui
  components/layout/    AppShell, Sidebar, Header
  components/charts/    ForecastChart, TrendChart, Gauge, Sparkline, BarCompare
  components/shared/    KpiCard, DataTable, StatusBadge, PageHeader, Section, RfTag…
  pages/                uma página por módulo (12 telas)
  data/                 mock data + agregações (substituível por API)
  types/                tipos de domínio
  lib/                  utils, format (pt-BR), status, navegação
```

## Cobertura dos Requisitos Funcionais

| Rota | Módulo | RFs |
|------|--------|-----|
| `/` | Dashboard Gerencial | RF-DASH-01 · RF-IND-01..04 |
| `/operacional` | Painel Operacional | RF-DASH-02 · RF-ALE · RF-REC |
| `/previsao` | Previsão de Demanda (ML) | RF-PRV-01..09 |
| `/estoque` | Estoque & Rastreabilidade por Lote | RF-EST-01..06 |
| `/alertas` | Alertas Operacionais | RF-ALE-01..05 |
| `/recomendacoes` | Reposição & Redistribuição | RF-REC-01..05 |
| `/relatorios` | Relatórios & Visualização | RF-DASH-03..07 |
| `/ingestao` | Ingestão, Tratamento e Anonimização | RF-DAD-01..08 |
| `/integracao` | Integração com Sistemas EMSERH | RF-INT-01..06 |
| `/seguranca` | Segurança, Auditoria e LGPD | RF-SEG-01..06 |
| `/admin` | Administração e Gestão de Usuários | RF-ADM-01..04 |
| `/indicadores` | Indicadores e Monitoramento | RF-IND-01..06 |

Cada card/seção exibe uma **tag de rastreabilidade** (ex.: `RF-PRV-02`) que referencia o
requisito correspondente no documento — passe o mouse para ver a descrição.
