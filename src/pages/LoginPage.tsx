import { useId, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"
import {
  Activity,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/hooks/use-theme"
import { ApiError, useAuth } from "@/context/auth"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const { status, login } = useAuth()
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const emailId = useId()
  const senhaId = useId()
  const erroId = useId()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [lembrar, setLembrar] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Já autenticado: volta para a rota de origem (ou o dashboard).
  if (status === "autenticado") {
    const origem = (location.state as { from?: Location })?.from?.pathname ?? "/"
    return <Navigate to={origem} replace />
  }

  async function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault()
    if (enviando) return

    // Validação no cliente: mensagens claras, sem ida ao servidor para campo vazio.
    const emailLimpo = email.trim()
    if (!emailLimpo || !senha) {
      setErro(
        !emailLimpo && !senha
          ? "Informe seu e-mail e sua senha para entrar."
          : !emailLimpo
            ? "Informe seu e-mail para entrar."
            : "Informe sua senha para entrar.",
      )
      return
    }

    setErro(null)
    setEnviando(true)
    try {
      await login(emailLimpo, senha, lembrar)
      // O redirecionamento acontece no próximo render (status vira "autenticado").
    } catch (e) {
      if (e instanceof ApiError) {
        setErro(
          e.credenciaisInvalidas
            ? "E-mail ou senha incorretos. Verifique e tente novamente."
            : e.codigo === "VALIDACAO"
              ? "Confira o e-mail e a senha e tente novamente."
              : e.message,
        )
      } else {
        setErro("Erro inesperado. Tente novamente em instantes.")
      }
      setEnviando(false)
    }
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Camadas de fundo institucional: grade + brilho suave (sem glassmorphism) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-[0.4]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[55svh] bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_70%)]"
      />

      {/* Alternar tema */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        aria-label={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
        className="absolute right-4 top-4 z-10 text-muted-foreground"
      >
        {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </Button>

      <div className="relative z-10 w-full max-w-[26rem] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
        {/* Marca */}
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="relative flex size-12 items-center justify-center">
            {/* Halo de luz pulsante (apenas a luz pulsa, não o ícone) */}
            <span
              aria-hidden
              className="absolute -inset-1.5 rounded-[1.25rem] bg-primary/45 opacity-70 blur-lg motion-safe:animate-[pulse-glow_2.6s_ease-in-out_infinite]"
            />
            <div className="relative flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
              <Activity className="size-6" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="mt-4 font-display text-xl font-bold tracking-tight">Smart Health</h1>
          <p className="text-xs font-medium text-muted-foreground">CAHOSP · EMSERH-MA</p>
        </div>

        {/* Cartão de login */}
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-7">
          <div className="mb-6 space-y-1">
            <h2 className="font-display text-2xl font-bold tracking-tight text-balance">
              Acesse a plataforma
            </h2>
            <p className="text-sm text-muted-foreground">
              Gestão preditiva da cadeia farmacêutica.
            </p>
          </div>

          <form onSubmit={aoEnviar} noValidate className="space-y-4">
            {erro && (
              <div
                id={erroId}
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor={emailId}>E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={emailId}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  required
                  placeholder="nome@cahosp.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={enviando}
                  aria-invalid={erro ? true : undefined}
                  aria-describedby={erro ? erroId : undefined}
                  className="h-11 pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={senhaId}>Senha</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={senhaId}
                  name="password"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={enviando}
                  aria-invalid={erro ? true : undefined}
                  aria-describedby={erro ? erroId : undefined}
                  className="h-11 pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  disabled={enviando}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={mostrarSenha}
                  className={cn(
                    "absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors",
                    "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50",
                  )}
                >
                  {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <Label htmlFor={`${senhaId}-lembrar`} className="cursor-pointer text-muted-foreground">
                <Switch
                  id={`${senhaId}-lembrar`}
                  checked={lembrar}
                  onCheckedChange={setLembrar}
                  disabled={enviando}
                />
                Manter conectado
              </Label>
            </div>

            <Button type="submit" size="lg" disabled={enviando} className="mt-1 w-full">
              {enviando ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Entrando…
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </div>

        {/* Nota institucional de segurança */}
        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 shrink-0 text-teal" />
          Acesso restrito e auditado conforme a LGPD.
        </p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Plataforma de gestão preditiva farmacêutica · FAPEMA GovIA
        </p>
      </div>
    </main>
  )
}
