import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Cabecalho, Erro, Vazio } from '@/components/estados'
import { CampoSelect } from '@/components/filtros/CampoSelect'
import { CampoCartao } from '@/components/TabelaSimples'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDebounce } from '@/hooks/use-debounce'
import { useIsMobile } from '@/hooks/use-mobile'
import { useParamsUrl } from '@/hooks/use-params-url'
import { api, mensagemErro } from '@/lib/api'
import { fmt, truncar } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ColunaMeta, ListaResposta, Registro, TabelaMeta } from '@/types/api'
import { FormularioRegistro } from './FormularioRegistro'

const CODIGOS = ['co_catmat', 'co_pdm', 'co_ibge', 'co_seq_bps', 'co_classe', 'ano_compra']
const numerica = (c: ColunaMeta) => (c.tipo === 'int' || c.tipo === 'decimal') && !c.fk

function Celula({ coluna: c, linha }: { coluna: ColunaMeta; linha: Registro }) {
  const v = linha[c.nome]
  if (c.fk) return <>{linha[`${c.nome}__rotulo`] ?? v ?? '—'}</>
  if (v === null || v === undefined) return <span className="text-muted-foreground">—</span>
  switch (c.tipo) {
    case 'decimal':
      return <>{c.nome.startsWith('vl_preco_unit') ? fmt.preco(v) : fmt.num(v)}</>
    case 'int':
      return <>{CODIGOS.includes(c.nome) ? v : fmt.int(v)}</>
    case 'date':
    case 'datetime':
      return <>{fmt.data(v)}</>
    case 'flag':
      return <Badge variant={v === 'S' ? 'secondary' : 'outline'}>{v === 'S' ? 'Sim' : 'Não'}</Badge>
    case 'enum':
      return <Badge variant="outline">{v}</Badge>
    default:
      return c.cnpj ? <>{fmt.cnpj(v)}</> : <span title={String(v)}>{truncar(v, 70)}</span>
  }
}

function Listagem({ tabela }: { tabela: TabelaMeta }) {
  const queryClient = useQueryClient()
  const celular = useIsMobile()
  const { valores, definir } = useParamsUrl()
  const [busca, setBusca] = useState(valores.q ?? '')
  const termo = useDebounce(busca)
  const [formulario, setFormulario] = useState<{ id: string | number | null } | null>(null)
  const [excluindo, setExcluindo] = useState<string | number | null>(null)

  const pagina = Math.max(Number(valores.pagina) || 1, 1)
  const ordem = valores.ordem ?? ''
  const dir = valores.dir === 'desc' ? 'desc' : 'asc'
  const visiveis = tabela.colunas.filter((c) => !c.ocultaNaLista && c.tipo !== 'senha')

  useEffect(() => {
    if (termo !== (valores.q ?? '')) definir({ q: termo, pagina: null })
  }, [termo, valores.q, definir])

  const lista = useQuery({
    queryKey: ['crud', tabela.nome, 'lista', valores.q ?? '', pagina, ordem, dir],
    queryFn: () =>
      api<ListaResposta>(`/crud/${tabela.nome}`, { params: { q: valores.q, pagina, ordem, dir } }),
    placeholderData: keepPreviousData,
  })

  const excluir = useMutation({
    mutationFn: (id: string | number) => api(`/crud/${tabela.nome}/${id}`, { metodo: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crud', tabela.nome] })
      queryClient.invalidateQueries({ queryKey: ['opcoes', tabela.nome] })
      toast.success('Registro excluído.')
    },
    onError: (e) => toast.error(mensagemErro(e)),
    onSettled: () => setExcluindo(null),
  })

  const ordenar = (coluna: string) =>
    definir({ ordem: coluna, dir: ordem === coluna && dir === 'asc' ? 'desc' : 'asc', pagina: null })

  const paginas = lista.data ? Math.max(1, Math.ceil(lista.data.total / lista.data.tamanho)) : 1

  return (
    <>
      <Cabecalho
        titulo={tabela.rotulo}
        descricao={tabela.podeEscrever ? undefined : 'Seu perfil tem acesso somente de leitura.'}
        acoes={
          tabela.podeEscrever && (
            <Button onClick={() => setFormulario({ id: null })}>
              <PlusIcon />
              Novo
            </Button>
          )
        }
      />

      <Card className="gap-4 py-4">
        <CardContent className="px-4">
          <div className="relative mb-4 max-w-sm">
            <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Buscar"
              placeholder="Buscar por texto ou código"
              className="pl-8"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {celular && (
            <div className="mb-3 flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <CampoSelect
                  rotulo="Ordenar por"
                  valor={ordem}
                  todos="Padrão"
                  aoMudar={(v) => definir({ ordem: v || null, dir: null, pagina: null })}
                  opcoes={visiveis.map((c) => ({ valor: c.nome, rotulo: c.rotulo }))}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                disabled={!ordem}
                aria-label={dir === 'asc' ? 'Ordem crescente; inverter' : 'Ordem decrescente; inverter'}
                onClick={() => ordenar(ordem)}
              >
                {dir === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />}
              </Button>
            </div>
          )}

          {lista.isPending && <Skeleton className="h-96" />}
          {lista.isError && <Erro erro={lista.error} tentar={() => lista.refetch()} />}
          {lista.data && lista.data.linhas.length === 0 && (
            <Vazio titulo="Nenhum registro encontrado" descricao={valores.q ? 'Tente outro termo de busca.' : undefined} />
          )}
          {celular && lista.data && lista.data.linhas.length > 0 && (
            <ul className={cn('grid grid-cols-1 gap-2 transition-opacity md:grid-cols-2', lista.isPlaceholderData && 'opacity-60')}>
              {lista.data.linhas.map((linha) => {
                const id = linha[tabela.pk] as string | number
                return (
                  <li key={id} className="flex min-w-0 flex-col gap-2 rounded-lg border p-3">
                    <dl className="grid gap-2">
                      {visiveis.map((c) => (
                        <CampoCartao key={c.nome} rotulo={c.rotulo} num={numerica(c)}>
                          <Celula coluna={c} linha={linha} />
                        </CampoCartao>
                      ))}
                    </dl>
                    {tabela.podeEscrever && (
                      <div className="mt-auto flex justify-end gap-2 border-t pt-2">
                        <Button variant="outline" size="sm" aria-label={`Editar registro ${id}`} onClick={() => setFormulario({ id })}>
                          <PencilIcon />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Excluir registro ${id}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setExcluindo(id)}
                        >
                          <Trash2Icon />
                          Excluir
                        </Button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {!celular && lista.data && lista.data.linhas.length > 0 && (
            <div className={cn('overflow-x-auto transition-opacity', lista.isPlaceholderData && 'opacity-60')}>
              <Table>
                <TableHeader>
                  <TableRow>
                    {visiveis.map((c) => {
                      const ativa = ordem === c.nome
                      const Icone = !ativa ? ArrowUpDownIcon : dir === 'asc' ? ArrowUpIcon : ArrowDownIcon
                      return (
                        <TableHead
                          key={c.nome}
                          aria-sort={ativa ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                          className={cn(numerica(c) && 'text-right')}
                        >
                          <button
                            type="button"
                            onClick={() => ordenar(c.nome)}
                            className="inline-flex items-center gap-1 rounded hover:text-primary"
                          >
                            {c.rotulo}
                            <Icone className={cn('size-3', !ativa && 'opacity-40')} />
                          </button>
                        </TableHead>
                      )
                    })}
                    {tabela.podeEscrever && <TableHead className="w-20" aria-label="Ações" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lista.data.linhas.map((linha) => {
                    const id = linha[tabela.pk] as string | number
                    return (
                      <TableRow key={id}>
                        {visiveis.map((c) => (
                          <TableCell key={c.nome} className={cn(numerica(c) && 'text-right tabular-nums')}>
                            <Celula coluna={c} linha={linha} />
                          </TableCell>
                        ))}
                        {tabela.podeEscrever && (
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Editar registro ${id}`}
                                onClick={() => setFormulario({ id })}
                              >
                                <PencilIcon />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Excluir registro ${id}`}
                                className="text-destructive hover:text-destructive"
                                onClick={() => setExcluindo(id)}
                              >
                                <Trash2Icon />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {lista.data && (
            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{fmt.int(lista.data.total)} registro(s)</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Página anterior"
                  disabled={pagina <= 1}
                  onClick={() => definir({ pagina: pagina - 1 })}
                >
                  <ChevronLeftIcon />
                </Button>
                <span className="tabular-nums">
                  {lista.data.pagina} / {paginas}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Próxima página"
                  disabled={pagina >= paginas}
                  onClick={() => definir({ pagina: pagina + 1 })}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {formulario && <FormularioRegistro tabela={tabela} id={formulario.id} aoFechar={() => setFormulario(null)} />}

      <AlertDialog open={excluindo !== null} onOpenChange={(aberto) => !aberto && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Registros usados em compras são protegidos e não serão excluídos. Ao
              excluir um processo, os itens dele também são apagados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={excluir.isPending}
              onClick={() => excluindo !== null && excluir.mutate(excluindo)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function CrudPage() {
  const { tabela: nome } = useParams()
  const meta = useQuery({
    queryKey: ['crud-meta'],
    queryFn: () => api<TabelaMeta[]>('/crud'),
    staleTime: Infinity,
  })

  if (meta.isPending) return <Skeleton className="h-96" />
  if (meta.isError) return <Erro erro={meta.error} tentar={() => meta.refetch()} />
  const tabela = meta.data.find((t) => t.nome === nome)
  if (!tabela) return <Vazio titulo="Cadastro não encontrado" descricao="Ele não existe ou seu perfil não tem acesso." />
  return <Listagem key={tabela.nome} tabela={tabela} />
}
