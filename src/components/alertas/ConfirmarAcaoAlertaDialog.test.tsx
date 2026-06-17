import { vi } from "vitest"
import { ConfirmarAcaoAlertaDialog } from "@/components/alertas/ConfirmarAcaoAlertaDialog"
import { renderizar, screen } from "@/test/utils"
import { alertasTeste } from "@/test/handlers"
import { salvarToken } from "@/lib/auth-storage"

const alerta = alertasTeste[0] // Aberto · Ceftriaxona 1g · HTO

describe("ConfirmarAcaoAlertaDialog", () => {
  it("não renderiza nada quando não há alerta selecionado", () => {
    renderizar(
      <ConfirmarAcaoAlertaDialog
        aberto
        alerta={null}
        novoStatus="Em tratamento"
        onOpenChange={() => {}}
        onConfirmar={() => {}}
        processando={false}
      />,
    )
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("mostra quem realiza a ação e só confirma após o aceite", async () => {
    salvarToken("jwt", true) // AuthProvider carrega o usuário de teste (Ana Sousa · Gestor)
    const onConfirmar = vi.fn()
    const { usuario } = renderizar(
      <ConfirmarAcaoAlertaDialog
        aberto
        alerta={alerta}
        novoStatus="Em tratamento"
        onOpenChange={() => {}}
        onConfirmar={onConfirmar}
        processando={false}
      />,
    )

    // Quem realiza a ação (fica registrado na auditoria).
    expect(await screen.findByText(/Ana Sousa/)).toBeInTheDocument()

    const confirmar = screen.getByRole("button", { name: /Confirmar tratamento/ })
    expect(confirmar).toBeDisabled()
    await usuario.click(confirmar)
    expect(onConfirmar).not.toHaveBeenCalled()

    await usuario.click(screen.getByRole("checkbox"))
    expect(confirmar).toBeEnabled()
    await usuario.click(confirmar)
    expect(onConfirmar).toHaveBeenCalledTimes(1)
  })

  it("explica que a resolução é terminal quando o status é Resolvido", async () => {
    renderizar(
      <ConfirmarAcaoAlertaDialog
        aberto
        alerta={alerta}
        novoStatus="Resolvido"
        onOpenChange={() => {}}
        onConfirmar={() => {}}
        processando={false}
      />,
    )
    expect(await screen.findByText("Confirmar resolução do alerta")).toBeInTheDocument()
    expect(screen.getByText(/não volta a mudar de status/)).toBeInTheDocument()
    // O botão de confirmar reflete a ação de resolução.
    expect(screen.getByRole("button", { name: /Confirmar resolução/ })).toBeInTheDocument()
  })

  it("desabilita os controles enquanto a ação está sendo processada", async () => {
    salvarToken("jwt", true)
    renderizar(
      <ConfirmarAcaoAlertaDialog
        aberto
        alerta={alerta}
        novoStatus="Em tratamento"
        onOpenChange={() => {}}
        onConfirmar={() => {}}
        processando
      />,
    )
    expect(await screen.findByRole("button", { name: /Confirmando…/ })).toBeDisabled()
    expect(screen.getByRole("checkbox")).toBeDisabled()
  })
})
