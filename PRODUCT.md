# Product

## Register

product

## Users

Servidores e gestores da Central de Abastecimento Hospitalar (CAHOSP / EMSERH-MA).
Três perfis de acesso (RBAC):

- **Operador** — operação do dia a dia: leitura e lançamentos operacionais (estoque, alertas).
- **Gestor** — decisões de negócio: aprova recomendações, recalibra previsões, define limiares.
- **TI** — administração: usuários, parâmetros, integrações.

Contexto de uso: estações de trabalho hospitalares/administrativas, muitas vezes sob
conectividade intermitente, com jornada longa diante da tela. O trabalho é de decisão sob
pressão (evitar desabastecimento e perdas por vencimento), não de navegação casual.

## Product Purpose

Plataforma de **gestão preditiva da cadeia farmacêutica** que cobre os 62 requisitos
funcionais do edital FAPEMA GovIA (Desafio Tecnológico 2): previsão de demanda por ML,
estoque rastreável por lote, alertas de desabastecimento/vencimento, recomendações de
reposição e redistribuição, ingestão e anonimização de dados, integração com sistemas
EMSERH, e auditoria/LGPD. Sucesso = decisões de abastecimento mais rápidas e defensáveis,
com menos rupturas e menos descarte por validade.

## Brand Personality

Clínico, confiável e preciso. Voz institucional de saúde pública: direta, em pt-BR, sem
jargão de marketing. Três palavras: **confiável, preciso, sóbrio**. A interface deve
transmitir segurança (dados sensíveis, decisões críticas) e clareza sob carga cognitiva
alta, nunca exuberância ou entretenimento.

## Anti-references

- Dashboards "consumer" coloridos e gamificados (Duolingo-like): inadequado para saúde pública.
- Estética cripto/fintech com gradientes vibrantes e números-herói gigantes.
- Glassmorphism decorativo, neon, dark-mode "para parecer hi-tech" sem função.
- Telas de login genéricas de SaaS (split com foto stock sorridente, "Welcome back 👋").

## Design Principles

1. **Confiança visível** — densidade de informação honesta, rastreabilidade (cada dado tem
   procedência, cada seção referencia seu requisito RF-*). O usuário precisa confiar no número.
2. **Clareza sob carga** — hierarquia forte, números tabulares, status semântico inequívoco
   (ok/atenção/crítico). Reduzir esforço de leitura em jornadas longas.
3. **Sobriedade institucional** — cor a serviço do significado (status), não decoração.
   Azul/teal institucional; acentos cromáticos só onde carregam sentido.
4. **Acessível por padrão** — pt-BR, contraste AA, foco visível, alvos clicáveis adequados,
   suporte a tema claro/escuro e a `prefers-reduced-motion`.
5. **Pronto para o real** — camada de dados isolada e substituível pela API EMSERH; nada de
   atalho que não sobreviva à integração de produção.

## Accessibility & Inclusion

- Alvo **WCAG 2.1 AA**: corpo ≥ 4.5:1, texto grande ≥ 3:1, foco sempre visível.
- Tema claro e escuro de primeira classe; respeitar `prefers-color-scheme`.
- `prefers-reduced-motion`: toda animação tem alternativa (crossfade/instantâneo).
- Status nunca comunicado só por cor (ícone + rótulo acompanham a cor semântica).
- Idioma pt-BR, `lang="pt-BR"`, mensagens de erro claras e acionáveis.
