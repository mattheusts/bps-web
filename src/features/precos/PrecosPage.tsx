import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { GraficoBarras, GraficoLinhas } from '@/components/charts/graficos'
import { Cabecalho, CarregandoPagina, Erro, GradeKpis, KpiCard, Painel, Vazio } from '@/components/estados'
import { BarraFiltros } from '@/components/filtros/BarraFiltros'
import { CampoSelect } from '@/components/filtros/CampoSelect'
import { TabelaSimples } from '@/components/TabelaSimples'
import { Badge } from '@/components/ui/badge'
import { useParamsUrl } from '@/hooks/use-params-url'
import { api } from '@/lib/api'
import { fmt, truncar } from '@/lib/format'
import type { PrecoResposta } from '@/types/api'
import { BuscaMedicamento } from './BuscaMedicamento'

const VAZIA = '(vazio)'

export default function PrecosPage() {
  const { valores, definir } = useParamsUrl()
  const catmat = valores.catmat ?? ''
  const filtros = useMemo(
    () => ({ ano: valores.ano, esfera: valores.esfera, tp_compra: valores.tp_compra }),
    [valores.ano, valores.esfera, valores.tp_compra],
  )

  const unidades = useQuery({
    queryKey: ['precos', catmat, 'unidades', filtros],
    queryFn: () => api<{ un: string; n: number }[]>(`/dashboard/precos/${catmat}/unidades`, { params: filtros }),
    enabled: /^\d+$/.test(catmat),
  })

  // RN03: preço só é comparável dentro da mesma unidade. Começa pela mais frequente.
  const lista = unidades.data ?? []
  const pedida = valores.un
  const un = lista.some((u) => (u.un || VAZIA) === pedida) ? (pedida as string) : lista[0] ? lista[0].un || VAZIA : undefined

  const preco = useQuery({
    queryKey: ['precos', catmat, un, filtros],
    queryFn: () => api<PrecoResposta>(`/dashboard/precos/${catmat}`, { params: { ...filtros, un } }),
    enabled: un !== undefined,
  })

  const g = preco.data?.geral
  const nome = preco.data?.medicamento
    ? `${preco.data.medicamento.co_catmat} · ${truncar(preco.data.medicamento.ds_item, 80)}`
    : catmat

  return (
    <>
      <Cabecalho
        titulo="Preço de referência"
        descricao="Quanto o poder público paga por um medicamento, por estado e ao longo do tempo."
      />
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end">
        <BuscaMedicamento rotulo={nome} aoEscolher={(c) => definir({ catmat: c, un: null })} />
        <div className="md:w-72">
          <CampoSelect
            rotulo="Unidade de fornecimento"
            valor={un ?? ''}
            todos={un === undefined ? '—' : null}
            desabilitado={lista.length < 2}
            aoMudar={(v) => definir({ un: v })}
            opcoes={lista.map((u) => ({
              valor: u.un || VAZIA,
              rotulo: `${u.un || '(não informada)'} — ${fmt.int(u.n)} compras`,
            }))}
          />
        </div>
      </div>
      <BarraFiltros campos={['ano', 'esfera', 'tp_compra']} valores={valores} definir={definir} />

      {!catmat && <Vazio titulo="Escolha um medicamento" descricao="Busque pelo nome ou pelo código CATMAT." />}
      {unidades.isError && <Erro erro={unidades.error} tentar={() => unidades.refetch()} />}
      {catmat && unidades.isSuccess && lista.length === 0 && <Vazio titulo="Nenhuma compra desse medicamento no recorte" />}
      {(unidades.isLoading || preco.isLoading) && <CarregandoPagina />}
      {preco.isError && <Erro erro={preco.error} tentar={() => preco.refetch()} />}
      {preco.data && !g?.n && <Vazio titulo="Sem compras no recorte" />}

      {preco.data && g && g.n > 0 && (
        <div className="grid gap-4">
          <GradeKpis className="lg:grid-cols-5">
            <KpiCard rotulo="Compras" valor={fmt.int(g.n)} />
            <KpiCard rotulo="Mediana" valor={fmt.preco(g.mediana)} detalhe={`p25 ${fmt.preco(g.p25)} · p75 ${fmt.preco(g.p75)}`} />
            <KpiCard rotulo="Média ponderada" valor={fmt.preco(g.media_ponderada)} detalhe="pela quantidade comprada" />
            <KpiCard rotulo="Menor preço" valor={fmt.preco(g.minimo)} />
            <KpiCard
              rotulo="Maior preço"
              valor={fmt.preco(g.maximo)}
              detalhe={g.mediana > 0 ? `${fmt.num(Math.round((g.maximo / g.mediana) * 100) / 100)}× a mediana` : undefined}
            />
          </GradeKpis>

          <div className="grid gap-4 xl:grid-cols-2">
            <Painel
              titulo="Preço mediano por UF"
              nota="A linha tracejada é a mediana nacional. Estados com uma ou duas compras têm mediana pouco confiável."
            >
              <GraficoBarras
                dados={preco.data.porUf}
                categoria="sg_uf"
                series={[{ chave: 'mediana', rotulo: 'Mediana da UF' }]}
                formatar={fmt.preco}
                referencia={{ valor: g.mediana, rotulo: 'Nacional' }}
                detalhe={(u) => `${fmt.int(u.n)} compra(s) · mín. ${fmt.preco(u.minimo)} · máx. ${fmt.preco(u.maximo)}`}
              />
            </Painel>
            <Painel titulo="Evolução mensal do preço">
              <GraficoLinhas
                dados={preco.data.porMes}
                categoria="mes"
                series={[
                  { chave: 'mediana', rotulo: 'Mediana' },
                  { chave: 'media_ponderada', rotulo: 'Média ponderada' },
                ]}
                formatar={fmt.preco}
                formatarCategoria={fmt.mes}
                detalhe={(m) => `${fmt.int(m.n)} compra(s)`}
              />
            </Painel>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Painel titulo="Por fornecedor">
              <TabelaSimples
                linhas={preco.data.porFornecedor}
                chave={(l) => l.id_fornecedor}
                colunas={[
                  { titulo: 'Fornecedor', valor: (l) => <span title={l.no_fornecedor}>{truncar(l.no_fornecedor, 36)}</span> },
                  { titulo: 'Compras', valor: (l) => fmt.int(l.n), num: true },
                  { titulo: 'Mediana', valor: (l) => fmt.preco(l.mediana), num: true },
                  { titulo: 'Mín.', valor: (l) => fmt.preco(l.minimo), num: true },
                  { titulo: 'Máx.', valor: (l) => fmt.preco(l.maximo), num: true },
                ]}
              />
            </Painel>
            <Painel titulo="Compras mais caras">
              <TabelaSimples
                linhas={preco.data.compras.slice(0, 15)}
                chave={(l) => l.co_seq_bps}
                colunas={[
                  { titulo: 'Data', valor: (l) => fmt.data(l.dt_compra) },
                  {
                    titulo: 'Comprador',
                    valor: (l) => (
                      <span title={l.no_instituicao}>
                        {truncar(l.no_instituicao, 28)}
                        <span className="block text-xs text-muted-foreground">
                          {l.no_municipio}/{l.sg_uf}
                        </span>
                      </span>
                    ),
                  },
                  { titulo: 'Qtd.', valor: (l) => fmt.int(l.qt_medicamento), num: true },
                  { titulo: 'Preço', valor: (l) => fmt.preco(l.vl_preco_unitario), num: true },
                  {
                    titulo: '× mediana',
                    num: true,
                    valor: (l) => {
                      const x = g.mediana > 0 ? l.vl_preco_unitario / g.mediana : 0
                      return (
                        <Badge variant={x >= 1.5 ? 'destructive' : 'secondary'}>
                          {fmt.num(Math.round(x * 10) / 10)}×
                        </Badge>
                      )
                    },
                  },
                ]}
              />
            </Painel>
          </div>
        </div>
      )}
    </>
  )
}
