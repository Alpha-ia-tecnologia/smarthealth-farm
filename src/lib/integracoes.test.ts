import { integracoesApi } from "@/lib/integracoes"
import { iaApi } from "@/lib/ia"
import { integracoesTeste, provedoresIaTeste, resumoIntegracaoTeste } from "@/test/handlers"

describe("integracoesApi", () => {
  it("lista as conexões com status, modo e buffer", async () => {
    const integracoes = await integracoesApi.listar()
    expect(integracoes).toHaveLength(integracoesTeste.length)
    expect(integracoes[1].modo).toBe("Offline (buffer)")
    expect(integracoes[1].registrosBuffer).toBe(2140)
  })

  it("traz o resumo (KPIs) da integração", async () => {
    const resumo = await integracoesApi.resumo()
    expect(resumo.operacionais).toBe(resumoIntegracaoTeste.operacionais)
    expect(resumo.provedoresIa).toBe(2)
  })

  it("lista os provedores de IA do AI Gateway", async () => {
    const provedores = await integracoesApi.provedoresIa()
    expect(provedores).toHaveLength(provedoresIaTeste.length)
    expect(provedores[0].papel).toBe("Primário")
    expect(provedores[0].anonimizacao).toBe(true)
  })
})

describe("iaApi", () => {
  it("envia a conversa e devolve a resposta do gateway", async () => {
    const resposta = await iaApi.chat([{ papel: "user", conteudo: "olá" }])
    expect(resposta.mode).toBe("demo")
    expect(resposta.content).toContain("olá")
  })
})
