import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Feature } from 'geojson'
import { ChevronRightIcon } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Cabecalho, Erro, KpiCard, Painel } from '@/components/estados'
import { BarraFiltros } from '@/components/filtros/BarraFiltros'
import { CampoSelect } from '@/components/filtros/CampoSelect'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useParamsUrl } from '@/hooks/use-params-url'
import { api } from '@/lib/api'
import { fmt, normalizar, truncar } from '@/lib/format'
import { IBGE_UF, malhaBrasil, malhaEstado, municipiosIbge } from '@/lib/geo'
import type { MapaEstado, MapaMunicipio, MapaResumo, TotaisRegiao } from '@/types/api'
import { MapaCoropletico, METRICAS, type Metrica } from './MapaCoropletico'

const codigo = (f: Feature) => String((f.properties as { codarea?: string } | null)?.codarea ?? '')

function Ranking<T>({
  linhas,
  chave,
  nome,
  valor,
}: {
  linhas: T[]
  chave: (l: T) => string | number
  nome: (l: T) => React.ReactNode
  valor: (l: T) => number
}) {
  if (!linhas.length) return <p className="text-sm text-muted-foreground">Sem dados.</p>
  const maximo = Math.max(...linhas.map(valor), 1)
  return (
    <ul className="grid grid-cols-1 gap-3">
      {linhas.map((l) => (
        <li key={chave(l)} className="min-w-0 text-sm">
          <div className="flex justify-between gap-3">
            <span className="min-w-0 truncate">{nome(l)}</span>
            <span className="shrink-0 font-medium tabular-nums">{fmt.moedaCurta(valor(l))}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(valor(l) / maximo) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function MapaPage() {
  const { valores, definir } = useParamsUrl()
  const uf = valores.uf ?? ''
  const idMunicipio = valores.id_municipio ?? ''
  const metrica = (valores.metrica && valores.metrica in METRICAS ? valores.metrica : 'vl_total') as Metrica
  const filtros = useMemo(
    () => ({ ano: valores.ano, esfera: valores.esfera, tp_compra: valores.tp_compra, atipicos: valores.atipicos }),
    [valores.ano, valores.esfera, valores.tp_compra, valores.atipicos],
  )

  const geoBrasil = useQuery({ queryKey: ['ibge', 'br'], queryFn: malhaBrasil, staleTime: Infinity, enabled: !uf })
  const geoUf = useQuery({ queryKey: ['ibge', uf], queryFn: () => malhaEstado(uf), staleTime: Infinity, enabled: !!uf })
  const nomesIbge = useQuery({
    queryKey: ['ibge', 'nomes', uf],
    queryFn: () => municipiosIbge(uf),
    staleTime: Infinity,
    enabled: !!uf,
  })
  const estados = useQuery({
    queryKey: ['mapa', 'estados', filtros],
    queryFn: () => api<MapaEstado[]>('/dashboard/mapa/estados', { params: filtros }),
    enabled: !uf,
  })
  const municipios = useQuery({
    queryKey: ['mapa', 'municipios', uf, filtros],
    queryFn: () => api<MapaMunicipio[]>(`/dashboard/mapa/estados/${uf}/municipios`, { params: filtros }),
    enabled: !!uf,
  })
  const resumo = useQuery({
    queryKey: ['mapa', 'resumo', uf, idMunicipio, filtros],
    queryFn: () => api<MapaResumo>('/dashboard/mapa/resumo', { params: { ...filtros, uf, id_municipio: idMunicipio } }),
    placeholderData: keepPreviousData,
  })

  // O CSV do BPS não traz código IBGE: casa pelo nome normalizado quando co_ibge está vazio.
  const casamento = useMemo(() => {
    const porCodigo = new Map<string, MapaMunicipio>()
    const semCorrespondencia: string[] = []
    const nomes = nomesIbge.data ?? []
    const codigoPorNome = new Map(nomes.map((n) => [normalizar(n.nome), String(n.id)]))
    const nomePorCodigo = new Map(nomes.map((n) => [String(n.id), n.nome]))
    for (const d of municipios.data ?? []) {
      const cod = d.co_ibge ? String(d.co_ibge) : codigoPorNome.get(normalizar(d.no_municipio))
      if (cod) porCodigo.set(cod, d)
      else semCorrespondencia.push(d.no_municipio)
    }
    return { porCodigo, nomePorCodigo, semCorrespondencia }
  }, [municipios.data, nomesIbge.data])

  const porUf = useMemo(() => new Map((estados.data ?? []).map((d) => [d.sg_uf, d])), [estados.data])

  const dadoDe = useCallback(
    (f: Feature): TotaisRegiao | undefined =>
      uf ? casamento.porCodigo.get(codigo(f)) : porUf.get(IBGE_UF[codigo(f)]),
    [uf, casamento, porUf],
  )
  const nomeDe = useCallback(
    (f: Feature) => {
      const c = codigo(f)
      if (uf) return casamento.nomePorCodigo.get(c) ?? casamento.porCodigo.get(c)?.no_municipio ?? c
      return porUf.get(IBGE_UF[c])?.no_estado ?? IBGE_UF[c] ?? c
    },
    [uf, casamento, porUf],
  )
  const aoClicar = useCallback(
    (f: Feature) => {
      const c = codigo(f)
      if (!uf) {
        definir({ uf: IBGE_UF[c], id_municipio: null, municipio: null })
        return
      }
      const d = casamento.porCodigo.get(c)
      if (d) definir({ id_municipio: d.id_municipio, municipio: casamento.nomePorCodigo.get(c) ?? d.no_municipio })
    },
    [uf, casamento, definir],
  )

  const geo = uf ? geoUf : geoBrasil
  const dados = uf ? municipios : estados
  const pronto = geo.data && dados.data && (!uf || nomesIbge.data)
  const erroMapa = geo.error ?? dados.error ?? (uf ? nomesIbge.error : null)
  const titulo = valores.municipio ?? uf ?? ''
  const k = resumo.data?.kpi

  return (
    <>
      <Cabecalho titulo="Compras por localidade" descricao="Clique em um estado para ver os municípios." />
      <BarraFiltros campos={['ano', 'esfera', 'tp_compra', 'atipicos']} valores={valores} definir={definir}>
        <CampoSelect
          rotulo="Colorir por"
          valor={metrica}
          todos={null}
          aoMudar={(v) => definir({ metrica: v === 'vl_total' ? '' : v })}
          opcoes={Object.entries(METRICAS).map(([valor, m]) => ({ valor, rotulo: m.rotulo }))}
        />
      </BarraFiltros>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Painel
          titulo="Mapa"
          nota={
            pronto
              ? uf
                ? `${dados.data?.length} município(s) com compras.${
                    casamento.semCorrespondencia.length
                      ? ` Sem correspondência no mapa: ${casamento.semCorrespondencia.join(', ')}.`
                      : ''
                  } Malhas: IBGE.`
                : `${dados.data?.length} de 27 estados com compras no recorte. Malhas: IBGE.`
              : undefined
          }
        >
          <nav aria-label="Localização" className="mb-3 flex flex-wrap items-center gap-1 text-sm">
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0"
              onClick={() => definir({ uf: null, id_municipio: null, municipio: null })}
            >
              Brasil
            </Button>
            {uf && (
              <>
                <ChevronRightIcon className="size-3.5 text-muted-foreground" />
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={() => definir({ id_municipio: null, municipio: null })}
                >
                  {uf}
                </Button>
              </>
            )}
            {valores.municipio && (
              <>
                <ChevronRightIcon className="size-3.5 text-muted-foreground" />
                <span className="font-medium">{valores.municipio}</span>
              </>
            )}
          </nav>
          {erroMapa ? (
            <Erro
              erro={erroMapa}
              tentar={() => {
                geo.refetch()
                dados.refetch()
                if (uf) nomesIbge.refetch()
              }}
            />
          ) : pronto ? (
            <MapaCoropletico
              geo={geo.data!}
              metrica={metrica}
              detalhado={!!uf}
              dadoDe={dadoDe}
              nomeDe={nomeDe}
              aoClicar={aoClicar}
            />
          ) : (
            <Skeleton className="h-[420px] w-full md:h-[560px]" />
          )}
        </Painel>

        <div className="grid min-w-0 grid-cols-1 gap-4">
          {resumo.isError && <Erro erro={resumo.error} tentar={() => resumo.refetch()} />}
          {resumo.isPending && <Skeleton className="h-96" />}
          {k && resumo.data && (
            <>
              <section aria-label={`Resumo de ${titulo || 'Brasil'}`}>
                <h2 className="mb-2 text-sm font-semibold">{titulo || 'Brasil'}</h2>
                <div className="grid grid-cols-2 gap-3">
                  <KpiCard rotulo="Valor comprado" valor={fmt.moedaCurta(k.vl_total)} />
                  <KpiCard rotulo="Itens" valor={fmt.int(k.qt_itens)} />
                  <KpiCard rotulo="Processos" valor={fmt.int(k.qt_processos)} />
                  <KpiCard rotulo="Instituições" valor={fmt.int(k.qt_instituicoes)} />
                  <KpiCard rotulo="Medicamentos" valor={fmt.int(k.qt_medicamentos)} />
                  <KpiCard rotulo="Fornecedores" valor={fmt.int(k.qt_fornecedores)} />
                </div>
              </section>
              <Painel titulo="Medicamentos com maior gasto" nota="Clique para ver o preço de referência.">
                <Ranking
                  linhas={resumo.data.medicamentos}
                  chave={(m) => m.co_catmat}
                  valor={(m) => m.vl_total}
                  nome={(m) => (
                    <Link to={`/precos?catmat=${m.co_catmat}`} title={m.ds_item} className="hover:text-primary hover:underline">
                      {truncar(m.ds_item, 44)}
                    </Link>
                  )}
                />
              </Painel>
              <Painel titulo="Instituições que mais compraram">
                <Ranking
                  linhas={resumo.data.instituicoes}
                  chave={(i) => `${i.no_instituicao}-${i.no_municipio}-${i.sg_uf}`}
                  valor={(i) => i.vl_total}
                  nome={(i) => (
                    <span title={i.no_instituicao}>
                      {truncar(i.no_instituicao, 30)}{' '}
                      <span className="text-muted-foreground">
                        {i.no_municipio}/{i.sg_uf}
                      </span>
                    </span>
                  )}
                />
              </Painel>
            </>
          )}
        </div>
      </div>
    </>
  )
}
