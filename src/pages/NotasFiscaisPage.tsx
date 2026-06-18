import { useRef, useState } from "react"
import { toast } from "sonner"
import {
  Building2,
  FileText,
  FileUp,
  Hash,
  Receipt,
  ReceiptText,
  RotateCcw,
  Truck,
  Upload,
} from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { Section } from "@/components/shared/Section"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { fmtData, fmtDataHora, fmtDec, fmtMoedaExata } from "@/lib/format"
import {
  formatarChave,
  formatarDocumento,
  NfeParseError,
  parseNfeXml,
  type NfeEndereco,
  type NfeParte,
  type NotaFiscal,
} from "@/lib/nfe"

/** Lê o conteúdo de texto de um arquivo (FileReader funciona no navegador e no jsdom). */
function lerArquivoTexto(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(String(leitor.result ?? ""))
    leitor.onerror = () => reject(new Error("Falha ao ler o arquivo."))
    leitor.readAsText(arquivo)
  })
}

function formatarEmissao(iso: string): string {
  if (!iso) return "—"
  return iso.includes("T") ? fmtDataHora(iso) : fmtData(iso)
}

export default function NotasFiscaisPage() {
  const [nota, setNota] = useState<NotaFiscal | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function processar(arquivo: File) {
    setNomeArquivo(arquivo.name)
    setErro(null)
    try {
      const xml = await lerArquivoTexto(arquivo)
      const resultado = parseNfeXml(xml)
      setNota(resultado)
      toast.success("Nota fiscal lida com sucesso.")
    } catch (e) {
      setNota(null)
      const mensagem =
        e instanceof NfeParseError ? e.message : "Não foi possível processar o arquivo."
      setErro(mensagem)
      toast.error(mensagem)
    }
  }

  function aoSelecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (arquivo) void processar(arquivo)
    e.target.value = "" // permite reenviar o mesmo arquivo
  }

  function aoSoltar(e: React.DragEvent) {
    e.preventDefault()
    setArrastando(false)
    const arquivo = e.dataTransfer.files?.[0]
    if (arquivo) void processar(arquivo)
  }

  function limpar() {
    setNota(null)
    setErro(null)
    setNomeArquivo(null)
  }

  return (
    <>
      <PageHeader
        icon={<ReceiptText className="size-5" />}
        title="Notas Fiscais"
        info="Envie o arquivo XML de uma NF-e (nota fiscal eletrônica) e a plataforma extrai e exibe os dados — emitente, destinatário, itens, impostos e totais — sem precisar digitar nada."
        description="Importação de NF-e (XML) e extração automática dos dados da nota."
        actions={
          nota || erro ? (
            <Button variant="outline" size="sm" onClick={limpar}>
              <RotateCcw className="size-4" /> Enviar outra nota
            </Button>
          ) : undefined
        }
      />

      {/* Zona de upload — sempre visível; vira faixa compacta após a leitura. */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={aoSoltar}
        className={cn(
          "group flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          arrastando
            ? "border-primary bg-primary/5"
            : "border-input hover:border-primary/50 hover:bg-muted/40",
          nota && "py-5",
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15">
          <FileUp className="size-6" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-semibold">
            {nomeArquivo ? nomeArquivo : "Arraste o XML da NF-e ou clique para selecionar"}
          </p>
          <p className="text-xs text-muted-foreground">
            Apenas arquivos <span className="font-mono">.xml</span> de NF-e (padrão Portal Fiscal).
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
          <Upload className="size-3.5" /> Selecionar arquivo
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".xml,text/xml,application/xml"
          className="sr-only"
          aria-label="Arquivo XML da nota fiscal"
          onChange={aoSelecionar}
        />
      </button>

      {erro && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {erro}
        </div>
      )}

      {nota && <DetalhesNota nota={nota} />}
    </>
  )
}

function DetalhesNota({ nota }: { nota: NotaFiscal }) {
  return (
    <div className="space-y-6">
      <Section title="Identificação" icon={<FileText className="size-4" />}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo rotulo="Número" valor={nota.numero || "—"} icone={<Hash className="size-3.5" />} />
          <Campo rotulo="Série" valor={nota.serie || "—"} />
          <Campo
            rotulo="Emissão"
            valor={formatarEmissao(nota.dataEmissao)}
          />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Tipo de operação</p>
            <StatusBadge
              status={nota.tipo === "Entrada" ? "info" : nota.tipo === "Saída" ? "ok" : "neutro"}
              label={nota.tipo}
              dot={false}
            />
          </div>
          <Campo
            rotulo="Natureza da operação"
            valor={nota.naturezaOperacao || "—"}
            className="sm:col-span-2"
          />
          <Campo
            rotulo="Chave de acesso"
            valor={nota.chave ? formatarChave(nota.chave) : "—"}
            className="sm:col-span-2 lg:col-span-2"
            mono
          />
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <CartaoParte titulo="Emitente" icone={<Building2 className="size-4" />} parte={nota.emitente} />
        <CartaoParte titulo="Destinatário" icone={<Truck className="size-4" />} parte={nota.destinatario} />
      </div>

      <Section
        title="Itens da nota"
        description={`${nota.itens.length} ${nota.itens.length === 1 ? "produto" : "produtos"}`}
        icon={<Receipt className="size-4" />}
        noPadding
      >
        {nota.itens.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            Nenhum item encontrado na nota.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>NCM</TableHead>
                <TableHead>CFOP</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Valor unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nota.itens.map((item) => (
                <TableRow key={item.numero}>
                  <TableCell className="text-muted-foreground tabular-nums">{item.numero}</TableCell>
                  <TableCell>
                    <p className="font-medium">{item.descricao || "—"}</p>
                    {item.codigo && (
                      <p className="font-mono text-xs text-muted-foreground">{item.codigo}</p>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.ncm || "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.cfop || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fmtDec(item.quantidade)} {item.unidade}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMoedaExata(item.valorUnitario)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {fmtMoedaExata(item.valorTotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      <Section title="Totais da nota">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <LinhaTotal rotulo="Base de cálculo ICMS" valor={nota.totais.baseIcms} />
          <LinhaTotal rotulo="Valor do ICMS" valor={nota.totais.valorIcms} />
          <LinhaTotal rotulo="Valor dos produtos" valor={nota.totais.valorProdutos} />
          <LinhaTotal rotulo="Frete" valor={nota.totais.valorFrete} />
          <LinhaTotal rotulo="Desconto" valor={nota.totais.valorDesconto} />
          <LinhaTotal rotulo="Valor total da nota" valor={nota.totais.valorTotal} destaque />
        </div>
      </Section>
    </div>
  )
}

function Campo({
  rotulo,
  valor,
  icone,
  className,
  mono,
}: {
  rotulo: string
  valor: string
  icone?: React.ReactNode
  className?: string
  mono?: boolean
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icone}
        {rotulo}
      </p>
      <p className={cn("text-sm font-medium break-words", mono && "font-mono text-xs")}>{valor}</p>
    </div>
  )
}

function CartaoParte({
  titulo,
  icone,
  parte,
}: {
  titulo: string
  icone: React.ReactNode
  parte: NfeParte
}) {
  return (
    <Section title={titulo} icon={icone}>
      <div className="space-y-3">
        <div>
          <p className="text-base font-semibold">{parte.nome || "—"}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {parte.documento ? formatarDocumento(parte.documento) : "Documento não informado"}
          </p>
        </div>
        {parte.inscricaoEstadual && (
          <Campo rotulo="Inscrição estadual" valor={parte.inscricaoEstadual} mono />
        )}
        {parte.endereco && <EnderecoTexto endereco={parte.endereco} />}
      </div>
    </Section>
  )
}

function EnderecoTexto({ endereco }: { endereco: NfeEndereco }) {
  const linha1 = [endereco.logradouro, endereco.numero].filter(Boolean).join(", ")
  const linha2 = [endereco.bairro, endereco.municipio && `${endereco.municipio} - ${endereco.uf}`]
    .filter(Boolean)
    .join(" · ")
  const cep = endereco.cep ? `CEP ${endereco.cep}` : ""
  return (
    <div className="space-y-0.5 text-sm text-muted-foreground">
      {linha1 && <p>{linha1}</p>}
      {(linha2 || cep) && <p>{[linha2, cep].filter(Boolean).join(" · ")}</p>}
    </div>
  )
}

function LinhaTotal({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string
  valor: number
  destaque?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border p-3",
        destaque && "border-primary/30 bg-primary/5",
      )}
    >
      <span className="text-sm text-muted-foreground">{rotulo}</span>
      <span className={cn("tabular-nums font-semibold", destaque && "text-primary")}>
        {fmtMoedaExata(valor)}
      </span>
    </div>
  )
}
