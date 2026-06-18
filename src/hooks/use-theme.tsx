import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

interface ThemeCtx {
  theme: Theme
  toggle: () => void
}

const Ctx = createContext<ThemeCtx>({ theme: "light", toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Branco é o padrão. Só vamos para o escuro se o usuário tiver escolhido isso antes
    // (persistido em localStorage); não seguimos a preferência do sistema operacional.
    const stored = localStorage.getItem("sh-theme") as Theme | null
    return stored ?? "light"
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
    localStorage.setItem("sh-theme", theme)
  }, [theme])

  return (
    <Ctx.Provider value={{ theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) }}>
      {children}
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(Ctx)
