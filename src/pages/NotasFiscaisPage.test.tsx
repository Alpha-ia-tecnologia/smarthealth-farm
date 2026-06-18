import NotasFiscaisPage from "@/pages/NotasFiscaisPage"
import { renderizar, screen } from "@/test/utils"
import { xmlNfeExemplo } from "@/test/fixtures/nfe"

function arquivoXml(conteudo: string, nome = "nota.xml") {
  return new File([conteudo], nome, { type: "text/xml" })
}

describe("NotasFiscaisPage", () => {
  it("mostra o estado inicial de upload", () => {
    renderizar(<NotasFiscaisPage />)
    expect(
      screen.getByText("Arraste o XML da NF-e ou clique para selecionar"),
    ).toBeInTheDocument()
  })

  it("extrai e exibe os dados ao enviar um XML de NF-e válido", async () => {
    const { usuario } = renderizar(<NotasFiscaisPage />)
    const input = screen.getByLabelText("Arquivo XML da nota fiscal")

    await usuario.upload(input, arquivoXml(xmlNfeExemplo))

    expect(await screen.findByText("DISTRIBUIDORA FARMA LTDA")).toBeInTheDocument()
    expect(screen.getByText("CAHOSP CENTRAL DE ABASTECIMENTO")).toBeInTheDocument()
    expect(screen.getByText("DIPIRONA 500MG CX 100")).toBeInTheDocument()
    expect(screen.getByText("SORO FISIOLOGICO 500ML")).toBeInTheDocument()
    // Valor total da nota formatado em R$.
    expect(screen.getByText("R$ 450,00")).toBeInTheDocument()
  })

  it("mostra erro ao enviar um arquivo que não é NF-e", async () => {
    const { usuario } = renderizar(<NotasFiscaisPage />)
    const input = screen.getByLabelText("Arquivo XML da nota fiscal")

    await usuario.upload(input, arquivoXml("<root><item>1</item></root>"))

    const alerta = await screen.findByRole("alert")
    expect(alerta).toHaveTextContent(/não parece ser uma NF-e/)
  })
})
