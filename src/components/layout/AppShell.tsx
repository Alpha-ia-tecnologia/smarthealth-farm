import { useEffect, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { Bell, CalendarClock, LogOut, Menu, Moon, PackageX, Sun } from "lucide-react"
import { SidebarContent } from "./Sidebar"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { LogoEmserh } from "@/components/shared/LogoEmserh"
import { AssistenteIa } from "@/components/shared/AssistenteIa"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTheme } from "@/hooks/use-theme"
import { useAuth } from "@/context/auth"
import { useAlertas, useResumoAlertas } from "@/hooks/use-alertas"
import { Spinner } from "@/components/ui/spinner"
import { navItems } from "@/lib/nav"

/** Iniciais para o avatar a partir do nome completo (ex.: "Ana Sousa" → "AS"). */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return "?"
  const primeira = partes[0][0]
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ""
  return (primeira + ultima).toUpperCase()
}

function NotificacoesDropdown({ alertasAtivos }: { alertasAtivos: number }) {
  const navigate = useNavigate()
  const [lido, setLido] = useState(false)
  
  // Reseta o estado lido se o número de alertas aumentar (chegou novo)
  // Utilizamos um Ref ou o próprio state para comparar, mas simplificadamente 
  // assumiremos que se a flag `lido` for verdadeira e o count crescer, reseta.
  // Como `alertasAtivos` pode variar, vamos guardar o count anterior.
  const [lastCount, setLastCount] = useState(alertasAtivos)
  useEffect(() => {
    if (alertasAtivos > lastCount) {
      setLido(false)
    }
    setLastCount(alertasAtivos)
  }, [alertasAtivos, lastCount])

  const alertasQuery = useAlertas({ status: "Aberto" }, { tamanho: 5, ordenarPor: "criadoEm", ordem: "desc" })
  const itens = alertasQuery.data?.itens ?? []

  return (
    <DropdownMenu onOpenChange={(open) => {
      if (open && alertasAtivos > 0) setLido(true)
    }}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={alertasAtivos > 0 ? `Alertas — ${alertasAtivos} ativo(s)` : "Alertas"}
        >
          <Bell className="size-5" />
          {alertasAtivos > 0 && !lido && (
            <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-danger ring-2 ring-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Alertas Recentes</span>
          {alertasAtivos > 0 && (
            <span className="text-xs font-normal text-muted-foreground">{alertasAtivos} pendentes</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-80 overflow-y-auto">
          {alertasQuery.isPending ? (
            <div className="flex justify-center p-4"><Spinner size={24} /></div>
          ) : itens.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Nenhum alerta pendente.</p>
          ) : (
            itens.map((a) => (
              <DropdownMenuItem key={a.id} className="flex flex-col items-start gap-1.5 p-3 cursor-pointer" onSelect={() => navigate("/alertas")}>
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-medium text-sm">
                    {a.tipo === "Desabastecimento" ? <PackageX className="size-4 text-danger" /> : <CalendarClock className="size-4 text-warning" />}
                    {a.tipo}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{a.severidade}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold leading-tight">{a.insumoNome}</span>
                  <span className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.mensagem}</span>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        
        <DropdownMenuSeparator />
        <div className="p-1">
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate("/alertas")}>
            Ver todos os alertas
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { theme, toggle } = useTheme()
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const current = navItems.find((n) => n.to === pathname) ?? navItems[0]
  const { data: resumoAlertas } = useResumoAlertas()
  const alertasAtivos = resumoAlertas?.ativos ?? 0

  async function aoSair() {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:px-6">
      {/* Fio de marca EMSERH: azul → verde da logo, vinculando o header à identidade */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-brand-azul/70 via-brand-azul/20 to-brand-verde/70"
      />
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMenu}>
        <Menu className="size-5" />
      </Button>

      {/* Logo oficial EMSERH no mobile (a sidebar fica oculta); título da página no desktop. */}
      <LogoEmserh variant="full" className="h-8 w-auto lg:hidden" />

      <div className="hidden min-w-0 lg:block">
        <p className="truncate font-display text-sm font-semibold">{current.label}</p>
        <p className="truncate text-xs text-muted-foreground">{current.desc}</p>
      </div>

      <Button variant="ghost" size="icon" onClick={toggle} className="ml-auto" aria-label="Alternar tema">
        {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </Button>

      <NotificacoesDropdown alertasAtivos={alertasAtivos} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full pl-1 outline-none" aria-label="Conta">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                {usuario ? iniciais(usuario.nome) : "?"}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="truncate text-sm font-semibold">{usuario?.nome ?? "Usuário"}</p>
            <p className="truncate text-xs font-normal text-muted-foreground">
              {usuario ? `${usuario.perfil} · CAHOSP` : "CAHOSP"}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={aoSair}>
            <LogOut className="size-4" />
            Encerrar sessão
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

export function AppShell() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-0 p-0">
          <SheetTitle className="sr-only">Navegação</SheetTitle>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMenu={() => setOpen(true)} />
        <main className="flex-1 space-y-6 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      {/* Assistente de IA transversal (RF-INT-06): flutua sobre qualquer tela autenticada. */}
      <AssistenteIa />
    </div>
  )
}
