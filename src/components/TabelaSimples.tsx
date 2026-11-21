import type { ReactNode } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface ColunaSimples<T> {
  titulo: string
  valor: (linha: T) => ReactNode
  num?: boolean
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
  if (!linhas.length) return <p className="py-6 text-center text-sm text-muted-foreground">{vazio}</p>
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
