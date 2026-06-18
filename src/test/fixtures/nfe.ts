// XML de exemplo de NF-e (padrão Portal Fiscal, namespace default) usado nos testes de parsing
// e da tela de Notas Fiscais. Estrutura mínima porém realista: nfeProc → NFe → infNFe.

export const xmlNfeExemplo = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35200114200166000187550010000000031000000017" versao="4.00">
      <ide>
        <nNF>3</nNF>
        <serie>1</serie>
        <natOp>VENDA DE MERCADORIA</natOp>
        <tpNF>1</tpNF>
        <dhEmi>2026-06-15T10:30:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>14200166000187</CNPJ>
        <xNome>DISTRIBUIDORA FARMA LTDA</xNome>
        <IE>123456789</IE>
        <enderEmit>
          <xLgr>RUA DAS FLORES</xLgr>
          <nro>100</nro>
          <xBairro>CENTRO</xBairro>
          <xMun>SAO LUIS</xMun>
          <UF>MA</UF>
          <CEP>65000000</CEP>
        </enderEmit>
      </emit>
      <dest>
        <CNPJ>06900000000191</CNPJ>
        <xNome>CAHOSP CENTRAL DE ABASTECIMENTO</xNome>
        <IE>987654321</IE>
        <enderDest>
          <xLgr>AV DOS HOSPITAIS</xLgr>
          <nro>500</nro>
          <xBairro>RENASCENCA</xBairro>
          <xMun>SAO LUIS</xMun>
          <UF>MA</UF>
          <CEP>65075000</CEP>
        </enderDest>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>MED-001</cProd>
          <xProd>DIPIRONA 500MG CX 100</xProd>
          <NCM>30049099</NCM>
          <CFOP>5102</CFOP>
          <uCom>CX</uCom>
          <qCom>10.0000</qCom>
          <vUnCom>25.5000</vUnCom>
          <vProd>255.00</vProd>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>MED-002</cProd>
          <xProd>SORO FISIOLOGICO 500ML</xProd>
          <NCM>30049069</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>50.0000</qCom>
          <vUnCom>4.0000</vUnCom>
          <vProd>200.00</vProd>
        </prod>
      </det>
      <total>
        <ICMSTot>
          <vBC>455.00</vBC>
          <vICMS>54.60</vICMS>
          <vProd>455.00</vProd>
          <vFrete>0.00</vFrete>
          <vDesc>5.00</vDesc>
          <vNF>450.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`
