import { NavLink } from "react-router-dom"
import { Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { grupos, navItems } from "@/lib/nav"

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Marca */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
          <Activity className="size-5" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <p className="font-display text-base font-bold tracking-tight">Smart Health</p>
          <p className="text-[11px] text-sidebar-foreground/60">CAHOSP · EMSERH-MA</p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {grupos.map((grupo) => (
          <div key={grupo}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
              {grupo}
            </p>
            <div className="space-y-0.5">
              {navItems
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
                          ? "bg-sidebar-primary/15 text-sidebar-primary-foreground"
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
