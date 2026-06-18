import { GraficoInsightDialog } from "@/components/shared/GraficoInsightDialog"
import { CurvaAbcResumo } from "@/components/shared/CurvaAbcResumo"
import { AbcChart } from "@/components/charts/AbcChart"
import { COR_CLASSE } from "@/components/charts/abc-cores"
import type { MensagemChat } from "@/lib/ia"
import type { CurvaAbc } from "@/lib/estoque"
import { fmtMoeda, fmtNum } from "@/lib/format"

interface Props {
  curva: CurvaAbc | undefined
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
}

/**
 * Modal de detalhe + análise por IA da Curva ABC: resumo por classe, o gráfico de Pareto e a tabela
 * ranqueada por valor de consumo. Reutilizado pela tela de Estoque e pelo Dashboard.
 */
export function CurvaAbcInsightDialog({ curva, aberto, onOpenChange }: Props) {
  return (
    <GraficoInsightDialog
      aberto={aberto}
      onOpenChange={onOpenChange}
      titulo="Curva ABC — insumos por valor de consumo"
      descricao="Classificação de Pareto: poucos itens (A) concentram a maior parte do valor de consumo."
      chave={curva ? "curva-abc" : null}
      mensagens={curva ? construirMensagens(curva) : []}
    >
      {curva && (
        <>
          <CurvaAbcResumo resumo={curva.resumo} />
          <AbcChart itens={curva.itens} height={240} />
          <TabelaAbc curva={curva} />
        </>
      )}
    </GraficoInsightDialog>
  )
}

/** Tabela ranqueada por valor de consumo, com participação/acumulado e a classe (com cor). */
function TabelaAbc({ curva }: { curva: CurvaAbc }) {
  return (
    <div className="max-h-72 overflow-y-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur">
          <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2 text-left font-semibold">#</th>
            <th className="px-3 py-2 text-left font-semibold">Insumo</th>
            <th className="px-3 py-2 text-right font-semibold">Valor consumo</th>
            <th className="px-3 py-2 text-right font-semibold">Part.</th>
            <th className="px-3 py-2 text-right font-semibold">Acum.</th>
            <th className="px-3 py-2 text-right font-semibold">Classe</th>
          </tr>
        </thead>
        <tbody>
          {curva.itens.map((i, idx) => (
            <tr key={i.insumoId} className="border-b last:border-0">
              <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
              <td className="px-3 py-2">
                <span className="font-medium">{i.insumoNome}</span>{" "}
                <span className="text-xs text-muted-foreground">{i.insumoCodigo}</span>
              </td>
              <td className="px-3 py-2 text-right tabular font-medium">{fmtMoeda(i.valorConsumo)}</td>
              <td className="px-3 py-2 text-right tabular text-muted-foreground">{i.participacaoPct}%</td>
              <td className="px-3 py-2 text-right tabular text-muted-foreground">{i.acumuladoPct}%</td>
              <td className="px-3 py-2 text-right">
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold"
                  style={{ color: COR_CLASSE[i.classe] }}
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: COR_CLASSE[i.classe] }} />
                  {i.classe}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const SISTEMA: MensagemChat = {
  papel: "system",
  conteudo:
    "Você é um analista da plataforma Smart Health CAHOSP, de gestão preditiva da cadeia " +
    "farmacêutica hospitalar (EMSERH-MA). Analise a Curva ABC e responda em português do Brasil, " +
    "de forma objetiva e executiva (3 a 4 frases), sem inventar dados além dos fornecidos.",
}

function construirMensagens(curva: CurvaAbc): MensagemChat[] {
  const resumo = curva.resumo
    .map(
      (r) =>
        `Classe ${r.classe}: ${r.itens} itens (${r.itensPct}% dos itens) = ${r.valorPct}% do valor ` +
        `(${fmtMoeda(r.valor)})`,
    )
    .join("\n")
  const top = curva.itens
    .slice(0, 5)
    .map(
      (i, idx) =>
        `${idx + 1}. ${i.insumoNome} (${i.insumoCodigo}): ${fmtMoeda(i.valorConsumo)} — ` +
        `${i.participacaoPct}% do valor, ${fmtNum(i.consumoMedioDiario)}/dia, classe ${i.classe}`,
    )
    .join("\n")

  return [
    SISTEMA,
    {
      papel: "user",
      conteudo:
        `Analise a Curva ABC dos insumos por valor de consumo (consumo médio diário × custo unitário). ` +
        `Aponte: (1) a concentração observada (princípio de Pareto), (2) onde a gestão deve focar (classe A), ` +
        `(3) uma recomendação prática de política de estoque por classe (controle/revisão/segurança).\n\n` +
        `Resumo por classe:\n${resumo}\n\nTop 5 itens por valor de consumo:\n${top}`,
    },
  ]
}
