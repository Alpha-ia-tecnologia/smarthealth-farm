import { formatarValorIndicador, indicadoresApi } from "@/lib/indicadores"
import { indicadoresTeste, resumoIndicadoresTeste } from "@/test/handlers"

describe("indicadoresApi", () => {
  it("lista os indicadores", async () => {
    const lista = await indicadoresApi.listar()
    expect(lista).toHaveLength(indicadoresTeste.length)
    expect(lista[0].codigo).toBe("ind-ruptura")
    expect(lista[0].historico.length).toBeGreaterThan(0)
  })

  it("traz o resumo de KPIs", async () => {
    const resumo = await indicadoresApi.resumo()
    expect(resumo).toEqual(resumoIndicadoresTeste)
  })

  it("detalha um indicador pelo código", async () => {
    const ind = await indicadoresApi.detalhar("ind-mape")
    expect(ind.codigo).toBe("ind-mape")
    expect(ind.atual).toBe(11.8)
  })

  it("propaga 404 para código inexistente", async () => {
    await expect(indicadoresApi.detalhar("ind-inexistente")).rejects.toMatchObject({
      codigo: "NAO_ENCONTRADO",
      status: 404,
    })
  })
})

describe("formatarValorIndicador", () => {
  it("formata por unidade de medida (% · R$ mil · dias · un)", () => {
    expect(formatarValorIndicador("%", 11.2)).toContain("%")
    expect(formatarValorIndicador("R$ mil", 812)).toContain("812") // R$ 812.000
    expect(formatarValorIndicador("dias", 14)).toContain("dias")
    expect(formatarValorIndicador("un", 147)).toBe("147")
  })
})
