import { useEffect, useRef, useState } from "react"
import { Bot, SendHorizonal, Sparkles, ShieldCheck, User } from "lucide-react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useChatIa } from "@/hooks/use-ia"
import type { MensagemChat, ModoResposta } from "@/lib/ia"
import { cn } from "@/lib/utils"

/** Contexto do assistente enviado ao backend (anonimização é feita lá). Não é exibido na conversa. */
const MENSAGEM_SISTEMA: MensagemChat = {
  papel: "system",
  conteudo:
    "Você é o assistente da plataforma Smart Health CAHOSP, de gestão preditiva da cadeia " +
    "farmacêutica hospitalar (EMSERH-MA). Responda em português do Brasil, de forma objetiva, " +
    "sobre estoque, previsão de demanda, alertas, recomendações e indicadores. Não invente dados " +
    "de pacientes nem informações sensíveis.",
}

const SUGESTOES = [
  "O que é o risco de desabastecimento?",
  "Como funciona a redistribuição entre unidades?",
  "O que significa o MAPE da previsão?",
]

/** Turno exibido na conversa (apenas usuário e assistente; a mensagem de sistema fica oculta). */
interface Turno {
  papel: "user" | "assistant"
  conteudo: string
}

/**
 * Assistente de IA flutuante (RF-INT-06): botão fixo que abre um painel de chat sobre qualquer
 * tela, consumindo `POST /ia/chat`. O backend anonimiza antes de enviar à IA e responde em "modo
 * demo" quando não há provedor configurado — sinalizado na UI.
 */
export function AssistenteIa() {
  const [aberto, setAberto] = useState(false)
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [entrada, setEntrada] = useState("")
  const [modo, setModo] = useState<ModoResposta | null>(null)
  const chat = useChatIa()

  const fimRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [turnos, chat.isPending])

  async function enviar(texto: string) {
    const conteudo = texto.trim()
    if (!conteudo || chat.isPending) return

    const novoTurno: Turno = { papel: "user", conteudo }
    const historico = [...turnos, novoTurno]
    setTurnos(historico)
    setEntrada("")

    const mensagens: MensagemChat[] = [
      MENSAGEM_SISTEMA,
      ...historico.map((t) => ({ papel: t.papel, conteudo: t.conteudo })),
    ]

    try {
      const resposta = await chat.mutateAsync(mensagens)
      setModo(resposta.mode)
      setTurnos((atual) => [...atual, { papel: "assistant", conteudo: resposta.content }])
    } catch {
      // Mantém a pergunta na tela e devolve o texto ao campo para nova tentativa.
      setEntrada(conteudo)
      setTurnos((atual) => atual.slice(0, -1))
      toast.error("Não foi possível falar com o assistente. Tente novamente.")
    } finally {
      inputRef.current?.focus()
    }
  }

  function aoSubmeter(evento: React.FormEvent) {
    evento.preventDefault()
    void enviar(entrada)
  }

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-5 right-5 z-40 size-12 rounded-full shadow-lg"
          aria-label="Abrir assistente de IA"
        >
          <Sparkles className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-md"
        onOpenAutoFocus={(e) => {
          // Foco direto no campo de pergunta (em vez do botão de fechar do Radix).
          e.preventDefault()
          inputRef.current?.focus()
        }}
      >
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Bot className="size-4" />
            </span>
            Assistente Smart Health
            {modo === "demo" && (
              <Badge variant="outline" className="ml-1 text-[10px]">
                Modo demo
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-success" />
            Dados anonimizados antes do envio à IA.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
          {turnos.length === 0 ? (
            <div className="space-y-3 pt-6 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="size-6" />
              </span>
              <div>
                <p className="text-sm font-semibold">Como posso ajudar?</p>
                <p className="text-xs text-muted-foreground">
                  Tire dúvidas sobre estoque, previsões, alertas e indicadores.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void enviar(s)}
                    className="cursor-pointer rounded-lg border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            turnos.map((t, i) => <Bolha key={i} turno={t} />)
          )}

          {chat.isPending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Spinner size={18} label="Assistente digitando" />
              Pensando…
            </div>
          )}
          <div ref={fimRef} />
        </div>

        <form onSubmit={aoSubmeter} className="flex items-center gap-2 border-t p-3">
          <Input
            ref={inputRef}
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            placeholder="Escreva sua pergunta…"
            aria-label="Mensagem para o assistente"
            disabled={chat.isPending}
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={chat.isPending || !entrada.trim()} aria-label="Enviar">
            <SendHorizonal className="size-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function Bolha({ turno }: { turno: Turno }) {
  const ehUsuario = turno.papel === "user"
  return (
    <div className={cn("flex gap-2", ehUsuario && "flex-row-reverse")}>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          ehUsuario ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary",
        )}
      >
        {ehUsuario ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
      </span>
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
          ehUsuario ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        {turno.conteudo}
      </div>
    </div>
  )
}
