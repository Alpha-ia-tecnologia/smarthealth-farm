# CLAUDE.md — Smart Health CAHOSP (Frontend)

Guia de desenvolvimento deste repositório. Leia antes de qualquer mudança. O objetivo é um
projeto **profissional, seguro, sem gambiarra e com testes**, pronto para escalar sem dívida.

> **Companheiros de leitura:** [`PRODUCT.md`](PRODUCT.md) (estratégia/design), [`ROADMAP.md`](ROADMAP.md)
> (fases do projeto) e a documentação do backend em
> [`../smarthealth-farm-backend/docs/GUIA-API.md`](../smarthealth-farm-backend/docs/GUIA-API.md).

---

## 1. O que é

Frontend web da plataforma **Smart Health CAHOSP** — gestão preditiva da cadeia farmacêutica da
Central de Abastecimento Hospitalar (CAHOSP / EMSERH-MA). Cobre 12 telas e os 62 requisitos
funcionais (`RF-*`) do Edital FAPEMA GovIA.

**Estado atual:** a UI está construída com **dados mockados** em `src/data`. O objetivo do projeto
agora é **substituir o mock pela API real** (backend Spring Boot, já 100% pronto), domínio a
domínio, de forma segura e testada. O passo a passo está no [`ROADMAP.md`](ROADMAP.md).

A camada de autenticação (login, JWT, rotas protegidas) **já está integrada à API** e serve de
**molde** para todos os outros domínios: `src/lib/api.ts`, `src/lib/auth.ts`, `src/context/auth.tsx`.

---

## 2. Regras de ouro (inegociáveis)

1. **Sem gambiarra.** Nada de `any`, `@ts-ignore`, `as unknown as`, dados hardcoded para "passar",
   `setTimeout` para "esperar render", ou lógica duplicada. Se algo está difícil, o desenho está
   errado — pare e ajuste a abstração.
2. **Testes quase em tudo.** Toda lógica de dados (serviços, hooks, mapeamentos, guards de RBAC) e
   todo componente com comportamento (formulários, estados de erro/vazio, interações) tem teste.
   Não se considera uma tarefa "pronta" sem teste verde. Ver [§8](#8-padrão-de-testes).
3. **O backend é a fonte da verdade dos dados.** Status (ok/atenção/crítico), KPIs, severidade,
   dimensionamento, economia estimada — **tudo isso já é calculado no backend**. O front **consome**,
   não recalcula. Não reintroduza regra de negócio que a API já entrega (evita divergência).
4. **Segurança real.** Token só no storage definido em `auth-storage.ts`; nunca em código/log/URL.
   O RBAC do backend é a barreira de verdade; a UI **espelha** o perfil para esconder/mostrar, mas
   nunca confia só no cliente. Trate sempre 401 (sessão expirada → re-login) e 403 (sem permissão).
5. **Tipos corretos.** Os tipos do front espelham os DTOs do backend (`src/types`). Datas são
   strings ISO; dinheiro é número em R$ vindo do backend. Nada de `Date` solto ou `parseFloat` ad hoc.
6. **Português no domínio.** Nomes de domínio, rótulos e mensagens em pt-BR (o envelope técnico
   `success/data/error/codigo` fica em inglês, espelhando o backend). Acessibilidade AA sempre.
7. **Definition of Done** (ver [§9](#9-definition-of-done)) cumprida em cada tarefa, sem exceção.

---

## 3. Stack

| Camada | Tecnologia |
|---|---|
| Base | React 19 · TypeScript · Vite |
| Estilo | Tailwind CSS v4 · shadcn/ui (Radix) · `lucide-react` |
| Rotas | React Router 7 (code-splitting por página) |
| Tabelas / Gráficos | TanStack Table · Recharts |
| Estado de servidor (API) | **TanStack Query** *(proposto — ver ROADMAP Fase 2)* |
| Testes | **Vitest · Testing Library · MSW** *(proposto — ver ROADMAP Fase 2)* |
| Notificações | `sonner` (toasts) |

Backend: Spring Boot em `http://localhost:3002/api` (porta 3002, rotas sob `/api`). CORS liberado
para `http://localhost:5173` — **rode o front na 5173** (`npm run dev`) ou ajuste
`CORS_ALLOWED_ORIGINS` no `.env` do backend.

---

## 4. Comandos

```bash
npm run dev       # desenvolvimento (Vite) — porta 5173 (origem liberada no CORS do backend)
npm run build     # typecheck (tsc -b) + build de produção
npm run preview   # pré-visualizar o build
npm run lint      # ESLint
# npm run test    # Vitest (a ser adicionado na Fase 2)
```

O backend precisa estar de pé para a integração: na pasta do backend, `./mvnw spring-boot:run`
(requer JDK 21 + PostgreSQL). Swagger interativo em `http://localhost:3002/api/swagger-ui/index.html`.

---

## 5. Arquitetura em camadas

O fluxo de dados é unidirecional e cada camada tem uma responsabilidade única:

```
Backend (HTTP, envelope)
        │
src/lib/api.ts            ← cliente HTTP: base URL, Bearer, desembrulha o envelope, normaliza erro (ApiError)
        │
src/lib/<dominio>.ts      ← serviço do domínio: 1 função por endpoint, tipada (ex.: auth.ts, estoque.ts)
        │
src/hooks/<dominio>.ts    ← hooks TanStack Query: useQuery/useMutation, chaves de cache, invalidação
        │
src/pages / components    ← UI: consome hooks, trata loading/erro/vazio, espelha RBAC
```

Regras de camada:
- **Controller fino, serviço com a regra de transporte, UI burra de dados.** A página não chama
  `fetch` nem monta URL; ela usa um hook. O hook usa o serviço. O serviço usa `api`.
- **Nunca** exponha o envelope cru para a UI: `api.ts` já devolve só o `data`.
- **Um arquivo de serviço por domínio**, espelhando os domínios do [`GUIA-API.md`](../smarthealth-farm-backend/docs/GUIA-API.md):
  `auth`, `usuarios`, `unidades`, `medicamentos`, `estoque`, `previsoes`, `alertas`,
  `recomendacoes`, `indicadores`, `painel`, `ingestao`, `integracoes`, `auditoria`, `ia`.

### O contrato da API (resumo)

- **Envelope:** sucesso `{ success: true, data, total? }` · erro `{ success: false, error, codigo }`.
  `api.ts` lança `ApiError` (com `.status` e `.codigo`) em qualquer falha.
- **Auth:** `Authorization: Bearer <token>`. `GET /auth/me` revalida a sessão no boot.
- **RBAC:** `Operador` (leitura/operação), `Gestor` (decisões: aprovar/recalibrar/gerar), `TI`
  (administração: catálogo e usuários). Ler = qualquer logado.
- **Filtros por enum aceitam o rótulo pt-BR** (`?familia=Antibióticos`, `?status=Aberto`).
- **Códigos de erro estáveis** (use `ApiError.codigo`, não a string): `CREDENCIAIS_INVALIDAS`,
  `VALIDACAO`, `NAO_ENCONTRADO`, `CONFLITO`, `REGRA_NEGOCIO`, `ACESSO_NEGADO`, `NAO_AUTENTICADO`,
  `ERRO_INTERNO`, `REDE` (cliente — falha de conexão).

---

## 6. Estrutura de pastas

```
src/
  lib/
    api.ts            # cliente HTTP + ApiError (fonte única de fetch)
    auth.ts           # serviço de autenticação (molde dos demais serviços)
    auth-storage.ts   # persistência do token (local vs session)
    <dominio>.ts      # um serviço por domínio (a criar por fase)
    utils.ts, format.ts, status.ts, nav.ts
  hooks/
    use-theme.tsx
    <dominio>.ts      # hooks TanStack Query por domínio (a criar por fase)
  context/
    auth.tsx          # AuthProvider + useAuth
  components/
    ui/               # primitivos shadcn/ui (não reinventar)
    layout/           # AppShell, Sidebar, Header
    auth/             # ProtectedRoute (e guards de RBAC)
    shared/           # KpiCard, DataTable, StatusBadge, PageHeader, Section…
    charts/
  pages/              # uma página por tela (12)
  types/              # tipos de domínio espelhando os DTOs da API
  data/               # MOCK — em remoção progressiva (ver ROADMAP). Não adicionar mock novo.
```

---

## 7. Convenções de código

- **TypeScript estrito.** Sem `any`. Tipos de retorno explícitos nos serviços. `interface`/`type`
  para DTOs em `src/types`, espelhando o backend.
- **Imports** com alias `@/` (configurado no Vite/tsconfig).
- **Componentes** funcionais; um componente por arquivo de tela; reutilize `components/ui` e
  `components/shared` antes de criar algo novo.
- **Estados obrigatórios de UI:** toda tela que busca dados trata **carregando** (skeleton),
  **erro** (mensagem + ação de tentar de novo) e **vazio** (estado vazio claro). Sem isso, a tarefa
  não está pronta.
- **RBAC na UI:** esconda/desabilite ações que o perfil não pode executar (ex.: botões de Gestor),
  lendo `usuario.perfil` do `useAuth`. O backend continua barrando de verdade.
- **Acessibilidade:** contraste AA, foco visível, `aria-*` em estados de erro, `prefers-reduced-motion`.
- **Sem business logic duplicada:** se o backend manda `status`/`severidade`/KPI pronto, use-o.
  `lib/status.ts`/`lib/insights.ts` que recalculam o que a API já entrega devem encolher ou sair.

---

## 8. Padrão de testes

Ferramentas (Fase 2): **Vitest** + **Testing Library** (`@testing-library/react`, `user-event`,
`jest-dom`) + **MSW** (intercepta o `fetch` e simula respostas reais da API, inclusive o envelope e
os 401/403).

O que testar, por camada:
- **Serviços (`lib/*.ts`):** monta a request certa, desembrulha `data`, lança `ApiError` com o
  `codigo`/status correto. MSW simula sucesso e erro.
- **Hooks (`hooks/*.ts`):** estados de loading/sucesso/erro, chaves de cache, invalidação após
  mutation. (`renderHook` + provider de QueryClient).
- **Componentes/telas:** o usuário vê loading → dados; vê a mensagem certa no erro; o estado vazio
  aparece; ações de RBAC só aparecem para o perfil certo. Testar **comportamento**, não implementação.
- **Guards:** `ProtectedRoute` redireciona anônimo para `/login` e libera autenticado.

Convenções:
- Arquivo de teste **co-localizado**: `algo.ts` → `algo.test.ts` (ou `.test.tsx`).
- Nada de teste que dependa de backend real rodando — a API é simulada por MSW.
- Um teste deve falhar por um motivo claro; nomes descrevem o comportamento esperado em pt-BR.

> Meta de cobertura: alta nas camadas `lib/` e `hooks/` (perto de 100% da lógica de dados) e nos
> fluxos críticos de UI (login, RBAC, erro). Cobertura não é o fim; **teste o que quebra**.

---

## 9. Definition of Done

Uma tarefa/fase só está concluída quando **tudo** abaixo é verdade:

- [ ] Código sem gambiarra, sem `any`, tipos espelhando a API.
- [ ] Dados vêm da API real (o mock correspondente foi removido ou isolado), não de `src/data`.
- [ ] Estados de **carregando / erro / vazio** tratados na UI.
- [ ] RBAC espelhado na UI; 401 e 403 tratados.
- [ ] **Testes escritos e verdes** (serviço + hook + UI relevante), via MSW.
- [ ] `npm run build` (typecheck) e `npm run lint` passam limpos.
- [ ] Acessibilidade preservada (contraste, foco, reduced-motion).
- [ ] `ROADMAP.md` atualizado (item marcado como concluído).

---

## 10. Fluxo de trabalho

- Trabalhamos **por fases** ([`ROADMAP.md`](ROADMAP.md)), uma de cada vez, na ordem de dependência.
- Antes de migrar um domínio: confira o contrato no [`GUIA-API.md`](../smarthealth-farm-backend/docs/GUIA-API.md)
  e, se preciso, o Swagger. Alinhe os tipos do front ao DTO real.
- Commits pequenos e descritivos; só commitar/pushar quando solicitado. Branch a partir de `main`.
- Se um endpoint do backend não bater com o que o front precisa, **anote e alinhe** — o backend pode
  mudar "uma coisa ou outra", mas não se improvisa no front para compensar.
