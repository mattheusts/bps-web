import type { ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { useIsMobile } from '@/hooks/use-mobile'
import { truncar } from '@/lib/format'

export interface Serie {
  chave: string
  rotulo: string
}

interface Base<T> {
  dados: T[]
  categoria: keyof T & string
  series: Serie[]
  formatar: (valor: number) => string
  formatarEixo?: (valor: number) => string
  formatarCategoria?: (valor: string) => string
  detalhe?: (linha: T) => ReactNode
  tituloDica?: (linha: T) => string
  altura?: number
}

function configuracao(series: Serie[]): ChartConfig {
  return Object.fromEntries(series.map((s, i) => [s.chave, { label: s.rotulo, color: `var(--chart-${i + 1})` }]))
}

function Dica<T>({
  active,
  payload,
  label,
  formatar,
  detalhe,
  tituloDica,
  formatarCategoria,
}: {
  active?: boolean
  payload?: readonly { name?: unknown; value?: unknown; color?: string; payload?: unknown; dataKey?: unknown }[]
  label?: unknown
  formatar: (valor: number) => string
  detalhe?: (linha: T) => ReactNode
  tituloDica?: (linha: T) => string
  formatarCategoria?: (valor: string) => string
}) {
  if (!active || !payload?.length) return null
  const linha = payload[0].payload as T
  const titulo = tituloDica?.(linha) ?? (formatarCategoria ? formatarCategoria(String(label)) : String(label))
  return (
    <div className="max-w-xs rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
      <p className="mb-1 font-medium">{titulo}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <i className="size-2 rounded-xs" style={{ background: p.color }} />
            {String(p.name)}
          </span>
          <span className="font-medium tabular-nums">{formatar(Number(p.value))}</span>
        </p>
      ))}
      {detalhe && <div className="mt-1 text-muted-foreground">{detalhe(linha)}</div>}
    </div>
  )
}

export function GraficoBarras<T extends object>({
  dados,
  categoria,
  series,
  formatar,
  formatarEixo = formatar,
  formatarCategoria,
  detalhe,
  tituloDica,
  altura = 300,
  horizontal,
  referencia,
}: Base<T> & { horizontal?: boolean; referencia?: { valor: number; rotulo: string } }) {
  const compacto = useIsMobile()
  return (
    <ChartContainer config={configuracao(series)} className="aspect-auto w-full" style={{ height: altura }}>
      <BarChart data={dados} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={!!horizontal} horizontal={!horizontal} strokeDasharray="3 3" />
        {horizontal ? (
          <>
            <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={formatarEixo} />
            <YAxis
              type="category"
              dataKey={categoria as string}
              width={compacto ? 112 : 165}
              interval={0}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) => truncar(v, compacto ? 18 : 24)}
            />
          </>
        ) : (
          <>
            <XAxis dataKey={categoria as string} tickLine={false} axisLine={false} tickFormatter={formatarCategoria} />
            <YAxis width={compacto ? 58 : 72} tickLine={false} axisLine={false} tickFormatter={formatarEixo} />
          </>
        )}
        <ChartTooltip
          cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
          content={(p) => (
            <Dica
              active={p.active}
              payload={p.payload}
              label={p.label}
              formatar={formatar}
              detalhe={detalhe}
              tituloDica={tituloDica}
              formatarCategoria={formatarCategoria}
            />
          )}
        />
        {series.length > 1 && <Legend iconType="square" iconSize={10} />}
        {series.map((s) => (
          <Bar
            key={s.chave}
            dataKey={s.chave}
            name={s.rotulo}
            fill={`var(--color-${s.chave})`}
            radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            maxBarSize={36}
          />
        ))}
        {referencia && (
          <ReferenceLine
            y={referencia.valor}
            stroke="var(--chart-2)"
            strokeDasharray="6 4"
            strokeWidth={2}
            label={{ value: referencia.rotulo, position: 'insideTopRight', fill: 'var(--chart-2)', fontSize: 11 }}
          />
        )}
      </BarChart>
    </ChartContainer>
  )
}

export function GraficoLinhas<T extends object>({
  dados,
  categoria,
  series,
  formatar,
  formatarEixo = formatar,
  formatarCategoria,
  detalhe,
  altura = 300,
}: Base<T>) {
  const compacto = useIsMobile()
  return (
    <ChartContainer config={configuracao(series)} className="aspect-auto w-full" style={{ height: altura }}>
      <LineChart data={dados} margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey={categoria as string} tickLine={false} axisLine={false} tickFormatter={formatarCategoria} />
        <YAxis width={compacto ? 58 : 72} tickLine={false} axisLine={false} tickFormatter={formatarEixo} />
        <ChartTooltip
          content={(p) => (
            <Dica
              active={p.active}
              payload={p.payload}
              label={p.label}
              formatar={formatar}
              detalhe={detalhe}
              formatarCategoria={formatarCategoria}
            />
          )}
        />
        {series.length > 1 && <Legend iconType="plainline" />}
        {series.map((s) => (
          <Line
            key={s.chave}
            dataKey={s.chave}
            name={s.rotulo}
            type="monotone"
            stroke={`var(--color-${s.chave})`}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ChartContainer>
  )
}
