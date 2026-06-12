import { fmtData, fmtDataHora } from "@/lib/format"

describe("fmtDataHora", () => {
  it("converte um Instant UTC para o fuso de Brasília (UTC-3)", () => {
    // 12:00Z corresponde a 09:00 em São Paulo.
    expect(fmtDataHora("2026-06-10T12:00:00Z")).toBe("10/06/2026 09:00")
  })

  it("vira o dia quando o horário UTC cruza a meia-noite local", () => {
    // 02:00Z = 23:00 do dia anterior em São Paulo.
    expect(fmtDataHora("2026-06-12T02:00:00Z")).toBe("11/06/2026 23:00")
  })

  it("devolve a string original quando não é uma data válida", () => {
    expect(fmtDataHora("—")).toBe("—")
  })
})

describe("fmtData", () => {
  it("formata uma data pura (LocalDate) sem deslocar o dia por fuso", () => {
    expect(fmtData("2026-06-25")).toBe("25 jun 2026")
  })
})
