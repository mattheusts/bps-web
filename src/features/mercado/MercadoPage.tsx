import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { GraficoBarras, GraficoLinhas } from '@/components/charts/graficos'
import { Cabecalho, CarregandoPagina, Erro, GradeKpis, KpiCard, Painel, Vazio } from '@/components/estados'
import { BarraFiltros } from '@/components/filtros/BarraFiltros'
import { useParamsUrl } from '@/hooks/use-params-url'
import { api } from '@/lib/api'
import { fmt } from '@/lib/format'
import type { MercadoResposta } from '@/types/api'

const NOME_GENERICO = { S: 'Genérico', N: 'Não genérico', I: 'Não informado' }

/** Leitura do HHI pelas faixas usuais de defesa da concorrência. */
function leituraHhi(h: number) {
  if (h < 1500) return 'pouco concentrado'
  if (h <= 2500) return 'moderadamente concentrado'
  return 'muito concentrado'
}

export default function MercadoPage() {
  const { valores, definir } = useParamsUrl()
  const params = {
    ano: valores.ano,
    uf: valores.uf,
    esfera: valores.esfera,
    tp_compra: valores.tp_compra,
    atipicos: valores.atipicos,
  }
  const consulta = useQuery({
    queryKey: ['mercado', params],
    queryFn: () => api<MercadoResposta>('/dashboard/mercado', { params }),
    placeholderData: keepPreviousData,
  })
  const r = consulta.data

  const conteudo = () => {
    if (!r) return null
    if (!r.hhi.qt_fornecedores) return <Vazio titulo="Sem compras no recorte" descricao="Ajuste os filtros." />

    const total = r.hhi.vl_total || 1
    const top10 = r.fornecedores.reduce((soma, f) => soma + f.vl_total, 0)
    const gen = Object.fromEntries(r.genericos.map((g) => [g.fg_generico, g]))
    const informado = (gen.S?.vl_total ?? 0) + (gen.N?.vl_total ?? 0)
    const genericos = (['S', 'N', 'I'] as const)
      .filter((k) => gen[k])
      .map((k) => ({ nome: NOME_GENERICO[k], vl_total: gen[k].vl_total, qt_itens: gen[k].qt_itens }))

    const tipos = [...new Set(r.esferas.map((e) => e.tp_compra))]
    const esferas = [...new Set(r.esferas.map((e) => e.nome))].map((nome) => ({
      nome,
      ...Object.fromEntries(
        tipos.map((t) => [t, r.esferas.find((x) => x.nome === nome && x.tp_compra === t)?.vl_total ?? 0]),
      ),
    }))

    const participacao = (l: { vl_total: number; qt_itens: number }) =>
      `${fmt.pct(l.vl_total / total)} do total · ${fmt.int(l.qt_itens)} itens`

    return (
      <div className="grid gap-4">
        <GradeKpis className="lg:grid-cols-5">
          <KpiCard rotulo="Valor total" valor={fmt.moedaCurta(r.hhi.vl_total)} />
          <KpiCard rotulo="Fornecedores" valor={fmt.int(r.hhi.qt_fornecedores)} />
          <KpiCard rotulo="Participação dos 10 maiores" valor={fmt.pct(top10 / total)} />
          <KpiCard rotulo="Concentração (HHI)" valor={fmt.int(r.hhi.hhi)} detalhe={leituraHhi(r.hhi.hhi)} />
          <KpiCard
            rotulo="Genéricos"
            valor={informado ? fmt.pct((gen.S?.vl_total ?? 0) / informado) : '—'}
            detalhe="do valor com a informação preenchida"
          />
        </GradeKpis>

        <div className="grid gap-4 xl:grid-cols-2">
          <Painel titulo="10 maiores fornecedores">
            <GraficoBarras
              horizontal
              altura={380}
              dados={r.fornecedores}
              categoria="nome"
              series={[{ chave: 'vl_total', rotulo: 'Valor' }]}
              formatar={fmt.moeda}
              formatarEixo={fmt.moedaCurta}
              tituloDica={(l) => l.nome}
              detalhe={participacao}
            />
          </Painel>
          <Painel titulo="10 maiores fabricantes">
            <GraficoBarras
              horizontal
              altura={380}
              dados={r.fabricantes}
              categoria="nome"
              series={[{ chave: 'vl_total', rotulo: 'Valor' }]}
              formatar={fmt.moeda}
              formatarEixo={fmt.moedaCurta}
              tituloDica={(l) => l.nome}
              detalhe={participacao}
            />
          </Painel>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Painel titulo="Valor por modalidade">
            <GraficoBarras
              dados={r.modalidades}
              categoria="nome"
              series={[{ chave: 'vl_total', rotulo: 'Valor' }]}
              formatar={fmt.moeda}
              formatarEixo={fmt.moedaCurta}
              detalhe={(m) => `${fmt.int(m.qt_processos)} processos`}
            />
          </Painel>
          <Painel titulo="Esfera e tipo de compra">
            <GraficoBarras
              dados={esferas}
              categoria="nome"
              series={tipos.map((t) => ({ chave: t, rotulo: t }))}
              formatar={fmt.moeda}
              formatarEixo={fmt.moedaCurta}
            />
          </Painel>
          <Painel
            titulo="Genérico ou não"
            nota={`${fmt.pct((gen.I?.vl_total ?? 0) / total)} do valor não informa se o item é genérico.`}
          >
            <GraficoBarras
              dados={genericos}
              categoria="nome"
              series={[{ chave: 'vl_total', rotulo: 'Valor' }]}
              formatar={fmt.moeda}
              formatarEixo={fmt.moedaCurta}
              detalhe={participacao}
            />
          </Painel>
        </div>

        <Painel
          titulo="Valor comprado por mês"
          nota="Pela data da compra. Os meses mais recentes tendem a crescer conforme novas compras são inseridas no BPS."
        >
          <GraficoLinhas
            dados={r.mensal}
            categoria="mes"
            series={[{ chave: 'vl_total', rotulo: 'Valor' }]}
            formatar={fmt.moeda}
            formatarEixo={fmt.moedaCurta}
            formatarCategoria={fmt.mes}
            detalhe={(m) => `${fmt.int(m.qt_itens)} itens`}
          />
        </Painel>
      </div>
    )
  }

  return (
    <>
      <Cabecalho titulo="Mercado e fornecedores" descricao="Quem vende, quem fabrica e como o poder público compra." />
      <BarraFiltros campos={['ano', 'uf', 'esfera', 'tp_compra', 'atipicos']} valores={valores} definir={definir} />
      {consulta.isPending && <CarregandoPagina />}
      {consulta.isError && <Erro erro={consulta.error} tentar={() => consulta.refetch()} />}
      {conteudo()}
    </>
  )
}
