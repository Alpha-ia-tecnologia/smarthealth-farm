import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Bell, Menu, Moon, Search, Sun } from "lucide-react"
import { SidebarContent } from "./Sidebar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { navItems } from "@/lib/nav"
import { unidadesAtendidas, totais } from "@/data"

function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { theme, toggle } = useTheme()
  const { pathname } = useLocation()
  const current = navItems.find((n) => n.to === pathname) ?? navItems[0]

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMenu}>
        <Menu className="size-5" />
      </Button>

      <div className="hidden min-w-0 lg:block">
        <p className="truncate font-display text-sm font-semibold">{current.label}</p>
        <p className="truncate text-xs text-muted-foreground">{current.desc}</p>
      </div>

      <div className="relative ml-auto hidden w-full max-w-xs md:block">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar medicamento, lote, unidade…" className="pl-8" />
      </div>

      <Select defaultValue="todas">
        <SelectTrigger className="w-[150px]" aria-label="Unidade">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as unidades</SelectItem>
          {unidadesAtendidas.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.sigla} · {u.municipio}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema">
        {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </Button>

      <Button variant="ghost" size="icon" className="relative" aria-label="Alertas">
        <Bell className="size-5" />
        {totais.alertasAbertos > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-danger ring-2 ring-background" />
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full pl-1 outline-none">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">AS</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="text-sm font-semibold">Ana Sousa</p>
            <p className="text-xs font-normal text-muted-foreground">Gestor · CAHOSP</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Meu perfil</DropdownMenuItem>
          <DropdownMenuItem>Preferências</DropdownMenuItem>
          <DropdownMenuItem>Conformidade LGPD</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-danger">Encerrar sessão</DropdownMenuItem>
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
    </div>
  )
}

// trigger usado fora? mantido para conveniência
export { SheetTrigger }
