import type { ReactNode } from "react"
import {
  AlertTriangle,
  AlignLeft,
  ArrowRight,
  CheckCircle2,
  type LucideIcon,
  Lightbulb,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Secao {
  teste: RegExp
  icone: LucideIcon
  cor: string
  ponto: string
}

/** Seções reconhecidas no texto da IA → ícone e cor (para um cabeçalho mais dinâmico). */
const SECOES: Secao[] = [
  { teste: /^(resumo|s[ií]ntese|vis[aã]o geral|panorama|an[aá]lise)\b/i, icone: AlignLeft, cor: "text-foreground", ponto: "bg-muted-foreground" },
  { teste: /insight/i, icone: Lightbulb, cor: "text-primary", ponto: "bg-primary" },
  { teste: /(pontos?\s+fortes?|for[cç]as?|destaques?)/i, icone: CheckCircle2, cor: "text-success", ponto: "bg-success" },
  { teste: /(aten[cç]|riscos?|cuidados?|alertas?|fr[aá]gil|fragilidade)/i, icone: AlertTriangle, cor: "text-warning", ponto: "bg-warning" },
  { teste: /(recomenda|a[cç][oõ]es|pr[oó]xim|sugest|encaminh)/i, icone: ArrowRight, cor: "text-teal", ponto: "bg-teal" },
]

/** Remove marcadores de markdown (negrito/itálico/código/título). */
function limpar(texto: string): string {
  return texto
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/^\s*#{1,6}\s+/, "")
    .trim()
}

function ehBullet(linha: string): boolean {
  return /^\s*([-*•–▪]|\d+[.)])\s+/.test(linha)
}

function semBullet(linha: string): string {
  return linha.replace(/^\s*([-*•–▪]|\d+[.)])\s+/, "")
}

function secaoConhecida(rotulo: string): Secao | undefined {
  return SECOES.find((s) => s.teste.test(rotulo))
}

/**
 * Renderiza o texto livre da IA de forma dinâmica: tira os marcadores markdown (`**`, `*`, `` ` ``),
 * transforma seções conhecidas (Resumo, Insights, Pontos fortes, Pontos de atenção, Recomendações)
 * em cabeçalhos com ícone e cor, e os itens "- …" em bullets coloridos pela seção atual.
 */
export function AnaliseConteudo({ texto }: { texto: string }) {
  const blocos: ReactNode[] = []
  let pontoAtual = "bg-primary"
  let chave = 0

  for (const bruta of texto.split(/\r?\n/)) {
    const linha = limpar(bruta)
    if (!linha) continue

    // 1) Bullet (testa a linha crua, antes de remover o "*").
    if (ehBullet(bruta)) {
      blocos.push(<Item key={chave++} ponto={pontoAtual} texto={limpar(semBullet(bruta))} />)
      continue
    }

    // 2) "Seção: conteúdo" na mesma linha (só quando a seção é conhecida).
    const m = linha.match(/^([\p{L}][\p{L}\s]{1,28}?):\s+(.+)$/u)
    if (m) {
      const sec = secaoConhecida(m[1])
      if (sec) {
        pontoAtual = sec.ponto
        blocos.push(<Cabecalho key={chave++} sec={sec} texto={m[1]} />)
        blocos.push(<Paragrafo key={chave++} texto={m[2]} />)
        continue
      }
    }

    // 3) Cabeçalho de seção isolado ("Seção:").
    if (/:\s*$/.test(linha)) {
      const rotulo = linha.replace(/:\s*$/, "")
      const sec = secaoConhecida(rotulo)
      if (sec) {
        pontoAtual = sec.ponto
        blocos.push(<Cabecalho key={chave++} sec={sec} texto={rotulo} />)
        continue
      }
    }

    // 4) Parágrafo comum.
    blocos.push(<Paragrafo key={chave++} texto={linha} />)
  }

  return (
    <div className="space-y-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300">
      {blocos}
    </div>
  )
}

function Cabecalho({ sec, texto }: { sec: Secao; texto: string }) {
  const Icone = sec.icone
  return (
    <p className={cn("mt-3 flex items-center gap-1.5 text-sm font-semibold first:mt-0", sec.cor)}>
      <Icone className="size-4 shrink-0" />
      {texto}
    </p>
  )
}

function Item({ ponto, texto }: { ponto: string; texto: string }) {
  return (
    <div className="flex gap-2 pl-0.5 text-sm leading-relaxed text-foreground">
      <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", ponto)} />
      <span>{texto}</span>
    </div>
  )
}

function Paragrafo({ texto }: { texto: string }) {
  return <p className="text-sm leading-relaxed text-foreground">{texto}</p>
}
