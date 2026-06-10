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
| 2 | Fundação técnica & qualidade | (sem tela) testes + camada de dados | ⬜ |
| 3 | Catálogo base | Unidades, Medicamentos | ⬜ |
| 4 | Núcleo operacional | Estoque & Lotes, Alertas | ⬜ |
| 5 | Inteligência preditiva | Previsão, Recomendações | ⬜ |
| 6 | Visão gerencial | Dashboard, Operacional, Indicadores, Relatórios | ⬜ |
| 7 | Dados & Integração | Ingestão, Integração EMSERH, IA | ⬜ |
| 8 | Segurança & Administração | Auditoria/LGPD, Admin de usuários | ⬜ |
| 9 | Hardening & produção | Tudo (remoção final do mock, cobertura, prod) | ⬜ |

A ordem segue a dependência entre domínios: catálogo (unidade/medicamento) antes dos consumidores
(estoque, previsão, alerta, recomendação), e as agregações (painel/indicadores) depois das fontes.

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

**Pendência técnica (fechar na Fase 2):** ainda **não há testes automatizados** para esta camada;
eles serão escritos junto com a fundação de testes, validando o molde em código real.

---

## ⬜ Fase 2 — Fundação técnica & qualidade

**Objetivo:** montar os trilhos para integrar com segurança e testar tudo. **Nenhuma tela migrada
ainda** — só a infraestrutura, provada nos testes da camada de auth.

**Escopo:**
1. **Estado de servidor:** adicionar **TanStack Query** (`@tanstack/react-query`); criar o
   `QueryClientProvider` no `main.tsx`; definir convenção de **query keys** por domínio e política
   de retry/erro (não dar retry em 401/403/422).
2. **Infra de testes:** **Vitest** + **jsdom** + **Testing Library** (`@testing-library/react`,
   `user-event`, `jest-dom`) + **MSW** (handlers que simulam o envelope da API). Script `test` no
   `package.json`; `setupTests` global.
3. **Tratamento de erro transversal:** mapear `ApiError` → toast/inline padrão; 401 global encerra a
   sessão e manda para `/login`; helper de RBAC (`usePerfil`/`<RequirePerfil>`).
4. **Tipos:** alinhar `src/types` aos DTOs reais do backend (conferir no Swagger/GUIA-API).
5. **Provar o molde:** escrever os **testes da camada de auth** já existente — `api.ts` (envelope,
   ApiError, 401, falha de rede), `auth-storage.ts`, `AuthContext` (restauração de sessão), `LoginPage`
   (sucesso, credencial inválida, mostrar/ocultar senha) e `ProtectedRoute`.

**Decisão a confirmar:** adoção do **TanStack Query** como padrão de estado de servidor (recomendado).

**DoD:** `npm run test` verde com a suíte de auth cobrindo sucesso e erro; QueryClient ativo; lint/build limpos.

---

## ⬜ Fase 3 — Catálogo base (Unidades & Medicamentos)

**Objetivo:** trocar o catálogo mockado pela API. É a base referenciada por quase todas as telas
(seletores de unidade/medicamento no header e nos filtros).

**Escopo:**
- `lib/unidades.ts` + `lib/medicamentos.ts` (listar, detalhar, filtros pt-BR).
- `hooks/use-unidades.ts` + `hooks/use-medicamentos.ts` (queries com cache).
- Substituir `unidadesAtendidas`/catálogo do `src/data` no **seletor de unidade do header** e onde mais
  for consumido; remover o mock correspondente.
- Estados de carregando/erro/vazio nos seletores.

**Endpoints:** `GET /unidades` (+filtros) · `GET /medicamentos` (+filtros) · `GET .../{id}`.
*(escrita de catálogo é da Fase 8 — perfil TI.)*

**DoD:** seletores e filtros consomem a API; testes de serviço+hook+seletor verdes; mock de catálogo removido.

---

## ⬜ Fase 4 — Núcleo operacional (Estoque & Alertas)

**Objetivo:** as telas operacionais de maior uso diário, lendo dados reais com status do backend.

**Escopo:**
- **Estoque & Lotes (`/estoque`):** posições com status, KPIs do resumo, drill-down por item
  (lotes + movimentações). `lib/estoque.ts`, `hooks/use-estoque.ts`.
- **Alertas (`/alertas`):** lista com filtros, resumo, **tratar status** (`PATCH .../status`:
  Aberto→Em tratamento→Resolvido). `lib/alertas.ts`, `hooks/use-alertas.ts` (mutation + invalidação).
- Usar **status/severidade que vêm do backend** (não recalcular). `StatusBadge` consome o valor real.

**Endpoints:** `GET /estoque` · `/estoque/resumo` · `/estoque/{med}/{uni}` · `GET /lotes` · `GET /movimentacoes`
· `GET /alertas` · `/alertas/resumo` · `PATCH /alertas/{id}/status` · `POST /alertas/gerar` *(Gestor)*.

**DoD:** ambas as telas em dados reais; mutation de alerta testada (incl. invalidação); RBAC do "gerar"
escondido para não-Gestor; mocks de estoque/alerta removidos.

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
