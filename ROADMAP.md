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
| 4 | Núcleo operacional | Estoque & Lotes ✅, Alertas ✅ | ✅ |
| 5 | Inteligência preditiva | Previsão, Recomendações | ✅ |
| 6 | Visão gerencial | Dashboard, Operacional, Indicadores, Relatórios | ✅ |
| 7 | Dados & Integração | Ingestão, Integração EMSERH, IA | ✅ |
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
| ✅ | Alertas (`/alertas`) | `/alertas` (+ `/limiares`) | 4 |
| ✅ | Previsão de Demanda (`/previsao`) | `/previsoes` | 5 |
| ✅ | Reposição & Redistribuição (`/recomendacoes`) | `/recomendacoes` | 5 |
| ✅ | Dashboard Gerencial (`/`) | `/painel` (+ `/indicadores`) | 6 |
| ✅ | Painel Operacional (`/operacional`) | `/painel/operacional` | 6 |
| ✅ | Indicadores (`/indicadores`) | `/indicadores` | 6 |
| ✅ | Relatórios (`/relatorios`) | `/indicadores`, `/painel` | 6 |
| ✅ | Ingestão de Dados (`/ingestao`) | `/ingestao` | 7 |
| ✅ | Integração EMSERH (`/integracao`) | `/integracoes` | 7 |
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

## ✅ Fase 4 — Núcleo operacional (Estoque & Alertas) *(concluída)*

**Objetivo:** as telas operacionais de maior uso diário, lendo dados reais com status do backend.

**✅ Estoque & Lotes (`/estoque`) — concluída:**
- Contract-check: a API já entrega tudo **denormalizado e pré-calculado** (nomes, `status` como
  `ok/atencao/critico`, `tipo` de movimentação, `diasParaVencer`, KPIs em `/resumo`) — **sem mudança
  no backend**. `StatusBadge` consome o `status` real (não recalcula).
- `lib/estoque.ts` (posições/resumo/detalhe/lotes) + `hooks/use-estoque.ts` (query keys).
- `EstoquePage` reescrita: KPIs do resumo, tabela de posições, aba de validade, drill-down por
  query; estados de carregando/erro/vazio. **Mock removido da tela** (não importa mais `src/data`).
- **Paginação server-side (back + front):** `/estoque`, `/lotes` e `/movimentacoes` agora paginam no
  **servidor** (`page`/`size`/`sort`, default 10/página), com filtro e ordenação no banco. O `status`
  derivado virou `Specification` (`EspecificacoesPosicao`) para paginar corretamente; o livro-razão do
  drill-down é limitado às 20 movimentações mais recentes. No front: `api.getPagina` (lê `data`+`total`),
  componente reutilizável `Paginacao` (com seleção de página) e `DataTable` com **modo servidor opt-in**
  (paginação/ordenação/busca conduzidas pela API, busca com debounce). Backend `./mvnw verify` verde.
- **Correção de cache:** `staleTime` do React Query ajustado para **stale-while-revalidate** (revisitar
  uma tela mostra o cache na hora e revalida) — antes (30s) revisitar dentro da janela não refazia a requisição.
- Testes (+16): serviço, hook, `Paginacao` e `EstoquePage` (KPIs, drill-down, paginação server-side de
  posições e de validade, erro); backend: teste de paginação no `EstoqueIT`.

**✅ Alertas (`/alertas`) — concluída:**
- Contract-check encontrou **uma lacuna real no backend**: a aba "Configuração de limiares"
  (RF-ALE-03) não tinha endpoint — o mock era decorativo. **Backend implementado:** migration
  `V12__limiar_alerta.sql` (config singleton), entidade `LimiarAlerta` (validações cruzadas),
  `GET/PUT /alertas/limiares` (PUT restrito a **Gestor**, com **auditoria** `ALTERAR_LIMIAR_ALERTA`),
  e o **motor (`GeradorAlerta`) passou a usar os limiares salvos** (percentual do estoque mínimo,
  bandas de severidade, janela de vencimento e toggles por tipo) — salvar limiar muda de fato a
  próxima geração. `GET /alertas` paginado (`Pageable` + countQuery, fetch joins to-one).
- **Front:** `lib/alertas.ts` + `hooks/use-alertas.ts` (queries + 3 **mutations** com invalidação:
  tratar status, gerar, salvar limiares). `AlertasPage` reescrita: KPIs reais (o "Tratados" era um
  `"38"` cravado no mock), tabela server-side com ações **Tratar/Resolver** por linha, botão
  **Gerar alertas** visível só para Gestor (RBAC espelhado), formulário de limiares **real**
  (somente leitura para não-Gestor) e histórico paginado. Toasts de sucesso/erro (sonner).
- `api.ts` ganhou `put`/`patch` e a paginação compartilhada (`ParamsPaginacao` movida para `api.ts`).
- Testes: front +17 (serviço, hooks com invalidação, página: mutation, RBAC dos dois perfis,
  limiares, filtro por rótulo, erro); back: `CalculadoraAlertaTest` parametrizado + 7 casos novos
  no `AlertaIT` (paginação, GET/PUT limiares, 403 Operador, 422 banda incoerente, 400 faixa,
  toggle desligado zera a geração do tipo).

**Endpoints:** `GET /estoque` · `/estoque/resumo` · `/estoque/{med}/{uni}` · `GET /lotes`
· `GET /alertas` · `/alertas/resumo` · `PATCH /alertas/{id}/status` · `POST /alertas/gerar` *(Gestor)*.

> **Nota:** o mock de estoque permanece em `src/data/index.ts` porque ainda **gera internamente**
> os alertas/recomendações/`totais` usados por outras telas mockadas; sai quando Alertas (Fase 4),
> Recomendações (Fase 5) e os dashboards (Fase 6) migrarem.

---

## ✅ Fase 5 — Inteligência preditiva (Previsão & Recomendações) *(concluída)*

**Objetivo:** telas guiadas por ML, incluindo **ações de decisão** (perfil Gestor).

**✅ Previsão (`/previsao`) — concluída:**
- Contract-check: a API já entrega tudo **denormalizado e pré-calculado** — resumo (`mapeMedio`,
  `criticosNaMeta`/`totalCriticos`, `previsoesAtivas`, `itensComDesvio`), lista com nomes/criticidade/
  modelo/`drift` e a série temporal por item. **Sem mudança no backend.** O front consome o status
  pronto (some `mapeStatus`/`driftStatus`/`insightPrevisao` que reimplementavam regra).
- `lib/previsoes.ts` (listar/resumo/detalhar/recalibrar) + `hooks/use-previsoes.ts` (query keys,
  detalhe `enabled` por med/unidade, **mutation** de recalibrar com invalidação).
- **Paginação server-side (back + front):** `GET /previsoes` passou a paginar no **servidor**
  (`page`/`size`/`sort`, default 10/página) — `buscarComFiltros` virou `Page` com `countQuery`
  (fetch joins to-one), controller com `@PageableDefault(sort = "medicamento.nome")`. No front,
  `previsoesApi.listar` usa `getPagina` e a `DataTable` roda em **modo servidor** (paginação,
  ordenação por coluna e busca com debounce conduzidas pela API).
- `PrevisaoPage` reescrita: KPIs do resumo, gráfico real da série (`ForecastChart` desacoplado de
  `src/data` via novo `fmtPeriodoMes`), tabela com seleção de linha → série; estados de
  carregando/erro/vazio. Botão **Recalibrar** visível só para Gestor (RBAC espelhado), com toast e
  tratamento de 403. **Mock removido da tela** (não importa mais `src/data`).
- **Decisão de produto:** o painel "Composição da previsão" (ensemble/validação/versões) **não tem
  endpoint** e fica **fora do escopo desta fase** — mantido com **dados ilustrativos**, marcado
  visivelmente na UI ("Dados ilustrativos") e com nota no código. Migra quando o backend expuser.
- Testes (+18): serviço (envelope, filtros, detalhe, recalibrar, 403), hooks (lista, detalhe
  `enabled`, invalidação) e página (KPIs, seleção→série, recalibrar Gestor, 403 Operador sem botão,
  vazio, erro, marcação de mock).

**✅ Recomendações (`/recomendacoes`) — concluída:**
- Contract-check: a API entrega tudo denormalizado (cards com medicamento/origem→destino, motor,
  prioridade, economia R$, status) + resumo (`pendentes`, `economiaPotencial`, `geradasPorIA`,
  `taxaAdesao`) — o front consome, não recalcula (o mock computava os KPIs no cliente).
- **Paginação server-side (back + front):** `GET /recomendacoes` passou a paginar (`page`/`size`/`sort`,
  default 10/pág., `economiaEstimada` desc) — `buscarComFiltros` virou `Page` com `countQuery`
  (fetch joins to-one). No front, `getPagina` + `<Paginacao>` sob a grade de cards.
- `lib/recomendacoes.ts` + `hooks/use-recomendacoes.ts` (queries + 3 **mutations** com invalidação:
  aprovar, executar, gerar). `RecomendacoesPage` reescrita: KPIs reais, filtro por tipo (tabs →
  servidor), ciclo **Aprovar → Executar** por card (Gestor; RBAC espelhado), botão **Gerar**
  (Gestor), toasts e tratamento de 403/422. **Mock removido da tela** (não importa mais `src/data`).
- **Decisão de produto:** o painel "Desempenho do módulo" (assertividade/redistribuições/cobertura)
  não tem endpoint → mantido como **dados ilustrativos**, marcado na UI e com nota no código.
- Testes: front +21 (serviço com 422/403, hooks com invalidação, página: aprovar/executar/gerar,
  RBAC de Operador, filtro por tipo, paginação, erro, marcação de mock); back: `RecomendacaoIT` +1
  (paginação) — **12/12 verde** no `./mvnw verify`.

**Endpoints:** `GET /previsoes` (+resumo/série) · `POST /previsoes/recalibrar` · `GET /recomendacoes`
(+resumo) · `POST /recomendacoes/{id}/aprovar` · `/executar` · `/recomendacoes/gerar`.

**DoD:** séries e KPIs reais; fluxos de decisão testados (sucesso + 403 para perfil sem permissão);
mocks de previsão/recomendação removidos.

---

## ✅ Fase 6 — Visão gerencial (Dashboard, Operacional, Indicadores, Relatórios) *(concluída)*

**Objetivo:** as agregações de gestão, que dependem dos domínios anteriores.

**✅ Dashboard Gerencial (`/`) — concluída:**
- Contract-check: a tela é coberta por **`/painel`** (totais da rede, cobertura por unidade, série
  agregada, filas de alertas/recomendações) **+ `/indicadores`** (os 4 KPIs do topo + o gauge MAPE).
  **Sem mudança no backend.** Os "147 desabastecimentos evitados" antes cravados viram o indicador
  real `ind-rupturas-evitadas`; sumiram os `AiInsight`/`insights` que recalculavam no cliente.
- `lib/painel.ts` (dashboard) + `lib/indicadores.ts` (listar/resumo/detalhar + `formatarValorIndicador`)
  + `hooks/use-painel.ts` e `hooks/use-indicadores.ts` (query keys; detalhe `enabled` por código).
- `DashboardPage` reescrita: KPIs de `/indicadores` (delta a partir do `variacaoPct` real), gráfico
  da série agregada, gauge de assertividade, cobertura por unidade, filas de alertas e recomendações
  com nomes denormalizados; estados de carregando/erro por seção. **Mock removido** (não importa `src/data`).
- Testes (+16): serviços (`painel`, `indicadores` com 404 e formatador), hooks (painel, indicadores
  com `enabled`), página (KPIs, série, evitados reais, cobertura/alertas, erro de `/painel` e `/indicadores`).

**✅ Painel Operacional (`/operacional`) — concluída:**
- Contract-check: coberto 100% por **`/painel/operacional`** (`PainelOperacionalResponse`: totais,
  situação por unidade `ResumoUnidadeResponse`, fila de alertas ativos e recomendações em aberto).
  **Sem mudança no backend.** Listas são top-N de painel (sem paginação, como as filas do dashboard);
  o `statusUnidade` vem pronto (some o `criticos > 3 ? ...` que o mock recalculava).
- Estendido `lib/painel.ts` (`operacional()` + tipos `PainelOperacional`/`ResumoUnidade`) e
  `hooks/use-painel.ts` (`usePainelOperacional`). `OperacionalPage` reescrita: KPIs reais (KPI de
  alertas usa **`alertasAtivos`**, coerente com Dashboard e tela de Alertas), situação por unidade,
  filas de alertas/recomendações com nomes denormalizados; estados carregando/erro/vazio; ações de
  decisão linkam para `/alertas` e `/recomendacoes` (leitura aqui). **Mock removido** (não importa `src/data`).
- Testes (+5): serviço (`operacional`), hook, página (KPIs, unidades com status pronto, filas, erro).

**✅ Indicadores (`/indicadores`) — concluída:**
- Contract-check: coberto por **`/indicadores`** (lista com `progresso`/`atingiu`/`variacaoPct`/`historico`
  **prontos** — o front para de recalcular) + **`/indicadores/resumo`** (KPIs total/atingidas/em progresso).
  **Sem mudança no backend.** O `lib/indicadores.ts` já existia (da etapa do Dashboard) — só faltava UI.
- `IndicadoresPage` reescrita: KPIs do resumo, cards por indicador (valor/base/meta + série `TrendChart`
  + progresso do backend), e o **comparativo piloto × sistema atual (RF-IND-06)** agora usa **dados reais**
  (baseline × atual × `variacaoPct`), não mais valores hardcoded. `TrendChart` desacoplado de `src/data`
  (via `fmtPeriodoMes`); saiu o `AiInsight`/`insights`. **Mock removido** (não importa `src/data`).
- **Decisão de produto:** painel "Coleta e consolidação" (cadência, sem endpoint) mantido como
  **dados ilustrativos**, marcado na UI e com nota no código.
- Testes (+6): página (KPIs do resumo, cards com status do backend, comparativo com variação real,
  marcação de mock, erro da lista e do resumo).

**✅ Relatórios (`/relatorios`) — concluída:**
- Contract-check: a tela é majoritariamente **demo** (catálogo de relatórios, exportação e marcos OPED
  **não têm endpoint**). O dado real cabível é a **composição** de `/painel` (totais) + `/indicadores/resumo`.
  **Sem mudança no backend.** Reaproveita `lib/painel.ts`, `lib/indicadores.ts` e `useUnidades`.
- `RelatoriosPage` reescrita: novo **Resumo executivo** real (metas atingidas, economia potencial, itens
  críticos, alertas ativos — de `/painel` + `/indicadores/resumo`), filtro de unidade alimentado por
  `/unidades`; catálogo de relatórios, exportação (toasts demo) e painel OPED **mantidos e marcados
  "Dados ilustrativos"**. `TrendChart` já desacoplado de `src/data`. **Mock removido** (não importa `src/data`).
- Testes (+5): página (resumo executivo composto, filtro de unidade real, marcação de mock, export demo, erro).

> **10 das 12 telas já largaram o `src/data`** (Login + Fases 3–7). Restam mockadas as telas da
> Fase 8 (Segurança/LGPD, Admin de usuários). O mock de `src/data` e os resíduos de
> `lib/insights.ts`/`status.ts` só são **apagados** quando a última tela migrar (Fase 9).

**Endpoints:** `GET /painel` · `/painel/operacional` · `/indicadores` · `/indicadores/resumo` · `/indicadores/{codigo}`.

**DoD:** dashboards em dados reais; KPIs/cards consomem o resumo do backend; mocks de painel/indicadores removidos.

---

## ✅ Fase 7 — Dados & Integração (Ingestão, Integração EMSERH, IA) *(concluída)*

**Objetivo:** telas de governança de dados e saúde das integrações (somente leitura) + assistente de IA.

**✅ Ingestão (`/ingestao`) — concluída:**
- Contract-check: coberta 100% por **`/ingestao/fontes|qualidade|resumo`** — fontes (status/volume/
  qualidade/procedência), maturidade por família e os 4 KPIs **prontos** (o front parou de somar no
  cliente). **Sem mudança no backend.**
- `lib/ingestao.ts` (fontes/qualidade/resumo, tipos espelhando os DTOs) + `hooks/use-ingestao.ts`
  (query keys). `IngestaoPage` reescrita: KPIs do resumo, lista de fontes com `StatusBadge` real,
  cartões de qualidade por família; estados de carregando/erro/vazio por seção. **Mock removido**
  (não importa `src/data`).
- **Decisão de produto:** "Sazonalidade epidemiológica" (RF-DAD-05) e "Linha de base consolidada"
  (RF-DAD-08) não têm endpoint → mantidas como **dados ilustrativos**, marcadas na UI e com nota no código.

**✅ Integração EMSERH (`/integracao`) — concluída:**
- Contract-check: coberta 100% por **`/integracoes|/resumo|/provedores-ia`** — conexões (status/latência/
  modo/buffer), KPIs prontos e provedores do AI Gateway (papel/custo/anonimização). **Sem mudança no backend.**
- `lib/integracoes.ts` + `hooks/use-integracoes.ts` (query keys). `IntegracaoPage` reescrita: KPIs do
  resumo, lista de conexões com status+modo reais, cards de provedores; carregando/erro/vazio por seção.
  **Mock removido** (não importa `src/data`). Os toggles de "Resiliência" e o botão "Exportar OpenAPI"
  (sem endpoint) viraram **read-only** (status, não controle falso), marcados "Dados ilustrativos"; o
  estado `ativo`/`anonimização` do provedor é exibido como selo (não há mutation).

**✅ IA — assistente flutuante (RF-INT-06) — concluída:**
- `lib/ia.ts` (`chat`) + `hooks/use-ia.ts` (**mutation** — cada turno envia o histórico). Novo
  componente **`AssistenteIa`** flutuante no `AppShell` (presente em toda tela autenticada): painel de
  chat consumindo `POST /ia/chat`, com estado inicial/sugestões, indicador "pensando", **selo "Modo demo"**
  quando o backend responde sem provedor, e tratamento de erro (toast + devolve a pergunta ao campo).
  A anonimização LGPD (RF-SEG-04) é do backend; a UI sinaliza isso.

- **Limpeza:** `fontes`/`qualidadeFamilias`/`integracoes`/`provedoresIA` saíram de `src/data` e os tipos
  órfãos (`FonteDado`/`QualidadeFamilia`/`IntegracaoAPI`/`ProvedorIA`) saíram de `src/types`.
- **Testes (+26):** serviços (`ingestao`, `integracoes`, `ia` — request certa, erro), hooks (ingestão +
  integração), páginas (KPIs reais, listas com status do backend, marcação de mock, erro) e o
  `AssistenteIa` (abre, envia→resposta+selo demo, erro devolve a pergunta). Front verde: `tsc -b`, `lint`, `vitest`.

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
