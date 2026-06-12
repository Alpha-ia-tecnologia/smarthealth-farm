import { http, HttpResponse } from "msw"
import { auditoriaApi } from "@/lib/auditoria"
import { ApiError } from "@/lib/api"
import { server } from "@/test/server"
import { erro, logsAuditoriaTeste, ok, resumoAuditoriaTeste } from "@/test/handlers"

describe("auditoriaApi", () => {
  it("lista a trilha de auditoria", async () => {
    const logs = await auditoriaApi.listar()
    expect(logs).toHaveLength(logsAuditoriaTeste.length)
    expect(logs[0].categoria).toBe("Recalibração de previsão")
    expect(logs[0].assistidoPorIA).toBe(true)
  })

  it("envia os filtros (categoria, perfil, IA, busca) na query string", async () => {
    let url = ""
    server.use(
      http.get("*/seguranca/auditoria", ({ request }) => {
        url = request.url
        return HttpResponse.json(ok(logsAuditoriaTeste, logsAuditoriaTeste.length))
      }),
    )
    await auditoriaApi.listar({
      categoria: "Gestão de usuário",
      perfil: "TI",
      assistidoPorIA: false,
      busca: "criou",
    })
    const params = new URL(url).searchParams
    expect(params.get("categoria")).toBe("Gestão de usuário")
    expect(params.get("perfil")).toBe("TI")
    expect(params.get("assistidoPorIA")).toBe("false")
    expect(params.get("busca")).toBe("criou")
  })

  it("traz o resumo (KPIs) da auditoria", async () => {
    const resumo = await auditoriaApi.resumo()
    expect(resumo.total).toBe(resumoAuditoriaTeste.total)
    expect(resumo.assistidosPorIa).toBe(resumoAuditoriaTeste.assistidosPorIa)
  })

  it("lança ApiError quando a trilha falha", async () => {
    server.use(
      http.get("*/seguranca/auditoria", () =>
        HttpResponse.json(erro("Acesso negado.", "ACESSO_NEGADO"), { status: 403 }),
      ),
    )
    await expect(auditoriaApi.listar()).rejects.toBeInstanceOf(ApiError)
  })
})
