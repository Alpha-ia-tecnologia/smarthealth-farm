import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { LogoEmserh } from "@/components/shared/LogoEmserh"
import { grupos, navItemsPara } from "@/lib/nav"
import { usePerfil } from "@/context/auth"

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const itens = navItemsPara(usePerfil())
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Marca institucional EMSERH (logo oficial) + plataforma */}
      <div className="border-b border-sidebar-border/60 px-5 py-5">
        <LogoEmserh variant="full" className="w-[12.5rem] max-w-full" />
        <p className="mt-2.5 text-[11px] text-sidebar-foreground/60">Smart Health · CAHOSP</p>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {grupos
          .filter((grupo) => itens.some((i) => i.grupo === grupo))
          .map((grupo) => (
          <div key={grupo}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
              {grupo}
            </p>
            <div className="space-y-0.5">
              {itens
                .filter((i) => i.grupo === grupo)
                .map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-primary/15 font-semibold text-sidebar-primary"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            "flex size-7 items-center justify-center rounded-md transition-colors",
                            isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground",
                          )}
                        >
                          <item.icon className="size-4" />
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-3">
        <p className="text-[10px] leading-relaxed text-sidebar-foreground/50">
          Plataforma de gestão preditiva da cadeia farmacêutica · FAPEMA GovIA
        </p>
      </div>
    </div>
  )
}
