import { renderHook } from "@testing-library/react"
import { act } from "react"
import { ThemeProvider, useTheme } from "./use-theme"

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

describe("useTheme", () => {
  it("usa o tema branco (light) como padrão quando não há escolha salva", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe("light")
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("ignora a preferência escura do sistema operacional — o padrão continua branco", () => {
    // Simula um SO configurado em modo escuro.
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia

    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe("light")
  })

  it("respeita o tema salvo pelo usuário (escolha manual persiste)", () => {
    localStorage.setItem("sh-theme", "dark")
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("alterna entre claro e escuro e persiste a escolha", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe("light")
    act(() => result.current.toggle())
    expect(result.current.theme).toBe("dark")
    expect(localStorage.getItem("sh-theme")).toBe("dark")
  })
})
