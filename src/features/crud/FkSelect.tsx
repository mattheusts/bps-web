import { useQuery } from '@tanstack/react-query'
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useDebounce } from '@/hooks/use-debounce'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Opcao } from '@/types/api'

export function FkSelect({
  id,
  tabela,
  valor,
  rotuloInicial,
  obrigatorio,
  invalido,
  aoMudar,
}: {
  id: string
  tabela: string
  valor: string
  rotuloInicial?: string
  obrigatorio: boolean
  invalido?: boolean
  aoMudar: (valor: string) => void
}) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [rotulo, setRotulo] = useState(rotuloInicial ?? '')
  const termo = useDebounce(busca)
  const { data = [], isFetching, isError } = useQuery({
    queryKey: ['opcoes', tabela, termo],
    queryFn: () => api<Opcao[]>(`/crud/${tabela}/opcoes`, { params: { q: termo } }),
    enabled: aberto,
  })

  const escolher = (opcao: Opcao | null) => {
    aoMudar(opcao ? String(opcao.id) : '')
    setRotulo(opcao?.rotulo ?? '')
    setAberto(false)
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={aberto}
          aria-invalid={invalido}
          className="w-full justify-between font-normal"
        >
          <span className={cn('truncate', !valor && 'text-muted-foreground')}>
            {valor ? rotulo || `#${valor}` : 'Selecione…'}
          </span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-[min(18rem,calc(100vw-2rem))] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar…" value={busca} onValueChange={setBusca} />
          <CommandList>
            <CommandEmpty>
              {isError ? 'Erro ao buscar.' : isFetching ? 'Buscando…' : 'Nada encontrado.'}
            </CommandEmpty>
            <CommandGroup>
              {!obrigatorio && valor && (
                <CommandItem value="__nenhum" onSelect={() => escolher(null)}>
                  (nenhum)
                </CommandItem>
              )}
              {data.map((o) => (
                <CommandItem key={o.id} value={String(o.id)} onSelect={() => escolher(o)}>
                  <CheckIcon className={cn(String(o.id) === valor ? 'opacity-100' : 'opacity-0')} />
                  <span className="truncate">{o.rotulo}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
