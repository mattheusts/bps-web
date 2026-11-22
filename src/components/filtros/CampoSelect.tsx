import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const TODOS = '__todos'

export interface OpcaoSelect {
  valor: string
  rotulo: string
}

/** O Select do Radix não aceita valor vazio; "Todos" usa uma sentinela e devolve ''. */
export function CampoSelect({
  rotulo,
  valor,
  aoMudar,
  opcoes,
  todos = 'Todos',
  desabilitado,
}: {
  rotulo: string
  valor: string
  aoMudar: (valor: string) => void
  opcoes: OpcaoSelect[]
  todos?: string | null
  desabilitado?: boolean
}) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-1.5 md:min-w-36">
      <Label className="text-xs text-muted-foreground">{rotulo}</Label>
      <Select
        value={valor || (todos ? TODOS : undefined)}
        onValueChange={(v) => aoMudar(v === TODOS ? '' : v)}
        disabled={desabilitado}
      >
        <SelectTrigger className="w-full bg-card" aria-label={rotulo}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {todos && <SelectItem value={TODOS}>{todos}</SelectItem>}
          {opcoes.map((o) => (
            <SelectItem key={o.valor} value={o.valor}>
              {o.rotulo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
