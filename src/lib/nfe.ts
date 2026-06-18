// Leitura client-side de NF-e (Nota Fiscal eletrônica) no formato XML do Portal Fiscal
// (`http://www.portalfiscal.inf.br/nfe`). Não há backend envolvido: o arquivo é lido e parseado
// no navegador. O parser é tolerante a namespace (usa nome local) e aceita tanto o XML "puro"
// (`<NFe>`) quanto o protocolado (`<nfeProc>`), que é o exportado pela maioria dos emissores.

export interface NfeEndereco {
  logradouro: string
  numero: string
  bairro: string
  municipio: string
  uf: string
  cep: string
}

export interface NfeParte {
  nome: string
  documento: string
  inscricaoEstadual: string
  endereco: NfeEndereco | null
}

export interface NfeItem {
  numero: number
  codigo: string
  descricao: string
  ncm: string
  cfop: string
  unidade: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

export interface NfeTotais {
  baseIcms: number
  valorIcms: number
  valorProdutos: number
  valorFrete: number
  valorDesconto: number
  valorTotal: number
}

export type NfeTipo = "Entrada" | "Saída" | "—"

export interface NotaFiscal {
  chave: string
  numero: string
  serie: string
  naturezaOperacao: string
  /** Data de emissão como string ISO (com fuso) ou data simples, conforme o XML. */
  dataEmissao: string
  tipo: NfeTipo
  emitente: NfeParte
  destinatario: NfeParte
  itens: NfeItem[]
  totais: NfeTotais
}

/** Erro de parsing com mensagem amigável para exibir na UI. */
export class NfeParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NfeParseError"
  }
}

/** Primeiro descendente com o nome local informado, ignorando namespace. */
function primeiro(escopo: Element | Document, tag: string): Element | null {
  return escopo.getElementsByTagNameNS("*", tag)[0] ?? null
}

/** Texto do primeiro descendente com o nome local informado (vazio se ausente). */
function texto(escopo: Element | Document | null, tag: string): string {
  if (!escopo) return ""
  return primeiro(escopo, tag)?.textContent?.trim() ?? ""
}

/** Número do primeiro descendente (0 se ausente ou não-numérico). O XML usa ponto decimal. */
function numero(escopo: Element | Document | null, tag: string): number {
  const valor = Number(texto(escopo, tag))
  return Number.isFinite(valor) ? valor : 0
}

function lerEndereco(parte: Element | null, tag: string): NfeEndereco | null {
  const ender = parte ? primeiro(parte, tag) : null
  if (!ender) return null
  return {
    logradouro: texto(ender, "xLgr"),
    numero: texto(ender, "nro"),
    bairro: texto(ender, "xBairro"),
    municipio: texto(ender, "xMun"),
    uf: texto(ender, "UF"),
    cep: texto(ender, "CEP"),
  }
}

function lerParte(infNFe: Element, tag: "emit" | "dest", tagEndereco: string): NfeParte {
  const el = primeiro(infNFe, tag)
  return {
    nome: texto(el, "xNome"),
    documento: texto(el, "CNPJ") || texto(el, "CPF"),
    inscricaoEstadual: texto(el, "IE"),
    endereco: lerEndereco(el, tagEndereco),
  }
}

const tiposNfe: Record<string, NfeTipo> = { "0": "Entrada", "1": "Saída" }

/**
 * Faz o parse do XML de uma NF-e e devolve os dados estruturados.
 * @throws {NfeParseError} se o XML for inválido ou não for uma NF-e.
 */
export function parseNfeXml(xml: string): NotaFiscal {
  if (!xml.trim()) throw new NfeParseError("O arquivo está vazio.")

  const doc = new DOMParser().parseFromString(xml, "application/xml")
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new NfeParseError("Não foi possível ler o arquivo: o XML está malformado.")
  }

  const infNFe = primeiro(doc, "infNFe")
  if (!infNFe) {
    throw new NfeParseError("O arquivo não parece ser uma NF-e (elemento infNFe não encontrado).")
  }

  const ide = primeiro(infNFe, "ide")
  const chave = (infNFe.getAttribute("Id") || texto(doc, "chNFe")).replace(/^NFe/, "")

  const itens: NfeItem[] = Array.from(infNFe.getElementsByTagNameNS("*", "det")).map((det, i) => {
    const prod = primeiro(det, "prod")
    return {
      numero: Number(det.getAttribute("nItem")) || i + 1,
      codigo: texto(prod, "cProd"),
      descricao: texto(prod, "xProd"),
      ncm: texto(prod, "NCM"),
      cfop: texto(prod, "CFOP"),
      unidade: texto(prod, "uCom"),
      quantidade: numero(prod, "qCom"),
      valorUnitario: numero(prod, "vUnCom"),
      valorTotal: numero(prod, "vProd"),
    }
  })

  const icmsTot = primeiro(infNFe, "ICMSTot")
  const totais: NfeTotais = {
    baseIcms: numero(icmsTot, "vBC"),
    valorIcms: numero(icmsTot, "vICMS"),
    valorProdutos: numero(icmsTot, "vProd"),
    valorFrete: numero(icmsTot, "vFrete"),
    valorDesconto: numero(icmsTot, "vDesc"),
    valorTotal: numero(icmsTot, "vNF"),
  }

  return {
    chave,
    numero: texto(ide, "nNF"),
    serie: texto(ide, "serie"),
    naturezaOperacao: texto(ide, "natOp"),
    dataEmissao: texto(ide, "dhEmi") || texto(ide, "dEmi"),
    tipo: tiposNfe[texto(ide, "tpNF")] ?? "—",
    emitente: lerParte(infNFe, "emit", "enderEmit"),
    destinatario: lerParte(infNFe, "dest", "enderDest"),
    itens,
    totais,
  }
}

/** Formata CNPJ (00.000.000/0000-00) ou CPF (000.000.000-00); devolve a entrada se não casar. */
export function formatarDocumento(doc: string): string {
  const d = doc.replace(/\D/g, "")
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  return doc
}

/** Formata uma chave de acesso de 44 dígitos em blocos de 4 para leitura. */
export function formatarChave(chave: string): string {
  const c = chave.replace(/\D/g, "")
  if (c.length !== 44) return chave
  return c.replace(/(.{4})/g, "$1 ").trim()
}
