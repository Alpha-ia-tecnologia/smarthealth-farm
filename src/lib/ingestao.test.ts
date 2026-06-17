import { http, HttpResponse } from "msw"
import { ingestaoApi } from "@/lib/ingestao"
import { ApiError } from "@/lib/api"
import { server } from "@/test/server"
import { erro, fontesTeste, qualidadeCategoriasTeste, resumoIngestaoTeste } from "@/test/handlers"

describe("ingestaoApi", () => {
  it("lista as fontes de dados com status e procedência", async () => {
    const fontes = await ingestaoApi.fontes()
    expect(fontes).toHaveLength(fontesTeste.length)
    expect(fontes[0].status).toBe("Sincronizado")
    expect(fontes[0].codigo).toBe("SIH")
  })

  it("lista a qualidade por categoria de insumo", async () => {
    const qualidade = await ingestaoApi.qualidade()
    expect(qualidade).toHaveLength(qualidadeCategoriasTeste.length)
    expect(qualidade[0].categoria).toBe("Antibióticos")
    expect(qualidade[0].granularidade).toBe("Diária")
  })

  it("traz o resumo (KPIs) da ingestão", async () => {
    const resumo = await ingestaoApi.resumo()
    expect(resumo.fontesSincronizadas).toBe(resumoIngestaoTeste.fontesSincronizadas)
    expect(resumo.anonimizacaoAtiva).toBe(true)
  })

  it("lança ApiError quando o resumo falha", async () => {
    server.use(
      http.get("*/ingestao/resumo", () =>
        HttpResponse.json(erro("Falha ao consultar.", "ERRO_INTERNO"), { status: 500 }),
      ),
    )
    await expect(ingestaoApi.resumo()).rejects.toBeInstanceOf(ApiError)
  })
})
