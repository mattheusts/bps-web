import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2Icon, FileSpreadsheetIcon, Loader2Icon, UploadCloudIcon } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { Cabecalho, GradeKpis, KpiCard, Painel } from '@/components/estados'
import { TabelaSimples } from '@/components/TabelaSimples'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { api, mensagemErro } from '@/lib/api'
import { fmt } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { RelatorioImportacao } from '@/types/api'

const ROTULOS: Record<string, string> = {
  municipio: 'Municípios',
  instituicao: 'Instituições',
  fornecedor: 'Fornecedores',
  fabricante: 'Fabricantes',
  pdm: 'PDM',
  medicamento: 'Medicamentos',
  processo_compra: 'Processos',
  item_compra: 'Itens',
}

export default function ImportacaoPage() {
  const queryClient = useQueryClient()
  const entrada = useRef<HTMLInputElement>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [arrastando, setArrastando] = useState(false)

  const importar = useMutation({
    mutationFn: (f: File) => {
      const corpo = new FormData()
      corpo.append('arquivo', f)
      return api<RelatorioImportacao>('/importacao', { metodo: 'POST', corpo })
    },
    onSuccess: () => {
      // A importação muda cadastros e todos os dashboards.
      const manter = new Set(['crud-meta'])
      queryClient.invalidateQueries({ predicate: (q) => !manter.has(String(q.queryKey[0])) })
    },
  })

  const soltar = (ev: DragEvent) => {
    ev.preventDefault()
    setArrastando(false)
    const f = ev.dataTransfer.files[0]
    if (f) setArquivo(f)
  }

  const r = importar.data

  return (
    <div className="grid max-w-4xl gap-4">
      <Cabecalho
        titulo="Importar CSV do BPS"
        descricao="Arquivo anual separado por ponto e vírgula. Reimportar o mesmo arquivo não duplica dados: cada item é identificado pelo co_seq_bps e atualizado."
      />

      <Card>
        <CardContent>
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setArrastando(true)
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={soltar}
            className={cn(
              'flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors hover:border-primary/60 hover:bg-accent/40',
              arrastando && 'border-primary bg-accent',
            )}
          >
            <input
              ref={entrada}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            />
            {arquivo ? (
              <>
                <FileSpreadsheetIcon className="mb-3 size-9 text-primary" />
                <span className="font-medium break-all">{arquivo.name}</span>
                <span className="mt-1 text-sm text-muted-foreground">
                  {fmt.num(Math.round((arquivo.size / 1024 / 1024) * 100) / 100)} MB
                </span>
              </>
            ) : (
              <>
                <UploadCloudIcon className="mb-3 size-9 text-muted-foreground" />
                <span className="font-medium">Arraste o CSV ou clique para escolher</span>
                <span className="mt-1 text-sm text-muted-foreground">Tamanho máximo de 500 MB</span>
              </>
            )}
          </label>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Para arquivos muito grandes, use <code>npm run importar -- arquivo.csv</code> na API.
            </p>
            <Button disabled={!arquivo || importar.isPending} onClick={() => arquivo && importar.mutate(arquivo)}>
              {importar.isPending && <Loader2Icon className="animate-spin" />}
              {importar.isPending ? 'Importando…' : 'Importar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {importar.isError && (
        <Alert variant="destructive">
          <AlertTitle>Falha na importação</AlertTitle>
          <AlertDescription>{mensagemErro(importar.error)}</AlertDescription>
        </Alert>
      )}

      {r && (
        <>
          <Alert>
            <CheckCircle2Icon />
            <AlertTitle>Importação concluída em {String(r.segundos).replace('.', ',')} s</AlertTitle>
          </Alert>
          <GradeKpis>
            <KpiCard rotulo="Linhas lidas" valor={fmt.int(r.linhas)} />
            <KpiCard rotulo="Itens novos" valor={fmt.int(r.inseridos)} />
            <KpiCard rotulo="Já existiam" valor={fmt.int(r.existentes)} detalhe="atualizados" />
            <KpiCard rotulo="Ignorados" valor={fmt.int(r.ignorados)} />
          </GradeKpis>
          <Painel titulo="Registros novos por tabela">
            <TabelaSimples
              linhas={Object.entries(r.novos)}
              chave={(l) => l[0]}
              colunas={[
                { titulo: 'Tabela', valor: (l) => ROTULOS[l[0]] ?? l[0] },
                { titulo: 'Registros novos', valor: (l) => fmt.int(l[1]), num: true },
              ]}
            />
          </Painel>
          {r.erros.length > 0 && (
            <Painel titulo="Linhas ignoradas">
              <TabelaSimples
                linhas={r.erros}
                chave={(l, i) => `${l.linha}-${i}`}
                colunas={[
                  { titulo: 'Linha', valor: (l) => l.linha, num: true },
                  { titulo: 'Motivo', valor: (l) => l.mensagem },
                ]}
              />
            </Painel>
          )}
        </>
      )}
    </div>
  )
}
