import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { api } from '@/lib/api'
import { UFS } from '@/lib/geo'
import type { OpcoesFiltros } from '@/types/api'
import { CampoSelect } from './CampoSelect'

export type CampoFiltro = 'ano' | 'uf' | 'esfera' | 'tp_compra' | 'atipicos'

const lista = (valores: (string | number)[] = []) => valores.map((v) => ({ valor: String(v), rotulo: String(v) }))

export function BarraFiltros({
  campos,
  valores,
  definir,
  children,
}: {
  campos: CampoFiltro[]
  valores: Record<string, string | undefined>
  definir: (mudancas: Record<string, string>) => void
  children?: ReactNode
}) {
  const { data } = useQuery({
    queryKey: ['filtros'],
    queryFn: () => api<OpcoesFiltros>('/dashboard/filtros'),
    staleTime: 5 * 60_000,
  })
  const campo = (nome: string, rotulo: string, opcoes: { valor: string; rotulo: string }[]) => (
    <CampoSelect
      key={nome}
      rotulo={rotulo}
      valor={valores[nome] ?? ''}
      aoMudar={(v) => definir({ [nome]: v })}
      opcoes={opcoes}
    />
  )

  return (
    <div className="mb-4 grid grid-cols-2 items-end gap-3 md:flex md:flex-wrap">
      {campos.map((c) => {
        if (c === 'ano') return campo('ano', 'Ano', lista(data?.anos))
        if (c === 'uf') return campo('uf', 'UF', lista(UFS))
        if (c === 'esfera') return campo('esfera', 'Esfera', lista(data?.esferas))
        if (c === 'tp_compra') return campo('tp_compra', 'Tipo de compra', lista(data?.tipos))
        return (
          <CampoSelect
            key={c}
            rotulo="Preços atípicos (>100×)"
            valor={valores.atipicos ?? ''}
            aoMudar={(v) => definir({ atipicos: v })}
            todos="Excluir dos totais"
            opcoes={[{ valor: 'incluir', rotulo: 'Incluir' }]}
          />
        )
      })}
      {children}
    </div>
  )
}
