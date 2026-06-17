// Tokens de status reutilizados em badges, tabelas e gráficos.

export type StatusKey = "ok" | "atencao" | "critico" | "info" | "neutro"

export const statusStyles: Record<
  StatusKey,
  { label: string; dot: string; badge: string; text: string; bg: string }
> = {
  ok: {
    label: "Normal",
    dot: "bg-success",
    badge: "bg-success/12 text-success border-success/25",
    text: "text-success",
    bg: "bg-success/10",
  },
  atencao: {
    label: "Atenção",
    dot: "bg-warning",
    badge: "bg-warning/15 text-warning border-warning/30",
    text: "text-warning",
    bg: "bg-warning/10",
  },
  critico: {
    label: "Crítico",
    dot: "bg-danger",
    badge: "bg-danger/12 text-danger border-danger/25",
    text: "text-danger",
    bg: "bg-danger/10",
  },
  info: {
    label: "Info",
    dot: "bg-info",
    badge: "bg-info/12 text-info border-info/25",
    text: "text-info",
    bg: "bg-info/10",
  },
  neutro: {
    label: "—",
    dot: "bg-muted-foreground",
    badge: "bg-muted text-muted-foreground border-border",
    text: "text-muted-foreground",
    bg: "bg-muted",
  },
}

export const severidadeStatus: Record<string, StatusKey> = {
  "Crítico": "critico",
  Alto: "atencao",
  Médio: "info",
}

export const conectividadeStatus: Record<string, StatusKey> = {
  Estável: "ok",
  Intermitente: "atencao",
  Precária: "critico",
}

/**
 * Status de recomendação → token de cor. Recusada é crítico (vermelho); executada, normal (verde);
 * aprovada, info; pendente, atenção. Centralizado para todas as telas pintarem igual.
 */
export const recomendacaoStatus: Record<string, StatusKey> = {
  Pendente: "atencao",
  Aprovada: "info",
  Executada: "ok",
  Recusada: "critico",
}
