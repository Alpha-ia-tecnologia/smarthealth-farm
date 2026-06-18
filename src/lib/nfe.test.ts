import { formatarChave, formatarDocumento, NfeParseError, parseNfeXml } from "@/lib/nfe"
import { xmlNfeExemplo } from "@/test/fixtures/nfe"

describe("parseNfeXml", () => {
  it("extrai a identificação da nota", () => {
    const nota = parseNfeXml(xmlNfeExemplo)
    expect(nota.numero).toBe("3")
    expect(nota.serie).toBe("1")
    expect(nota.naturezaOperacao).toBe("VENDA DE MERCADORIA")
    expect(nota.tipo).toBe("Saída")
    expect(nota.chave).toBe("35200114200166000187550010000000031000000017")
    expect(nota.dataEmissao).toBe("2026-06-15T10:30:00-03:00")
  })

  it("extrai emitente e destinatário com endereço", () => {
    const nota = parseNfeXml(xmlNfeExemplo)
    expect(nota.emitente.nome).toBe("DISTRIBUIDORA FARMA LTDA")
    expect(nota.emitente.documento).toBe("14200166000187")
    expect(nota.emitente.endereco?.municipio).toBe("SAO LUIS")
    expect(nota.destinatario.nome).toBe("CAHOSP CENTRAL DE ABASTECIMENTO")
    expect(nota.destinatario.endereco?.uf).toBe("MA")
  })

  it("extrai os itens com quantidades e valores", () => {
    const nota = parseNfeXml(xmlNfeExemplo)
    expect(nota.itens).toHaveLength(2)
    expect(nota.itens[0]).toMatchObject({
      numero: 1,
      descricao: "DIPIRONA 500MG CX 100",
      ncm: "30049099",
      cfop: "5102",
      unidade: "CX",
      quantidade: 10,
      valorUnitario: 25.5,
      valorTotal: 255,
    })
  })

  it("extrai os totais da nota", () => {
    const nota = parseNfeXml(xmlNfeExemplo)
    expect(nota.totais.valorProdutos).toBe(455)
    expect(nota.totais.valorIcms).toBe(54.6)
    expect(nota.totais.valorDesconto).toBe(5)
    expect(nota.totais.valorTotal).toBe(450)
  })

  it("lança erro para arquivo vazio", () => {
    expect(() => parseNfeXml("   ")).toThrow(NfeParseError)
  })

  it("lança erro para XML malformado", () => {
    expect(() => parseNfeXml("<nfeProc><NFe></nfeProc>")).toThrow(NfeParseError)
  })

  it("lança erro quando não é uma NF-e", () => {
    expect(() => parseNfeXml("<root><item>1</item></root>")).toThrow(/não parece ser uma NF-e/)
  })
})

describe("formatarDocumento", () => {
  it("formata CNPJ", () => {
    expect(formatarDocumento("14200166000187")).toBe("14.200.166/0001-87")
  })

  it("formata CPF", () => {
    expect(formatarDocumento("12345678909")).toBe("123.456.789-09")
  })

  it("devolve a entrada quando não casa com CNPJ/CPF", () => {
    expect(formatarDocumento("123")).toBe("123")
  })
})

describe("formatarChave", () => {
  it("agrupa a chave de 44 dígitos em blocos de 4", () => {
    const chave = "35200114200166000187550010000000031000000017"
    expect(formatarChave(chave)).toBe("3520 0114 2001 6600 0187 5500 1000 0000 0310 0000 0017")
  })
})
