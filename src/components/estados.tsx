import { CircleAlertIcon, InboxIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { mensagemErro } from '@/lib/api'
import { cn } from '@/lib/utils'

export function Cabecalho({ titulo, descricao, acoes }: { titulo: string; descricao?: string; acoes?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descricao && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acoes}
    </div>
  )
}

export function KpiCard({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="px-4">
        <p className="text-xs font-medium text-muted-foreground">{rotulo}</p>
        <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{valor}</p>
        {detalhe && <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>}
      </CardContent>
    </Card>
  )
}

export function GradeKpis({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>{children}</div>
}

export function Painel({
  titulo,
  descricao,
  nota,
  children,
  className,
}: {
  titulo: string
  descricao?: string
  nota?: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={cn('min-w-0 gap-4', className)}>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        {descricao && <CardDescription>{descricao}</CardDescription>}
      </CardHeader>
      <CardContent className="min-w-0">
        {children}
        {nota && <p className="mt-3 text-xs text-muted-foreground">{nota}</p>}
      </CardContent>
    </Card>
  )
}

export function Erro({ erro, tentar }: { erro: unknown; tentar?: () => void }) {
  return (
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertTitle>Não foi possível carregar</AlertTitle>
      <AlertDescription>
        <p>{mensagemErro(erro)}</p>
        {tentar && (
          <Button variant="outline" size="sm" className="mt-2" onClick={tentar}>
            Tentar novamente
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

export function Vazio({ titulo, descricao }: { titulo: string; descricao?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center">
      <InboxIcon className="mb-3 size-8 text-muted-foreground/70" />
      <p className="font-medium">{titulo}</p>
      {descricao && <p className="mt-1 max-w-md text-sm text-muted-foreground">{descricao}</p>}
    </div>
  )
}

export function CarregandoPagina() {
  return (
    <div className="grid gap-4" role="status" aria-label="Carregando">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  )
}
