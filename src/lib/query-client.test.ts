import { describe, expect, it, vi } from "vitest"
import { ApiError } from "./api"
import { criarQueryClient } from "./query-client"

describe("criarQueryClient", () => {
  it("chama aoSessaoExpirar quando uma query falha com 401", async () => {
    const aoSessaoExpirar = vi.fn()
    const client = criarQueryClient({ aoSessaoExpirar })

    await expect(
      client.fetchQuery({
        queryKey: ["sessao"],
        queryFn: () => Promise.reject(new ApiError("Sessão expirada.", 401, "NAO_AUTENTICADO")),
      }),
    ).rejects.toMatchObject({ status: 401 })

    expect(aoSessaoExpirar).toHaveBeenCalledTimes(1)
  })

  it("chama aoSessaoExpirar quando uma mutation falha com 401", async () => {
    const aoSessaoExpirar = vi.fn()
    const client = criarQueryClient({ aoSessaoExpirar })

    const mutation = client.getMutationCache().build(client, {
      mutationFn: () => Promise.reject(new ApiError("Sessão expirada.", 401, "NAO_AUTENTICADO")),
    })
    await expect(mutation.execute(undefined)).rejects.toMatchObject({ status: 401 })

    expect(aoSessaoExpirar).toHaveBeenCalledTimes(1)
  })

  it("não encerra a sessão em 403 (sem permissão) nem em erro de rede", async () => {
    const aoSessaoExpirar = vi.fn()
    const client = criarQueryClient({ aoSessaoExpirar })

    await expect(
      client.fetchQuery({
        queryKey: ["rbac"],
        queryFn: () => Promise.reject(new ApiError("Acesso negado.", 403, "ACESSO_NEGADO")),
      }),
    ).rejects.toMatchObject({ status: 403 })

    await expect(
      client.fetchQuery({
        queryKey: ["rede"],
        queryFn: () => Promise.reject(new ApiError("Sem conexão.", 0, "REDE")),
        retry: false,
      }),
    ).rejects.toMatchObject({ codigo: "REDE" })

    expect(aoSessaoExpirar).not.toHaveBeenCalled()
  })

  it("não repete a query em erro 4xx (retry só para falha transitória)", async () => {
    const client = criarQueryClient()
    const queryFn = vi
      .fn()
      .mockRejectedValue(new ApiError("Não encontrado.", 404, "NAO_ENCONTRADO"))

    await expect(client.fetchQuery({ queryKey: ["404"], queryFn })).rejects.toMatchObject({
      status: 404,
    })
    expect(queryFn).toHaveBeenCalledTimes(1)
  })
})
