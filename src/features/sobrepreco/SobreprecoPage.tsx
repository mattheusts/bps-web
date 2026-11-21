import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { GraficoBarras } from '@/components/charts/graficos'
import { Cabecalho, CarregandoPagina, Erro, GradeKpis, KpiCard, Painel, Vazio } from '@/components/estados'
import { BarraFiltros } from '@/components/filtros/BarraFiltros'
import { CampoSelect } from '@/components/filtros/CampoSelect'
import { TabelaSimples } from '@/components/TabelaSimples'
import { Badge } from '@/components/ui/badge'
import { useParamsUrl } from '@/hooks/use-params-url'
import { api } from '@/lib/api'
import { fmt, truncar } from '@/lib/format'
import type { SobreprecoResposta } from '@/types/api'

const FATORES = ['1.2', '1.5', '2', '3', '5', '10']
const AMOSTRAS = ['3', '5', '10', '20']

export default function SobreprecoPage() {
  const { valores, definir } = useParamsUrl()
  const fator = valores.fator ?? '1.5'
  const minAmostra = valores.min_amostra ?? '5'
  const params = {
    ano: valores.ano,
    uf: valores.uf,
    esfera: valores.esfera,
    tp_compra: valores.tp_compra,
    atipicos: valores.atipicos,
    fator,
    min_amostra: minAmostra,
  }

  const consulta = useQuery({
    queryKey: ['sobrepreco', params],
    queryFn: () => api<SobreprecoResposta>('/dashboard/sobrepreco', { params }),
    placeholderData: keepPreviousData,
  })
  const r = consulta.data

  return (
    <>
      <Cabecalho
        titulo="Alerta de sobrepreço"
        descricao="Itens comprados acima de N × a mediana nacional do mesmo medicamento, unidade e ano."
      />
      <BarraFiltros campos={['ano', 'uf', 'esfera', 'tp_compra']} valores={valores} definir={definir}>
        <CampoSelect
          rotulo="Acima de"
          valor={fator}
          todos={null}
          aoMudar={(v) => definir({ fator: v })}
          opcoes={FATORES.map((v) => ({ valor: v, rotulo: `${v.replace('.', ',')}× a mediana` }))}
        />
        <CampoSelect
          rotulo="Mínimo de compras"
          valor={minAmostra}
          todos={null}
          aoMudar={(v) => definir({ min_amostra: v })}
          opcoes={AMOSTRAS.map((v) => ({ valor: v, rotulo: `${v} compras` }))}
        />
        <CampoSelect
          rotulo="Erros prováveis (>100×)"
          valor={valores.atipicos ?? ''}
          todos="Ocultar"
          aoMudar={(v) => definir({ atipicos: v })}
          opcoes={[{ valor: 'incluir', rotulo: 'Mostrar' }]}
        />
      </BarraFiltros>

      {consulta.isPending && <CarregandoPagina />}
      {consulta.isError && <Erro erro={consulta.error} tentar={() => consulta.refetch()} />}

      {r && (
        <div className="grid gap-4">
          <GradeKpis>
            <KpiCard rotulo="Itens acima do limite" valor={fmt.int(r.resumo.qt_itens)} />
            <KpiCard
              rotulo="Pago a mais (estimado)"
              valor={fmt.moedaCurta(r.resumo.vl_excedente)}
              detalhe="diferença para a mediana × quantidade"
            />
            <KpiCard rotulo="Valor desses itens" valor={fmt.moedaCurta(r.resumo.vl_pago)} />
            <KpiCard rotulo="Medicamentos envolvidos" valor={fmt.int(r.resumo.qt_medicamentos)} />
          </GradeKpis>

          {r.itens.length === 0 ? (
            <Vazio titulo="Nenhum item acima do limite" descricao="Ajuste o fator, a amostra mínima ou os filtros." />
          ) : (
            <>
              <div className="grid gap-4 xl:grid-cols-2">
                <Painel titulo="Valor pago a mais por UF">
                  <GraficoBarras
                    dados={r.porUf}
                    categoria="sg_uf"
                    series={[{ chave: 'vl_excedente', rotulo: 'Pago a mais' }]}
                    formatar={fmt.moeda}
                    formatarEixo={fmt.moedaCurta}
                    detalhe={(u) => `${fmt.int(u.qt_itens)} item(ns)`}
                  />
                </Painel>
                <Painel titulo="Fornecedores com maior valor acima da mediana">
                  <GraficoBarras
                    horizontal
                    dados={r.porFornecedor}
                    categoria="no_fornecedor"
                    series={[{ chave: 'vl_excedente', rotulo: 'Pago a mais' }]}
                    formatar={fmt.moeda}
                    formatarEixo={fmt.moedaCurta}
                    tituloDica={(f) => f.no_fornecedor}
                    detalhe={(f) => `${fmt.int(f.qt_itens)} item(ns)`}
                  />
                </Painel>
              </div>
              <Painel
                titulo="Itens, do maior para o menor valor pago a mais"
                descricao={`Mostrando até ${fmt.int(r.parametros.limite)} itens.`}
              >
                <TabelaSimples
                  linhas={r.itens}
                  chave={(l) => l.id_item_compra}
                  colunas={[
                    { titulo: 'Data', valor: (l) => fmt.data(l.dt_compra) },
                    {
                      titulo: 'Comprador',
                      valor: (l) => (
                        <span title={l.no_instituicao}>
                          {truncar(l.no_instituicao, 32)}
                          <span className="block text-xs text-muted-foreground">
                            {l.no_municipio}/{l.sg_uf} · proc. {l.nu_processo_compra}
                          </span>
                        </span>
                      ),
                    },
                    {
                      titulo: 'Medicamento',
                      valor: (l) => (
                        <span>
                          <Link
                            to={`/precos?catmat=${l.co_catmat}&un=${encodeURIComponent(l.un || '(vazio)')}`}
                            title={l.ds_item}
                            className="text-primary hover:underline"
                          >
                            {truncar(l.ds_item, 42)}
                          </Link>
                          <span className="block text-xs text-muted-foreground">{l.un || 'sem unidade'}</span>
                        </span>
                      ),
                    },
                    { titulo: 'Fornecedor', valor: (l) => <span title={l.no_fornecedor}>{truncar(l.no_fornecedor, 26)}</span> },
                    { titulo: 'Qtd.', valor: (l) => fmt.int(l.qt_medicamento), num: true },
                    { titulo: 'Preço pago', valor: (l) => fmt.preco(l.vl_preco_unitario), num: true },
                    {
                      titulo: 'Mediana',
                      num: true,
                      valor: (l) => (
                        <span>
                          {fmt.preco(l.mediana)}
                          <span className="block text-xs text-muted-foreground">{fmt.int(l.n_amostra)} compras</span>
                        </span>
                      ),
                    },
                    {
                      titulo: '× mediana',
                      num: true,
                      valor: (l) => <Badge variant="destructive">{fmt.num(Math.round(l.razao * 10) / 10)}×</Badge>,
                    },
                    { titulo: 'Pago a mais', valor: (l) => fmt.moeda(l.vl_excedente), num: true },
                  ]}
                />
              </Painel>
            </>
          )}
        </div>
      )}
    </>
  )
}
