# ROADMAP — Integração Frontend × API · Smart Health CAHOSP

Plano de evolução do frontend: sair dos **dados mockados** (`src/data`) e integrar com a **API real**
(backend Spring Boot, já 100% pronto e testado), domínio a domínio, com qualidade de desenvolvedor
sênior — seguro, sem gambiarra, testado.

> **Regras de execução:** ver [`CLAUDE.md`](CLAUDE.md). **Contrato da API:** ver
> [`../smarthealth-farm-backend/docs/GUIA-API.md`](../smarthealth-farm-backend/docs/GUIA-API.md).
> Uma fase por vez, na ordem de dependência. Nenhuma fase fecha sem a *Definition of Done* (CLAUDE §9).

**Legenda:** ✅ concluída · 🚧 em andamento · ⬜ pendente

---

## Visão geral

| Fase | Tema | Telas / Domínios | Status |
|---|---|---|---|
| 1 | Autenticação & Acesso | Login, sessão, rotas protegidas | ✅ |
| 2 | Fundação técnica & qualidade | (sem tela) testes + camada de dados | ✅ |
| 3 | Catálogo base | Unidades, Medicamentos | ✅ |
| 4 | Núcleo operacional | Estoque & Lotes ✅, Alertas ⬜ | 🚧 |
| 5 | Inteligência preditiva | Previsão, Recomendações | ⬜ |
| 6 | Visão gerencial | Dashboard, Operacional, Indicadores, Relatórios | ⬜ |
| 7 | Dados & Integração | Ingestão, Integração EMSERH, IA | ⬜ |
| 8 | Segurança & Administração | Auditoria/LGPD, Admin de usuários | ⬜ |
| 9 | Hardening & produção | Tudo (remoção final do mock, cobertura, prod) | ⬜ |

A ordem segue a dependência entre domínios: catálogo (unidade/medicamento) antes dos consumidores
(estoque, previsão, alerta, recomendação), e as agregações (painel/indicadores) depois das fontes.

---

## Rastreamento de telas (mock → API)

Marcar a tela quando ela **deixar de usar `src/data`** e passar a consumir a API. "Mock removido"
significa: a tela não importa mais de `src/data`, com estados de carregando/erro/vazio e testes.

| ✓ | Tela (rota) | Domínio(s) da API | Fase alvo |
|---|---|---|---|
| ✅ | Login (`/login`) | `/auth` (sem mock — nasceu integrado) | 1 |
| ✅ | Header · seletor de unidade (`AppShell`) | `/unidades` | 3 |
| ✅ | Estoque & Lotes (`/estoque`) | `/estoque`, `/lotes`, `/movimentacoes` | 4 |
| ⬜ | Alertas (`/alertas`) | `/alertas` | 4 |
| ⬜ | Previsão de Demanda (`/previsao`) | `/previsoes` | 5 |
| ⬜ | Reposição & Redistribuição (`/recomendacoes`) | `/recomendacoes` | 5 |
| ⬜ | Dashboard Gerencial (`/`) | `/painel` | 6 |
| ⬜ | Painel Operacional (`/operacional`) | `/painel/operacional` | 6 |
| ⬜ | Indicadores (`/indicadores`) | `/indicadores` | 6 |
| ⬜ | Relatórios (`/relatorios`) | `/indicadores`, `/painel` | 6 |
| ⬜ | Ingestão de Dados (`/ingestao`) | `/ingestao` | 7 |
| ⬜ | Integração EMSERH (`/integracao`) | `/integracoes` | 7 |
| ⬜ | Segurança & LGPD (`/seguranca`) | `/seguranca/auditoria` | 8 |
| ⬜ | Administração (`/admin`) | `/admin/usuarios`, `/auth` | 8 |

> **Estado atual (pós-Fase 3):** as **12 telas** ainda consomem `src/data`. A Fase 3 trocou apenas
> o seletor de unidade do header — nenhuma tela teve o mock removido ainda.
>
> **Como migramos daqui em diante (fatia vertical — CLAUDE.md §10):** uma tela por vez, removendo o
> mock dela **na mesma passada** em que integra a API. Se a API não tiver o que a tela precisa, o
> backend é corrigido primeiro (lendo o CLAUDE.md dele, com testes). Front e back **verdes** antes de
> marcar a tela. A Fase 9 vira só uma **varredura de segurança**, não o lugar onde o mock "finalmente" sai.

---

## ✅ Fase 1 — Autenticação & Acesso *(concluída)*

**Objetivo:** entrar no sistema com a API real e proteger o app.

**Entregue:**
- `src/lib/api.ts` — cliente HTTP: base URL, `Bearer`, desembrulho do envelope, `ApiError` normalizada.
- `src/lib/auth.ts` — serviço (`login`, `me`, `logout`) · `src/lib/auth-storage.ts` — token (local/session).
- `src/context/auth.tsx` — `AuthProvider`/`useAuth`, restauração de sessão via `GET /auth/me`.
- `src/pages/LoginPage.tsx` — tela de login (na identidade institucional, acessível).
- `src/components/auth/ProtectedRoute.tsx` + rota `/login` + header com usuário real e logout.
- `.env` / `.env.example` com `VITE_API_URL`.

**Endpoints:** `POST /auth/login` · `GET /auth/me` · `POST /auth/logout`.

> Esta fase é o **molde** das próximas: todo domínio repete o padrão serviço → hook → UI testada.

---

## ✅ Fase 2 — Fundação técnica & qualidade *(concluída)*

**Objetivo:** montar os trilhos para integrar com segurança e testar tudo. Nenhuma tela migrada —
só a infraestrutura, **provada nos testes da camada de auth**.

**Entregue:**
- **Estado de servidor:** **TanStack Query** adicionado. `src/lib/query-client.ts`
  (`criarQueryClient`) com política de retry que **não repete em erro 4xx**; `QueryClientProvider`
  no `main.tsx`. *(As query keys e o uso por domínio entram na Fase 3, com as primeiras queries.)*
- **Infra de testes:** **Vitest** + **jsdom** + **Testing Library** + **MSW**. Vive em `src/test/`:
  `handlers.ts` (envelope real da API), `server.ts`, `setup.ts` (ciclo de vida + polyfills do jsdom)
  e `utils.tsx` (helper `renderizar` com todos os providers). Scripts `test`/`test:run`/`coverage`.
- **RBAC na UI:** helper `usePerfil()` no `AuthContext` (espelha o perfil; a barreira real é o backend).
- **Tipos:** `src/types` conferidos contra os DTOs do backend (alinhados).
- **Molde testado — 28 testes verdes:** `api.ts` (envelope, ApiError, 401, falha de rede, Bearer),
  `auth-storage.ts`, `authApi`, `AuthContext` (restauração de sessão, login, logout), `LoginPage`
  (validação, credencial inválida, mostrar/ocultar senha, redirecionamento) e `ProtectedRoute`.
- **Baseline de qualidade:** `tsc -b`, `eslint` (0 erros) e `vitest` limpos; config do ESLint
  ajustada ao padrão shadcn/testes.

**Decisão confirmada:** **TanStack Query** é o padrão de estado de servidor do projeto.

> **Ainda pendente para a Fase 3:** o handler global de 401 vindo de *queries* (encerrar sessão →
> `/login`) será ligado quando existirem as primeiras queries autenticadas.

---

## ✅ Fase 3 — Catálogo base (Unidades & Medicamentos) *(concluída)*

**Objetivo:** trocar o catálogo mockado pela API. É a base referenciada por quase todas as telas
(seletores de unidade/medicamento no header e nos filtros).

**Entregue:**
- **Tipos alinhados ao DTO real:** `Unidade` ganhou `hub`/`ativo`; `Medicamento` ganhou
  `codigo`/`ativo` (espelham `UnidadeResponse`/`MedicamentoResponse`). Mock conformado.
- **Serviços:** `lib/unidades.ts` e `lib/medicamentos.ts` (listar + filtros pt-BR + detalhar),
  com o helper `montarQuery` em `lib/api.ts` (ignora filtros vazios; reutilizável por todos os domínios).
- **Hooks:** `hooks/use-unidades.ts` e `hooks/use-medicamentos.ts` com **query keys** por domínio
  (`unidadesKeys`/`medicamentosKeys`) — convenção das próximas fases.
- **Componente reutilizável:** `components/shared/UnidadeSelect.tsx` (carregando/erro/vazio),
  ligado ao **seletor de unidade do header** — o mock `unidadesAtendidas` saiu do header.
- **Testes (40 no total, +12):** serviços (envelope, filtros na query, detalhar), hooks
  (sucesso + erro) e `UnidadeSelect` (abre, lista atendidas excluindo o hub, estado de erro).

**Endpoints:** `GET /unidades` (+filtros) · `GET /medicamentos` (+filtros) · `GET .../{id}`.
*(escrita de catálogo é da Fase 8 — perfil TI.)*

> **Nota de migração:** o mock de catálogo **ainda vive em `src/data`** porque as telas mockadas
> (estoque, previsão, etc.) o usam para resolver nomes por id. Pelo fluxo de fatia vertical
> (CLAUDE.md §10), **cada tela que migra passa a usar os hooks de catálogo da API** (`useUnidades`/
> `useMedicamentos`) e larga o `src/data`; os arquivos de catálogo são **apagados assim que nenhuma
> tela os importar** (durante as Fases 4–6, não adiado para o fim). Nesta fase migramos só o header.

---

## 🚧 Fase 4 — Núcleo operacional (Estoque & Alertas)

**Objetivo:** as telas operacionais de maior uso diário, lendo dados reais com status do backend.

**✅ Estoque & Lotes (`/estoque`) — concluída:**
- Contract-check: a API já entrega tudo **denormalizado e pré-calculado** (nomes, `status` como
  `ok/atencao/critico`, `tipo` de movimentação, `diasParaVencer`, KPIs em `/resumo`) — **sem mudança
  no backend**. `StatusBadge` consome o `status` real (não recalcula).
- `lib/estoque.ts` (posições/resumo/detalhe/lotes) + `hooks/use-estoque.ts` (query keys).
- `EstoquePage` reescrita: KPIs do resumo, tabela de posições, aba de validade, drill-down por
  query; estados de carregando/erro/vazio. **Mock removido da tela** (não importa mais `src/data`).
- **Paginação:** novo componente reutilizável `components/shared/Paginacao.tsx` com **seleção de
  página** (números + anterior/próxima); a aba "Controle de validade" passou a paginar e a `DataTable`
  ganhou seleção de página. A **API não é paginada** (retorna a lista completa) → paginação no cliente.
- Testes (+14): serviço, hook, `Paginacao` e `EstoquePage` (KPIs, drill-down, paginação da validade, erro).

**⬜ Alertas (`/alertas`) — pendente:** lista com filtros, resumo, **tratar status**
(`PATCH .../status`: Aberto→Em tratamento→Resolvido) — primeira **mutation** com invalidação de cache;
`POST /alertas/gerar` restrito a Gestor (RBAC na UI). `lib/alertas.ts`, `hooks/use-alertas.ts`.

**Endpoints:** `GET /estoque` · `/estoque/resumo` · `/estoque/{med}/{uni}` · `GET /lotes`
· `GET /alertas` · `/alertas/resumo` · `PATCH /alertas/{id}/status` · `POST /alertas/gerar` *(Gestor)*.

> **Nota:** o mock de estoque permanece em `src/data/index.ts` porque ainda **gera internamente**
> os alertas/recomendações/`totais` usados por outras telas mockadas; sai quando Alertas (Fase 4),
> Recomendações (Fase 5) e os dashboards (Fase 6) migrarem.

---

## ⬜ Fase 5 — Inteligência preditiva (Previsão & Recomendações)

**Objetivo:** telas guiadas por ML, incluindo **ações de decisão** (perfil Gestor).

**Escopo:**
- **Previsão (`/previsao`):** lista, resumo (MAPE), série temporal completa por item (gráfico real),
  `POST /previsoes/recalibrar` *(Gestor)*.
- **Recomendações (`/recomendacoes`):** lista/filtros, resumo, ciclo **aprovar → executar**
  *(Gestor)*, `POST /recomendacoes/gerar` *(Gestor)*.
- Mutations com invalidação de cache; feedback (toast) e tratamento de 403/422.

**Endpoints:** `GET /previsoes` (+resumo/série) · `POST /previsoes/recalibrar` · `GET /recomendacoes`
(+resumo) · `POST /recomendacoes/{id}/aprovar` · `/executar` · `/recomendacoes/gerar`.

**DoD:** séries e KPIs reais; fluxos de decisão testados (sucesso + 403 para perfil sem permissão);
mocks de previsão/recomendação removidos.

---

## ⬜ Fase 6 — Visão gerencial (Dashboard, Operacional, Indicadores, Relatórios)

**Objetivo:** as agregações de gestão, que dependem dos domínios anteriores.

**Escopo:**
- **Dashboard (`/`)** e **Operacional (`/operacional`)** via `/painel` e `/painel/operacional`
  (totais da rede, cobertura, série agregada, filas de alertas/recomendações).
- **Indicadores (`/indicadores`)** via `/indicadores` (+resumo, +drill-down).
- **Relatórios (`/relatorios`):** compõe `/indicadores` + `/painel` (sem endpoint próprio).

**Endpoints:** `GET /painel` · `/painel/operacional` · `/indicadores` · `/indicadores/resumo` · `/indicadores/{codigo}`.

**DoD:** dashboards em dados reais; KPIs/cards consomem o resumo do backend; mocks de painel/indicadores removidos.

---

## ⬜ Fase 7 — Dados & Integração (Ingestão, Integração EMSERH, IA)

**Objetivo:** telas de governança de dados e saúde das integrações (somente leitura) + assistente de IA.

**Escopo:**
- **Ingestão (`/ingestao`):** fontes, qualidade por família, resumo. `lib/ingestao.ts`.
- **Integração EMSERH (`/integracao`):** conexões, resumo, provedores de IA. `lib/integracoes.ts`.
- **IA (transversal):** `POST /ia/chat` (anonimização é do backend) — assistente onde aplicável.

**Endpoints:** `GET /ingestao/fontes|qualidade|resumo` · `GET /integracoes|/resumo|/provedores-ia` · `POST /ia/chat`.

**DoD:** telas em dados reais; chat de IA funcional (com modo demo do backend); mocks correspondentes removidos.

---

## ⬜ Fase 8 — Segurança & Administração (Auditoria & Usuários)

**Objetivo:** governança e o único módulo com **escrita sensível** + RBAC forte (TI).

**Escopo:**
- **Segurança & LGPD (`/seguranca`):** trilha de auditoria + resumo (leitura, **Gestor/TI**).
- **Administração (`/admin`):** CRUD de usuários (**TI**) — listar/filtrar, criar (e-mail único, senha ≥ 8),
  editar, **ativar/desativar** (sem DELETE), redefinir senha. Tratar 409 (e-mail duplicado) e 422
  (TI não se autodesativa). Escrita de **catálogo** (unidades/medicamentos, TI) se for do escopo da tela.
- RBAC rigoroso na UI (rotas/ações só para o perfil certo), espelhando o backend.

**Endpoints:** `GET /seguranca/auditoria` (+resumo) · `/admin/usuarios` (GET/POST/PUT/PATCH status/PUT senha).

**DoD:** formulários validados e testados (sucesso + 409/422 + 403 por perfil); auditoria em dados reais;
mocks de auditoria/usuários removidos.

---

## ⬜ Fase 9 — Hardening & produção

**Objetivo:** fechar com qualidade de produção.

**Escopo:**
- **Remover por completo `src/data`** (e `lib/insights.ts`/`status.ts` que recalculam o que a API entrega).
- Revisar todos os estados de carregando/erro/vazio; padronizar skeletons e estados vazios.
- Revisão de acessibilidade (contraste AA, foco, reduced-motion) e responsividade nas 12 telas.
- Cobertura de testes revisada (lib/hooks alta; fluxos críticos cobertos); CI opcional rodando os testes.
- `.env` de produção (`VITE_API_URL` real); build de produção validado; revisão de segurança
  (token, 401/403, nada de segredo no bundle).

**DoD:** zero mock no código; suíte verde; build de produção limpo; checklist de segurança/acessibilidade ok.

---

## Notas

- O backend pode mudar "uma coisa ou outra" sob demanda; quando o contrato não atender o front,
  **alinhar a mudança no backend** em vez de improvisar no front.
- Cada fase atualiza este arquivo (status na tabela + checkbox da fase) como parte da DoD.
