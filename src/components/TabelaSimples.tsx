import type { ReactNode } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

export interface ColunaSimples<T> {
  titulo: string
  valor: (linha: T) => ReactNode
  num?: boolean
}

/** Par rótulo e valor usado nas listas em cartões do celular. */
export function CampoCartao({ rotulo, num, children }: { rotulo: string; num?: boolean; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="shrink-0 text-xs text-muted-foreground">{rotulo}</dt>
      <dd className={cn('min-w-0 text-right [overflow-wrap:anywhere]', num && 'font-medium tabular-nums')}>{children}</dd>
    </div>
  )
}

export function TabelaSimples<T>({
  colunas,
  linhas,
  chave,
  vazio = 'Nenhum registro.',
}: {
  colunas: ColunaSimples<T>[]
  linhas: T[]
  chave: (linha: T, indice: number) => string | number
  vazio?: string
}) {
  const celular = useIsMobile()
  if (!linhas.length) return <p className="py-6 text-center text-sm text-muted-foreground">{vazio}</p>
  if (celular) {
    return (
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {linhas.map((linha, i) => (
          <li key={chave(linha, i)} className="min-w-0 rounded-lg border p-3">
            <dl className="grid gap-2">
              {colunas.map((c) => (
                <CampoCartao key={c.titulo} rotulo={c.titulo} num={c.num}>
                  {c.valor(linha)}
                </CampoCartao>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    )
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {colunas.map((c) => (
              <TableHead key={c.titulo} className={cn(c.num && 'text-right')}>
                {c.titulo}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((linha, i) => (
            <TableRow key={chave(linha, i)}>
              {colunas.map((c) => (
                <TableCell key={c.titulo} className={cn('align-top', c.num && 'text-right tabular-nums')}>
                  {c.valor(linha)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
