import { vi } from "vitest"
import { render, screen } from "@testing-library/react"

// Controla o estado de fetching sem promise pendente (evita prender o worker do Vitest).
const { useIsFetchingMock } = vi.hoisted(() => ({ useIsFetchingMock: vi.fn<() => number>() }))
vi.mock("@tanstack/react-query", () => ({ useIsFetching: () => useIsFetchingMock() }))

import { BarraProgresso } from "@/components/layout/BarraProgresso"

describe("BarraProgresso", () => {
  it("fica oculta quando não há requisições em andamento", () => {
    useIsFetchingMock.mockReturnValue(0)
    render(<BarraProgresso />)
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
  })

  it("aparece enquanto há requisição em andamento", () => {
    useIsFetchingMock.mockReturnValue(1)
    render(<BarraProgresso />)
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })
})
